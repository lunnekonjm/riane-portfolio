import { NextResponse } from "next/server";
import { getTrueLayerAuthUrl } from "@/lib/truelayer/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { origin, searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    const redirectUri = `${origin}/api/integrations/truelayer/callback`;
    const authUrl = getTrueLayerAuthUrl(redirectUri);

    if (!authUrl) {
      return NextResponse.json(
        { error: "TRUELAYER_CLIENT_ID not configured" },
        { status: 400 }
      );
    }

    // If API client requests JSON specifically
    if (format === "json") {
      return NextResponse.json({ authUrl, redirectUri });
    }

    // Direct browser navigation redirects directly to TrueLayer OAuth dialog
    return NextResponse.redirect(authUrl);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

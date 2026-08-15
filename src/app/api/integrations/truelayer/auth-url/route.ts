import { NextResponse } from "next/server";
import { getTrueLayerAuthUrl } from "@/lib/truelayer/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { origin } = new URL(request.url);
    const redirectUri = `${origin}/api/integrations/truelayer/callback`;
    const authUrl = getTrueLayerAuthUrl(redirectUri);

    if (!authUrl) {
      return NextResponse.json(
        { error: "TRUELAYER_CLIENT_ID not configured" },
        { status: 400 }
      );
    }

    return NextResponse.json({ authUrl, redirectUri });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { fetchTrueLayerSummary } from "@/lib/truelayer/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get("token") || process.env.TRUELAYER_ACCESS_TOKEN;

    const summary = await fetchTrueLayerSummary(accessToken);
    return NextResponse.json(summary);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ connected: false, accounts: [], partialErrors: [msg] }, { status: 500 });
  }
}

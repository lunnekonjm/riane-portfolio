import { NextResponse } from "next/server";
import { fetchTrueLayerSummary } from "@/lib/truelayer/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cookieHeader = request.headers.get("cookie") || "";
    const cookieMatch = cookieHeader.match(/truelayer_access_token=([^;]+)/);
    const cookieToken = cookieMatch ? decodeURIComponent(cookieMatch[1].trim()) : undefined;

    const accessToken =
      searchParams.get("token") ||
      searchParams.get("truelayerToken") ||
      cookieToken ||
      process.env.TRUELAYER_ACCESS_TOKEN;

    const summary = await fetchTrueLayerSummary(accessToken);
    return NextResponse.json(summary);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ connected: false, accounts: [], partialErrors: [msg] }, { status: 500 });
  }
}

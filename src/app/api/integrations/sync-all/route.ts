import { NextResponse } from "next/server";
import { fetchSnapTradeSummary } from "@/lib/snaptrade/service";
import { fetchTrueLayerSummary } from "@/lib/truelayer/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fxRate = parseFloat(searchParams.get("fxRate") || "1.08");

    const cookieHeader = request.headers.get("cookie") || "";
    const cookieMatch = cookieHeader.match(/truelayer_access_token=([^;]+)/);
    const cookieToken = cookieMatch ? decodeURIComponent(cookieMatch[1].trim()) : undefined;
    const refreshMatch = cookieHeader.match(/truelayer_refresh_token=([^;]+)/);
    const cookieRefreshToken = refreshMatch ? decodeURIComponent(refreshMatch[1].trim()) : undefined;

    const truelayerToken =
      searchParams.get("truelayerToken") ||
      searchParams.get("token") ||
      cookieToken ||
      process.env.TRUELAYER_ACCESS_TOKEN ||
      undefined;

    const refreshToken =
      searchParams.get("refreshToken") ||
      cookieRefreshToken ||
      process.env.TRUELAYER_REFRESH_TOKEN ||
      undefined;

    const [snaptradeRes, truelayerRes] = await Promise.allSettled([
      fetchSnapTradeSummary(isNaN(fxRate) ? 1.08 : fxRate),
      fetchTrueLayerSummary(truelayerToken, refreshToken),
    ]);

    const snaptrade =
      snaptradeRes.status === "fulfilled"
        ? snaptradeRes.value
        : {
            online: false,
            timestamp: new Date().toISOString(),
            authorizations: [],
            accounts: [],
            totalCashEUR: 0,
            totalInvestedEUR: 0,
            totalPortfolioEUR: 0,
            partialErrors: [snaptradeRes.reason?.message || "SnapTrade sync error"],
          };

    const truelayer =
      truelayerRes.status === "fulfilled"
        ? truelayerRes.value
        : {
            connected: false,
            timestamp: new Date().toISOString(),
            environment: (process.env.TRUELAYER_CLIENT_ID?.startsWith("sandbox-") ? "sandbox" : "live") as "sandbox" | "live",
            accounts: [],
            totalCheckingEUR: 0,
            totalSavingsEUR: 0,
            totalInvestedEUR: 0,
            totalBoursoBankEUR: 0,
            partialErrors: [truelayerRes.reason?.message || "TrueLayer sync error"],
          };

    const totalConsolidatedEUR = snaptrade.totalPortfolioEUR + truelayer.totalBoursoBankEUR;

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      snaptrade,
      truelayer,
      totalConsolidatedEUR: Math.round(totalConsolidatedEUR * 100) / 100,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

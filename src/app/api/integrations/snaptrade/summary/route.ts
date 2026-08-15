import { NextResponse } from "next/server";
import { fetchSnapTradeSummary } from "@/lib/snaptrade/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fxRate = parseFloat(searchParams.get("fxRate") || "1.08");

    const summary = await fetchSnapTradeSummary(isNaN(fxRate) ? 1.08 : fxRate);
    return NextResponse.json(summary);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      {
        online: false,
        timestamp: new Date().toISOString(),
        authorizations: [],
        accounts: [],
        totalCashEUR: 0,
        totalInvestedEUR: 0,
        totalPortfolioEUR: 0,
        partialErrors: [msg],
      },
      { status: 500 }
    );
  }
}

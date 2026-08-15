import "server-only";
import { getSnapTradeClient } from "./client";
import {
  SnapTradeSyncResult,
  SnapTradeAccountSummary,
  SnapTradeAuthorizationStatus,
  SnapTradeAccountBalance,
  SnapTradeHolding,
} from "./types";

export async function fetchSnapTradeSummary(fxRateEURUSD: number = 1.08): Promise<SnapTradeSyncResult> {
  const snaptrade = getSnapTradeClient();

  if (!snaptrade) {
    return {
      online: false,
      timestamp: new Date().toISOString(),
      authorizations: [],
      accounts: [],
      totalCashEUR: 0,
      totalInvestedEUR: 0,
      totalPortfolioEUR: 0,
      partialErrors: ["SnapTrade credentials not configured in environment (SNAPTRADE_CLIENT_ID / SNAPTRADE_CONSUMER_KEY)"],
    };
  }

  const partialErrors: string[] = [];
  let isOnline = false;

  // 1. Check API Health
  try {
    const statusRes = await snaptrade.apiStatus.check();
    isOnline = !!statusRes.data?.online;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    partialErrors.push(`SnapTrade API Status Check: ${msg}`);
  }

  // 2. Fetch Authorizations (Brokerage connections like IBKR)
  const authorizations: SnapTradeAuthorizationStatus[] = [];
  try {
    const authRes = await snaptrade.connections.listBrokerageAuthorizations();
    const rawAuths = authRes.data || [];

    for (const auth of rawAuths) {
      authorizations.push({
        id: auth.id || "",
        brokerageName: auth.brokerage?.display_name || auth.brokerage?.name || "Courtier Inconnu",
        brokerageSlug: auth.brokerage?.slug || "unknown",
        status: auth.disabled ? "disabled" : auth.brokerage?.is_degraded ? "degraded" : "active",
        dataFreshnessMode: auth.data_freshness_mode || "delayed",
        createdDate: auth.created_date || new Date().toISOString(),
        updatedDate: auth.updated_date || new Date().toISOString(),
        logoUrl: auth.brokerage?.aws_s3_logo_url || auth.brokerage?.aws_s3_square_logo_url || undefined,
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    partialErrors.push(`SnapTrade Authorizations Fetch: ${msg}`);
  }

  // 3. Fetch Accounts
  const accounts: SnapTradeAccountSummary[] = [];
  let rawAccounts: any[] = [];

  try {
    const accRes = await snaptrade.accountInformation.listUserAccounts();
    rawAccounts = accRes.data || [];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    partialErrors.push(`SnapTrade List Accounts: ${msg}`);
  }

  // 4. Concurrently fetch balances & positions for each account via Promise.allSettled
  const accountPromises = rawAccounts.map(async (acc) => {
    const accountId = acc.id;
    const accountName = acc.name || acc.institution_name || "Compte IBKR";
    const numberMasked = acc.number ? `••••${String(acc.number).slice(-4)}` : "••••";
    const currency = acc.currency?.code || "USD";
    const institutionName = acc.institution_name || "Interactive Brokers";

    let balances: SnapTradeAccountBalance[] = [];
    let holdings: SnapTradeHolding[] = [];
    let accountError: string | null = null;

    // Concurrently fetch balance & positions for this account
    const [balanceResult, positionsResult] = await Promise.allSettled([
      snaptrade.accountInformation.getUserAccountBalance({ accountId }),
      snaptrade.accountInformation.getAllAccountPositions({ accountId }),
    ]);

    // Handle Balances
    if (balanceResult.status === "fulfilled") {
      const bData = balanceResult.value.data;
      if (Array.isArray(bData)) {
        balances = bData.map((b: any) => ({
          currency: b.currency?.code || currency,
          cash: Number(b.cash ?? b.amount ?? 0),
          buyingPower: b.buying_power != null ? Number(b.buying_power) : undefined,
          totalEquity: b.total_value != null ? Number(b.total_value) : undefined,
        }));
      } else if (bData && typeof bData === "object") {
        balances = [
          {
            currency: (bData as any).currency?.code || currency,
            cash: Number((bData as any).cash ?? (bData as any).amount ?? 0),
            buyingPower: (bData as any).buying_power != null ? Number((bData as any).buying_power) : undefined,
            totalEquity: (bData as any).total_value != null ? Number((bData as any).total_value) : undefined,
          },
        ];
      }
    } else {
      const errReason = balanceResult.reason;
      accountError = `Balances: ${errReason?.message || String(errReason)}`;
    }

    // Handle Positions
    if (positionsResult.status === "fulfilled") {
      const pData = positionsResult.value.data;
      if (Array.isArray(pData)) {
        holdings = pData.map((pos: any, idx: number) => {
          const sym = pos.symbol?.symbol?.symbol || pos.symbol?.symbol || pos.symbol?.description || `ASSET-${idx}`;
          const name = pos.symbol?.description || pos.symbol?.symbol?.description || sym;
          const posCurrency = pos.symbol?.currency?.code || currency;
          const units = Number(pos.units ?? 0);
          const price = Number(pos.price ?? 0);
          const marketValue = Number(pos.market_value ?? units * price);
          const avgPrice = pos.average_purchase_price != null ? Number(pos.average_purchase_price) : undefined;
          const totalCost = avgPrice != null ? avgPrice * units : undefined;
          const gainLoss = totalCost != null ? marketValue - totalCost : undefined;
          const gainLossPct = totalCost && totalCost > 0 ? (gainLoss! / totalCost) * 100 : undefined;

          return {
            id: pos.id || `${accountId}-${sym}-${idx}`,
            symbol: sym,
            name: name,
            currency: posCurrency,
            units: units,
            price: price,
            marketValue: marketValue,
            averagePurchasePrice: avgPrice,
            totalGainLoss: gainLoss,
            totalGainLossPercentage: gainLossPct,
            accountId: accountId,
            accountName: accountName,
            brokerageName: institutionName,
          };
        });
      }
    } else {
      const errReason = positionsResult.reason;
      const posErrMsg = `Holdings: ${errReason?.message || String(errReason)}`;
      accountError = accountError ? `${accountError} | ${posErrMsg}` : posErrMsg;
    }

    // Calculate EUR equivalents
    const fxRateToEUR = (curr: string) => {
      const upper = curr.toUpperCase();
      if (upper === "EUR") return 1.0;
      if (upper === "USD") return 1.0 / (fxRateEURUSD > 0 ? fxRateEURUSD : 1.08);
      return 1.0;
    };

    const totalCashEUR = balances.reduce((sum, b) => sum + b.cash * fxRateToEUR(b.currency), 0);
    const totalHoldingsEUR = holdings.reduce((sum, h) => sum + h.marketValue * fxRateToEUR(h.currency), 0);
    const totalValueEUR = totalCashEUR + totalHoldingsEUR;

    let syncStatus: 'synced' | 'pending_first_sync' | 'error' = 'synced';
    if (accountError) {
      syncStatus = 'error';
    } else if (holdings.length === 0 && balances.length === 0) {
      syncStatus = 'pending_first_sync';
    }

    return {
      id: accountId,
      name: accountName,
      numberMasked: numberMasked,
      type: acc.raw_type || acc.type || "Brokerage",
      institutionName: institutionName,
      currency: currency,
      balances: balances,
      holdings: holdings,
      totalValueEUR: Math.round(totalValueEUR * 100) / 100,
      totalCashEUR: Math.round(totalCashEUR * 100) / 100,
      totalHoldingsEUR: Math.round(totalHoldingsEUR * 100) / 100,
      syncStatus: syncStatus,
      errorMessage: accountError || undefined,
    } as SnapTradeAccountSummary;
  });

  const accountResults = await Promise.allSettled(accountPromises);
  for (const res of accountResults) {
    if (res.status === "fulfilled") {
      accounts.push(res.value);
    } else {
      partialErrors.push(`Failed resolving account: ${res.reason?.message || String(res.reason)}`);
    }
  }

  // Calculate Global Totals
  const globalCashEUR = accounts.reduce((acc, a) => acc + a.totalCashEUR, 0);
  const globalInvestedEUR = accounts.reduce((acc, a) => acc + a.totalHoldingsEUR, 0);
  const globalPortfolioEUR = globalCashEUR + globalInvestedEUR;

  return {
    online: isOnline,
    timestamp: new Date().toISOString(),
    authorizations: authorizations,
    accounts: accounts,
    totalCashEUR: Math.round(globalCashEUR * 100) / 100,
    totalInvestedEUR: Math.round(globalInvestedEUR * 100) / 100,
    totalPortfolioEUR: Math.round(globalPortfolioEUR * 100) / 100,
    partialErrors: partialErrors,
  };
}

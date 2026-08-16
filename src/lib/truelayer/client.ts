import "server-only";
import { TrueLayerSyncResult, TrueLayerAccountSummary } from "./types";

const isSandbox = () => {
  const clientId = process.env.TRUELAYER_CLIENT_ID || "";
  if (process.env.TRUELAYER_USE_SANDBOX === "true") return true;
  if (process.env.TRUELAYER_USE_SANDBOX === "false") return false;
  return clientId.startsWith("sandbox-");
};

export const getTrueLayerAuthBaseUrl = () =>
  isSandbox() ? "https://auth.truelayer-sandbox.com" : "https://auth.truelayer.com";

export const getTrueLayerApiBaseUrl = () =>
  isSandbox() ? "https://api.truelayer-sandbox.com/data/v1" : "https://api.truelayer.com/data/v1";

/**
 * Generate OAuth authorization URL for BoursoBank / Open Banking
 */
export function getTrueLayerAuthUrl(redirectUri: string, state?: string, providerId: string = "stet-boursorama"): string | null {
  const clientId = process.env.TRUELAYER_CLIENT_ID;
  if (!clientId) return null;

  const sandbox = isSandbox();
  const baseUrl = getTrueLayerAuthBaseUrl();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "info accounts balance transactions offline_access",
    redirect_uri: redirectUri,
    providers: providerId,
    provider_id: providerId,
    country_code: "FR",
    ...(sandbox ? { enable_mock: "true" } : {}),
    ...(state ? { state } : {}),
  });

  return `${baseUrl}/?${params.toString()}`;
}

/**
 * Refresh access token using refresh_token
 */
export async function refreshTrueLayerToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string } | null> {
  const clientId = process.env.TRUELAYER_CLIENT_ID;
  const clientSecret = process.env.TRUELAYER_CLIENT_SECRET;
  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const authBase = getTrueLayerAuthBaseUrl();
    const tokenRes = await fetch(`${authBase}/connect/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!tokenRes.ok) {
      console.warn("[TrueLayer] Token refresh failed:", tokenRes.status);
      return null;
    }

    const data = await tokenRes.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
    };
  } catch (e) {
    console.warn("[TrueLayer] Error refreshing token:", e);
    return null;
  }
}

/**
 * Fetch TrueLayer accounts and balances using an existing access token or stored credentials
 */
export async function fetchTrueLayerSummary(accessToken?: string, refreshToken?: string): Promise<TrueLayerSyncResult> {
  const clientId = process.env.TRUELAYER_CLIENT_ID;
  const sandbox = isSandbox();

  if (!clientId) {
    return {
      connected: false,
      timestamp: new Date().toISOString(),
      environment: sandbox ? "sandbox" : "live",
      accounts: [],
      totalCheckingEUR: 0,
      totalSavingsEUR: 0,
      totalInvestedEUR: 0,
      totalBoursoBankEUR: 0,
      partialErrors: ["TrueLayer client ID not configured in environment"],
    };
  }

  let tokenToUse = accessToken;

  if (!tokenToUse && refreshToken) {
    const refreshed = await refreshTrueLayerToken(refreshToken);
    if (refreshed?.accessToken) {
      tokenToUse = refreshed.accessToken;
    }
  }

  if (!tokenToUse) {
    return {
      connected: false,
      timestamp: new Date().toISOString(),
      environment: sandbox ? "sandbox" : "live",
      accounts: [],
      totalCheckingEUR: 0,
      totalSavingsEUR: 0,
      totalInvestedEUR: 0,
      totalBoursoBankEUR: 0,
      partialErrors: [],
    };
  }

  const apiBase = getTrueLayerApiBaseUrl();
  const partialErrors: string[] = [];
  const accounts: TrueLayerAccountSummary[] = [];

  try {
    let accResponse = await fetch(`${apiBase}/accounts`, {
      headers: {
        Authorization: `Bearer ${tokenToUse}`,
      },
    });

    if (accResponse.status === 401 && refreshToken) {
      const refreshed = await refreshTrueLayerToken(refreshToken);
      if (refreshed?.accessToken) {
        tokenToUse = refreshed.accessToken;
        accResponse = await fetch(`${apiBase}/accounts`, {
          headers: { Authorization: `Bearer ${tokenToUse}` },
        });
      }
    }

    if (accResponse.status === 401) {
      return {
        connected: false,
        timestamp: new Date().toISOString(),
        environment: sandbox ? "sandbox" : "live",
        accounts: [],
        totalCheckingEUR: 0,
        totalSavingsEUR: 0,
        totalInvestedEUR: 0,
        totalBoursoBankEUR: 0,
        partialErrors: ["Session BoursoBank expirée (401). Veuillez vous reconnecter."],
      };
    }

    if (!accResponse.ok) {
      const errText = await accResponse.text();
      throw new Error(`TrueLayer Accounts API error (${accResponse.status}): ${errText}`);
    }

    const accData = await accResponse.json();
    const rawAccounts: any[] = accData.results || [];

    for (const rawAcc of rawAccounts) {
      const accId = rawAcc.account_id;
      const displayName = rawAcc.display_name || "BoursoBank Compte";
      const currency = rawAcc.currency || "EUR";
      const rawType = (rawAcc.account_type || "").toLowerCase();

      let mappedType: 'checking' | 'savings' | 'investment' | 'other' = 'checking';
      if (rawType.includes("saving") || displayName.toLowerCase().includes("livret")) {
        mappedType = "savings";
      } else if (rawType.includes("invest") || displayName.toLowerCase().includes("pea") || displayName.toLowerCase().includes("bourse")) {
        mappedType = "investment";
      }

      let currentBal = 0;
      let availableBal = 0;
      let lastUpdated = new Date().toISOString();

      try {
        const balResponse = await fetch(`${apiBase}/accounts/${accId}/balance`, {
          headers: {
            Authorization: `Bearer ${tokenToUse}`,
          },
        });

        if (balResponse.ok) {
          const balData = await balResponse.json();
          const balResult = balData.results?.[0];
          if (balResult) {
            currentBal = Number(balResult.current ?? 0);
            availableBal = Number(balResult.available ?? currentBal);
            lastUpdated = balResult.update_timestamp || lastUpdated;
          }
        }
      } catch (balErr: unknown) {
        const msg = balErr instanceof Error ? balErr.message : String(balErr);
        partialErrors.push(`Account ${displayName} balance: ${msg}`);
      }

      const iban = rawAcc.account_number?.iban;
      const ibanMasked = iban ? `••••${iban.slice(-4)}` : undefined;

      accounts.push({
        id: accId,
        displayName: displayName,
        accountType: mappedType,
        institutionName: rawAcc.provider?.display_name || "BoursoBank",
        currency: currency,
        currentBalance: currentBal,
        availableBalance: availableBal,
        balanceEUR: currentBal,
        ibanMasked: ibanMasked,
        lastUpdated: lastUpdated,
        logoUri: rawAcc.provider?.logo_uri,
      });
    }

    // Also fetch cards if available
    try {
      const cardsResponse = await fetch(`${apiBase}/cards`, {
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
        },
      });
      if (cardsResponse.ok) {
        const cardsData = await cardsResponse.json();
        const rawCards: any[] = cardsData.results || [];
        for (const rawCard of rawCards) {
          const cardId = rawCard.account_id || rawCard.card_id;
          if (accounts.some((a) => a.id === cardId)) continue;

          let currentBal = 0;
          let availableBal = 0;
          try {
            const cardBalResponse = await fetch(`${apiBase}/cards/${cardId}/balance`, {
              headers: { Authorization: `Bearer ${tokenToUse}` },
            });
            if (cardBalResponse.ok) {
              const cardBalData = await cardBalResponse.json();
              const balResult = cardBalData.results?.[0];
              if (balResult) {
                currentBal = Number(balResult.current ?? 0);
                availableBal = Number(balResult.available ?? currentBal);
              }
            }
          } catch {}

          const displayName = rawCard.display_name || `Carte BoursoBank ${rawCard.card_type || ''}`;
          accounts.push({
            id: cardId,
            displayName,
            accountType: "checking",
            institutionName: rawCard.provider?.display_name || "BoursoBank",
            currency: rawCard.currency || "EUR",
            currentBalance: currentBal,
            availableBalance: availableBal,
            balanceEUR: currentBal,
            ibanMasked: rawCard.partial_card_number ? `••••${rawCard.partial_card_number}` : undefined,
            lastUpdated: new Date().toISOString(),
            logoUri: rawCard.provider?.logo_uri,
          });
        }
      }
    } catch {
      // ignore card errors if accounts succeeded
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    partialErrors.push(`TrueLayer Sync: ${msg}`);
  }

  const totalCheckingEUR = accounts
    .filter((a) => a.accountType === "checking")
    .reduce((sum, a) => sum + a.balanceEUR, 0);

  const totalSavingsEUR = accounts
    .filter((a) => a.accountType === "savings")
    .reduce((sum, a) => sum + a.balanceEUR, 0);

  const totalInvestedEUR = accounts
    .filter((a) => a.accountType === "investment")
    .reduce((sum, a) => sum + a.balanceEUR, 0);

  const totalBoursoBankEUR = accounts.reduce((sum, a) => sum + a.balanceEUR, 0);

  return {
    connected: accounts.length > 0,
    timestamp: new Date().toISOString(),
    environment: sandbox ? "sandbox" : "live",
    accounts: accounts,
    totalCheckingEUR: Math.round(totalCheckingEUR * 100) / 100,
    totalSavingsEUR: Math.round(totalSavingsEUR * 100) / 100,
    totalInvestedEUR: Math.round(totalInvestedEUR * 100) / 100,
    totalBoursoBankEUR: Math.round(totalBoursoBankEUR * 100) / 100,
    partialErrors: partialErrors,
  };
}

/**
 * Fetch TrueLayer transactions for all accounts between two dates
 */
export async function fetchTrueLayerTransactions(
  accessToken?: string,
  from?: string,
  to?: string,
  refreshToken?: string
): Promise<{ transactions: Array<{ id: string; date: string; description: string; amount: number; accountType?: string; counterpartyName?: string }>; partialErrors: string[]; requiresReauth?: boolean }> {
  let tokenToUse = accessToken;

  if (!tokenToUse && refreshToken) {
    const refreshed = await refreshTrueLayerToken(refreshToken);
    if (refreshed?.accessToken) {
      tokenToUse = refreshed.accessToken;
    }
  }

  if (!tokenToUse) {
    return { transactions: [], partialErrors: ['Non connecté à BoursoBank. Veuillez vous connecter.'], requiresReauth: true };
  }

  const apiBase = getTrueLayerApiBaseUrl();
  const partialErrors: string[] = [];
  const transactions: Array<{ id: string; date: string; description: string; amount: number; accountType?: string; counterpartyName?: string }> = [];

  try {
    let accResponse = await fetch(`${apiBase}/accounts`, {
      headers: { Authorization: `Bearer ${tokenToUse}` },
    });

    if (accResponse.status === 401 && refreshToken) {
      const refreshed = await refreshTrueLayerToken(refreshToken);
      if (refreshed?.accessToken) {
        tokenToUse = refreshed.accessToken;
        accResponse = await fetch(`${apiBase}/accounts`, {
          headers: { Authorization: `Bearer ${tokenToUse}` },
        });
      }
    }

    if (accResponse.status === 401) {
      return {
        transactions: [],
        partialErrors: ['Session BoursoBank expirée. Veuillez vous reconnecter.'],
        requiresReauth: true,
      };
    }

    if (!accResponse.ok) {
      throw new Error(`Accounts API returned ${accResponse.status}`);
    }

    const accData = await accResponse.json();
    const rawAccounts: any[] = accData.results || [];

    const now = new Date();
    const defaultFrom = from || new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
    const defaultTo = to || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    for (const acc of rawAccounts) {
      const accId = acc.account_id;
      const accName = acc.display_name || 'Compte BoursoBank';

      try {
        const txUrl = `${apiBase}/accounts/${accId}/transactions?from=${encodeURIComponent(defaultFrom)}&to=${encodeURIComponent(defaultTo)}`;
        const txRes = await fetch(txUrl, {
          headers: { Authorization: `Bearer ${tokenToUse}` },
        });

        if (txRes.ok) {
          const txData = await txRes.json();
          const results: any[] = txData.results || [];
          for (const rawTx of results) {
            const amount = Number(rawTx.amount || 0);
            const desc = rawTx.description || rawTx.transaction_classification || 'Transaction BoursoBank';
            const date = rawTx.timestamp || rawTx.normalized_provider_transaction_id?.slice(0, 10) || defaultFrom;
            const counterparty = rawTx.merchant_name || rawTx.counterparty_name || '';

            transactions.push({
              id: rawTx.transaction_id || `tl-${Math.random()}`,
              date: typeof date === 'string' ? date.slice(0, 10) : defaultFrom,
              description: String(desc),
              amount: amount,
              accountType: accName,
              counterpartyName: counterparty,
            });
          }
        }
      } catch (txErr: unknown) {
        const msg = txErr instanceof Error ? txErr.message : String(txErr);
        partialErrors.push(`Transactions error for ${accName}: ${msg}`);
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    partialErrors.push(`TrueLayer Sync: ${msg}`);
  }

  return { transactions, partialErrors };
}



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
export function getTrueLayerAuthUrl(redirectUri: string, state?: string): string | null {
  const clientId = process.env.TRUELAYER_CLIENT_ID;
  if (!clientId) return null;

  const baseUrl = getTrueLayerAuthBaseUrl();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "info accounts balance cards transactions direct_debits standing_orders offline_access",
    redirect_uri: redirectUri,
    providers: "fr-all uk-ob-all",
    ...(state ? { state } : {}),
  });

  return `${baseUrl}/?${params.toString()}`;
}

/**
 * Fetch TrueLayer accounts and balances using an existing access token or stored credentials
 */
export async function fetchTrueLayerSummary(accessToken?: string): Promise<TrueLayerSyncResult> {
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

  if (!accessToken) {
    // If no access token provided yet, return connection ready state
    return {
      connected: false,
      timestamp: new Date().toISOString(),
      environment: sandbox ? "sandbox" : "live",
      accounts: [],
      totalCheckingEUR: 0,
      totalSavingsEUR: 0,
      totalInvestedEUR: 0,
      totalBoursoBankEUR: 0,
      partialErrors: ["BoursoBank non connecté via TrueLayer. Cliquez sur 'Connecter BoursoBank' pour autoriser l'accès DSP2."],
    };
  }

  const apiBase = getTrueLayerApiBaseUrl();
  const partialErrors: string[] = [];
  const accounts: TrueLayerAccountSummary[] = [];

  try {
    const accResponse = await fetch(`${apiBase}/accounts`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

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
            Authorization: `Bearer ${accessToken}`,
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

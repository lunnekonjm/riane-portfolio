import "server-only";
import { TrueLayerSyncResult, TrueLayerAccountSummary } from "./types";
import { isSandbox, getTrueLayerApiBaseUrl, refreshTrueLayerToken } from "./auth";

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
      partialErrors: ["Aucun jeton d'accès TrueLayer / BoursoBank disponible."],
      requiresReauth: true,
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
        requiresReauth: true,
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

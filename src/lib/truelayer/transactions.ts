"use server";

import { getTrueLayerApiBaseUrl, refreshTrueLayerToken } from "./auth";

export interface TrueLayerTransactionResult {
  transactions: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    accountId?: string;
    accountName?: string;
    accountType?: string;
    counterpartyName?: string;
    category?: string;
  }>;
  partialErrors: string[];
  requiresReauth?: boolean;
  debug?: {
    accountsCount: number;
    cardsCount: number;
    accountsDetails: any[];
    rawTxCount: number;
    apiBase: string;
    hasToken: boolean;
  };
}

/**
 * Normalise une date en format ISO complet accepté par TrueLayer
 */
function toIsoParam(dateStr?: string, isEnd = false): string | undefined {
  if (!dateStr) return undefined;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return undefined;
    if (isEnd) {
      d.setHours(23, 59, 59, 999);
    } else {
      d.setHours(0, 0, 0, 0);
    }
    return d.toISOString();
  } catch {
    return undefined;
  }
}

/**
 * Fetch TrueLayer transactions for all accounts & cards between two dates
 */
export async function fetchTrueLayerTransactions(
  accessToken?: string,
  from?: string,
  to?: string,
  refreshToken?: string
): Promise<TrueLayerTransactionResult> {
  let tokenToUse = accessToken;

  if (!tokenToUse && refreshToken) {
    console.log("[TrueLayer] Attempting token refresh with refreshToken...");
    const refreshed = await refreshTrueLayerToken(refreshToken);
    if (refreshed?.accessToken) {
      tokenToUse = refreshed.accessToken;
    }
  }

  if (!tokenToUse) {
    console.warn("[TrueLayer] No access token provided.");
    return {
      transactions: [],
      partialErrors: ["Non connecté à BoursoBank. Veuillez cliquer sur Connexion BoursoBank."],
      requiresReauth: true,
      debug: {
        accountsCount: 0,
        cardsCount: 0,
        accountsDetails: [],
        rawTxCount: 0,
        apiBase: getTrueLayerApiBaseUrl(),
        hasToken: false,
      },
    };
  }

  const apiBase = getTrueLayerApiBaseUrl();
  const partialErrors: string[] = [];
  const transactions: TrueLayerTransactionResult["transactions"] = [];
  const seenTxIds = new Set<string>();

  const now = new Date();
  const defaultFromIso = toIsoParam(from) || new Date(now.getFullYear(), now.getMonth() - 3, 1, 0, 0, 0).toISOString();
  const defaultToIso = toIsoParam(to, true) || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const extractDescription = (rawTx: any): string => {
    if (typeof rawTx.description === "string" && rawTx.description.trim()) {
      return rawTx.description.trim();
    }
    if (typeof rawTx.merchant_name === "string" && rawTx.merchant_name.trim()) {
      return rawTx.merchant_name.trim();
    }
    if (typeof rawTx.counterparty_name === "string" && rawTx.counterparty_name.trim()) {
      return rawTx.counterparty_name.trim();
    }
    if (Array.isArray(rawTx.transaction_classification) && rawTx.transaction_classification.length > 0) {
      return rawTx.transaction_classification.join(" - ");
    }
    if (typeof rawTx.transaction_classification === "string" && rawTx.transaction_classification.trim()) {
      return rawTx.transaction_classification.trim();
    }
    return "Transaction BoursoBank";
  };

  const extractCategory = (rawTx: any): string => {
    if (Array.isArray(rawTx.transaction_classification) && rawTx.transaction_classification.length > 0) {
      return rawTx.transaction_classification.join(" / ");
    }
    if (typeof rawTx.transaction_category === "string") {
      return rawTx.transaction_category;
    }
    return "";
  };

  let accountsCount = 0;
  let cardsCount = 0;
  const accountsDetails: any[] = [];

  try {
    // 1. Fetch Checking & Deposit Accounts
    console.log(`[TrueLayer] Fetching accounts from ${apiBase}/accounts ...`);
    let accResponse = await fetch(`${apiBase}/accounts`, {
      headers: { Authorization: `Bearer ${tokenToUse}` },
    });

    if (accResponse.status === 401 && refreshToken) {
      console.log("[TrueLayer] 401 on accounts, refreshing token...");
      const refreshed = await refreshTrueLayerToken(refreshToken);
      if (refreshed?.accessToken) {
        tokenToUse = refreshed.accessToken;
        accResponse = await fetch(`${apiBase}/accounts`, {
          headers: { Authorization: `Bearer ${tokenToUse}` },
        });
      }
    }

    if (accResponse.status === 401) {
      console.warn("[TrueLayer] 401 Unauthorized on /accounts");
      return {
        transactions: [],
        partialErrors: ["Session BoursoBank expirée (401). Veuillez vous reconnecter."],
        requiresReauth: true,
        debug: {
          accountsCount: 0,
          cardsCount: 0,
          accountsDetails: [],
          rawTxCount: 0,
          apiBase,
          hasToken: true,
        },
      };
    }

    if (!accResponse.ok) {
      const accErr = await accResponse.text();
      console.error(`[TrueLayer] /accounts error ${accResponse.status}: ${accErr}`);
      partialErrors.push(`Erreur récupération comptes (${accResponse.status}): ${accErr}`);
    } else {
      const accData = await accResponse.json();
      const rawAccounts: any[] = accData.results || [];
      accountsCount = rawAccounts.length;
      console.log(`[TrueLayer] Found ${accountsCount} account(s) from BoursoBank`);

      for (const acc of rawAccounts) {
        const accId = acc.account_id;
        const accName = acc.display_name || acc.account_type || "Compte BoursoBank";
        let accTxCount = 0;

        accountsDetails.push({
          id: accId,
          name: accName,
          type: acc.account_type,
          currency: acc.currency,
        });

        // 1a. Try ISO parameters first
        let txUrl = `${apiBase}/accounts/${accId}/transactions?from=${encodeURIComponent(defaultFromIso)}&to=${encodeURIComponent(defaultToIso)}`;
        let txRes = await fetch(txUrl, {
          headers: { Authorization: `Bearer ${tokenToUse}` },
        });

        // 1b. If 400 Bad Request, fallback to query without from/to (all default txs)
        if (!txRes.ok && txRes.status === 400) {
          console.log(`[TrueLayer] Retrying ${accName} transactions without from/to...`);
          txUrl = `${apiBase}/accounts/${accId}/transactions`;
          txRes = await fetch(txUrl, {
            headers: { Authorization: `Bearer ${tokenToUse}` },
          });
        }

        if (txRes.ok) {
          const txData = await txRes.json();
          const results: any[] = txData.results || [];
          accTxCount += results.length;
          console.log(`[TrueLayer] Account ${accName} (${accId}): ${results.length} settled transactions`);

          for (const rawTx of results) {
            const txId = rawTx.transaction_id || `acc-${accId}-${rawTx.timestamp}-${rawTx.amount}`;
            if (seenTxIds.has(txId)) continue;
            seenTxIds.add(txId);

            const amount = Number(rawTx.amount || 0);
            const desc = extractDescription(rawTx);
            const date = rawTx.timestamp || rawTx.normalized_provider_transaction_id?.slice(0, 10) || defaultFromIso;
            const counterparty = rawTx.merchant_name || rawTx.counterparty_name || "";

            transactions.push({
              id: txId,
              date: typeof date === "string" ? date.slice(0, 10) : defaultFromIso.slice(0, 10),
              description: desc,
              amount: amount,
              accountId: accId,
              accountName: accName,
              accountType: acc.account_type || accName,
              counterpartyName: counterparty,
              category: extractCategory(rawTx),
            });
          }
        } else {
          const txErrText = await txRes.text();
          console.warn(`[TrueLayer] Account ${accName} transactions error ${txRes.status}: ${txErrText}`);
          partialErrors.push(`Compte ${accName}: ${txRes.status} ${txErrText.slice(0, 100)}`);
        }

        // 1c. Pending transactions
        try {
          const pendingUrl = `${apiBase}/accounts/${accId}/transactions/pending`;
          const pendingRes = await fetch(pendingUrl, {
            headers: { Authorization: `Bearer ${tokenToUse}` },
          });
          if (pendingRes.ok) {
            const pendingData = await pendingRes.json();
            const pendingResults: any[] = pendingData.results || [];
            accTxCount += pendingResults.length;
            console.log(`[TrueLayer] Account ${accName}: ${pendingResults.length} pending transactions`);

            for (const rawTx of pendingResults) {
              const txId = rawTx.transaction_id || `pnd-${accId}-${rawTx.timestamp}-${rawTx.amount}`;
              if (seenTxIds.has(txId)) continue;
              seenTxIds.add(txId);

              const amount = Number(rawTx.amount || 0);
              const desc = extractDescription(rawTx);
              const date = rawTx.timestamp || defaultFromIso;
              const counterparty = rawTx.merchant_name || rawTx.counterparty_name || "";

              transactions.push({
                id: txId,
                date: typeof date === "string" ? date.slice(0, 10) : defaultFromIso.slice(0, 10),
                description: desc,
                amount: amount,
                accountId: accId,
                accountName: accName,
                accountType: acc.account_type || accName,
                counterpartyName: counterparty,
                category: extractCategory(rawTx),
              });
            }
          }
        } catch (_) {}
      }
    }

    // 2. Fetch Cards (BoursoBank Visa / CB)
    try {
      console.log(`[TrueLayer] Fetching cards from ${apiBase}/cards ...`);
      const cardsResponse = await fetch(`${apiBase}/cards`, {
        headers: { Authorization: `Bearer ${tokenToUse}` },
      });

      if (cardsResponse.ok) {
        const cardsData = await cardsResponse.json();
        const rawCards: any[] = cardsData.results || [];
        cardsCount = rawCards.length;
        console.log(`[TrueLayer] Found ${cardsCount} card(s) from BoursoBank`);

        for (const card of rawCards) {
          const cardId = card.account_id || card.card_id;
          const cardName = card.display_name || card.card_network || "Carte BoursoBank";

          accountsDetails.push({
            id: cardId,
            name: cardName,
            type: "CARD",
            currency: card.currency,
          });

          // Card transactions with ISO
          let cardTxUrl = `${apiBase}/cards/${cardId}/transactions?from=${encodeURIComponent(defaultFromIso)}&to=${encodeURIComponent(defaultToIso)}`;
          let cardTxRes = await fetch(cardTxUrl, {
            headers: { Authorization: `Bearer ${tokenToUse}` },
          });

          if (!cardTxRes.ok && cardTxRes.status === 400) {
            cardTxUrl = `${apiBase}/cards/${cardId}/transactions`;
            cardTxRes = await fetch(cardTxUrl, {
              headers: { Authorization: `Bearer ${tokenToUse}` },
            });
          }

          if (cardTxRes.ok) {
            const cardTxData = await cardTxRes.json();
            const results: any[] = cardTxData.results || [];
            console.log(`[TrueLayer] Card ${cardName} (${cardId}): ${results.length} transactions`);

            for (const rawTx of results) {
              const txId = rawTx.transaction_id || `card-${cardId}-${rawTx.timestamp}-${rawTx.amount}`;
              if (seenTxIds.has(txId)) continue;
              seenTxIds.add(txId);

              const amount = Number(rawTx.amount || 0);
              const desc = extractDescription(rawTx);
              const date = rawTx.timestamp || defaultFromIso;
              const counterparty = rawTx.merchant_name || rawTx.counterparty_name || "";

              transactions.push({
                id: txId,
                date: typeof date === "string" ? date.slice(0, 10) : defaultFromIso.slice(0, 10),
                description: desc,
                amount: amount,
                accountId: cardId,
                accountName: cardName,
                accountType: "CARD",
                counterpartyName: counterparty,
                category: extractCategory(rawTx),
              });
            }
          }
        }
      } else {
        console.log(`[TrueLayer] /cards returned ${cardsResponse.status} (normal if bank does not expose /cards)`);
      }
    } catch (_) {}

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[TrueLayer] Top-level sync error:", msg);
    partialErrors.push(`TrueLayer Sync Error: ${msg}`);
  }

  // Sort descending by date
  transactions.sort((a, b) => b.date.localeCompare(a.date));
  console.log(`[TrueLayer] Total parsed transactions: ${transactions.length}`);

  return {
    transactions,
    partialErrors,
    debug: {
      accountsCount,
      cardsCount,
      accountsDetails,
      rawTxCount: transactions.length,
      apiBase,
      hasToken: true,
    },
  };
}

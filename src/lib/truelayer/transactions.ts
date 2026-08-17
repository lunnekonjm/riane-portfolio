import "server-only";
import { getTrueLayerApiBaseUrl, refreshTrueLayerToken } from "./auth";

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

import type { RawBankTransaction } from './transactionClassifier';

export const TRUELAYER_TX_CACHE_KEY = 'truelayer_cached_transactions_v2';
export const TRUELAYER_TX_CACHE_TIMESTAMP_KEY = 'truelayer_cached_transactions_ts_v2';

export interface CachedTransactionsData {
  transactions: RawBankTransaction[];
  timestamp: number;
  months: string[];
}

/**
 * Récupère les transactions mises en cache dans localStorage
 */
export function getCachedTrueLayerTransactions(): CachedTransactionsData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TRUELAYER_TX_CACHE_KEY);
    const rawTs = localStorage.getItem(TRUELAYER_TX_CACHE_TIMESTAMP_KEY);
    if (!raw) return null;
    const transactions: RawBankTransaction[] = JSON.parse(raw);
    const timestamp = rawTs ? Number(rawTs) : Date.now();
    const monthSet = new Set<string>();
    transactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        monthSet.add(t.date.slice(0, 7));
      }
    });
    const months = Array.from(monthSet).sort().reverse();
    return { transactions, timestamp, months };
  } catch {
    return null;
  }
}

/**
 * Interroge l'API TrueLayer pour les N derniers mois complets et met en cache
 */
export async function fetchAndCacheTrueLayerTransactions(
  monthsCount: number = 3
): Promise<{ transactions: RawBankTransaction[]; partialErrors: string[]; months: string[]; requiresReauth?: boolean }> {
  const now = new Date();
  const fromDate = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1), 1);
  const from = fromDate.toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  try {
    const res = await fetch(`/api/integrations/truelayer/transactions?from=${from}&to=${to}`);
    if (!res.ok) {
      const errText = await res.text().catch(() => 'Erreur réseau');
      return {
        transactions: [],
        partialErrors: [`Échec de récupération (${res.status}): ${errText}`],
        months: [],
        requiresReauth: res.status === 401,
      };
    }

    const data = await res.json();
    const txList: RawBankTransaction[] = data.transactions || [];
    const partialErrors: string[] = data.partialErrors || [];
    const requiresReauth: boolean = !!data.requiresReauth;

    if (typeof window !== 'undefined' && txList.length > 0) {
      try {
        localStorage.setItem(TRUELAYER_TX_CACHE_KEY, JSON.stringify(txList));
        localStorage.setItem(TRUELAYER_TX_CACHE_TIMESTAMP_KEY, String(Date.now()));
      } catch (e) {
        console.warn('Could not cache transactions in localStorage:', e);
      }
    }

    const monthSet = new Set<string>();
    txList.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        monthSet.add(t.date.slice(0, 7));
      }
    });
    const months = Array.from(monthSet).sort().reverse();

    return { transactions: txList, partialErrors, months, requiresReauth };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur réseau';
    return {
      transactions: [],
      partialErrors: [msg],
      months: [],
      requiresReauth: false,
    };
  }
}

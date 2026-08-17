"use client";

import type { RawBankTransaction } from "./transactionClassifier";

export const TRUELAYER_TX_CACHE_KEY = "truelayer_cached_transactions_v2";
export const TRUELAYER_TX_CACHE_TIMESTAMP_KEY = "truelayer_cached_transactions_ts_v2";
export const TRUELAYER_DEBUG_KEY = "truelayer_debug_info_v2";

export interface CachedTransactionsData {
  transactions: RawBankTransaction[];
  timestamp: number;
  months: string[];
  debug?: any;
}

/**
 * Récupère les transactions mises en cache dans localStorage
 */
export function getCachedTrueLayerTransactions(): CachedTransactionsData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TRUELAYER_TX_CACHE_KEY);
    const rawTs = localStorage.getItem(TRUELAYER_TX_CACHE_TIMESTAMP_KEY);
    const rawDebug = localStorage.getItem(TRUELAYER_DEBUG_KEY);
    if (!raw) return null;
    const transactions: RawBankTransaction[] = JSON.parse(raw);
    const timestamp = rawTs ? Number(rawTs) : Date.now();
    const debug = rawDebug ? JSON.parse(rawDebug) : undefined;
    const monthSet = new Set<string>();
    transactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        monthSet.add(t.date.slice(0, 7));
      }
    });
    const months = Array.from(monthSet).sort().reverse();
    return { transactions, timestamp, months, debug };
  } catch {
    return null;
  }
}

/**
 * Interroge l'API TrueLayer pour les N derniers mois complets et met en cache
 */
export async function fetchAndCacheTrueLayerTransactions(
  monthsCount: number = 3
): Promise<{
  transactions: RawBankTransaction[];
  partialErrors: string[];
  months: string[];
  requiresReauth?: boolean;
  debug?: any;
}> {
  const now = new Date();
  const fromDate = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1), 1);
  const from = fromDate.toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const localToken = typeof window !== "undefined" ? localStorage.getItem("truelayer_access_token") : null;
  const tokenQuery = localToken ? `&token=${encodeURIComponent(localToken)}` : "";

  try {
    const res = await fetch(`/api/integrations/truelayer/transactions?from=${from}&to=${to}${tokenQuery}`);
    if (!res.ok) {
      const errText = await res.text().catch(() => "Erreur réseau");
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
    const debug = data.debug;

    if (typeof window !== "undefined") {
      try {
        if (txList.length > 0) {
          localStorage.setItem(TRUELAYER_TX_CACHE_KEY, JSON.stringify(txList));
          localStorage.setItem(TRUELAYER_TX_CACHE_TIMESTAMP_KEY, String(Date.now()));
        }
        if (debug) {
          localStorage.setItem(TRUELAYER_DEBUG_KEY, JSON.stringify(debug));
        }
        window.dispatchEvent(new CustomEvent("truelayer_transactions_updated", { detail: { txList, debug } }));
      } catch (e) {
        console.warn("Could not cache transactions in localStorage:", e);
      }
    }

    const monthSet = new Set<string>();
    txList.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        monthSet.add(t.date.slice(0, 7));
      }
    });
    const months = Array.from(monthSet).sort().reverse();

    return { transactions: txList, partialErrors, months, requiresReauth, debug };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur réseau";
    return {
      transactions: [],
      partialErrors: [msg],
      months: [],
      requiresReauth: false,
    };
  }
}

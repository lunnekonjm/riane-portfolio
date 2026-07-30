/**
 * Cache layer for market data — localStorage with TTL
 */

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
}

const CACHE_PREFIX = 'riane_market_';

export function getCached<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.cachedAt > entry.ttlMs) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
  if (typeof window === 'undefined') return;
  try {
    const entry: CacheEntry<T> = { data, cachedAt: Date.now(), ttlMs };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch { /* ignore quota exceeded */ }
}

export function clearMarketCache(): void {
  if (typeof window === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

/** Cache TTLs */
export const CACHE_TTL = {
  QUOTE: 5 * 60 * 1000,        // 5 min for real-time quotes
  PROFILE: 24 * 60 * 60 * 1000, // 24h for company profiles
  HISTORICAL: 60 * 60 * 1000,   // 1h for historical data
  NEWS: 15 * 60 * 1000,         // 15 min for news
} as const;

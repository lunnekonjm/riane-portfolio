import type { AnalysisResult } from '@/types/analysis';

const CACHE_KEY_PREFIX = 'riane_analysis_cache_';
const CACHE_EXPIRATION_MS = 30 * 60 * 1000; // 30 minutes cache validity

export interface CachedAnalysis {
  timestamp: number;
  result: AnalysisResult;
}

/**
 * Normalizes query string to create a consistent cache key
 */
export function getQueryCacheKey(query: string): string {
  return CACHE_KEY_PREFIX + query.trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * Retrieves a cached analysis if valid and not expired
 */
export function getCachedAnalysis(query: string, maxAgeMs = CACHE_EXPIRATION_MS): AnalysisResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = getQueryCacheKey(query);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const cached: CachedAnalysis = JSON.parse(raw);
    const now = Date.now();
    if (now - cached.timestamp > maxAgeMs) {
      localStorage.removeItem(key);
      return null;
    }
    return cached.result;
  } catch {
    return null;
  }
}

/**
 * Saves analysis result to cache
 */
export function setCachedAnalysis(query: string, result: AnalysisResult): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getQueryCacheKey(query);
    const entry: CachedAnalysis = {
      timestamp: Date.now(),
      result,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Fail silently if localStorage quota is exceeded
  }
}

/**
 * Clears analysis cache for a specific query or all
 */
export function clearAnalysisCache(query?: string): void {
  if (typeof window === 'undefined') return;
  if (query) {
    localStorage.removeItem(getQueryCacheKey(query));
  } else {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_KEY_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  }
}

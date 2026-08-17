import { yahooFinanceProvider } from './yahooFinance';
import { getCached, setCache, CACHE_TTL } from './cache';

/**
 * Get FX conversion rate to EUR (e.g. USD -> EUR)
 */
export async function getFxRates(): Promise<Record<string, number>> {
  const cacheKey = 'fx_rates_eur';
  const cached = getCached<Record<string, number>>(cacheKey);
  if (cached) return cached;

  const rates: Record<string, number> = { EUR: 1.0, USD: 0.92, GBP: 1.18, CHF: 1.04 };

  try {
    const usdQuote = await yahooFinanceProvider.getQuote('EURUSD=X');
    if (usdQuote && usdQuote.price > 0) {
      rates['USD'] = 1 / usdQuote.price;
    }
  } catch (err) {
    console.warn('[MarketData] FX rate fetch failed, using fallback:', err);
  }

  setCache(cacheKey, rates, CACHE_TTL.QUOTE);
  return rates;
}

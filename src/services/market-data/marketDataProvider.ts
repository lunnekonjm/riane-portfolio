import type { QuoteData, CompanyProfile, HistoricalDataPoint } from './types';
import { yahooFinanceProvider } from './yahooFinance';
import { coingeckoProvider } from './coingecko';
import { alphaVantageProvider } from './alphaVantage';
import { finnhubProvider } from './finnhub';
import { getCached, setCache, CACHE_TTL } from './cache';
import { normalizeMarketTicker } from './tickerNormalizer';

/**
 * Get a real-time quote — Yahoo Finance first (gratuit), then CoinGecko (for crypto), then Finnhub, then Alpha Vantage
 */
export async function getQuote(ticker: string): Promise<QuoteData> {
  const normalizedTicker = normalizeMarketTicker(ticker);
  const cacheKey = `quote_${normalizedTicker}`;
  const cached = getCached<QuoteData>(cacheKey);
  if (cached) return cached;

  // Try Yahoo Finance first (free, no API key needed)
  try {
    const quote = await yahooFinanceProvider.getQuote(normalizedTicker);
    if (quote.price > 0) {
      const resultQuote = { ...quote, ticker };
      setCache(cacheKey, resultQuote, CACHE_TTL.QUOTE);
      return resultQuote;
    }
  } catch (err) {
    // Yahoo failed, fallback to specialized providers
  }

  // Fallback: CoinGecko (for altcoins, SPL tokens & cryptos)
  try {
    const quote = await coingeckoProvider.getQuote(normalizedTicker);
    if (quote.price > 0) {
      const resultQuote = { ...quote, ticker };
      setCache(cacheKey, resultQuote, CACHE_TTL.QUOTE);
      return resultQuote;
    }
  } catch {
    // ignore
  }

  // Fallback: Finnhub
  try {
    const quote = await finnhubProvider.getQuote(normalizedTicker);
    setCache(cacheKey, quote, CACHE_TTL.QUOTE);
    return quote;
  } catch {
    // Last resort: Alpha Vantage
  }

  const quote = await alphaVantageProvider.getQuote(normalizedTicker);
  setCache(cacheKey, quote, CACHE_TTL.QUOTE);
  return quote;
}

/**
 * Get multiple quotes in parallel
 */
export async function getMultipleQuotes(tickers: string[]): Promise<Map<string, QuoteData>> {
  const results = new Map<string, QuoteData>();
  await Promise.allSettled(
    tickers.map(async (t) => {
      try {
        const q = await getQuote(t);
        if (q) results.set(t, q);
      } catch {
        // ignore
      }
    })
  );
  return results;
}

/**
 * Get company profile
 */
export async function getCompanyProfile(ticker: string): Promise<CompanyProfile> {
  const cacheKey = `profile_${ticker}`;
  const cached = getCached<CompanyProfile>(cacheKey);
  if (cached) return cached;

  try {
    const profile = await yahooFinanceProvider.getCompanyProfile(ticker);
    setCache(cacheKey, profile, CACHE_TTL.PROFILE);
    return profile;
  } catch {
    try {
      const profile = await alphaVantageProvider.getCompanyProfile(ticker);
      setCache(cacheKey, profile, CACHE_TTL.PROFILE);
      return profile;
    } catch {
      const profile = await finnhubProvider.getCompanyProfile(ticker);
      setCache(cacheKey, profile, CACHE_TTL.PROFILE);
      return profile;
    }
  }
}

/**
 * Get historical price data
 */
export async function getHistoricalData(
  ticker: string,
  period: string = '1Y'
): Promise<HistoricalDataPoint[]> {
  const cacheKey = `hist_${ticker}_${period}`;
  const cached = getCached<HistoricalDataPoint[]>(cacheKey);
  if (cached) return cached;

  try {
    const data = await yahooFinanceProvider.getHistoricalData(ticker, period);
    if (data.length > 0) {
      setCache(cacheKey, data, CACHE_TTL.HISTORICAL);
      return data;
    }
  } catch {
    // Fallback to Alpha Vantage
  }

  try {
    const data = await alphaVantageProvider.getHistoricalData(ticker, period);
    setCache(cacheKey, data, CACHE_TTL.HISTORICAL);
    return data;
  } catch {
    const data = await finnhubProvider.getHistoricalData(ticker, period);
    setCache(cacheKey, data, CACHE_TTL.HISTORICAL);
    return data;
  }
}

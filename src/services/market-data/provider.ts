/**
 * Market data provider — facade combining Alpha Vantage + Finnhub
 * with caching and intelligent fallback
 */

import type { QuoteData, CompanyProfile, HistoricalDataPoint, NewsItem } from './types';
import { alphaVantageProvider } from './alphaVantage';
import { finnhubProvider } from './finnhub';
import { getCached, setCache, CACHE_TTL } from './cache';

/**
 * Get a real-time quote — tries Finnhub first (higher rate limit), then Alpha Vantage
 */
export async function getQuote(ticker: string): Promise<QuoteData> {
  const cacheKey = `quote_${ticker}`;
  const cached = getCached<QuoteData>(cacheKey);
  if (cached) return cached;

  try {
    const quote = await finnhubProvider.getQuote(ticker);
    setCache(cacheKey, quote, CACHE_TTL.QUOTE);
    return quote;
  } catch {
    const quote = await alphaVantageProvider.getQuote(ticker);
    setCache(cacheKey, quote, CACHE_TTL.QUOTE);
    return quote;
  }
}

/**
 * Get company profile — tries Alpha Vantage first (richer data), then Finnhub
 */
export async function getCompanyProfile(ticker: string): Promise<CompanyProfile> {
  const cacheKey = `profile_${ticker}`;
  const cached = getCached<CompanyProfile>(cacheKey);
  if (cached) return cached;

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
    const data = await alphaVantageProvider.getHistoricalData(ticker, period);
    setCache(cacheKey, data, CACHE_TTL.HISTORICAL);
    return data;
  } catch {
    const data = await finnhubProvider.getHistoricalData(ticker, period);
    setCache(cacheKey, data, CACHE_TTL.HISTORICAL);
    return data;
  }
}

/**
 * Get news for a ticker
 */
export async function getNews(ticker: string): Promise<NewsItem[]> {
  const cacheKey = `news_${ticker}`;
  const cached = getCached<NewsItem[]>(cacheKey);
  if (cached) return cached;

  if (finnhubProvider.getNews) {
    const news = await finnhubProvider.getNews(ticker);
    setCache(cacheKey, news, CACHE_TTL.NEWS);
    return news;
  }
  return [];
}

/**
 * Batch fetch quotes for multiple tickers
 */
export async function getMultipleQuotes(tickers: string[]): Promise<Map<string, QuoteData>> {
  const results = new Map<string, QuoteData>();
  const promises = tickers.map(async (ticker) => {
    try {
      const quote = await getQuote(ticker);
      results.set(ticker, quote);
    } catch (err) {
      console.warn(`[MarketData] Failed to fetch ${ticker}:`, err);
    }
  });
  await Promise.allSettled(promises);
  return results;
}

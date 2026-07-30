/**
 * Market data provider — facade avec Yahoo Finance (gratuit) en priorité
 * Fallback: Alpha Vantage → Finnhub (nécessitent des clés API)
 */

import type { QuoteData, CompanyProfile, HistoricalDataPoint, NewsItem } from './types';
import { yahooFinanceProvider } from './yahooFinance';
import { alphaVantageProvider } from './alphaVantage';
import { finnhubProvider } from './finnhub';
import { getCached, setCache, CACHE_TTL } from './cache';

/**
 * Get a real-time quote — Yahoo Finance first (gratuit), then Finnhub, then Alpha Vantage
 */
export async function getQuote(ticker: string): Promise<QuoteData> {
  const cacheKey = `quote_${ticker}`;
  const cached = getCached<QuoteData>(cacheKey);
  if (cached) return cached;

  // Try Yahoo Finance first (free, no API key needed)
  try {
    const quote = await yahooFinanceProvider.getQuote(ticker);
    if (quote.price > 0) {
      setCache(cacheKey, quote, CACHE_TTL.QUOTE);
      return quote;
    }
  } catch (err) {
    console.warn(`[MarketData] Yahoo Finance failed for ${ticker}:`, err);
  }

  // Fallback: Finnhub
  try {
    const quote = await finnhubProvider.getQuote(ticker);
    setCache(cacheKey, quote, CACHE_TTL.QUOTE);
    return quote;
  } catch {
    // Last resort: Alpha Vantage
  }

  const quote = await alphaVantageProvider.getQuote(ticker);
  setCache(cacheKey, quote, CACHE_TTL.QUOTE);
  return quote;
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

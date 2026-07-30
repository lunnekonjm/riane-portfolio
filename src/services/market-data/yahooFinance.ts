/**
 * Yahoo Finance Provider — Cours de marché gratuits (pas de clé API)
 * Fonctionne pour Euronext Paris (.PA) et marchés US
 * Utilise l'API v8 de Yahoo Finance via un proxy CORS-friendly
 */

import type { QuoteData, CompanyProfile, HistoricalDataPoint, MarketDataProvider } from './types';

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance';

/**
 * Fetch with CORS proxy fallback for client-side requests
 */
async function yahooFetch(url: string): Promise<Response> {
  // Try direct fetch first (works server-side / Vercel Functions)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'RIANE-Portfolio/1.0' },
    });
    if (res.ok) return res;
  } catch {
    // Direct fetch failed, try via Next.js API route
  }

  // Fallback: use our own API route as proxy
  const proxyUrl = `/api/market-quote?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error(`Yahoo Finance proxy failed: ${res.status}`);
  return res;
}

export const yahooFinanceProvider: MarketDataProvider = {
  name: 'Yahoo Finance',

  async getQuote(ticker: string): Promise<QuoteData> {
    const url = `${YAHOO_BASE}/chart/${encodeURIComponent(ticker)}?range=2d&interval=1d`;
    const res = await yahooFetch(url);
    const data = await res.json();

    const result = data?.chart?.result?.[0];
    if (!result) throw new Error(`No Yahoo data for ${ticker}`);

    const meta = result.meta;
    const quotes = result.indicators?.quote?.[0];
    const timestamps = result.timestamp;

    // Get the most recent close price
    const lastIdx = timestamps ? timestamps.length - 1 : 0;
    const currentPrice = meta.regularMarketPrice || (quotes?.close?.[lastIdx]) || 0;
    const previousClose = meta.chartPreviousClose || meta.previousClose || (quotes?.close?.[Math.max(0, lastIdx - 1)]) || currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    return {
      ticker,
      price: currentPrice,
      change,
      changePercent,
      high: quotes?.high?.[lastIdx] || meta.regularMarketDayHigh || currentPrice,
      low: quotes?.low?.[lastIdx] || meta.regularMarketDayLow || currentPrice,
      open: quotes?.open?.[lastIdx] || meta.regularMarketOpen || currentPrice,
      previousClose,
      volume: quotes?.volume?.[lastIdx] || meta.regularMarketVolume || 0,
      timestamp: (timestamps?.[lastIdx] || Math.floor(Date.now() / 1000)) * 1000,
      currency: meta.currency || 'EUR',
      source: 'Yahoo Finance',
    };
  },

  async getCompanyProfile(ticker: string): Promise<CompanyProfile> {
    // Yahoo v8 chart gives us basic meta info
    const url = `${YAHOO_BASE}/chart/${encodeURIComponent(ticker)}?range=1d&interval=1d`;
    const res = await yahooFetch(url);
    const data = await res.json();

    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) throw new Error(`No Yahoo profile for ${ticker}`);

    return {
      ticker,
      name: meta.longName || meta.shortName || ticker,
      sector: '',
      industry: '',
      country: '',
      marketCap: 0,
      exchange: meta.exchangeName || meta.fullExchangeName || '',
      currency: meta.currency || 'EUR',
      description: '',
      source: 'Yahoo Finance',
    };
  },

  async getHistoricalData(ticker: string, period: string = '1Y'): Promise<HistoricalDataPoint[]> {
    const rangeMap: Record<string, string> = {
      '1M': '1mo', '3M': '3mo', '6M': '6mo',
      '1Y': '1y', '2Y': '2y', '5Y': '5y',
    };
    const range = rangeMap[period] || '1y';
    const url = `${YAHOO_BASE}/chart/${encodeURIComponent(ticker)}?range=${range}&interval=1d`;
    const res = await yahooFetch(url);
    const data = await res.json();

    const result = data?.chart?.result?.[0];
    if (!result) return [];

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const adjClose = result.indicators?.adjclose?.[0]?.adjclose || [];

    return timestamps.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open: quotes.open?.[i] || 0,
      high: quotes.high?.[i] || 0,
      low: quotes.low?.[i] || 0,
      close: quotes.close?.[i] || 0,
      adjustedClose: adjClose[i] || quotes.close?.[i] || 0,
      volume: quotes.volume?.[i] || 0,
    }));
  },
};

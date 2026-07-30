/**
 * Finnhub Provider — Cotations temps réel et actualités
 * Free tier: 60 req/min
 */

import type { QuoteData, CompanyProfile, HistoricalDataPoint, MarketDataProvider, NewsItem } from './types';

const BASE_URL = 'https://finnhub.io/api/v1';

function getApiKey(): string {
  return process.env.NEXT_PUBLIC_FINNHUB_API_KEY || '';
}

export const finnhubProvider: MarketDataProvider = {
  name: 'Finnhub',

  async getQuote(ticker: string): Promise<QuoteData> {
    const key = getApiKey();
    if (!key) throw new Error('Finnhub API key not configured');

    const res = await fetch(
      `${BASE_URL}/quote?symbol=${encodeURIComponent(ticker)}&token=${key}`
    );
    const data = await res.json();

    if (!data.c || data.c === 0) {
      throw new Error(`No quote data for ${ticker} from Finnhub`);
    }

    return {
      ticker,
      price: data.c,
      change: data.d || 0,
      changePercent: data.dp || 0,
      high: data.h || data.c,
      low: data.l || data.c,
      open: data.o || data.c,
      previousClose: data.pc || data.c,
      volume: 0,
      timestamp: Date.now(),
      currency: 'USD',
      source: 'Finnhub',
    };
  },

  async getCompanyProfile(ticker: string): Promise<CompanyProfile> {
    const key = getApiKey();
    if (!key) throw new Error('Finnhub API key not configured');

    const res = await fetch(
      `${BASE_URL}/stock/profile2?symbol=${encodeURIComponent(ticker)}&token=${key}`
    );
    const data = await res.json();

    return {
      ticker: data.ticker || ticker,
      name: data.name || ticker,
      sector: data.finnhubIndustry || 'Unknown',
      industry: data.finnhubIndustry || 'Unknown',
      country: data.country || 'Unknown',
      marketCap: data.marketCapitalization ? data.marketCapitalization * 1000000 : 0,
      exchange: data.exchange || 'Unknown',
      currency: data.currency || 'USD',
      description: '',
      source: 'Finnhub',
    };
  },

  async getHistoricalData(ticker: string, period: string = '1Y'): Promise<HistoricalDataPoint[]> {
    const key = getApiKey();
    if (!key) throw new Error('Finnhub API key not configured');

    const now = Math.floor(Date.now() / 1000);
    const periodMap: Record<string, number> = {
      '1M': 30 * 86400,
      '3M': 90 * 86400,
      '6M': 180 * 86400,
      '1Y': 365 * 86400,
      '5Y': 5 * 365 * 86400,
    };
    const from = now - (periodMap[period] || periodMap['1Y']);

    const res = await fetch(
      `${BASE_URL}/stock/candle?symbol=${encodeURIComponent(ticker)}&resolution=D&from=${from}&to=${now}&token=${key}`
    );
    const data = await res.json();

    if (data.s !== 'ok' || !data.t) {
      throw new Error(`No historical data for ${ticker} from Finnhub`);
    }

    return data.t.map((timestamp: number, i: number) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      adjustedClose: data.c[i],
      volume: data.v[i],
    }));
  },

  async getNews(ticker: string): Promise<NewsItem[]> {
    const key = getApiKey();
    if (!key) return [];

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    const res = await fetch(
      `${BASE_URL}/company-news?symbol=${encodeURIComponent(ticker)}&from=${weekAgo}&to=${today}&token=${key}`
    );
    const data = await res.json();

    if (!Array.isArray(data)) return [];

    return data.slice(0, 10).map((item: any) => ({
      title: item.headline || '',
      summary: item.summary || '',
      source: item.source || '',
      url: item.url || '',
      publishedAt: new Date(item.datetime * 1000).toISOString(),
      relatedTickers: item.related ? item.related.split(',') : [ticker],
    }));
  },
};

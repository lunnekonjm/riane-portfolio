/**
 * Alpha Vantage Provider — Fondamentaux et données historiques
 * Free tier: 25 requêtes/jour
 */

import type { QuoteData, CompanyProfile, HistoricalDataPoint, MarketDataProvider } from './types';

const BASE_URL = 'https://www.alphavantage.co/query';

function getApiKey(): string {
  return process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || '';
}

export const alphaVantageProvider: MarketDataProvider = {
  name: 'Alpha Vantage',

  async getQuote(ticker: string): Promise<QuoteData> {
    const key = getApiKey();
    if (!key) throw new Error('Alpha Vantage API key not configured');

    const res = await fetch(
      `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(ticker)}&apikey=${key}`
    );
    const data = await res.json();
    const quote = data['Global Quote'];

    if (!quote || !quote['05. price']) {
      throw new Error(`No quote data for ${ticker}`);
    }

    return {
      ticker,
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent']?.replace('%', '') || '0'),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      open: parseFloat(quote['02. open']),
      previousClose: parseFloat(quote['08. previous close']),
      volume: parseInt(quote['06. volume'], 10),
      timestamp: Date.now(),
      currency: 'USD',
      source: 'Alpha Vantage',
    };
  },

  async getCompanyProfile(ticker: string): Promise<CompanyProfile> {
    const key = getApiKey();
    if (!key) throw new Error('Alpha Vantage API key not configured');

    const res = await fetch(
      `${BASE_URL}?function=OVERVIEW&symbol=${encodeURIComponent(ticker)}&apikey=${key}`
    );
    const data = await res.json();

    if (!data.Symbol) {
      throw new Error(`No company profile for ${ticker}`);
    }

    return {
      ticker: data.Symbol,
      name: data.Name || ticker,
      sector: data.Sector || 'Unknown',
      industry: data.Industry || 'Unknown',
      country: data.Country || 'Unknown',
      marketCap: parseFloat(data.MarketCapitalization || '0'),
      exchange: data.Exchange || 'Unknown',
      currency: data.Currency || 'USD',
      description: data.Description || '',
      peRatio: data.PERatio ? parseFloat(data.PERatio) : undefined,
      eps: data.EPS ? parseFloat(data.EPS) : undefined,
      dividendYield: data.DividendYield ? parseFloat(data.DividendYield) : undefined,
      beta: data.Beta ? parseFloat(data.Beta) : undefined,
      week52High: data['52WeekHigh'] ? parseFloat(data['52WeekHigh']) : undefined,
      week52Low: data['52WeekLow'] ? parseFloat(data['52WeekLow']) : undefined,
      source: 'Alpha Vantage',
    };
  },

  async getHistoricalData(ticker: string, period: string = 'compact'): Promise<HistoricalDataPoint[]> {
    const key = getApiKey();
    if (!key) throw new Error('Alpha Vantage API key not configured');

    const outputSize = period === 'full' ? 'full' : 'compact';
    const res = await fetch(
      `${BASE_URL}?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${encodeURIComponent(ticker)}&outputsize=${outputSize}&apikey=${key}`
    );
    const data = await res.json();
    const timeSeries = data['Time Series (Daily)'];

    if (!timeSeries) {
      throw new Error(`No historical data for ${ticker}`);
    }

    return Object.entries(timeSeries)
      .map(([date, values]: [string, any]) => ({
        date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        adjustedClose: parseFloat(values['5. adjusted close']),
        volume: parseInt(values['6. volume'], 10),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
};

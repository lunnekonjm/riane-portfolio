/**
 * Types pour les services de données de marché
 */

export interface QuoteData {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  timestamp: number;
  currency: string;
  source: string;
}

export interface CompanyProfile {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  country: string;
  marketCap: number;
  exchange: string;
  currency: string;
  description: string;
  peRatio?: number;
  eps?: number;
  dividendYield?: number;
  beta?: number;
  week52High?: number;
  week52Low?: number;
  source: string;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose: number;
  volume: number;
}

export interface MarketDataProvider {
  name: string;
  getQuote(ticker: string): Promise<QuoteData>;
  getCompanyProfile(ticker: string): Promise<CompanyProfile>;
  getHistoricalData(ticker: string, period: string): Promise<HistoricalDataPoint[]>;
  getNews?(ticker: string): Promise<NewsItem[]>;
}

export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  relatedTickers: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}

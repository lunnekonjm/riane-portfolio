import type { QuoteData } from './types';

const COINGECKO_MAP: Record<string, string> = {
  'GST': 'green-satoshi-token',
  'GST-EUR': 'green-satoshi-token',
  'GST-USD': 'green-satoshi-token',
  'GMT': 'stepn',
  'GMT-EUR': 'stepn',
  'GMT-USD': 'stepn',
  'BONK': 'bonk',
  'BONK-EUR': 'bonk',
  'JUP': 'jupiter-exchange-solana',
  'JUP-EUR': 'jupiter-exchange-solana',
  'RAY': 'raydium',
  'RAY-EUR': 'raydium',
  'WIF': 'dogwifcoin',
  'WIF-EUR': 'dogwifcoin',
  'RENDER': 'render-token',
  'RENDER-EUR': 'render-token',
  'PYTH': 'pyth-network',
  'PYTH-EUR': 'pyth-network',
  'SOL': 'solana',
  'SOL-EUR': 'solana',
  'BTC': 'bitcoin',
  'BTC-EUR': 'bitcoin',
  'ETH': 'ethereum',
  'ETH-EUR': 'ethereum',
};

export const coingeckoProvider = {
  name: 'CoinGecko',

  async getQuote(ticker: string): Promise<QuoteData> {
    const clean = ticker.trim().toUpperCase();
    const id = COINGECKO_MAP[clean] || COINGECKO_MAP[clean.replace('-EUR', '').replace('-USD', '')];
    if (!id) {
      throw new Error(`CoinGecko ID not found for ticker: ${ticker}`);
    }

    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=eur&include_24hr_change=true`,
      {
        headers: { 'User-Agent': 'RIANE-Portfolio/1.0' },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) {
      throw new Error(`CoinGecko request failed with status: ${res.status}`);
    }

    const data = await res.json();
    const coinData = data?.[id];
    if (!coinData || typeof coinData.eur !== 'number') {
      throw new Error(`No price data returned from CoinGecko for: ${id}`);
    }

    const price = coinData.eur;
    const changePercent = typeof coinData.eur_24h_change === 'number' ? coinData.eur_24h_change : 0;
    const change = price * (changePercent / 100);

    return {
      ticker,
      price,
      change,
      changePercent,
      high: price * 1.05,
      low: price * 0.95,
      open: price - change,
      previousClose: price - change,
      volume: 0,
      timestamp: Date.now(),
      currency: 'EUR',
      source: 'CoinGecko Direct',
      marketState: 'REGULAR',
      quoteTypeLabel: '🟢 Cours Crypto en Direct (CoinGecko)',
    };
  },
};

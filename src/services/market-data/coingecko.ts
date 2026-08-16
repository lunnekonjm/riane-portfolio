const DEXSCREENER_MINTS: Record<string, string> = {
  'GST': 'AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB',
  'GST-EUR': 'AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB',
  'GST-USD': 'AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB',
  'GMT': '7i5KKDFALHgnWaPtKjdLVdvoJBnhRQuKAezGUrX1KDt2',
  'GMT-EUR': '7i5KKDFALHgnWaPtKjdLVdvoJBnhRQuKAezGUrX1KDt2',
  'GMT-USD': '7i5KKDFALHgnWaPtKjdLVdvoJBnhRQuKAezGUrX1KDt2',
  'DMTR': '0x51cb253744189f11241becb29bedd3f1b5384fdb',
  'DMTR-EUR': '0x51cb253744189f11241becb29bedd3f1b5384fdb',
  'DMTR-USD': '0x51cb253744189f11241becb29bedd3f1b5384fdb',
  'WTK': '0x4cff49d0a19ed6ff845a9122fa912abcfb1f68a6',
  'WTK-EUR': '0x4cff49d0a19ed6ff845a9122fa912abcfb1f68a6',
  'WTK-USD': '0x4cff49d0a19ed6ff845a9122fa912abcfb1f68a6',
};

import type { QuoteData } from './types';

const COINGECKO_MAP: Record<string, string> = {
  'DMTR': 'dimitra',
  'DMTR-EUR': 'dimitra',
  'DMTR-USD': 'dimitra',
  'WTK': 'wadzpay-token',
  'WTK-EUR': 'wadzpay-token',
  'WTK-USD': 'wadzpay-token',
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
    const mint = DEXSCREENER_MINTS[clean] || DEXSCREENER_MINTS[clean.replace('-EUR', '').replace('-USD', '')];
    if (mint) {
      try {
        const dRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, { signal: AbortSignal.timeout(4000) });
        if (dRes.ok) {
          const dData = await dRes.json();
          const usdPrice = Number(dData?.pairs?.[0]?.priceUsd);
          if (!isNaN(usdPrice) && usdPrice > 0) {
            const price = usdPrice * 0.864;
            const changePercent = Number(dData?.pairs?.[0]?.priceChange?.h24 || 0);
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
              volume: Number(dData?.pairs?.[0]?.volume?.h24 || 0),
              timestamp: Date.now(),
              currency: 'EUR',
              source: 'DexScreener (On-Chain)',
              marketState: 'REGULAR',
              quoteTypeLabel: '🟢 Cours Crypto On-Chain en Direct (DexScreener)',
            };
          }
        }
      } catch {}
    }
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

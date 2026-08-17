/**
 * Service de récupération des prix crypto de référence en EUR
 * Cascading: DexScreener -> CoinGecko -> Yahoo Finance (EUR) -> Yahoo Finance (USD)
 */

export async function fetchPriceEUR(
  ticker: string,
  fallback: number,
  coingeckoId?: string,
  mintAddress?: string
): Promise<number> {
  // 1. Try DexScreener if token contract / mint address is known (ideal for on-chain Solana tokens like GST, GMT)
  if (mintAddress) {
    try {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mintAddress)}`, {
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const data = await res.json();
        const usd = Number(data?.pairs?.[0]?.priceUsd);
        if (!isNaN(usd) && usd > 0) {
          return usd * 0.864; // USD -> EUR
        }
      }
    } catch {}
  }

  // 2. Try CoinGecko if ID available
  if (coingeckoId) {
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coingeckoId)}&vs_currencies=eur`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json = await res.json();
        const p = json?.[coingeckoId]?.eur;
        if (typeof p === 'number' && p > 0) return p;
      }
    } catch {}
  }

  // 3. Try Yahoo Finance with exact ticker
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=1d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const json = await res.json();
      const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (typeof price === 'number' && price > 0) return price;
    }
  } catch {}

  // 4. Try Yahoo Finance USD pair if ticker is -EUR
  if (ticker.endsWith('-EUR')) {
    try {
      const usdTicker = ticker.replace(/-EUR$/, '-USD');
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(usdTicker)}?range=1d&interval=1d`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const json = await res.json();
        const usdPrice = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (typeof usdPrice === 'number' && usdPrice > 0) return usdPrice * 0.864;
      }
    } catch {}
  }

  return fallback;
}

import type { RegisteredAsset } from '../assetRegistry';
import { ASSET_REGISTRY } from '../assetRegistry';

/**
 * Search assets in real-time by query string with fuzzy token & ISIN matching
 */
export function searchAssets(query: string): RegisteredAsset[] {
  if (!query || query.trim().length === 0) return [];

  const rawQuery = query.trim().toLowerCase();
  const cleanQuery = rawQuery.replace(/[^a-z0-9]/g, '');

  return ASSET_REGISTRY.filter((asset) => {
    // 1. Direct ISIN check
    if (asset.isin && cleanQuery.length >= 4) {
      const cleanIsin = asset.isin.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanIsin.includes(cleanQuery)) return true;
    }

    // 2. Direct Ticker check
    const cleanTicker = asset.ticker.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanTicker === cleanQuery || cleanTicker.startsWith(cleanQuery) || (cleanQuery.length >= 2 && cleanTicker.includes(cleanQuery))) {
      return true;
    }

    // 3. Direct Name check
    const cleanName = asset.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanName.includes(cleanQuery) || asset.name.toLowerCase().includes(rawQuery)) {
      return true;
    }

    // 4. Search terms check
    return (asset.searchTerms || []).some((term) => {
      const cleanTerm = term.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanTerm.includes(cleanQuery) || (cleanQuery.length >= 3 && cleanTerm.includes(cleanQuery));
    });
  });
}

/**
 * Universal helper to detect if an asset/ticker is a cryptocurrency
 */
export function isCryptoAsset(ticker?: string, name?: string): boolean {
  if (!ticker && !name) return false;
  const t = (ticker || '').toUpperCase().trim();
  const n = (name || '').toUpperCase().trim();
  const combined = `${t} ${n}`;

  const cryptoSymbols = [
    'BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'AVAX', 'DOT', 'DOGE', 'LINK', 'BNB', 
    'NEAR', 'SUI', 'RENDER', 'MATIC', 'POL', 'SHIB', 'LTC', 'UNI', 'ATOM', 'XLM'
  ];

  if (cryptoSymbols.some((s) => t === s || t.startsWith(`${s}-`) || t.startsWith(`${s}/`) || t.startsWith(`${s}.`))) {
    return true;
  }
  if (t.includes('BTC-') || t.includes('ETH-') || t.includes('SOL-') || (t.endsWith('-USD') && cryptoSymbols.some((s) => t.startsWith(s)))) {
    return true;
  }
  const cryptoKeywords = ['BITCOIN', 'ETHEREUM', 'SOLANA', 'RIPPLE', 'CARDANO', 'DOGECOIN', 'CRYPTO', 'POLKADOT', 'AVALANCHE', 'CHAINLINK'];
  if (cryptoKeywords.some((k) => combined.includes(k))) {
    return true;
  }
  return false;
}

export const CRYPTO_TICKER_MAP: Record<string, string> = {
  BTC: 'BTC-EUR',
  BITCOIN: 'BTC-EUR',
  ETH: 'ETH-EUR',
  ETHEREUM: 'ETH-EUR',
  SOL: 'SOL-EUR',
  SOLANA: 'SOL-EUR',
  ADA: 'ADA-EUR',
  CARDANO: 'ADA-EUR',
  XRP: 'XRP-EUR',
  RIPPLE: 'XRP-EUR',
  DOT: 'DOT-EUR',
  POLKADOT: 'DOT-EUR',
  AVAX: 'AVAX-EUR',
  AVALANCHE: 'AVAX-EUR',
  DOGE: 'DOGE-EUR',
  BNB: 'BNB-EUR',
  LINK: 'LINK-EUR',
  POL: 'POL-EUR',
  MATIC: 'MATIC-EUR',
  GST: 'GST-EUR',
  GMT: 'GMT-EUR',
};

export function normalizeMarketTicker(ticker: string): string {
  if (!ticker) return ticker;
  const clean = ticker.trim().toUpperCase();
  if (CRYPTO_TICKER_MAP[clean]) {
    return CRYPTO_TICKER_MAP[clean];
  }
  return ticker;
}

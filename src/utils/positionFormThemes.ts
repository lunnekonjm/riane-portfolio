export function generatePositionId(): string {
  return `pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isCryptoAsset(ticker?: string, name?: string): boolean {
  if (!ticker) return false;
  const t = ticker.toUpperCase();
  const n = (name || '').toUpperCase();
  const cryptoTokens = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOT', 'DOGE', 'MATIC', 'LINK', 'UNI', 'SHIB', 'NEAR', 'TRX', 'DMTR', 'VELO', 'GST', 'USDT', 'USDC'];
  if (cryptoTokens.some((token) => t === token || t === `${token}-EUR` || t === `${token}-USD` || t === `${token}EUR` || t === `${token}USD`)) return true;
  if (t.includes('BTC') || t.includes('ETH') || t.includes('SOL') || t.includes('BNB') || t.includes('CRYPTO')) return true;
  if (n.includes('BITCOIN') || n.includes('ETHEREUM') || n.includes('SOLANA') || n.includes('BINANCE') || n.includes('DIMITRA') || n.includes('VELO') || n.includes('CRYPTO')) return true;
  return false;
}

export function autoGenerateThemes(
  ticker: string,
  name?: string,
  sector?: string,
  industry?: string
): string[] {
  const t = (ticker || '').toUpperCase();
  const n = (name || '').toLowerCase();
  const s = (sector || '').toLowerCase();
  const ind = (industry || '').toLowerCase();
  const matched = new Set<string>();

  if (t.includes('CW8') || t.includes('GPEA') || t.includes('ACWI') || n.includes('msci world') || n.includes('acwi')) {
    matched.add('global-core');
  }
  if (t.includes('PUST') || t.includes('QQQ') || n.includes('nasdaq') || s.includes('tech') || ind.includes('software') || ind.includes('cloud')) {
    matched.add('ai-datacenters');
    matched.add('tech-satellite');
  }
  if (ind.includes('semi') || n.includes('semi') || s.includes('semi') || t.includes('ALRIB') || t.includes('MEMS') || t.includes('NVDA') || t.includes('AMD') || t.includes('ASML')) {
    matched.add('semiconductors');
    matched.add('ai-datacenters');
  }
  if (t.includes('COHR') || t.includes('ALKAL') || ind.includes('photo') || n.includes('kalray') || n.includes('coherent')) {
    matched.add('photonics');
    matched.add('semiconductors');
  }
  if (t.endsWith('.PA') && (t.startsWith('AL') || t.includes('INDE') || n.includes('small cap') || s.includes('small'))) {
    matched.add('europe-small-caps');
    matched.add('sovereign-industry');
  }
  if (s.includes('defense') || s.includes('aerospace') || ind.includes('defense') || n.includes('airbus') || n.includes('thales') || n.includes('dassault') || n.includes('safran')) {
    matched.add('defense');
    matched.add('sovereign-industry');
  }
  if (s.includes('energy') || s.includes('utilit') || ind.includes('solar') || ind.includes('electricity') || t.includes('CEG') || t.includes('TTE')) {
    matched.add('energy-electrification');
  }
  if (s.includes('health') || s.includes('pharma') || ind.includes('biotech') || n.includes('sanofi') || n.includes('novartis')) {
    matched.add('health');
  }

  if (matched.size === 0) {
    if (s.includes('tech')) matched.add('tech-satellite');
    else matched.add('global-core');
  }

  return Array.from(matched);
}

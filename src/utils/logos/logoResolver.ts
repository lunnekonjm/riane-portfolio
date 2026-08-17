import { PALETTE_COLORS, TICKER_DOMAIN_MAP, INSTITUTION_DOMAIN_MAP } from './logoDomainMaps';

export interface LogoInfo {
  url?: string;
  fallbackLetters: string;
  fallbackColor: string;
  fallbackEmoji?: string;
}

export function buildFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

export function getDeterministicColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE_COLORS.length;
  return PALETTE_COLORS[index];
}

export function getInitials(nameOrTicker: string): string {
  const cleaned = nameOrTicker.replace(/[^a-zA-Z0-9]/g, ' ').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '•';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Résout le logo officiel authentique d'un actif ou d'un compte
 */
export function resolveAssetLogo(
  ticker?: string,
  name?: string,
  envelope?: string,
  institutionName?: string
): LogoInfo {
  const normTicker = (ticker || '').toUpperCase().trim();
  const cleanTicker = normTicker.split('.')[0];
  const normName = (name || '').trim();
  const lowerName = normName.toLowerCase();
  const normInst = (institutionName || '').trim();
  const lowerInst = normInst.toLowerCase();

  const isSavingsEnv = ['LIVRET', 'ASSURANCE_VIE', 'PER', 'PEE', 'IMMOBILIER'].includes(envelope || '');

  const fallbackKey = normTicker || normName || 'ACTIF';
  const baseTicker = cleanTicker.replace(/-(EUR|USD|USDT)$/i, '');
  const fallbackLetters = getInitials(baseTicker || cleanTicker || normName);
  const fallbackColor = getDeterministicColor(fallbackKey);

  // 1. Recherche par Ticker exact
  if (normTicker && TICKER_DOMAIN_MAP[normTicker]) {
    const entry = TICKER_DOMAIN_MAP[normTicker];
    if (entry.directUrl) return { url: entry.directUrl, fallbackLetters, fallbackColor, fallbackEmoji: entry.emoji };
    if (entry.domain) return { url: buildFaviconUrl(entry.domain), fallbackLetters, fallbackColor, fallbackEmoji: entry.emoji };
  }

  // 2. Recherche par Ticker sans extension de place
  if (cleanTicker && TICKER_DOMAIN_MAP[cleanTicker]) {
    const entry = TICKER_DOMAIN_MAP[cleanTicker];
    if (entry.directUrl) return { url: entry.directUrl, fallbackLetters, fallbackColor, fallbackEmoji: entry.emoji };
    if (entry.domain) return { url: buildFaviconUrl(entry.domain), fallbackLetters, fallbackColor, fallbackEmoji: entry.emoji };
  }

  // 3. Recherche par Ticker de base sans suffixe de devise (-EUR, -USD, -USDT)
  if (baseTicker && TICKER_DOMAIN_MAP[baseTicker]) {
    const entry = TICKER_DOMAIN_MAP[baseTicker];
    if (entry.directUrl) return { url: entry.directUrl, fallbackLetters, fallbackColor, fallbackEmoji: entry.emoji };
    if (entry.domain) return { url: buildFaviconUrl(entry.domain), fallbackLetters, fallbackColor, fallbackEmoji: entry.emoji };
  }

  // 4. Recherche par mots-clés du nom d'entreprise ou du produit financier
  if (lowerName.includes('servicenow') || normTicker === 'NOW') {
    return { url: buildFaviconUrl('servicenow.com'), fallbackLetters: 'NOW', fallbackColor };
  }
  if (lowerName.includes('microsoft') || normTicker === 'MSFT') {
    return { url: buildFaviconUrl('microsoft.com'), fallbackLetters: 'MS', fallbackColor };
  }
  if (lowerName.includes('coherent') || normTicker.includes('COHR')) {
    return { url: buildFaviconUrl('coherent.com'), fallbackLetters: 'CO', fallbackColor };
  }
  if (lowerName.includes('constellation') || normTicker.includes('CEG')) {
    return { url: buildFaviconUrl('constellationenergy.com'), fallbackLetters: 'CE', fallbackColor };
  }
  if (lowerName.includes('symbotic') || lowerName.includes('symbiotic') || normTicker.includes('SYM')) {
    return { url: buildFaviconUrl('symbotic.com'), fallbackLetters: 'SY', fallbackColor };
  }
  if (lowerName.includes('independance') || lowerName.includes('indépendance') || normTicker.includes('0P0001DKPM') || lowerName.includes('europe small')) {
    return { url: buildFaviconUrl('independance-am.com'), fallbackLetters: 'IA', fallbackColor };
  }
  if (lowerName.includes('riber') || normTicker.includes('ALRIB')) {
    return { url: buildFaviconUrl('riber.com'), fallbackLetters: 'RI', fallbackColor };
  }
  if (lowerName.includes('memscap') || normTicker.includes('MEMS')) {
    return { url: buildFaviconUrl('memscap.com'), fallbackLetters: 'ME', fallbackColor };
  }
  if (lowerName.includes('amundi') || lowerName.includes('cw8') || lowerName.includes('pust') || lowerName.includes('dcam') || lowerName.includes('gpea') || lowerName.includes('nasdaq')) {
    return { url: buildFaviconUrl('amundi.com'), fallbackLetters: 'AM', fallbackColor };
  }
  if (lowerName.includes('alan allman') || normTicker.includes('ALALM')) {
    return { url: buildFaviconUrl('alan-allman.com'), fallbackLetters: 'AA', fallbackColor };
  }
  if (lowerName.includes('eurobio') || normTicker.includes('ALERS')) {
    return { url: buildFaviconUrl('eurobio-scientific.com'), fallbackLetters: 'EB', fallbackColor };
  }
  if (lowerName.includes('nvidia') || normTicker.includes('NVDA')) {
    return { url: buildFaviconUrl('nvidia.com'), fallbackLetters: 'NV', fallbackColor };
  }
  if (lowerName.includes('palantir') || normTicker.includes('PLTR')) {
    return { url: buildFaviconUrl('palantir.com'), fallbackLetters: 'PL', fallbackColor };
  }
  if (lowerName.includes('apple') || normTicker.includes('AAPL')) {
    return { url: buildFaviconUrl('apple.com'), fallbackLetters: 'AP', fallbackColor };
  }
  if (lowerName.includes('google') || lowerName.includes('alphabet') || normTicker.includes('GOOG')) {
    return { url: buildFaviconUrl('google.com'), fallbackLetters: 'GO', fallbackColor };
  }
  if (lowerName.includes('amazon') || normTicker.includes('AMZN')) {
    return { url: buildFaviconUrl('amazon.com'), fallbackLetters: 'AZ', fallbackColor };
  }
  if (lowerName.includes('meta ') || lowerName.includes('facebook') || normTicker.includes('META')) {
    return { url: buildFaviconUrl('meta.com'), fallbackLetters: 'ME', fallbackColor };
  }
  if (lowerName.includes('tesla') || normTicker.includes('TSLA')) {
    return { url: buildFaviconUrl('tesla.com'), fallbackLetters: 'TS', fallbackColor };
  }
  if (lowerName.includes('ishares') || normTicker.includes('WPEA')) {
    return { url: buildFaviconUrl('ishares.com'), fallbackLetters: 'IS', fallbackColor };
  }
  if (lowerName.includes('vanguard') || normTicker.includes('VWCE')) {
    return { url: buildFaviconUrl('vanguard.com'), fallbackLetters: 'VG', fallbackColor };
  }

  // 5. UNIQUEMENT pour les comptes d'ÉPARGNE : Résoudre par Établissement Bancaire
  if (isSavingsEnv) {
    if (normInst && INSTITUTION_DOMAIN_MAP[normInst]) {
      const entry = INSTITUTION_DOMAIN_MAP[normInst];
      if (entry.directUrl) return { url: entry.directUrl, fallbackLetters, fallbackColor, fallbackEmoji: entry.emoji };
      if (entry.domain) return { url: buildFaviconUrl(entry.domain), fallbackLetters, fallbackColor, fallbackEmoji: entry.emoji };
    }
    if (lowerName.includes('livret a') || lowerName.includes('ldds') || lowerName.includes('bourso') || lowerInst.includes('bourso')) {
      return { url: buildFaviconUrl('boursobank.com'), fallbackLetters: 'BB', fallbackColor };
    }
    if (lowerName.includes('mf action') || lowerName.includes('natixis') || lowerInst.includes('natixis')) {
      return { url: buildFaviconUrl('interepargne.natixis.com'), fallbackLetters: 'NX', fallbackColor };
    }
    if (lowerName.includes('linxea') || lowerInst.includes('linxea')) {
      return { url: buildFaviconUrl('linxea.com'), fallbackLetters: 'LX', fallbackColor };
    }
  }

  // 6. Fallback par enveloppe fiscale
  let fallbackEmoji: string | undefined;
  if (envelope === 'PEE') fallbackEmoji = '🏢';
  else if (envelope === 'ASSURANCE_VIE' || envelope === 'PER') fallbackEmoji = '📜';
  else if (envelope === 'IMMOBILIER') fallbackEmoji = '🏠';
  else if (envelope === 'SPECULATIVE') fallbackEmoji = '🚀';

  return {
    fallbackLetters,
    fallbackColor,
    fallbackEmoji,
  };
}

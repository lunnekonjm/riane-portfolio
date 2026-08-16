/**
 * Annuaire et Résolveur de Logos & Symboles Financiers Officiels
 * Récupère les logos authentiques officiels via Google Favicon CDN 128px / CoinGecko
 * avec mapping direct sur les domaines officiels des sociétés et institutions financières.
 */

export interface LogoInfo {
  url?: string;
  fallbackLetters: string;
  fallbackColor: string;
  fallbackEmoji?: string;
}

// Couleurs de repli élégantes
const PALETTE_COLORS = [
  'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
];

// Mapping explicite Ticker / Code -> Domaine officiel pour récupération du logo authentique 128px
const TICKER_DOMAIN_MAP: Record<string, { domain?: string; directUrl?: string; emoji?: string }> = {
  // Actions & ETF Portefeuille
  'COHR': { domain: 'coherent.com' },
  'CEG': { domain: 'constellationenergy.com' },
  'SYM': { domain: 'symbotic.com' },
  'PUST.PA': { domain: 'amundi.com' },
  'PUST': { domain: 'amundi.com' },
  'CW8.PA': { domain: 'amundi.com' },
  'CW8': { domain: 'amundi.com' },
  'DCAM.PA': { domain: 'amundi.com' },
  'DCAM': { domain: 'amundi.com' },
  'GPEA.PA': { domain: 'amundi.com' },
  'GPEA': { domain: 'amundi.com' },
  'PAEEM.PA': { domain: 'amundi.com' },
  'PE500.PA': { domain: 'amundi.com' },
  '0P0001DKPM.F': { domain: 'independance-am.com' },
  '0P0001DKPM': { domain: 'independance-am.com' },
  'IES': { domain: 'independance-am.com' },
  'INDE.PA': { domain: 'independance-am.com' },
  'ALRIB.PA': { domain: 'riber.com' },
  'ALRIB': { domain: 'riber.com' },
  'RIBER': { domain: 'riber.com' },
  'MEMS.PA': { domain: 'memscap.com' },
  'MEMS': { domain: 'memscap.com' },
  'ALMEM.PA': { domain: 'memscap.com' },
  'ALALM.PA': { domain: 'alan-allman.com' },
  'ALALM': { domain: 'alan-allman.com' },
  'ALERS.PA': { domain: 'eurobio-scientific.com' },
  'ALERS': { domain: 'eurobio-scientific.com' },

  // Tech & Mega-Caps US & Global Stocks
  'NOW': { domain: 'servicenow.com' },
  'MSFT': { domain: 'microsoft.com' },
  'NVDA': { domain: 'nvidia.com' },
  'PLTR': { domain: 'palantir.com' },
  'AAPL': { domain: 'apple.com' },
  'GOOGL': { domain: 'google.com' },
  'GOOG': { domain: 'google.com' },
  'AMZN': { domain: 'amazon.com' },
  'META': { domain: 'meta.com' },
  'TSLA': { domain: 'tesla.com' },
  'AMD': { domain: 'amd.com' },
  'INTC': { domain: 'intel.com' },
  'ASML': { domain: 'asml.com' },
  'AVGO': { domain: 'broadcom.com' },
  'CRM': { domain: 'salesforce.com' },
  'ORCL': { domain: 'oracle.com' },
  'ADBE': { domain: 'adobe.com' },
  'SNOW': { domain: 'snowflake.com' },
  'CRWD': { domain: 'crowdstrike.com' },
  'PANW': { domain: 'paloaltonetworks.com' },
  'UBER': { domain: 'uber.com' },
  'ABNB': { domain: 'airbnb.com' },
  'NFLX': { domain: 'netflix.com' },

  // CAC 40 & Europe
  'MC.PA': { domain: 'lvmh.com' },
  'OR.PA': { domain: 'loreal.com' },
  'RMS.PA': { domain: 'hermes.com' },
  'TTE.PA': { domain: 'totalenergies.com' },
  'AIR.PA': { domain: 'airbus.com' },
  'SAN.PA': { domain: 'sanofi.com' },
  'AI.PA': { domain: 'airliquide.com' },
  'BN.PA': { domain: 'danone.com' },
  'SU.PA': { domain: 'se.com' },
  'CAP.PA': { domain: 'capgemini.com' },
  'DSY.PA': { domain: '3ds.com' },
  'HO.PA': { domain: 'thalesgroup.com' },

  // Autres ETF & Émetteurs
  'WPEA.PA': { domain: 'ishares.com' },
  'WPEA': { domain: 'ishares.com' },
  'CSPX.L': { domain: 'ishares.com' },
  'SXR8.DE': { domain: 'ishares.com' },
  'IWDA.AS': { domain: 'ishares.com' },
  'VWCE.DE': { domain: 'vanguard.com' },
  'VUSA.AS': { domain: 'vanguard.com' },
  'ESE.PA': { domain: 'bnpparibas.com' },

  // Cryptomonnaies (CoinGecko HD & Direct)
  'BTC': { directUrl: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', emoji: '₿' },
  'BTC-EUR': { directUrl: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', emoji: '₿' },
  'BTC-USD': { directUrl: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', emoji: '₿' },
  'ETH': { directUrl: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', emoji: 'Ξ' },
  'ETH-EUR': { directUrl: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', emoji: 'Ξ' },
  'ETH-USD': { directUrl: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', emoji: 'Ξ' },
  'BNB': { directUrl: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', emoji: '🟡' },
  'BNB-EUR': { directUrl: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', emoji: '🟡' },
  'BNB-USD': { directUrl: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', emoji: '🟡' },
  'SOL': { directUrl: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', emoji: '◎' },
  'SOL-EUR': { directUrl: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', emoji: '◎' },
  'SOL-USD': { directUrl: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', emoji: '◎' },
  'USDT': { directUrl: 'https://assets.coingecko.com/coins/images/325/large/Tether.png', emoji: '₮' },
  'USDT-EUR': { directUrl: 'https://assets.coingecko.com/coins/images/325/large/Tether.png', emoji: '₮' },
  'USDT-USD': { directUrl: 'https://assets.coingecko.com/coins/images/325/large/Tether.png', emoji: '₮' },
  'USDC': { directUrl: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png', emoji: '💲' },
  'USDC-EUR': { directUrl: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png', emoji: '💲' },
  'USDC-USD': { directUrl: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png', emoji: '💲' },
  'XRP': { directUrl: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', emoji: '✕' },
  'XRP-EUR': { directUrl: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', emoji: '✕' },
  'ADA': { directUrl: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', emoji: '₳' },
  'ADA-EUR': { directUrl: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', emoji: '₳' },
  'AVAX': { directUrl: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png', emoji: '🔺' },
  'AVAX-EUR': { directUrl: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png', emoji: '🔺' },
  'DOT': { directUrl: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png', emoji: '●' },
  'LINK': { directUrl: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png', emoji: '⬡' },
  'MATIC': { directUrl: 'https://assets.coingecko.com/coins/images/4713/large/polygon.png', emoji: '💜' },
  'POL': { directUrl: 'https://assets.coingecko.com/coins/images/4713/large/polygon.png', emoji: '💜' },
  'DOGE': { directUrl: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png', emoji: '🐕' },
  'NEAR': { directUrl: 'https://assets.coingecko.com/coins/images/10365/large/near.png', emoji: 'Ⓝ' },
  'SUI': { directUrl: 'https://assets.coingecko.com/coins/images/26375/large/sui-ocean-square.png', emoji: '💧' },
  'APT': { directUrl: 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png', emoji: '▲' },
  'TRX': { directUrl: 'https://coin-images.coingecko.com/coins/images/1094/large/tron-logo.png', emoji: '🔴' },
  'TRX-EUR': { directUrl: 'https://coin-images.coingecko.com/coins/images/1094/large/tron-logo.png', emoji: '🔴' },
  'TRX-USD': { directUrl: 'https://coin-images.coingecko.com/coins/images/1094/large/tron-logo.png', emoji: '🔴' },
  'TRON': { directUrl: 'https://coin-images.coingecko.com/coins/images/1094/large/tron-logo.png', emoji: '🔴' },
  'VELO': { directUrl: 'https://coin-images.coingecko.com/coins/images/12538/large/Logo_200x_200.png?1696512350', emoji: '🚲' },
  'VELO-EUR': { directUrl: 'https://coin-images.coingecko.com/coins/images/12538/large/Logo_200x_200.png?1696512350', emoji: '🚲' },
  'VELO-USD': { directUrl: 'https://coin-images.coingecko.com/coins/images/12538/large/Logo_200x_200.png?1696512350', emoji: '🚲' },
  'DMTR': { directUrl: 'https://coin-images.coingecko.com/coins/images/18530/large/HqEiru32_400x400.jpg?1696518010', emoji: '🌾' },
  'DMTR-EUR': { directUrl: 'https://coin-images.coingecko.com/coins/images/18530/large/HqEiru32_400x400.jpg?1696518010', emoji: '🌾' },
  'WTK': { directUrl: 'https://coin-images.coingecko.com/coins/images/13019/large/wadzpay.png', emoji: '💳' },
  'WTK-EUR': { directUrl: 'https://coin-images.coingecko.com/coins/images/13019/large/wadzpay.png', emoji: '💳' },
  'GST': { directUrl: 'https://coin-images.coingecko.com/coins/images/21841/large/gst.png?1696521196', emoji: '👟' },
  'GST-EUR': { directUrl: 'https://coin-images.coingecko.com/coins/images/21841/large/gst.png?1696521196', emoji: '👟' },
  'GST-USD': { directUrl: 'https://coin-images.coingecko.com/coins/images/21841/large/gst.png?1696521196', emoji: '👟' },
  'GMT': { directUrl: 'https://coin-images.coingecko.com/coins/images/23597/large/token-gmt-200x200.png?1703153841', emoji: '👟' },
  'GMT-EUR': { directUrl: 'https://coin-images.coingecko.com/coins/images/23597/large/token-gmt-200x200.png?1703153841', emoji: '👟' },
  'BONK': { directUrl: 'https://coin-images.coingecko.com/coins/images/28600/large/bonk.jpg', emoji: '🐶' },
  'JUP': { directUrl: 'https://coin-images.coingecko.com/coins/images/34188/large/jup.png', emoji: '🪐' },
  'RAY': { directUrl: 'https://coin-images.coingecko.com/coins/images/13928/large/PSigc4ie_400x400.jpg', emoji: '⚡' },
  'WIF': { directUrl: 'https://coin-images.coingecko.com/coins/images/33566/large/dogwifhat.jpg', emoji: '🐶' },
  'RENDER': { directUrl: 'https://coin-images.coingecko.com/coins/images/11636/large/rndr.png', emoji: '🎨' },
  'PYTH': { directUrl: 'https://coin-images.coingecko.com/coins/images/31924/large/pyth.png', emoji: '🔮' }
};

// Mapping Établissements Bancaires & Teneurs de Compte
const INSTITUTION_DOMAIN_MAP: Record<string, { domain?: string; directUrl?: string; emoji?: string }> = {
  'BoursoBank': { domain: 'boursobank.com' },
  'Boursorama': { domain: 'boursobank.com' },
  'Natixis': { domain: 'interepargne.natixis.com' },
  'Natixis Interépargne': { domain: 'interepargne.natixis.com' },
  'Amundi': { domain: 'amundi.com' },
  'Amundi ESR': { domain: 'amundi-ee.com' },
  'Crédit Agricole': { domain: 'credit-agricole.fr' },
  'BNP Paribas': { domain: 'bnpparibas.com' },
  'Société Générale': { domain: 'societegenerale.com' },
  'Linxea': { domain: 'linxea.com' },
  'Spirica': { domain: 'spirica.fr' },
  'Suravenir': { domain: 'suravenir.fr' },
  'Fortuneo': { domain: 'fortuneo.fr' },
  'Trade Republic': { domain: 'traderepublic.com' },
  'DEGIRO': { domain: 'degiro.fr' },
  'Interactive Brokers': { domain: 'interactivebrokers.com' },
};

function buildFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

function getDeterministicColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE_COLORS.length;
  return PALETTE_COLORS[index];
}

function getInitials(nameOrTicker: string): string {
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

  // 1. Recherche par Ticker exact (ex: NOW, MSFT, PUST.PA, 0P0001DKPM.F, MEMS.PA, ALRIB.PA...)
  if (normTicker && TICKER_DOMAIN_MAP[normTicker]) {
    const entry = TICKER_DOMAIN_MAP[normTicker];
    if (entry.directUrl) return { url: entry.directUrl, fallbackLetters, fallbackColor, fallbackEmoji: entry.emoji };
    if (entry.domain) return { url: buildFaviconUrl(entry.domain), fallbackLetters, fallbackColor, fallbackEmoji: entry.emoji };
  }

  // 2. Recherche par Ticker sans extension de place (ex: NOW, MSFT, PUST, DCAM, MEMS, ALRIB, COHR, CEG, SYM)
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

  // 5. UNIQUEMENT pour les comptes d'ÉPARGNE (Livrets, PEE, Assurance-Vie...) : Résoudre par Établissement Bancaire
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

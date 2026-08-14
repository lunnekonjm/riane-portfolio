/**
 * Annuaire et Résolveur de Logos & Symboles Financiers
 * Fournit des URLs de logos haute résolution (Clearbit / Unavatar / CoinGecko / Émetteurs)
 * avec fallback vectoriel stylisé en cas d'indisponibilité.
 */

export interface LogoInfo {
  url?: string;
  fallbackLetters: string;
  fallbackColor: string;
  fallbackEmoji?: string;
}

// Couleurs de pastilles harmonisées avec la charte graphique
const PALETTE_COLORS = [
  'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)', // Cyan / Bleu
  'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Émeraude / Vert
  'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', // Violet
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // Ambre
  'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', // Rose
  'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Indigo
];

// Mapping explicite Ticker / Nom -> Domaine officiel pour récupération du logo
const TICKER_DOMAIN_MAP: Record<string, { domain?: string; directUrl?: string; emoji?: string }> = {
  // Actions US & Tech
  'NVDA': { domain: 'nvidia.com' },
  'PLTR': { domain: 'palantir.com' },
  'COHR': { domain: 'coherent.com' },
  'AAPL': { domain: 'apple.com' },
  'MSFT': { domain: 'microsoft.com' },
  'GOOGL': { domain: 'google.com' },
  'GOOG': { domain: 'google.com' },
  'AMZN': { domain: 'amazon.com' },
  'META': { domain: 'meta.com' },
  'TSLA': { domain: 'tesla.com' },
  'AMD': { domain: 'amd.com' },
  'INTC': { domain: 'intel.com' },
  'ASML': { domain: 'asml.com' },
  'AVGO': { domain: 'broadcom.com' },
  'ORCL': { domain: 'oracle.com' },
  'CRM': { domain: 'salesforce.com' },
  'UBER': { domain: 'uber.com' },
  'SNOW': { domain: 'snowflake.com' },
  'NET': { domain: 'cloudflare.com' },
  'CRWD': { domain: 'crowdstrike.com' },
  'PANW': { domain: 'paloaltonetworks.com' },

  // Actions Françaises & PEA-PME
  'MEMS.PA': { domain: 'memscap.com' },
  'ALMEM.PA': { domain: 'memscap.com' },
  'ALALM.PA': { domain: 'alan-allman.com' },
  'ALRIB.PA': { domain: 'alan-allman.com' },
  'ALERS.PA': { domain: 'eurobio-scientific.com' },
  'MC.PA': { domain: 'lvmh.com' },
  'OR.PA': { domain: 'loreal.com' },
  'RMS.PA': { domain: 'hermes.com' },
  'TTE.PA': { domain: 'totalenergies.com' },
  'AIR.PA': { domain: 'airbus.com' },
  'SAN.PA': { domain: 'sanofi.com' },
  'SU.PA': { domain: 'se.com' },
  'BNP.PA': { domain: 'bnpparibas.com' },
  'GLE.PA': { domain: 'societegenerale.com' },
  'ACA.PA': { domain: 'credit-agricole.com' },

  // Émetteurs ETF
  'CW8.PA': { domain: 'amundietf.com' },
  'WPEA.PA': { domain: 'ishares.com' },
  'GPEA.PA': { domain: 'amundietf.com' },
  'PUST.PA': { domain: 'amundietf.com' },
  'PAEEM.PA': { domain: 'amundietf.com' },
  'PE500.PA': { domain: 'amundietf.com' },
  'CSPX.L': { domain: 'ishares.com' },
  'SXR8.DE': { domain: 'ishares.com' },
  'IWDA.AS': { domain: 'ishares.com' },
  'VWCE.DE': { domain: 'vanguard.com' },
  'VUSA.AS': { domain: 'vanguard.com' },
  'ESE.PA': { domain: 'bnpparibas.com' },

  // Cryptomonnaies
  'BTC-USD': { directUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', emoji: '₿' },
  'BTC': { directUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', emoji: '₿' },
  'ETH-USD': { directUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', emoji: 'Ξ' },
  'ETH': { directUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', emoji: 'Ξ' },
  'SOL-USD': { directUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', emoji: '◎' },
  'SOL': { directUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', emoji: '◎' },
};

// Mapping Établissements Bancaires & Teneurs de Compte
const INSTITUTION_DOMAIN_MAP: Record<string, { domain?: string; directUrl?: string; emoji?: string }> = {
  'BoursoBank': { domain: 'boursobank.com' },
  'Boursorama': { domain: 'boursobank.com' },
  'Natixis': { domain: 'natixis.com' },
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
  'BforBank': { domain: 'bforbank.com' },
  'Trade Republic': { domain: 'traderepublic.com' },
  'DEGIRO': { domain: 'degiro.fr' },
  'Interactive Brokers': { domain: 'interactivebrokers.com' },
};

/**
 * Calcule une couleur déterministe à partir d'une chaîne
 */
function getDeterministicColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE_COLORS.length;
  return PALETTE_COLORS[index];
}

/**
 * Extrait 1 ou 2 lettres d'initiales pour l'avatar
 */
function getInitials(nameOrTicker: string): string {
  const cleaned = nameOrTicker.replace(/[^a-zA-Z0-9]/g, ' ').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '•';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Résout le logo et les métadonnées visuelles d'un actif
 */
export function resolveAssetLogo(
  ticker?: string,
  name?: string,
  envelope?: string,
  institutionName?: string
): LogoInfo {
  const normTicker = (ticker || '').toUpperCase().trim();
  const normName = (name || '').trim();
  const normInst = (institutionName || '').trim();

  const fallbackKey = normTicker || normName || 'ACTIF';
  const fallbackLetters = getInitials(normTicker ? normTicker.split('.')[0] : normName);
  const fallbackColor = getDeterministicColor(fallbackKey);

  // 1. Recherche par Ticker exact
  if (normTicker && TICKER_DOMAIN_MAP[normTicker]) {
    const entry = TICKER_DOMAIN_MAP[normTicker];
    if (entry.directUrl) {
      return { url: entry.directUrl, fallbackLetters, fallbackColor, fallbackEmoji: entry.emoji };
    }
    if (entry.domain) {
      return {
        url: `https://unavatar.io/${entry.domain}?fallback=false`,
        fallbackLetters,
        fallbackColor,
        fallbackEmoji: entry.emoji,
      };
    }
  }

  // 2. Recherche par Ticker sans extension (.PA, .L, etc.)
  const cleanTicker = normTicker.split('.')[0];
  if (cleanTicker && TICKER_DOMAIN_MAP[cleanTicker]) {
    const entry = TICKER_DOMAIN_MAP[cleanTicker];
    if (entry.directUrl) {
      return { url: entry.directUrl, fallbackLetters, fallbackColor, fallbackEmoji: entry.emoji };
    }
    if (entry.domain) {
      return {
        url: `https://unavatar.io/${entry.domain}?fallback=false`,
        fallbackLetters,
        fallbackColor,
        fallbackEmoji: entry.emoji,
      };
    }
  }

  // 3. Recherche par Organisme Bancaire (pour Livrets / PEE / Épargne)
  if (normInst && INSTITUTION_DOMAIN_MAP[normInst]) {
    const entry = INSTITUTION_DOMAIN_MAP[normInst];
    if (entry.directUrl) {
      return { url: entry.directUrl, fallbackLetters, fallbackColor, fallbackEmoji: entry.emoji };
    }
    if (entry.domain) {
      return {
        url: `https://unavatar.io/${entry.domain}?fallback=false`,
        fallbackLetters,
        fallbackColor,
        fallbackEmoji: entry.emoji,
      };
    }
  }

  // 4. Recherche par mots-clés dans le nom
  const lowerName = normName.toLowerCase();
  if (lowerName.includes('amundi') || lowerName.includes('cw8') || lowerName.includes('wpea')) {
    return { url: 'https://unavatar.io/amundietf.com?fallback=false', fallbackLetters, fallbackColor };
  }
  if (lowerName.includes('ishares') || lowerName.includes('blackrock')) {
    return { url: 'https://unavatar.io/ishares.com?fallback=false', fallbackLetters, fallbackColor };
  }
  if (lowerName.includes('vanguard')) {
    return { url: 'https://unavatar.io/vanguard.com?fallback=false', fallbackLetters, fallbackColor };
  }
  if (lowerName.includes('bnp') || lowerName.includes('easy')) {
    return { url: 'https://unavatar.io/bnpparibas.com?fallback=false', fallbackLetters, fallbackColor };
  }
  if (lowerName.includes('bourso') || lowerName.includes('boursorama')) {
    return { url: 'https://unavatar.io/boursobank.com?fallback=false', fallbackLetters, fallbackColor };
  }
  if (lowerName.includes('natixis') || lowerName.includes('interepargne')) {
    return { url: 'https://unavatar.io/natixis.com?fallback=false', fallbackLetters, fallbackColor };
  }
  if (lowerName.includes('livret a') || lowerName.includes('ldds') || lowerName.includes('lep')) {
    return { fallbackLetters: '🛡️', fallbackColor: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', fallbackEmoji: '🛡️' };
  }

  // 5. Fallback par enveloppe fiscale
  let fallbackEmoji: string | undefined;
  if (envelope === 'LIVRET') fallbackEmoji = '🛡️';
  else if (envelope === 'PEE') fallbackEmoji = '🏢';
  else if (envelope === 'ASSURANCE_VIE' || envelope === 'PER') fallbackEmoji = '📜';
  else if (envelope === 'IMMOBILIER') fallbackEmoji = '🏠';
  else if (envelope === 'SPECULATIVE') fallbackEmoji = '🚀';

  return {
    fallbackLetters,
    fallbackColor,
    fallbackEmoji,
  };
}

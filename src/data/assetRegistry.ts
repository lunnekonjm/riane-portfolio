/**
 * Asset Registry & Ticker Search Engine
 * Pre-indexed registry of PEA-eligible ETFs, Euronext Paris stocks, US Tech & International assets
 */

export interface RegisteredAsset {
  ticker: string;
  name: string;
  assetType: 'ETF' | 'STOCK' | 'FUND' | 'BOND' | 'CRYPTO';
  envelope: 'PEA' | 'PEA-PME' | 'CTO';
  currency: 'EUR' | 'USD';
  themes: string[];
  exchange: string;
  searchTerms: string[];
}

export const ASSET_REGISTRY: RegisteredAsset[] = [
  // ── ETF PEA ──
  {
    ticker: 'CW8.PA',
    name: 'Amundi MSCI World UCITS ETF (PEA)',
    assetType: 'ETF',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    searchTerms: ['cw8', 'msci world', 'amundi world', 'world pea', 'etf world'],
  },
  {
    ticker: 'PUST.PA',
    name: 'Amundi PEA Nasdaq-100 UCITS ETF',
    assetType: 'ETF',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['ai-semis', 'cloud-saas'],
    exchange: 'Euronext Paris',
    searchTerms: ['pust', 'nasdaq', 'nasdaq 100', 'pea nasdaq', 'amundi nasdaq'],
  },
  {
    ticker: 'GPEA.PA',
    name: 'Amundi MSCI ACWI UCITS ETF (PEA)',
    assetType: 'ETF',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    searchTerms: ['gpea', 'acwi', 'all country world', 'amundi acwi'],
  },
  {
    ticker: 'WSEA.PA',
    name: 'BNP Paribas Easy MSCI World PEA',
    assetType: 'ETF',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    searchTerms: ['wsea', 'bnp msci world', 'bnp world pea'],
  },
  {
    ticker: 'ESE.PA',
    name: 'BNP Paribas Easy S&P 500 PEA',
    assetType: 'ETF',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    searchTerms: ['ese', 'sp500', 's&p 500', 'bnp sp500', 'pea sp500'],
  },
  {
    ticker: 'PAEEM.PA',
    name: 'Amundi PEA MSCI Emerging Markets ETF',
    assetType: 'ETF',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    searchTerms: ['paeem', 'emerging', 'marches emergents', 'pea emerging'],
  },

  // ── Euronext Paris (PEA Actions) ──
  {
    ticker: 'MC.PA',
    name: 'LVMH Moët Hennessy Louis Vuitton',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['luxury'],
    exchange: 'Euronext Paris',
    searchTerms: ['lvmh', 'mc.pa', 'mc', 'moet', 'louis vuitton', 'luxe'],
  },
  {
    ticker: 'OR.PA',
    name: 'L\'Oréal SA',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['luxury'],
    exchange: 'Euronext Paris',
    searchTerms: ['loreal', 'or.pa', 'or', 'l\'oreal', 'cosmetique'],
  },
  {
    ticker: 'RMS.PA',
    name: 'Hermès International',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['luxury'],
    exchange: 'Euronext Paris',
    searchTerms: ['hermes', 'rms.pa', 'rms', 'luxe hermes'],
  },
  {
    ticker: 'TTE.PA',
    name: 'TotalEnergies SE',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['energy-grid'],
    exchange: 'Euronext Paris',
    searchTerms: ['total', 'totalenergies', 'tte.pa', 'tte', 'energie', 'petrole'],
  },
  {
    ticker: 'AI.PA',
    name: 'Air Liquide SA',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['clean-energy'],
    exchange: 'Euronext Paris',
    searchTerms: ['air liquide', 'ai.pa', 'ai', 'gaz industriel', 'hydrogene'],
  },
  {
    ticker: 'SU.PA',
    name: 'Schneider Electric SE',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['energy-grid', 'ai-semis'],
    exchange: 'Euronext Paris',
    searchTerms: ['schneider', 'schneider electric', 'su.pa', 'su'],
  },
  {
    ticker: 'SAN.PA',
    name: 'Sanofi SE',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    searchTerms: ['sanofi', 'san.pa', 'san', 'pharma', 'sante'],
  },
  {
    ticker: 'BNP.PA',
    name: 'BNP Paribas SA',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    searchTerms: ['bnp', 'bnp paribas', 'bnp.pa', 'banque'],
  },
  {
    ticker: 'DG.PA',
    name: 'Vinci SA',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    searchTerms: ['vinci', 'dg.pa', 'dg', 'btp', 'autoroutes'],
  },
  {
    ticker: 'KER.PA',
    name: 'Kering SA',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['luxury'],
    exchange: 'Euronext Paris',
    searchTerms: ['kering', 'gucci', 'ker.pa', 'ker'],
  },
  {
    ticker: 'AIR.PA',
    name: 'Airbus SE',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    searchTerms: ['airbus', 'air.pa', 'aero', 'aviation'],
  },

  // ── PEA-PME Actions ──
  {
    ticker: 'ALRIB.PA',
    name: 'Ribiberry / Digital PEA-PME Asset',
    assetType: 'STOCK',
    envelope: 'PEA-PME',
    currency: 'EUR',
    themes: ['cloud-saas'],
    exchange: 'Euronext Growth',
    searchTerms: ['alrib', 'ribiberry', 'pea pme'],
  },
  {
    ticker: 'MEMS.PA',
    name: 'MEMSCAP SE',
    assetType: 'STOCK',
    envelope: 'PEA-PME',
    currency: 'EUR',
    themes: ['ai-semis'],
    exchange: 'Euronext Paris',
    searchTerms: ['memscap', 'mems.pa', 'mems', 'semiconducteurs pme'],
  },

  // ── Actions US (CTO) ──
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['cloud-saas', 'ai-semis'],
    exchange: 'NASDAQ',
    searchTerms: ['microsoft', 'msft', 'windows', 'azure', 'ai'],
  },
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['general'],
    exchange: 'NASDAQ',
    searchTerms: ['apple', 'aapl', 'iphone', 'mac'],
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['ai-semis'],
    exchange: 'NASDAQ',
    searchTerms: ['nvidia', 'nvda', 'gpu', 'ia', 'chips'],
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['cloud-saas'],
    exchange: 'NASDAQ',
    searchTerms: ['amazon', 'amzn', 'aws', 'ecommerce'],
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc. (Google)',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['cloud-saas', 'ai-semis'],
    exchange: 'NASDAQ',
    searchTerms: ['google', 'alphabet', 'googl', 'goog', 'youtube'],
  },
  {
    ticker: 'META',
    name: 'Meta Platforms Inc.',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['cloud-saas'],
    exchange: 'NASDAQ',
    searchTerms: ['meta', 'facebook', 'instagram', 'whatsapp'],
  },
  {
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['clean-energy', 'robotics-automation'],
    exchange: 'NASDAQ',
    searchTerms: ['tesla', 'tsla', 'ev', 'elon musk'],
  },
  {
    ticker: 'CEG',
    name: 'Constellation Energy Corporation',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['clean-energy', 'energy-grid'],
    exchange: 'NASDAQ',
    searchTerms: ['constellation energy', 'ceg', 'nucleaire', 'energie clean'],
  },
  {
    ticker: 'COHR',
    name: 'Coherent Corp.',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['ai-semis', 'energy-grid', 'robotics-automation'],
    exchange: 'NYSE',
    searchTerms: ['coherent', 'cohr', 'laser', 'optique', 'datacenter'],
  },
  {
    ticker: 'SYM',
    name: 'Symbotic Inc.',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['robotics-automation'],
    exchange: 'NASDAQ',
    searchTerms: ['symbotic', 'sym', 'robotique', 'logistique'],
  },
];

/**
 * Search assets in real-time by query string
 */
export function searchAssets(query: string): RegisteredAsset[] {
  if (!query || query.trim().length === 0) return [];

  const q = query.trim().toLowerCase();
  return ASSET_REGISTRY.filter((asset) => {
    if (asset.ticker.toLowerCase().includes(q)) return true;
    if (asset.name.toLowerCase().includes(q)) return true;
    return asset.searchTerms.some((term) => term.toLowerCase().includes(q));
  });
}

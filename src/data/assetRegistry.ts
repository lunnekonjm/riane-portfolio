/**
 * Asset Registry & Ticker Search Engine
 * Pre-indexed registry of PEA-eligible ETFs, Euronext Paris stocks, US Tech & International assets
 */

export interface RegisteredAsset {
  ticker: string;
  name: string;
  assetType: 'ETF' | 'STOCK' | 'FUND' | 'BOND' | 'CRYPTO';
  envelope: 'PEA' | 'PEA-PME' | 'CTO' | 'CRYPTO';
  currency: 'EUR' | 'USD';
  themes: string[];
  exchange: string;
  isin?: string;
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
    isin: 'FR0010315770',
    searchTerms: ['cw8', 'cw8.pa', 'fr0010315770', 'msci world', 'amundi world', 'world pea', 'etf world', 'amundi msci world'],
  },
  {
    ticker: 'PUST.PA',
    name: 'Amundi PEA Nasdaq-100 UCITS ETF',
    assetType: 'ETF',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['ai-semis', 'cloud-saas'],
    exchange: 'Euronext Paris',
    isin: 'FR0013412269',
    searchTerms: ['pust', 'pust.pa', 'fr0013412269', 'nasdaq', 'nasdaq 100', 'pea nasdaq', 'amundi nasdaq', 'amundi pea nasdaq-100'],
  },
  {
    ticker: 'GPEA.PA',
    name: 'Amundi MSCI ACWI UCITS ETF (PEA)',
    assetType: 'ETF',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    isin: 'FR0014017NX3',
    searchTerms: ['gpea', 'gpea.pa', 'fr0014017nx3', 'acwi', 'all country world', 'amundi acwi', 'msci acwi', 'pea all country'],
  },
  {
    ticker: 'WSEA.PA',
    name: 'BNP Paribas Easy MSCI World PEA',
    assetType: 'ETF',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    isin: 'FR0011550185',
    searchTerms: ['wsea', 'wsea.pa', 'fr0011550185', 'bnp msci world', 'bnp world pea', 'easy msci world'],
  },
  {
    ticker: 'ESE.PA',
    name: 'BNP Paribas Easy S&P 500 PEA',
    assetType: 'ETF',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    isin: 'FR0011550185',
    searchTerms: ['ese', 'ese.pa', 'sp500', 's&p 500', 'bnp sp500', 'pea sp500', 'easy s&p 500'],
  },
  {
    ticker: 'PE500.PA',
    name: 'Amundi PEA S&P 500 UCITS ETF',
    assetType: 'ETF',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    isin: 'FR0013412285',
    searchTerms: ['pe500', 'pe500.pa', 'fr0013412285', 'amundi sp500', 'amundi s&p 500', 'pea s&p 500'],
  },
  {
    ticker: 'PAEEM.PA',
    name: 'Amundi PEA MSCI Emerging Markets ETF',
    assetType: 'ETF',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    isin: 'FR0013412020',
    searchTerms: ['paeem', 'paeem.pa', 'fr0013412020', 'emerging', 'marches emergents', 'pea emerging', 'amundi emerging'],
  },
  {
    ticker: 'RS2K.PA',
    name: 'Amundi PEA US Russell 2000 UCITS ETF',
    assetType: 'ETF',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    isin: 'LU1681044480',
    searchTerms: ['rs2k', 'rs2k.pa', 'lu1681044480', 'russell', 'russell 2000', 'small caps us'],
  },
  {
    ticker: 'CL2.PA',
    name: 'Amundi Leveraged MSCI USA Daily (PEA)',
    assetType: 'ETF',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    isin: 'FR0010756082',
    searchTerms: ['cl2', 'cl2.pa', 'fr0010756082', 'lev usa', 'amundi leveraged msci usa', 'leverage'],
  },

  // ── Euronext Paris (PEA Actions & Blue Chips) ──
  {
    ticker: 'MC.PA',
    name: 'LVMH Moët Hennessy Louis Vuitton',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['luxury'],
    exchange: 'Euronext Paris',
    isin: 'FR0000121014',
    searchTerms: ['lvmh', 'mc.pa', 'mc', 'fr0000121014', 'moet', 'louis vuitton', 'luxe', 'bernard arnault'],
  },
  {
    ticker: 'OR.PA',
    name: 'L\'Oréal SA',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['luxury'],
    exchange: 'Euronext Paris',
    isin: 'FR0000120321',
    searchTerms: ['loreal', 'or.pa', 'or', 'fr0000120321', 'l\'oreal', 'cosmetique', 'beaute'],
  },
  {
    ticker: 'RMS.PA',
    name: 'Hermès International',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['luxury'],
    exchange: 'Euronext Paris',
    isin: 'FR0000052292',
    searchTerms: ['hermes', 'rms.pa', 'rms', 'fr0000052292', 'luxe hermes', 'birkin'],
  },
  {
    ticker: 'TTE.PA',
    name: 'TotalEnergies SE',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['energy-grid'],
    exchange: 'Euronext Paris',
    isin: 'FR0000120271',
    searchTerms: ['total', 'totalenergies', 'tte.pa', 'tte', 'fr0000120271', 'energie', 'petrole', 'dividende'],
  },
  {
    ticker: 'AI.PA',
    name: 'Air Liquide SA',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['clean-energy'],
    exchange: 'Euronext Paris',
    isin: 'FR0000120073',
    searchTerms: ['air liquide', 'ai.pa', 'ai', 'fr0000120073', 'gaz industriel', 'hydrogene', 'action gratuite'],
  },
  {
    ticker: 'SU.PA',
    name: 'Schneider Electric SE',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['energy-grid', 'ai-semis'],
    exchange: 'Euronext Paris',
    isin: 'FR0000121972',
    searchTerms: ['schneider', 'schneider electric', 'su.pa', 'su', 'fr0000121972', 'datacenter', 'gestion energie'],
  },
  {
    ticker: 'SAN.PA',
    name: 'Sanofi SE',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    isin: 'FR0000120578',
    searchTerms: ['sanofi', 'san.pa', 'san', 'fr0000120578', 'pharma', 'sante', 'dupixent'],
  },
  {
    ticker: 'BNP.PA',
    name: 'BNP Paribas SA',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    isin: 'FR0000131104',
    searchTerms: ['bnp', 'bnp paribas', 'bnp.pa', 'fr0000131104', 'banque', 'boursobank'],
  },
  {
    ticker: 'DG.PA',
    name: 'Vinci SA',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    isin: 'FR0000125486',
    searchTerms: ['vinci', 'dg.pa', 'dg', 'fr0000125486', 'btp', 'autoroutes', 'aeroports'],
  },
  {
    ticker: 'KER.PA',
    name: 'Kering SA',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['luxury'],
    exchange: 'Euronext Paris',
    isin: 'FR0000121485',
    searchTerms: ['kering', 'gucci', 'ker.pa', 'ker', 'fr0000121485', 'saint laurent', 'balenciaga'],
  },
  {
    ticker: 'AIR.PA',
    name: 'Airbus SE',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    isin: 'NL0000235190',
    searchTerms: ['airbus', 'air.pa', 'air', 'nl0000235190', 'aero', 'aviation', 'avions'],
  },
  {
    ticker: 'SAF.PA',
    name: 'Safran SA',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    isin: 'FR0000073272',
    searchTerms: ['safran', 'saf.pa', 'saf', 'fr0000073272', 'aeronautique', 'moteurs leap', 'defense'],
  },
  {
    ticker: 'ML.PA',
    name: 'Cie Générale des Établissements Michelin',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    isin: 'FR00140759',
    searchTerms: ['michelin', 'ml.pa', 'ml', 'fr00140759', 'pneu', 'pneumatiques'],
  },
  {
    ticker: 'STLAP.PA',
    name: 'Stellantis N.V.',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Euronext Paris',
    isin: 'NL00150001Q9',
    searchTerms: ['stellantis', 'peugeot', 'fiat', 'stlap.pa', 'stla', 'nl00150001q9', 'automobile'],
  },
  {
    ticker: 'DSY.PA',
    name: 'Dassault Systèmes SE',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['cloud-saas', 'ai-semis'],
    exchange: 'Euronext Paris',
    isin: 'FR0014003TT8',
    searchTerms: ['dassault systemes', 'dsy.pa', 'dsy', 'fr0014003tt8', 'logiciel', 'catia', '3dexperience'],
  },
  {
    ticker: 'CAP.PA',
    name: 'Capgemini SE',
    assetType: 'STOCK',
    envelope: 'PEA',
    currency: 'EUR',
    themes: ['cloud-saas', 'ai-semis'],
    exchange: 'Euronext Paris',
    isin: 'FR0000125338',
    searchTerms: ['capgemini', 'cap.pa', 'cap', 'fr0000125338', 'esn', 'conseil it', 'tech france'],
  },

  // ── PEA-PME Actions ──
  {
    ticker: 'ALKAL.PA',
    name: 'Kalray SA',
    assetType: 'STOCK',
    envelope: 'PEA-PME',
    currency: 'EUR',
    themes: ['ai-semis', 'cloud-saas'],
    exchange: 'Euronext Growth Paris',
    isin: 'FR0010796062',
    searchTerms: ['kalray', 'alkal.pa', 'alkal', 'fr0010796062', 'kalray sa', 'semiconducteurs pea-pme', 'dpu', 'ia processeur'],
  },
  {
    ticker: 'MEMS.PA',
    name: 'MEMSCAP SE',
    assetType: 'STOCK',
    envelope: 'PEA-PME',
    currency: 'EUR',
    themes: ['ai-semis'],
    exchange: 'Euronext Paris',
    isin: 'FR0010263202',
    searchTerms: ['memscap', 'mems.pa', 'mems', 'fr0010263202', 'capteurs', 'mems', 'semiconducteurs pme'],
  },
  {
    ticker: 'VU.PA',
    name: 'VusionGroup (SES-imagotag)',
    assetType: 'STOCK',
    envelope: 'PEA-PME',
    currency: 'EUR',
    themes: ['cloud-saas', 'robotics-automation'],
    exchange: 'Euronext Paris',
    isin: 'FR0010282822',
    searchTerms: ['vusiongroup', 'ses-imagotag', 'vu.pa', 'fr0010282822', 'etiquettes electroniques', 'retail tech'],
  },
  {
    ticker: 'ALCLA.PA',
    name: 'Claranova SE',
    assetType: 'STOCK',
    envelope: 'PEA-PME',
    currency: 'EUR',
    themes: ['cloud-saas'],
    exchange: 'Euronext Growth Paris',
    isin: 'FR0013426004',
    searchTerms: ['claranova', 'alcla.pa', 'alcla', 'fr0013426004', 'logiciel grand public', 'planetart'],
  },

  // ── Actions US & Internationales (CTO) ──
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['cloud-saas', 'ai-semis'],
    exchange: 'NASDAQ',
    isin: 'US5949181045',
    searchTerms: ['microsoft', 'msft', 'us5949181045', 'windows', 'azure', 'ai', 'copilot', 'openai'],
  },
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['general'],
    exchange: 'NASDAQ',
    isin: 'US0378331005',
    searchTerms: ['apple', 'aapl', 'us0378331005', 'iphone', 'mac', 'ipad', 'apple intelligence'],
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['ai-semis'],
    exchange: 'NASDAQ',
    isin: 'US67066G1040',
    searchTerms: ['nvidia', 'nvda', 'us67066g1040', 'gpu', 'ia', 'chips', 'jensen huang', 'blackwell', 'h100'],
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['cloud-saas'],
    exchange: 'NASDAQ',
    isin: 'US0231351067',
    searchTerms: ['amazon', 'amzn', 'us0231351067', 'aws', 'ecommerce', 'prime', 'cloud'],
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc. (Google)',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['cloud-saas', 'ai-semis'],
    exchange: 'NASDAQ',
    isin: 'US02079K3059',
    searchTerms: ['google', 'alphabet', 'googl', 'goog', 'us02079k3059', 'youtube', 'gemini', 'search'],
  },
  {
    ticker: 'META',
    name: 'Meta Platforms Inc.',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['cloud-saas'],
    exchange: 'NASDAQ',
    isin: 'US30303M1027',
    searchTerms: ['meta', 'facebook', 'instagram', 'whatsapp', 'us30303m1027', 'llama', 'zuckerberg'],
  },
  {
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['clean-energy', 'robotics-automation'],
    exchange: 'NASDAQ',
    isin: 'US88160R1014',
    searchTerms: ['tesla', 'tsla', 'us88160r1014', 'ev', 'elon musk', 'optimus', 'robotaxi', 'batteries'],
  },
  {
    ticker: 'PLTR',
    name: 'Palantir Technologies Inc.',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['ai-semis', 'cloud-saas'],
    exchange: 'NYSE',
    isin: 'US69608A1088',
    searchTerms: ['palantir', 'pltr', 'us69608a1088', 'aip', 'defense tech', 'big data', 'alex karp'],
  },
  {
    ticker: 'AMD',
    name: 'Advanced Micro Devices Inc.',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['ai-semis'],
    exchange: 'NASDAQ',
    isin: 'US0079031078',
    searchTerms: ['amd', 'us0079031078', 'ryzen', 'epyc', 'rocm', 'lisa su', 'semiconducteurs'],
  },
  {
    ticker: 'ASML',
    name: 'ASML Holding N.V.',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'EUR',
    themes: ['ai-semis'],
    exchange: 'Euronext Amsterdam',
    isin: 'NL0010273215',
    searchTerms: ['asml', 'nl0010273215', 'euv', 'lithographie', 'semiconducteurs europe'],
  },
  {
    ticker: 'CEG',
    name: 'Constellation Energy Corporation',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['clean-energy', 'energy-grid'],
    exchange: 'NASDAQ',
    isin: 'US21037T1097',
    searchTerms: ['constellation energy', 'ceg', 'us21037t1097', 'nucleaire', 'energie clean', 'datacenter power'],
  },
  {
    ticker: 'COHR',
    name: 'Coherent Corp.',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['ai-semis', 'energy-grid', 'robotics-automation'],
    exchange: 'NYSE',
    isin: 'US19247G1076',
    searchTerms: ['coherent', 'cohr', 'us19247g1076', 'laser', 'optique', 'datacenter', 'transceiver 800g'],
  },
  {
    ticker: 'SYM',
    name: 'Symbotic Inc.',
    assetType: 'STOCK',
    envelope: 'CTO',
    currency: 'USD',
    themes: ['robotics-automation'],
    exchange: 'NASDAQ',
    isin: 'US87151X1019',
    searchTerms: ['symbotic', 'sym', 'us87151x1019', 'robotique', 'logistique', 'walmart supply chain'],
  },

  // ── Cryptomonnaies ──
  {
    ticker: 'BTC-EUR',
    name: 'Bitcoin (BTC / EUR)',
    assetType: 'CRYPTO',
    envelope: 'CRYPTO',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Crypto Market (24/7)',
    searchTerms: ['btc', 'btc-eur', 'btceur', 'bitcoin', 'crypto', 'satoshi', 'or numerique'],
  },
  {
    ticker: 'BTC-USD',
    name: 'Bitcoin (BTC / USD)',
    assetType: 'CRYPTO',
    envelope: 'CRYPTO',
    currency: 'USD',
    themes: ['general'],
    exchange: 'Crypto Market (24/7)',
    searchTerms: ['btc', 'btc-usd', 'btcusd', 'bitcoin', 'crypto', 'satoshi', 'or numerique'],
  },
  {
    ticker: 'ETH-EUR',
    name: 'Ethereum (ETH / EUR)',
    assetType: 'CRYPTO',
    envelope: 'CRYPTO',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Crypto Market (24/7)',
    searchTerms: ['eth', 'eth-eur', 'etheur', 'ethereum', 'ether', 'smart contracts', 'vitalik'],
  },
  {
    ticker: 'ETH-USD',
    name: 'Ethereum (ETH / USD)',
    assetType: 'CRYPTO',
    envelope: 'CRYPTO',
    currency: 'USD',
    themes: ['general'],
    exchange: 'Crypto Market (24/7)',
    searchTerms: ['eth', 'eth-usd', 'ethusd', 'ethereum', 'ether', 'smart contracts', 'vitalik'],
  },
  {
    ticker: 'GST-EUR',
    name: 'Green Satoshi Token (GST / EUR)',
    assetType: 'CRYPTO',
    envelope: 'CRYPTO',
    currency: 'EUR',
    themes: ['general', 'gaming'],
    exchange: 'Solana SPL',
    searchTerms: ['gst', 'gst-eur', 'gsteur', 'green satoshi token', 'stepn', 'solana spl'],
  },
  {
    ticker: 'GMT-EUR',
    name: 'STEPN (GMT / EUR)',
    assetType: 'CRYPTO',
    envelope: 'CRYPTO',
    currency: 'EUR',
    themes: ['general', 'gaming'],
    exchange: 'Solana SPL',
    searchTerms: ['gmt', 'gmt-eur', 'gmteur', 'stepn', 'solana spl'],
  },
  {
    ticker: 'SOL-EUR',
    name: 'Solana (SOL / EUR)',
    assetType: 'CRYPTO',
    envelope: 'CRYPTO',
    currency: 'EUR',
    themes: ['general'],
    exchange: 'Crypto Market (24/7)',
    searchTerms: ['sol', 'sol-eur', 'soleur', 'solana', 'crypto rapide', 'defi'],
  },
  {
    ticker: 'SOL-USD',
    name: 'Solana (SOL / USD)',
    assetType: 'CRYPTO',
    envelope: 'CRYPTO',
    currency: 'USD',
    themes: ['general'],
    exchange: 'Crypto Market (24/7)',
    searchTerms: ['sol', 'sol-usd', 'solusd', 'solana', 'crypto rapide', 'defi'],
  },
];

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


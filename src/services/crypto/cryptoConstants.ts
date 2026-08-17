/**
 * Types et Constantes pour le scanner On-Chain
 */

export interface DiscoveredCryptoAsset {
  id: string;
  ticker: string; // e.g. "BTC-EUR", "ETH-EUR", "SOL-EUR", "USDT-EUR"
  name: string; // e.g. "Bitcoin", "Ethereum", "Solana", "Tether USD"
  symbol: string; // e.g. "BTC", "ETH", "SOL", "USDT"
  chain: string; // e.g. "ETH", "BSC", "POLYGON", "SOLANA", "BITCOIN", "ARBITRUM"
  chainLabel: string; // e.g. "Ethereum (Mainnet)", "BNB Chain (BEP20)", "Polygon"
  chainIcon: string; // e.g. "🔷", "🟡", "🟣", "🟣", "🟠"
  balance: number; // e.g. 0.0512
  priceEUR: number; // e.g. 85000
  valueEUR: number; // e.g. 4352
  contractAddress?: string;
  selected: boolean;
}

export interface OnChainScanResult {
  success: boolean;
  address: string;
  detectedType: 'EVM' | 'SOLANA' | 'BITCOIN' | 'TRON' | 'UNKNOWN';
  assets: DiscoveredCryptoAsset[];
  totalValueEUR: number;
  error?: string;
  warning?: string;
  isTokenContract?: boolean;
}

export const PUBLIC_RPCS = {
  ETH: 'https://ethereum-rpc.publicnode.com',
  BSC: 'https://bsc-dataseed.binance.org',
  POLYGON: 'https://polygon-rpc.com',
  ARBITRUM: 'https://arb1.arbitrum.io/rpc',
  BASE: 'https://mainnet.base.org',
  SOLANA: 'https://api.mainnet-beta.solana.com',
  BTC_EXPLORER: 'https://blockstream.info/api/address',
};

// Top ERC20 / BEP20 Tokens to check
export interface TokenContractDef {
  symbol: string;
  name: string;
  ticker: string;
  decimals: number;
  address: string;
  chain: 'ETH' | 'BSC' | 'POLYGON';
  fallbackPriceEUR: number;
}

// Solana SPL Token Definitions
export interface SolanaSplDef {
  symbol: string;
  name: string;
  ticker: string;
  coingeckoId?: string;
  fallbackPriceEUR: number;
  icon: string;
}

export const SOLANA_SPL_MAP: Record<string, SolanaSplDef> = {
  // GST - Green Satoshi Token (STEPN on Solana)
  'AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB': {
    symbol: 'GST',
    name: 'Green Satoshi Token (SOL)',
    ticker: 'GST-EUR',
    coingeckoId: 'green-satoshi-token',
    fallbackPriceEUR: 0.00085,
    icon: '👟',
  },
  // GMT - STEPN Governance
  '7i5KKDFALHgnWaPtKjdLVdvoJBnhRQuKAezGUrX1KDt2': {
    symbol: 'GMT',
    name: 'STEPN (GMT)',
    ticker: 'GMT-EUR',
    coingeckoId: 'stepn',
    fallbackPriceEUR: 0.12,
    icon: '👟',
  },
  // USDC SPL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
    symbol: 'USDC',
    name: 'USD Coin (Solana)',
    ticker: 'USDC-EUR',
    coingeckoId: 'usd-coin',
    fallbackPriceEUR: 0.95,
    icon: '💵',
  },
  // USDT SPL
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': {
    symbol: 'USDT',
    name: 'Tether USD (Solana)',
    ticker: 'USDT-EUR',
    coingeckoId: 'tether',
    fallbackPriceEUR: 0.95,
    icon: '💵',
  },
  // BONK
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': {
    symbol: 'BONK',
    name: 'Bonk',
    ticker: 'BONK-EUR',
    coingeckoId: 'bonk',
    fallbackPriceEUR: 0.00002,
    icon: '🐶',
  },
  // JUP
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': {
    symbol: 'JUP',
    name: 'Jupiter',
    ticker: 'JUP-EUR',
    coingeckoId: 'jupiter-exchange-solana',
    fallbackPriceEUR: 0.85,
    icon: '🪐',
  },
  // RAY
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': {
    symbol: 'RAY',
    name: 'Raydium',
    ticker: 'RAY-EUR',
    coingeckoId: 'raydium',
    fallbackPriceEUR: 1.8,
    icon: '⚡',
  },
  // WIF
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': {
    symbol: 'WIF',
    name: 'dogwifhat',
    ticker: 'WIF-EUR',
    coingeckoId: 'dogwifcoin',
    fallbackPriceEUR: 1.5,
    icon: '🐶',
  },
  // RENDER
  'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBXd': {
    symbol: 'RENDER',
    name: 'Render Token (SOL)',
    ticker: 'RENDER-EUR',
    coingeckoId: 'render-token',
    fallbackPriceEUR: 5.5,
    icon: '🎨',
  },
  // MSOL
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': {
    symbol: 'MSOL',
    name: 'Marinade Staked SOL',
    ticker: 'MSOL-EUR',
    coingeckoId: 'marinade-staked-sol',
    fallbackPriceEUR: 200,
    icon: '🥩',
  },
  // JITOSOL
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': {
    symbol: 'JITOSOL',
    name: 'Jito Staked SOL',
    ticker: 'JITOSOL-EUR',
    coingeckoId: 'jito-staked-sol',
    fallbackPriceEUR: 200,
    icon: '🥩',
  },
  // PYTH
  'PYTHx3w5gnk1bZf6n6C6Tdmk6c7M4N8mQ3pWjYnL6': {
    symbol: 'PYTH',
    name: 'Pyth Network',
    ticker: 'PYTH-EUR',
    coingeckoId: 'pyth-network',
    fallbackPriceEUR: 0.35,
    icon: '🔮',
  },
};

export const COMMON_TOKEN_CONTRACTS: TokenContractDef[] = [
  // Ethereum ERC20
  { symbol: 'DMTR', name: 'Dimitra', ticker: 'DMTR-EUR', decimals: 18, address: '0x51cb253744189f11241becb29bedd3f1b5384fdb', chain: 'ETH', fallbackPriceEUR: 0.0043 },
  { symbol: 'WTK', name: 'WadzPay', ticker: 'WTK-EUR', decimals: 18, address: '0x4cff49d0a19ed6ff845a9122fa912abcfb1f68a6', chain: 'ETH', fallbackPriceEUR: 0.015 },
  { symbol: 'USDT', name: 'Tether USD', ticker: 'USDT-EUR', decimals: 6, address: '0xdac17f958d2ee523a2206206994597c13d831ec7', chain: 'ETH', fallbackPriceEUR: 0.95 },
  { symbol: 'USDC', name: 'USD Coin', ticker: 'USDC-EUR', decimals: 6, address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chain: 'ETH', fallbackPriceEUR: 0.95 },
  { symbol: 'LINK', name: 'Chainlink', ticker: 'LINK-EUR', decimals: 18, address: '0x514910771af9ca656af840dff83e8264ecf986ca', chain: 'ETH', fallbackPriceEUR: 15.5 },
  { symbol: 'UNI', name: 'Uniswap', ticker: 'UNI-EUR', decimals: 18, address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', chain: 'ETH', fallbackPriceEUR: 8.2 },
  { symbol: 'WBTC', name: 'Wrapped BTC', ticker: 'BTC-EUR', decimals: 8, address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', chain: 'ETH', fallbackPriceEUR: 85000 },
  { symbol: 'SHIB', name: 'Shiba Inu', ticker: 'SHIB-EUR', decimals: 18, address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', chain: 'ETH', fallbackPriceEUR: 0.000015 },
  
  // BSC BEP20
  { symbol: 'VELO', name: 'Velo Protocol (BEP20)', ticker: 'VELO-EUR', decimals: 18, address: '0xf486ad071f3bee968384d2e39e2d8af0fcf6fd46', chain: 'BSC', fallbackPriceEUR: 0.0026 },
  { symbol: 'USDT', name: 'Tether USD (BEP20)', ticker: 'USDT-EUR', decimals: 18, address: '0x55d398326f99059ff775485246999027b3197955', chain: 'BSC', fallbackPriceEUR: 0.95 },
  { symbol: 'USDC', name: 'USD Coin (BEP20)', ticker: 'USDC-EUR', decimals: 18, address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', chain: 'BSC', fallbackPriceEUR: 0.95 },
  { symbol: 'BTCB', name: 'Bitcoin BEP2', ticker: 'BTC-EUR', decimals: 18, address: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c', chain: 'BSC', fallbackPriceEUR: 85000 },
  { symbol: 'ETH', name: 'Ethereum BEP20', ticker: 'ETH-EUR', decimals: 18, address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8', chain: 'BSC', fallbackPriceEUR: 3200 },
  { symbol: 'CAKE', name: 'PancakeSwap', ticker: 'CAKE-EUR', decimals: 18, address: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82', chain: 'BSC', fallbackPriceEUR: 2.1 },

  // Polygon
  { symbol: 'USDT', name: 'Tether USD (Polygon)', ticker: 'USDT-EUR', decimals: 6, address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', chain: 'POLYGON', fallbackPriceEUR: 0.95 },
  { symbol: 'USDC', name: 'USD Coin (Polygon)', ticker: 'USDC-EUR', decimals: 6, address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', chain: 'POLYGON', fallbackPriceEUR: 0.95 },
  { symbol: 'WETH', name: 'Wrapped Ether (Polygon)', ticker: 'ETH-EUR', decimals: 18, address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619', chain: 'POLYGON', fallbackPriceEUR: 3200 },
];

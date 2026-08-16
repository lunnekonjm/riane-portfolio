/**
 * Service de lecture des soldes blockchain en mode Lecture Seule (Watch-Only)
 * Compatible avec les adresses publiques Trust Wallet, Ledger, Metamask, Phantom, etc.
 * 100% sécurisé : zéro clé privée, zéro signature, requêtes directes sur RPCs publics.
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

const PUBLIC_RPCS = {
  ETH: 'https://ethereum-rpc.publicnode.com',
  BSC: 'https://bsc-dataseed.binance.org',
  POLYGON: 'https://polygon-rpc.com',
  ARBITRUM: 'https://arb1.arbitrum.io/rpc',
  BASE: 'https://mainnet.base.org',
  SOLANA: 'https://api.mainnet-beta.solana.com',
  BTC_EXPLORER: 'https://blockstream.info/api/address',
};

// Top ERC20 / BEP20 Tokens to check
interface TokenContractDef {
  symbol: string;
  name: string;
  ticker: string;
  decimals: number;
  address: string;
  chain: 'ETH' | 'BSC' | 'POLYGON';
  fallbackPriceEUR: number;
}


// Solana SPL Token Definitions
interface SolanaSplDef {
  symbol: string;
  name: string;
  ticker: string;
  coingeckoId?: string;
  fallbackPriceEUR: number;
  icon: string;
}

const SOLANA_SPL_MAP: Record<string, SolanaSplDef> = {
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

const COMMON_TOKEN_CONTRACTS: TokenContractDef[] = [
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

/**
 * Récupère le prix de référence en EUR
 */
async function fetchPriceEUR(ticker: string, fallback: number, coingeckoId?: string, mintAddress?: string): Promise<number> {
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

/**
 * Scan complet multi-actifs pour une adresse (EVM, Solana, ou Bitcoin)
 */
export async function scanWalletAllAssets(
  rawAddress: string,
  preferredInstitution = 'Trust Wallet'
): Promise<OnChainScanResult> {
  const address = rawAddress.trim();
  const discovered: DiscoveredCryptoAsset[] = [];
  let isTokenContract = false;
  let contractWarning: string | undefined = undefined;

  // Vérification si l'utilisateur a collé l'adresse d'un smart contract / mint de token plutôt que son wallet
  if (SOLANA_SPL_MAP[address] || COMMON_TOKEN_CONTRACTS.some(c => c.address.toLowerCase() === address.toLowerCase())) {
    const matchedToken = SOLANA_SPL_MAP[address]?.name || COMMON_TOKEN_CONTRACTS.find(c => c.address.toLowerCase() === address.toLowerCase())?.name || 'Token';
    isTokenContract = true;
    contractWarning = `Attention : Cette adresse correspond au Smart Contract officiel du token « ${matchedToken} » (le contrat du projet), et non à votre adresse de portefeuille personnel. Les fonds affichés appartiennent au contrat du projet.`;
  }

  if (!address) {
    return {
      success: false,
      address,
      detectedType: 'UNKNOWN',
      assets: [],
      totalValueEUR: 0,
      error: 'Veuillez saisir une adresse blockchain valide.',
    };
  }

  // 1. Détection BITCOIN
  if (/^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address)) {
    let btcBalance = 0;
    let btcFound = false;

    // 1.1 Essai Mempool.space (Segwit & Taproot compatible)
    try {
      const res = await fetch(`https://mempool.space/api/address/${address}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        const funded = (data?.chain_stats?.funded_txo_sum ?? 0) + (data?.mempool_stats?.funded_txo_sum ?? 0);
        const spent = (data?.chain_stats?.spent_txo_sum ?? 0) + (data?.mempool_stats?.spent_txo_sum ?? 0);
        const satoshis = funded - spent;
        btcBalance = Math.max(0, satoshis / 1e8);
        btcFound = true;
      }
    } catch {}

    // 1.2 Repli Blockstream Explorer
    if (!btcFound) {
      try {
        const res = await fetch(`${PUBLIC_RPCS.BTC_EXPLORER}/${address}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json();
          const funded = (data?.chain_stats?.funded_txo_sum ?? 0) + (data?.mempool_stats?.funded_txo_sum ?? 0);
          const spent = (data?.chain_stats?.spent_txo_sum ?? 0) + (data?.mempool_stats?.spent_txo_sum ?? 0);
          const satoshis = funded - spent;
          btcBalance = Math.max(0, satoshis / 1e8);
          btcFound = true;
        }
      } catch {}
    }

    // 1.3 Repli Blockchain.info
    if (!btcFound) {
      try {
        const res = await fetch(`https://blockchain.info/rawaddr/${address}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json();
          const satoshis = data?.final_balance ?? 0;
          btcBalance = Math.max(0, satoshis / 1e8);
          btcFound = true;
        }
      } catch {}
    }

    const price = await fetchPriceEUR('BTC-EUR', 85000);
    if (btcBalance > 0) {
      discovered.push({
        id: `btc-${address.slice(-6)}`,
        ticker: 'BTC-EUR',
        name: 'Bitcoin',
        symbol: 'BTC',
        chain: 'BITCOIN',
        chainLabel: 'Réseau Bitcoin (BTC)',
        chainIcon: '🟠',
        balance: btcBalance,
        priceEUR: price,
        valueEUR: btcBalance * price,
        selected: true,
      });
    }

    return {
      success: true,
      address,
      detectedType: 'BITCOIN',
      assets: discovered,
      totalValueEUR: discovered.reduce((sum, a) => sum + a.valueEUR, 0),
    };
  }

  // 2. Détection TRON (T...)
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) {
    try {
      const res = await fetch(`https://api.trongrid.io/v1/accounts/${address}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const data = await res.json();
        const acc = data?.data?.[0];
        const sun = acc?.balance ?? 0;
        const trxBalance = sun / 1e6;
        const trxPrice = await fetchPriceEUR('TRX-EUR', 0.28, 'tron');

        if (trxBalance > 0.0001) {
          discovered.push({
            id: `trx-${address.slice(-6)}`,
            ticker: 'TRX-EUR',
            name: 'TRON',
            symbol: 'TRX',
            chain: 'TRON',
            chainLabel: 'Réseau TRON (TRX)',
            chainIcon: '🔴',
            balance: trxBalance,
            priceEUR: trxPrice,
            valueEUR: trxBalance * trxPrice,
            selected: true,
          });
        }

        // Check TRC20 tokens from account if present
        if (Array.isArray(acc?.trc20)) {
          for (const item of acc.trc20) {
            for (const [contractKey, rawAmount] of Object.entries(item)) {
              const bal = Number(rawAmount) / 1e6; // standard USDT-TRC20 decimals = 6
              if (bal > 0.0001) {
                const isUSDT = contractKey.toLowerCase() === 'tr7nhqjekqxgtci8q8zy4pl8otszgjl6t6'.toLowerCase();
                const sym = isUSDT ? 'USDT' : `TRC20-${contractKey.slice(0, 4)}`;
                const name = isUSDT ? 'Tether USD (TRC20)' : `TRC-20 Token (${contractKey.slice(0, 6)}...)`;
                const ticker = `${sym}-EUR`;
                const price = isUSDT ? 0.95 : 0;
                discovered.push({
                  id: `trc20-${contractKey.slice(-6)}`,
                  ticker,
                  name,
                  symbol: sym,
                  chain: 'TRON',
                  chainLabel: 'Réseau TRON (TRC-20)',
                  chainIcon: '🔴',
                  balance: bal,
                  priceEUR: price,
                  valueEUR: bal * price,
                  contractAddress: contractKey,
                  selected: price > 0,
                });
              }
            }
          }
        }
      }
    } catch {}

    return {
      success: true,
      address,
      detectedType: 'TRON',
      assets: discovered,
      totalValueEUR: discovered.reduce((sum, a) => sum + (a.selected ? a.valueEUR : 0), 0),
    };
  }

  // 3. Détection SOLANA (Native SOL + SPL Tokens GST, GMT, USDC, BONK, etc.)
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) && !address.startsWith('0x')) {
    // 2.1 Native SOL Balance
    try {
      const res = await fetch(PUBLIC_RPCS.SOLANA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [address],
        }),
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const data = await res.json();
        const lamports = data.result?.value ?? 0;
        const solBalance = lamports / 1e9;
        const price = await fetchPriceEUR('SOL-EUR', 180, 'solana');

        if (solBalance > 0.0001) {
          discovered.push({
            id: `sol-${address.slice(-6)}`,
            ticker: 'SOL-EUR',
            name: 'Solana',
            symbol: 'SOL',
            chain: 'SOLANA',
            chainLabel: 'Réseau Solana (SOL)',
            chainIcon: '🟣',
            balance: solBalance,
            priceEUR: price,
            valueEUR: solBalance * price,
            selected: true,
          });
        }
      }
    } catch {}

    // 2.2 SPL Token Accounts (Token Program & Token-2022 Program)
    const tokenPrograms = [
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Standard SPL Token
      'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb', // Token-2022
    ];

    for (const progId of tokenPrograms) {
      try {
        const res = await fetch(PUBLIC_RPCS.SOLANA, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'getTokenAccountsByOwner',
            params: [
              address,
              { programId: progId },
              { encoding: 'jsonParsed' },
            ],
          }),
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          const data = await res.json();
          const accounts = data.result?.value || [];

          for (const acc of accounts) {
            const info = acc.account?.data?.parsed?.info;
            const mint = info?.mint;
            const uiAmount = info?.tokenAmount?.uiAmount ?? (Number(info?.tokenAmount?.amount || 0) / Math.pow(10, info?.tokenAmount?.decimals || 0));

            if (uiAmount > 0.000001 && mint) {
              const def = SOLANA_SPL_MAP[mint] || Object.entries(SOLANA_SPL_MAP).find(([k]) => k.toLowerCase() === mint.toLowerCase() || mint.startsWith(k.slice(0, 5)))?.[1];
              const symbol = def ? def.symbol : `SPL-${mint.slice(0, 4)}`;
              const isNFT = uiAmount === 1 && !def;
              const name = def ? def.name : (isNFT ? `NFT / Collectible (${mint.slice(0, 6)}...)` : `SPL Token (${mint.slice(0, 6)}...)`);
              const ticker = def ? def.ticker : `${symbol}-EUR`;
              const icon = def ? def.icon : (isNFT ? '🖼️' : '🟣');
              const price = await fetchPriceEUR(ticker, def?.fallbackPriceEUR || 0, def?.coingeckoId, mint);
              const val = uiAmount * price;
              const isValuable = val > 0.01 || (def !== undefined && price > 0);

              discovered.push({
                id: `sol-spl-${mint.slice(-6)}`,
                ticker,
                name,
                symbol,
                chain: 'SOLANA',
                chainLabel: def ? 'Réseau Solana (SPL Token)' : (isNFT ? 'Solana NFT / Collectible' : 'Solana SPL Token'),
                chainIcon: icon,
                balance: uiAmount,
                priceEUR: price,
                valueEUR: val,
                contractAddress: mint,
                selected: isValuable,
              });
            }
          }
        }
      } catch {}
    }

    // Sort: assets with positive value or verified first, then others
    discovered.sort((a, b) => (b.valueEUR || 0) - (a.valueEUR || 0));

    return {
      success: true,
      address,
      detectedType: 'SOLANA',
      warning: contractWarning,
      isTokenContract,
      assets: discovered,
      totalValueEUR: discovered.reduce((sum, a) => sum + (a.selected ? a.valueEUR : 0), 0),
    };
  }

  // 3. Détection EVM (0x...) - Multi-Chain Scanning
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
    // Fetch ETH, BNB, POL prices in parallel
    const [ethPrice, bnbPrice, polPrice] = await Promise.all([
      fetchPriceEUR('ETH-EUR', 3200),
      fetchPriceEUR('BNB-EUR', 620),
      fetchPriceEUR('POL-EUR', 0.45),
    ]);

    // Check Native balances across chains
    const nativeChecks = [
      { chain: 'ETH', label: 'Ethereum (Mainnet)', icon: '🔷', rpc: PUBLIC_RPCS.ETH, symbol: 'ETH', name: 'Ethereum', ticker: 'ETH-EUR', price: ethPrice },
      { chain: 'BSC', label: 'BNB Smart Chain', icon: '🟡', rpc: PUBLIC_RPCS.BSC, symbol: 'BNB', name: 'BNB', ticker: 'BNB-EUR', price: bnbPrice },
      { chain: 'POLYGON', label: 'Polygon PoS', icon: '🟣', rpc: PUBLIC_RPCS.POLYGON, symbol: 'POL', name: 'Polygon Ecosystem Token', ticker: 'POL-EUR', price: polPrice },
      { chain: 'ARBITRUM', label: 'Arbitrum One', icon: '🔵', rpc: PUBLIC_RPCS.ARBITRUM, symbol: 'ETH', name: 'Ethereum (Arbitrum)', ticker: 'ETH-EUR', price: ethPrice },
      { chain: 'BASE', label: 'Base Mainnet', icon: '🔵', rpc: PUBLIC_RPCS.BASE, symbol: 'ETH', name: 'Ethereum (Base)', ticker: 'ETH-EUR', price: ethPrice },
    ];

    await Promise.allSettled(
      nativeChecks.map(async (n) => {
        try {
          const res = await fetch(n.rpc, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_getBalance',
              params: [address, 'latest'],
            }),
            signal: AbortSignal.timeout(5000),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.result) {
              const wei = BigInt(data.result);
              const bal = Number(wei) / 1e18;
              if (bal > 0.00001) {
                discovered.push({
                  id: `${n.chain.toLowerCase()}-native-${address.slice(-6)}`,
                  ticker: n.ticker,
                  name: n.name,
                  symbol: n.symbol,
                  chain: n.chain,
                  chainLabel: n.label,
                  chainIcon: n.icon,
                  balance: bal,
                  priceEUR: n.price,
                  valueEUR: bal * n.price,
                  selected: true,
                });
              }
            }
          }
        } catch {
          // ignore individual rpc failure
        }
      })
    );

    // 3.1 Dynamic Token Discovery on Ethereum via Ethplorer
    try {
      const ethRes = await fetch(`https://api.ethplorer.io/getAddressInfo/${address}?apiKey=freekey`, {
        signal: AbortSignal.timeout(5000),
      });
      if (ethRes.ok) {
        const ethData = await ethRes.json();
        for (const tok of ethData.tokens || []) {
          const info = tok.tokenInfo;
          if (!info || !info.address) continue;
          const decimals = Number(info.decimals || 18);
          const bal = Number(tok.balance) / Math.pow(10, decimals);
          if (bal > 0.0001) {
            const sym = (info.symbol || 'ERC20').toUpperCase();
            const name = info.name || sym;
            const ticker = `${sym}-EUR`;
            const contractAddr = info.address.toLowerCase();

            if (!discovered.some(d => d.contractAddress?.toLowerCase() === contractAddr)) {
              let price = 0;
              if (info.price?.rate && typeof info.price.rate === 'number' && info.price.rate > 0) {
                price = info.price.rate * 0.864;
              } else {
                price = await fetchPriceEUR(ticker, 0, undefined, info.address);
              }
              const val = bal * price;
              const isValuable = val > 0.01 || price > 0;

              discovered.push({
                id: `${sym.toLowerCase()}-eth-${contractAddr.slice(-4)}`,
                ticker,
                name,
                symbol: sym,
                chain: 'ETH',
                chainLabel: 'Ethereum (ERC20)',
                chainIcon: '🔷',
                balance: bal,
                priceEUR: price,
                valueEUR: val,
                contractAddress: info.address,
                selected: isValuable,
              });
            }
          }
        }
      }
    } catch {}

    // Check ERC-20 / BEP-20 Top tokens via eth_call balanceOf(address)
    // 0x70a08231000000000000000000000000 + address without 0x
    const paddedAddr = address.toLowerCase().replace(/^0x/, '').padStart(64, '0');
    const callData = `0x70a08231${paddedAddr}`;

    await Promise.allSettled(
      COMMON_TOKEN_CONTRACTS.map(async (tok) => {
        const rpc = tok.chain === 'BSC' ? PUBLIC_RPCS.BSC : tok.chain === 'POLYGON' ? PUBLIC_RPCS.POLYGON : PUBLIC_RPCS.ETH;
        try {
          const res = await fetch(rpc, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 2,
              method: 'eth_call',
              params: [{ to: tok.address, data: callData }, 'latest'],
            }),
            signal: AbortSignal.timeout(5000),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.result && data.result !== '0x' && data.result !== '0x0') {
              const raw = BigInt(data.result);
              const bal = Number(raw) / Math.pow(10, tok.decimals);
              if (bal > 0.0001 && !discovered.some(d => d.contractAddress?.toLowerCase() === tok.address.toLowerCase())) {
                const chainLabel = tok.chain === 'BSC' ? 'BNB Chain (BEP20)' : tok.chain === 'POLYGON' ? 'Polygon (ERC20)' : 'Ethereum (ERC20)';
                const chainIcon = tok.chain === 'BSC' ? '🟡' : tok.chain === 'POLYGON' ? '🟣' : '🔷';
                const price = tok.fallbackPriceEUR;
                discovered.push({
                  id: `${tok.symbol.toLowerCase()}-${tok.chain.toLowerCase()}-${tok.address.slice(-4)}`,
                  ticker: tok.ticker,
                  name: tok.name,
                  symbol: tok.symbol,
                  chain: tok.chain,
                  chainLabel,
                  chainIcon,
                  balance: bal,
                  priceEUR: price,
                  valueEUR: bal * price,
                  contractAddress: tok.address,
                  selected: true,
                });
              }
            }
          }
        } catch {
          // ignore
        }
      })
    );

    // Sort: assets with positive value first, then others
    discovered.sort((a, b) => (b.valueEUR || 0) - (a.valueEUR || 0));

    return {
      success: true,
      address,
      detectedType: 'EVM',
      assets: discovered,
      totalValueEUR: discovered.reduce((sum, a) => sum + (a.selected ? a.valueEUR : 0), 0),
    };
  }

  return {
    success: false,
    address,
    detectedType: 'UNKNOWN',
    assets: [],
    totalValueEUR: 0,
    error: "Format d'adresse non reconnu. Formats supportés : EVM (0x...), Bitcoin (1..., 3..., bc1...), Solana ou TRON (T...).",
  };
}

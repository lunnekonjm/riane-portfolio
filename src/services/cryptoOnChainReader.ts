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
  detectedType: 'EVM' | 'SOLANA' | 'BITCOIN' | 'UNKNOWN';
  assets: DiscoveredCryptoAsset[];
  totalValueEUR: number;
  error?: string;
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

const COMMON_TOKEN_CONTRACTS: TokenContractDef[] = [
  // Ethereum ERC20
  { symbol: 'USDT', name: 'Tether USD', ticker: 'USDT-EUR', decimals: 6, address: '0xdac17f958d2ee523a2206206994597c13d831ec7', chain: 'ETH', fallbackPriceEUR: 0.95 },
  { symbol: 'USDC', name: 'USD Coin', ticker: 'USDC-EUR', decimals: 6, address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chain: 'ETH', fallbackPriceEUR: 0.95 },
  { symbol: 'LINK', name: 'Chainlink', ticker: 'LINK-EUR', decimals: 18, address: '0x514910771af9ca656af840dff83e8264ecf986ca', chain: 'ETH', fallbackPriceEUR: 15.5 },
  { symbol: 'UNI', name: 'Uniswap', ticker: 'UNI-EUR', decimals: 18, address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', chain: 'ETH', fallbackPriceEUR: 8.2 },
  { symbol: 'WBTC', name: 'Wrapped BTC', ticker: 'BTC-EUR', decimals: 8, address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', chain: 'ETH', fallbackPriceEUR: 85000 },
  { symbol: 'SHIB', name: 'Shiba Inu', ticker: 'SHIB-EUR', decimals: 18, address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', chain: 'ETH', fallbackPriceEUR: 0.000015 },
  
  // BSC BEP20
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
async function fetchPriceEUR(ticker: string, fallback: number): Promise<number> {
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
  } catch {
    // Ignore and return fallback
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

  // 2. Détection SOLANA
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) && !address.startsWith('0x')) {
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
        const price = await fetchPriceEUR('SOL-EUR', 180);

        if (solBalance > 0) {
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
    } catch {
      // Ignore
    }

    return {
      success: true,
      address,
      detectedType: 'SOLANA',
      assets: discovered,
      totalValueEUR: discovered.reduce((sum, a) => sum + a.valueEUR, 0),
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
              if (bal > 0.0001) {
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

    return {
      success: true,
      address,
      detectedType: 'EVM',
      assets: discovered,
      totalValueEUR: discovered.reduce((sum, a) => sum + a.valueEUR, 0),
    };
  }

  return {
    success: false,
    address,
    detectedType: 'UNKNOWN',
    assets: [],
    totalValueEUR: 0,
    error: "Format d'adresse non reconnu. Formats supportés : EVM (0x...), Bitcoin (1..., 3..., bc1...), ou Solana.",
  };
}

import type { DiscoveredCryptoAsset, OnChainScanResult } from '../cryptoConstants';
import { PUBLIC_RPCS, COMMON_TOKEN_CONTRACTS } from '../cryptoConstants';
import { fetchPriceEUR } from '../cryptoPriceService';

export function isEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export async function scanEvmWallet(address: string): Promise<OnChainScanResult> {
  const discovered: DiscoveredCryptoAsset[] = [];

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

  // Dynamic Token Discovery on Ethereum via Ethplorer
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

  discovered.sort((a, b) => (b.valueEUR || 0) - (a.valueEUR || 0));

  return {
    success: true,
    address,
    detectedType: 'EVM',
    assets: discovered,
    totalValueEUR: discovered.reduce((sum, a) => sum + (a.selected ? a.valueEUR : 0), 0),
  };
}

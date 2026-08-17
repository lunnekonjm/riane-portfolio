import type { DiscoveredCryptoAsset, OnChainScanResult } from '../cryptoConstants';
import { PUBLIC_RPCS } from '../cryptoConstants';
import { fetchPriceEUR } from '../cryptoPriceService';

export function isBitcoinAddress(address: string): boolean {
  return /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);
}

export async function scanBitcoinWallet(address: string): Promise<OnChainScanResult> {
  const discovered: DiscoveredCryptoAsset[] = [];
  let btcBalance = 0;
  let btcFound = false;

  // 1. Essai Mempool.space (Segwit & Taproot compatible)
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

  // 2. Repli Blockstream Explorer
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

  // 3. Repli Blockchain.info
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

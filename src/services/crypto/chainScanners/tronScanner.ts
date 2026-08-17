import type { DiscoveredCryptoAsset, OnChainScanResult } from '../cryptoConstants';
import { fetchPriceEUR } from '../cryptoPriceService';

export function isTronAddress(address: string): boolean {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
}

export async function scanTronWallet(address: string): Promise<OnChainScanResult> {
  const discovered: DiscoveredCryptoAsset[] = [];

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

import type { DiscoveredCryptoAsset, OnChainScanResult } from '../cryptoConstants';
import { PUBLIC_RPCS, SOLANA_SPL_MAP } from '../cryptoConstants';
import { fetchPriceEUR } from '../cryptoPriceService';

export function isSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) && !address.startsWith('0x');
}

export async function scanSolanaWallet(
  address: string,
  isTokenContract: boolean,
  contractWarning?: string
): Promise<OnChainScanResult> {
  const discovered: DiscoveredCryptoAsset[] = [];

  // 1. Native SOL Balance
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

  // 2. SPL Token Accounts (Token Program & Token-2022 Program)
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

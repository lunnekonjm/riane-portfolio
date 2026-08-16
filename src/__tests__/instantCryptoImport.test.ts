import { describe, it, expect } from 'vitest';
import { sanitizeCryptoPosition } from '@/utils/cryptoWalletEngine';
import type { Position } from '@/types/portfolio';

describe('Instant Crypto Import and Deduplication', () => {
  it('instantly sanitizes batch imported assets without wiping existing ones', () => {
    const existing: Position[] = [
      {
        id: 'crypto-btc-1',
        ticker: 'BTC-EUR',
        name: 'Bitcoin',
        envelope: 'CRYPTO',
        assetType: 'CRYPTO',
        currency: 'EUR',
        quantity: 0.1,
        avgPrice: 60000,
        currentPrice: 62000,
        institutionName: 'Trust Wallet',
        updatedAt: 1000,
      },
    ];

    const newBatch: Position[] = [
      {
        id: 'crypto-eth-1',
        ticker: 'ETH-EUR',
        name: 'Ethereum',
        envelope: 'CRYPTO',
        assetType: 'CRYPTO',
        currency: 'EUR',
        quantity: 1.5,
        avgPrice: 2800,
        currentPrice: 2900,
        institutionName: 'Trust Wallet',
        updatedAt: 2000,
      },
      {
        id: 'crypto-bnb-1',
        ticker: 'BNB-EUR',
        name: 'Binance Coin',
        envelope: 'CRYPTO',
        assetType: 'CRYPTO',
        currency: 'EUR',
        quantity: 4.18,
        avgPrice: 520,
        currentPrice: 530,
        institutionName: 'Trust Wallet',
        updatedAt: 2000,
      },
    ];

    const posMap = new Map<string, Position>();
    existing.forEach((p) => posMap.set(p.id, p));

    newBatch.map(sanitizeCryptoPosition).forEach((pos) => {
      posMap.set(pos.id, pos);
    });

    const result = Array.from(posMap.values());
    expect(result).toHaveLength(3);
    expect(result.map((p) => p.ticker)).toEqual(['BTC-EUR', 'ETH-EUR', 'BNB-EUR']);
  });
});

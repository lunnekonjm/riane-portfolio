import { describe, it, expect } from 'vitest';
import {
  cleanWalletProviderName,
  sanitizeCryptoWallets,
  sanitizeCryptoPosition,
  calibratePRUFromTotalInvested,
} from '@/utils/cryptoWalletEngine';
import { resolveAssetLogo } from '@/utils/logoDirectory';
import type { Position, CryptoWalletPocket } from '@/types/portfolio';

describe('Crypto Deduplication, Normalization and Logos', () => {
  it('cleanWalletProviderName strips leading emojis and extra whitespace', () => {
    expect(cleanWalletProviderName('🛡️ Trust Wallet')).toBe('Trust Wallet');
    expect(cleanWalletProviderName('⚡ Revolut X')).toBe('Revolut X');
    expect(cleanWalletProviderName('🔒 Ledger')).toBe('Ledger');
    expect(cleanWalletProviderName('  Trust Wallet  ')).toBe('Trust Wallet');
    expect(cleanWalletProviderName('')).toBe('Wallet');
  });

  it('sanitizeCryptoWallets eliminates duplicate wallet entries for the same address/network', () => {
    const rawWallets: CryptoWalletPocket[] = [
      {
        id: 'w1',
        walletName: '🛡️ Trust Wallet (BSC)',
        institution: '🛡️ Trust Wallet',
        publicAddress: '0x1234567890abcdef1234567890abcdef12345678',
        network: 'BSC',
        quantity: 4.18278093,
        avgPrice: 528.22,
      },
      {
        id: 'w2',
        walletName: 'Trust Wallet (BSC)',
        institution: 'Trust Wallet',
        publicAddress: '0x1234567890abcdef1234567890abcdef12345678',
        network: 'BSC',
        quantity: 4.18278093,
        avgPrice: 528.22,
      },
      {
        id: 'w3',
        walletName: 'Trust Wallet (BSC)',
        institution: '🛡️ Trust Wallet',
        publicAddress: '0x1234567890abcdef1234567890abcdef12345678',
        network: 'BSC',
        quantity: 4.18278093,
        avgPrice: 528.22,
      },
    ];

    const cleaned = sanitizeCryptoWallets(rawWallets);
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0].quantity).toBe(4.18278093);
    expect(cleaned[0].institution).toBe('Trust Wallet');
  });

  it('sanitizeCryptoPosition heals position quantity and deduplicates wallets', () => {
    const corruptedPosition: Position = {
      id: 'crypto-bnb',
      ticker: 'BNB-EUR',
      name: 'BNB (Binance Coin)',
      envelope: 'CRYPTO',
      assetType: 'CRYPTO',
      currency: 'EUR',
      quantity: 12.54834279, // Inflated due to 3 duplicate entries of 4.18278093
      avgPrice: 528.22,
      currentPrice: 530.00,
      institutionName: '🛡️ Trust Wallet',
      cryptoWallets: [
        {
          id: 'w1',
          walletName: 'Trust Wallet',
          institution: '🛡️ Trust Wallet',
          publicAddress: '0x1234567890abcdef1234567890abcdef12345678',
          network: 'BSC',
          quantity: 4.18278093,
          avgPrice: 528.22,
        },
        {
          id: 'w2',
          walletName: 'Trust Wallet',
          institution: 'Trust Wallet',
          publicAddress: '0x1234567890abcdef1234567890abcdef12345678',
          network: 'BSC',
          quantity: 4.18278093,
          avgPrice: 528.22,
        },
        {
          id: 'w3',
          walletName: 'Trust Wallet',
          institution: '🛡️ Trust Wallet',
          publicAddress: '0x1234567890abcdef1234567890abcdef12345678',
          network: 'BSC',
          quantity: 4.18278093,
          avgPrice: 528.22,
        },
      ],
      updatedAt: Date.now(),
    };

    const healed = sanitizeCryptoPosition(corruptedPosition);
    expect(healed.cryptoWallets).toHaveLength(1);
    expect(healed.quantity).toBe(4.18278093);
    expect(healed.institutionName).toBe('Trust Wallet');
  });

  it('resolveAssetLogo returns official HD CoinGecko logos for BNB, BTC, ETH, SOL and handles -EUR suffix', () => {
    const bnb = resolveAssetLogo('BNB-EUR', 'Binance Coin', 'CRYPTO');
    expect(bnb.url).toContain('coingecko.com');
    expect(bnb.url).toContain('bnb');

    const btc = resolveAssetLogo('BTC-EUR', 'Bitcoin', 'CRYPTO');
    expect(btc.url).toContain('coingecko.com');
    expect(btc.url).toContain('bitcoin');

    const eth = resolveAssetLogo('ETH-EUR', 'Ethereum', 'CRYPTO');
    expect(eth.url).toContain('coingecko.com');
    expect(eth.url).toContain('ethereum');

    const sol = resolveAssetLogo('SOL-EUR', 'Solana', 'CRYPTO');
    expect(sol.url).toContain('coingecko.com');
    expect(sol.url).toContain('solana');
  });

  it('calibratePRUFromTotalInvested accurately calculates unit PRU from total invested budget', () => {
    const result = calibratePRUFromTotalInvested(4.18278093, 2200);
    expect(result.totalCostEUR).toBe(2200);
    expect(result.avgPrice).toBeCloseTo(525.965, 2);
  });
});

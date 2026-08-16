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

  it('resolveAssetLogo returns official company/fund logos for stocks/ETFs even when a broker is assigned', () => {
    // 1. Amundi ETF held on Trade Republic
    const pust = resolveAssetLogo('PUST.PA', 'Amundi Nasdaq-100', 'PEA', 'Trade Republic');
    expect(pust.url).toContain('amundi.com');

    // 2. Microsoft held on IBKR
    const msft = resolveAssetLogo('MSFT', 'Microsoft Corporation', 'CTO', 'IBKR');
    expect(msft.url).toContain('microsoft.com');

    // 3. ServiceNow held on IBKR
    const now = resolveAssetLogo('NOW', 'ServiceNow, Inc.', 'CTO', 'IBKR');
    expect(now.url).toContain('servicenow.com');

    // 4. Indépendance Europe Small held on BoursoBank
    const ies = resolveAssetLogo('0P0001DKPM.F', 'Indépendance Europe Small', 'PEA-PME', 'BoursoBank');
    expect(ies.url).toContain('independance-am.com');

    // 5. Memscap & Riber
    const mems = resolveAssetLogo('MEMS.PA', 'Memscap', 'PEA-PME');
    expect(mems.url).toContain('memscap.com');

    const riber = resolveAssetLogo('ALRIB.PA', 'Riber', 'PEA-PME');
    expect(riber.url).toContain('riber.com');

    // 6. Savings account (Livret A) held on BoursoBank -> uses BoursoBank
    const livret = resolveAssetLogo(undefined, 'Livret A', 'LIVRET', 'BoursoBank');
    expect(livret.url).toContain('boursobank.com');
  });
});

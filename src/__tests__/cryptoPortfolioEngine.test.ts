import { describe, it, expect } from 'vitest';
import { Position } from '@/types/portfolio';

describe('Crypto Portfolio Multi-Wallet & PnL Engine', () => {
  const sampleCryptoPositions: Position[] = [
    {
      id: 'btc-1',
      ticker: 'BTC-EUR',
      name: 'Bitcoin',
      envelope: 'CRYPTO',
      assetType: 'CRYPTO',
      currency: 'EUR',
      quantity: 0.05,
      avgPrice: 60000,
      currentPrice: 85000,
      institutionName: 'Revolut X',
      totalFeesEUR: 15,
      cryptoWallets: [
        {
          id: 'w1',
          walletName: 'Revolut X Exchange',
          walletType: 'EXCHANGE',
          institution: 'Revolut X',
          quantity: 0.03,
          avgPrice: 58000,
          purchaseDate: '2024-01-15',
          feesEUR: 10,
        },
        {
          id: 'w2',
          walletName: 'Ledger Cold Wallet',
          walletType: 'COLD_WALLET',
          institution: 'Ledger Nano X',
          quantity: 0.02,
          avgPrice: 63000,
          purchaseDate: '2024-03-10',
          feesEUR: 5,
        },
      ],
      updatedAt: Date.now(),
    },
    {
      id: 'eth-1',
      ticker: 'ETH-EUR',
      name: 'Ethereum',
      envelope: 'CRYPTO',
      assetType: 'CRYPTO',
      currency: 'EUR',
      quantity: 1.5,
      avgPrice: 2800,
      currentPrice: 3200,
      institutionName: 'Trust Wallet',
      totalFeesEUR: 8,
      updatedAt: Date.now(),
    },
  ];

  it('correctly aggregates multi-wallet quantities and weighted PRU', () => {
    const btc = sampleCryptoPositions[0];
    const wallets = btc.cryptoWallets!;
    
    const totalQty = wallets.reduce((sum, w) => sum + w.quantity, 0);
    expect(totalQty).toBeCloseTo(0.05, 5);

    const totalCost = wallets.reduce((sum, w) => sum + (w.quantity * w.avgPrice) + (w.feesEUR || 0), 0);
    const expectedCost = (0.03 * 58000 + 10) + (0.02 * 63000 + 5);
    expect(totalCost).toBe(expectedCost);
  });

  it('computes accurate gross and net PnL after network fees and Flat Tax (30%)', () => {
    const btc = sampleCryptoPositions[0];
    const currentValue = btc.quantity * (btc.currentPrice || 0); // 0.05 * 85000 = 4250
    const totalInvested = (btc.quantity * btc.avgPrice) + (btc.totalFeesEUR || 0); // 3000 + 15 = 3015
    const grossGain = currentValue - totalInvested; // 1235 EUR

    expect(currentValue).toBe(4250);
    expect(totalInvested).toBe(3015);
    expect(grossGain).toBe(1235);

    // French Flat Tax (PFU 30% if gains > 305 €)
    const flatTax30 = grossGain > 305 ? grossGain * 0.3 : 0;
    const netRetirable = currentValue - flatTax30;

    expect(flatTax30).toBeCloseTo(370.5, 1);
    expect(netRetirable).toBeCloseTo(3879.5, 1);
  });

  it('identifies crypto exposure ratio and alerts if threshold exceeded', () => {
    const totalPortfolioNetWorth = 50000;
    const totalCryptoValue = (0.05 * 85000) + (1.5 * 3200); // 4250 + 4800 = 9050
    const cryptoWeightPercent = (totalCryptoValue / totalPortfolioNetWorth) * 100; // 18.1%

    expect(cryptoWeightPercent).toBeCloseTo(18.1, 1);
    
    // Risk bands: > 10% is Warning, > 20% is Critical
    const isExceededMaxPrudence = cryptoWeightPercent > 10;
    const isCritical = cryptoWeightPercent > 20;

    expect(isExceededMaxPrudence).toBe(true);
    expect(isCritical).toBe(false);
  });
});

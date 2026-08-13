import { describe, it, expect } from 'vitest';
import { computeSavingsPositionInterest } from '@/engines/savingsInterestEngine';
import type { Position } from '@/types/portfolio';

describe('savingsInterestEngine', () => {
  it('computes Livret A interest conforming to the French Règle des Quinzaines', () => {
    const livretPos: Position = {
      id: 'pos-livret',
      ticker: 'LIVRET-A',
      name: 'Livret A',
      envelope: 'LIVRET',
      assetType: 'CASH',
      quantity: 1,
      avgPrice: 10000, // 10 000 € initial
      currency: 'EUR',
      interestRateOverride: 0.03, // 3%
      dcaStartDate: '2024-01-01',
      monthlyDCA: 0,
    };

    // Evaluate 1 year later (2025-01-01)
    const result = computeSavingsPositionInterest(livretPos, new Date('2025-01-01'));

    expect(result.isQuinzaineRule).toBe(true);
    expect(result.legalCap).toBe(22950);
    expect(result.principalDeposited).toBe(10000);

    // 10 000 € at 3% = 300 € of annual interest
    expect(result.interestEarnedToDate).toBeCloseTo(300, -1);
    expect(result.isCapExceeded).toBe(false);
  });

  it('enforces legal deposit caps on Livret A and LEP', () => {
    const fullLepPos: Position = {
      id: 'pos-lep',
      ticker: 'LEP',
      name: 'Livret Épargne Populaire',
      envelope: 'LEP',
      assetType: 'CASH',
      quantity: 1,
      avgPrice: 10000, // At legal cap (10 000 €)
      currency: 'EUR',
      interestRateOverride: 0.04, // 4%
      dcaStartDate: '2024-01-01',
      monthlyDCA: 500, // Tries to add more
    };

    const result = computeSavingsPositionInterest(fullLepPos, new Date('2024-06-01'));

    expect(result.legalCap).toBe(10000);
    expect(result.isCapExceeded).toBe(true);
    // Principal deposited must not exceed 10 000 € despite monthly DCA
    expect(result.principalDeposited).toBe(10000);
  });

  it('returns initial balance without accrued interest for future start dates', () => {
    const futurePos: Position = {
      id: 'pos-future',
      ticker: 'LIVRET-A',
      name: 'Livret A',
      envelope: 'LIVRET',
      assetType: 'CASH',
      quantity: 1,
      avgPrice: 5000,
      currency: 'EUR',
      dcaStartDate: '2030-01-01',
    };

    const result = computeSavingsPositionInterest(futurePos, new Date('2024-01-01'));
    expect(result.currentBalance).toBe(5000);
    expect(result.interestEarnedToDate).toBe(0);
    expect(result.quinzainesCount).toBe(0);
  });
});

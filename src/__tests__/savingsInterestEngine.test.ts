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

  it('correctly simulates historical monthly DCA on Livret A from 2024 with quinzaines and capitalization', () => {
    const livretDcaPos: Position = {
      id: 'pos-livret-dca',
      ticker: 'LIVRET-A',
      name: 'Livret A',
      envelope: 'LIVRET',
      assetType: 'CASH',
      quantity: 1,
      avgPrice: 0, // 0 € initial capital
      currency: 'EUR',
      interestRateOverride: 0.03, // 3%
      dcaStartDate: '2024-01-01',
      monthlyDCA: 200, // 200 € / month
    };

    // Evaluate in August 2026 (31 completed months: 12 in 2024 + 12 in 2025 + 7 in 2026)
    const result = computeSavingsPositionInterest(livretDcaPos, new Date('2026-08-15'));

    expect(result.isQuinzaineRule).toBe(true);
    expect(result.principalDeposited).toBe(6200); // 31 months * 200 € = 6 200 €
    expect(result.quinzainesCount).toBeGreaterThanOrEqual(60);
    expect(result.interestEarnedToDate).toBeGreaterThan(240); // ~251.82 €
    expect(result.currentBalance).toBeGreaterThan(6440); // ~6 451.82 €
  });

  it('correctly calculates dynamic interest on ad-hoc free deposits and PEE bonuses without recurring DCA', () => {
    const peePos: Position = {
      id: 'pos-pee-bonuses',
      ticker: 'PEE-AMUNDI',
      name: 'PEE Entreprise',
      envelope: 'PEE',
      assetType: 'FUND',
      quantity: 1,
      avgPrice: 1000, // 1 000 € initial
      initialDepositDate: '2023-01-01',
      currency: 'EUR',
      interestRateOverride: 0.05, // 5% projected return
      monthlyDCA: 0, // No recurring monthly DCA
      depositsHistory: [
        { id: 'dep-1', date: '2023-05-15', amount: 2500, label: 'Prime Intéressement 2023', category: 'PRIME' },
        { id: 'dep-2', date: '2024-05-20', amount: 3000, label: 'Prime Participation 2024', category: 'PRIME' },
        { id: 'dep-3', date: '2024-06-01', amount: 1000, label: 'Abondement Employeur', category: 'ABONDEMENT' },
      ],
    };

    const result = computeSavingsPositionInterest(peePos, new Date('2025-01-01'));

    // Principal deposited: 1000 initial + 2500 + 3000 + 1000 = 7 500 €
    expect(result.principalDeposited).toBe(7500);
    // Interest earned should be strictly positive and compound from each deposit's specific date
    expect(result.interestEarnedToDate).toBeGreaterThan(350);
    expect(result.currentBalance).toBeGreaterThan(7850);
  });

  it('correctly applies French quinzaine rule to ad-hoc deposits on Livret A', () => {
    const livretAdHoc: Position = {
      id: 'pos-livret-adhoc',
      ticker: 'LIVRET-A',
      name: 'Livret A Adhoc',
      envelope: 'LIVRET',
      assetType: 'CASH',
      quantity: 1,
      avgPrice: 0,
      currency: 'EUR',
      interestRateOverride: 0.03, // 3%
      depositsHistory: [
        { id: 'd1', date: '2024-01-10', amount: 4000, label: 'Virement 1' }, // day 10 -> interest starts Jan 16 (Q2)
        { id: 'd2', date: '2024-01-20', amount: 2000, label: 'Virement 2' }, // day 20 -> interest starts Feb 1 (Q1)
      ],
    };

    // Evaluated at start of next year 2025-01-01 (when all 2024 quinzaines completed)
    const result = computeSavingsPositionInterest(livretAdHoc, new Date('2025-01-01'));

    expect(result.principalDeposited).toBe(6000);
    // 4000 € earned for 23 quinzaines: 4000 * (0.03/24) * 23 = 115 €
    // 2000 € earned for 22 quinzaines: 2000 * (0.03/24) * 22 = 55 €
    // Total interest = 170 €
    expect(result.interestEarnedToDate).toBeCloseTo(170, 0);
  });
});

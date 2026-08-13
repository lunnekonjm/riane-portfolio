import { describe, it, expect } from 'vitest';
import {
  getEffectiveTaxRate,
  applyFrenchTax,
  runMonteCarloSimulation,
} from '@/engines/monteCarloEngine';

describe('monteCarloEngine', () => {
  it('computes correct French tax rates across envelopes', () => {
    // CTO is subject to 31.4% Flat Tax / PFU
    expect(getEffectiveTaxRate('CTO', 100000)).toBe(0.314);

    // PEA under 150k deposit cap is subject only to 18.6% PS
    expect(getEffectiveTaxRate('PEA', 100000)).toBe(0.186);

    // PEA exceeding 150k deposit cap mixes 18.6% PS on 150k and 31.4% CTO on overflow
    const overflowInvested = 300000;
    const rateOverflow = getEffectiveTaxRate('PEA', overflowInvested);
    // (150k * 0.186 + 150k * 0.314) / 300k = 0.25
    expect(rateOverflow).toBeCloseTo(0.25, 2);
  });

  it('applies French tax exclusively to the capital gain portion', () => {
    const grossWealth = 200000;
    const totalInvested = 100000; // Gain = 100 000 €
    const taxRate = 0.30; // 30% Flat Tax

    const netWealth = applyFrenchTax(grossWealth, totalInvested, taxRate);
    // Tax = 100 000 * 30% = 30 000 € -> Net = 170 000 €
    expect(netWealth).toBe(170000);

    // No tax on capital loss
    const lossWealth = 80000;
    expect(applyFrenchTax(lossWealth, totalInvested, taxRate)).toBe(80000);
  });

  it('runs Monte Carlo simulation with consistent percentile ordering', () => {
    const result = runMonteCarloSimulation({
      initialCapital: 10000,
      monthlyDCA: 500,
      horizonYears: 10,
      annualReturnMean: 0.08,
      annualVolatility: 0.15,
      inflationRate: 0.02,
      numSimulations: 500,
      taxEnvelope: 'PEA',
    });

    expect(result.horizonYears).toBe(10);
    expect(result.numSimulations).toBe(500);
    expect(result.totalInvestedFinal).toBe(10000 + 500 * 120); // 70 000 €

    // Statistical percentiles must be strictly non-decreasing: P1 <= P10 <= P50 <= P90
    expect(result.finalP1).toBeLessThanOrEqual(result.finalP10);
    expect(result.finalP10).toBeLessThanOrEqual(result.finalP50);
    expect(result.finalP50).toBeLessThanOrEqual(result.finalP90);

    // Net wealth after tax must be <= gross wealth
    expect(result.finalP50Net).toBeLessThanOrEqual(result.finalP50);

    // Passive income based on 4% rule
    expect(result.monthlyPassiveIncomeP50Gross).toBeCloseTo((result.finalP50 * 0.04) / 12, 0);
    expect(result.monthlyPassiveIncomeP50Net).toBeCloseTo((result.finalP50Net * 0.04) / 12, 0);

    // Milestone probabilities must be non-empty and between 0 and 100
    expect(result.targetMilestones.length).toBeGreaterThan(0);
    result.targetMilestones.forEach((m) => {
      expect(m.successProbability).toBeGreaterThanOrEqual(0);
      expect(m.successProbability).toBeLessThanOrEqual(100);
    });
  });
});

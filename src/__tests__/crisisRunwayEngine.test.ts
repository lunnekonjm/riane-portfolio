import { describe, it, expect } from 'vitest';
import {
  computeCrisisRunwayMetrics,
  simulateLifeAccident,
  compareFinancingOptions,
} from '../engines/crisisRunwayEngine';

describe('CrisisRunwayEngine', () => {
  it('should compute emergency runway in months correctly', () => {
    const metrics = computeCrisisRunwayMetrics({
      emergencySavings: 6000,
      vitalExpenses: 1200,
      discretionaryExpenses: 400,
      targetMonths: 6,
    });

    expect(metrics.runwayMonths).toBe(5); // 6000 / 1200
    expect(metrics.targetBuffer6Months).toBe(7200); // 1200 * 6
    expect(metrics.bufferFillRatioPercent).toBe(83); // 6000 / 7200
    expect(metrics.safetyStatus).toBe('COMFORTABLE');
  });

  it('should classify < 1 month runway as CRITICAL and trigger alerts', () => {
    const metrics = computeCrisisRunwayMetrics({
      emergencySavings: 800,
      vitalExpenses: 1200,
      targetMonths: 6,
    });

    expect(metrics.runwayMonths).toBe(0.7);
    expect(metrics.safetyStatus).toBe('CRITICAL');
    expect(metrics.recommendations[0]).toContain('URGENCE');
  });

  it('should simulate life accident and recalculate post-shock runway', () => {
    const simulation = simulateLifeAccident({
      currentEmergencySavings: 5000,
      vitalMonthlyExpenses: 1000,
      emergencyExpense: 3000,
      cashPayment: 2000,
      creditMonths: 10,
    });

    expect(simulation.cashContribution).toBe(2000);
    expect(simulation.financedAmount).toBe(1000);
    expect(simulation.postAccidentAvailableSavings).toBe(3000);
    expect(simulation.postAccidentRunwayMonths).toBe(3);
    expect(simulation.isReserveExhausted).toBe(false);
  });

  it('should compare financing options and calculate interest for personal credit', () => {
    const comparison = compareFinancingOptions({
      totalCost: 2900,
      cashUpfront: 500,
      durationMonths: 12,
      taegPercent: 5.9,
      monthlyIncome: 2861.26,
      currentSavings: 1600,
    });

    expect(comparison.remainingAmount).toBe(2400);
    expect(comparison.noFeeOption.monthlyPayment).toBe(200);
    expect(comparison.personalCreditOption.totalInterest).toBeGreaterThan(0);
    expect(comparison.cashOption.isDangerous).toBe(true); // 2900 > 1600 * 0.5
    expect(comparison.recommendedOptionIndex).toBe(1); // 0% split recommended
  });
});

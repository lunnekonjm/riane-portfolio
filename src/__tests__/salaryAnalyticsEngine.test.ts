import { describe, it, expect } from 'vitest';
import {
  computeDetailedSalaryAnalytics,
  formatSalaryPeriodLabel,
  getActiveBaselineSalary,
  calculateRegularNet,
  calculatePurchasingPower,
} from '../engines/salaryAnalyticsEngine';
import { SalaryRecord } from '../types/revenue';

describe('SalaryAnalyticsEngine', () => {
  const sampleRecords: SalaryRecord[] = [
    {
      id: 'rec-2025-12',
      period: '2025-12',
      periodLabel: 'Décembre 2025',
      netSalary: 3500,
      grossSalary: 4500,
      socialContributions: -1000,
      incomeTaxRatePercent: 8,
      regularInvestableAmount: 500,
      bonusReserveContribution: 400,
      bonusAmount: 500,
      bonusNet: 395.1,
      savingsRate: 16.6,
      source: 'manual',
      createdAt: 1735600000000,
      updatedAt: 1735600000000,
    },
    {
      id: 'rec-2026-06',
      period: '2026-06',
      periodLabel: 'Juin 2026',
      netSalary: 2861.26,
      grossSalary: 3800,
      socialContributions: -840,
      incomeTaxRatePercent: 8.5,
      regularInvestableAmount: 500,
      bonusReserveContribution: 0,
      savingsRate: 17.5,
      source: 'manual',
      createdAt: 1751300000000,
      updatedAt: 1751300000000,
    },
    {
      id: 'rec-2026-07',
      period: '2026-07',
      periodLabel: 'Juillet 2026',
      netSalary: 2900,
      grossSalary: 3850,
      socialContributions: -850,
      incomeTaxRatePercent: 8.5,
      regularInvestableAmount: 500,
      bonusReserveContribution: 0,
      savingsRate: 17.2,
      source: 'manual',
      createdAt: 1753900000000,
      updatedAt: 1753900000000,
    },
  ];

  it('should format period label correctly in French', () => {
    expect(formatSalaryPeriodLabel('2026-08')).toBe('Août 2026');
    expect(formatSalaryPeriodLabel('2025-01')).toBe('Janvier 2025');
  });

  it('should resolve the active baseline salary chronologically descending', () => {
    const active = getActiveBaselineSalary(sampleRecords);
    expect(active?.period).toBe('2026-07');
  });

  it('should calculate regular net excluding extra bonus', () => {
    const regularNet = calculateRegularNet(sampleRecords[0]); // 3500 net with 395.1 bonusNet
    expect(Math.round(regularNet)).toBe(3105);
  });

  it('should calculate purchasing power adding employer benefits', () => {
    const withEmployerTickets = {
      ...sampleRecords[1],
      mealTicketsEmployer: 80,
    } as any;
    expect(calculatePurchasingPower(withEmployerTickets)).toBe(2941.26);
  });

  it('should group analytics by year and calculate multi-year trends', () => {
    const analytics = computeDetailedSalaryAnalytics(sampleRecords, [{ id: 'a1', date: '2025-12-15', amount: 100, envelope: 'PEA', createdAt: 0 }]);
    expect(analytics.totalRecordsCount).toBe(3);
    expect(analytics.yearlySummaries.length).toBe(2);
    expect(analytics.yearlySummaries[0].year).toBe(2026);
    expect(analytics.yearlySummaries[1].year).toBe(2025);
    expect(analytics.totalReserveBalanceAvailable).toBe(300); // 400 accrued - 100 allocated
  });
});

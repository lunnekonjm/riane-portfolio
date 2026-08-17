import { describe, it, expect } from 'vitest';
import { computeDcaBreakdown } from '@/utils/dcaBreakdown';
import type { Position } from '@/types/portfolio';

describe('computeDcaBreakdown', () => {
  it('should compute zero for empty portfolio', () => {
    const res = computeDcaBreakdown([]);
    expect(res.monthlySum).toBe(0);
    expect(res.totalAnnualCumulative).toBe(0);
    expect(res.monthlyEquivalent).toBe(0);
  });

  it('should aggregate multi-frequency DCA correctly', () => {
    const mockPositions: Position[] = [
      { id: '1', ticker: 'GPEA', name: 'PEA World', envelope: 'PEA', assetClass: 'Bourse', currency: 'EUR', quantity: 10, avgPrice: 10, targetWeight: 0.5, monthlyDCA: 800, dcaFrequency: 'monthly' },
      { id: '2', ticker: 'COHR', name: 'Coherent', envelope: 'CTO', assetClass: 'Bourse', currency: 'USD', quantity: 5, avgPrice: 50, targetWeight: 0.1, annualBudget: 2400, dcaFrequency: 'annual' },
      { id: '3', ticker: 'BTC', name: 'Bitcoin', envelope: 'Crypto', assetClass: 'Crypto', currency: 'USD', quantity: 0.1, avgPrice: 50000, targetWeight: 0.2, monthlyDCA: 300, dcaFrequency: 'quarterly' },
    ];

    const res = computeDcaBreakdown(mockPositions);

    // Monthly: 800 * 12 = 9600
    // Annual: 2400
    // Quarterly: (300 * 3) * 4 = 3600
    // Total Annual Cumulative = 9600 + 2400 + 3600 = 15600
    // Monthly Equivalent = 15600 / 12 = 1300
    expect(res.monthlySum).toBe(800);
    expect(res.annualSum).toBe(2400);
    expect(res.quarterlySum).toBe(900);
    expect(res.totalAnnualCumulative).toBe(15600);
    expect(res.monthlyEquivalent).toBe(1300);
    expect(res.activeFrequenciesCount).toBe(3);
  });
});

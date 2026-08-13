import { describe, it, expect } from 'vitest';
import {
  calculateSmartFlowRebalance,
  calculateActiveRebalance,
  isDueThisMonth,
  monthsBetweenPurchases,
  calculateMonthlyInvestmentPlan,
} from '@/engines/flowRebalancer';
import type { Position } from '@/types/portfolio';

describe('flowRebalancer Engine', () => {
  const mockPositions: Position[] = [
    {
      id: 'pos-gpea',
      ticker: 'GPEA.PA',
      name: 'BNP Easy S&P 500',
      envelope: 'PEA',
      assetType: 'ETF',
      quantity: 100,
      avgPrice: 5.0,
      currentPrice: 5.0,
      currency: 'EUR',
      targetWeight: 0.6, // 60% target
      monthlyDCA: 600,
      themes: ['core'],
    },
    {
      id: 'pos-pust',
      ticker: 'PUST.PA',
      name: 'Amundi Nasdaq-100',
      envelope: 'PEA',
      assetType: 'ETF',
      quantity: 50,
      avgPrice: 10.0,
      currentPrice: 10.0,
      currency: 'EUR',
      targetWeight: 0.4, // 40% target
      monthlyDCA: 400,
      themes: ['tech'],
    },
  ];

  it('allocates new cash towards underweight positions without selling', () => {
    // Current state: GPEA = 100 * 5 = 500 € (50%), PUST = 50 * 10 = 500 € (50%)
    // Targets: GPEA = 60%, PUST = 40% -> GPEA is underweight (50% < 60%)
    const result = calculateSmartFlowRebalance(mockPositions, 500, { EUR: 1.0, USD: 0.92 });

    expect(result.totalDCA).toBe(500);
    expect(result.totalSpent).toBeLessThanOrEqual(500);
    expect(result.uninvestedCash).toBeGreaterThanOrEqual(0);

    // GPEA should receive more purchases than PUST to reduce the gap
    const gpeaInstruction = result.instructions.find((i) => i.ticker === 'GPEA.PA');
    const pustInstruction = result.instructions.find((i) => i.ticker === 'PUST.PA');

    expect(gpeaInstruction?.recommendedShares).toBeGreaterThan(0);
    expect(gpeaInstruction?.recommendedCost).toBeGreaterThan(pustInstruction?.recommendedCost || 0);
  });

  it('handles PEA 150k ceiling overflow to CTO', () => {
    // Large PEA positions near 150k limit
    const nearFullPositions: Position[] = [
      {
        id: 'pos-gpea',
        ticker: 'GPEA.PA',
        name: 'BNP Easy S&P 500',
        envelope: 'PEA',
        assetType: 'ETF',
        quantity: 29990,
        avgPrice: 5.0, // 149 950 € invested
        currentPrice: 5.0,
        currency: 'EUR',
        targetWeight: 1.0,
        monthlyDCA: 1000,
        themes: ['core'],
      },
    ];

    const result = calculateSmartFlowRebalance(nearFullPositions, 500, { EUR: 1.0, USD: 0.92 });
    const gpeaInstruction = result.instructions.find((i) => i.ticker === 'GPEA.PA');

    // Should indicate CTO overflow once 150k is crossed
    expect(gpeaInstruction?.envelope).toContain('CTO');
  });

  it('calculates active rebalance instructions with SELL and BUY', () => {
    // GPEA target 50%, actual 80% (800€). PUST target 50%, actual 20% (200€). Total 1000€.
    const skewedPositions: Position[] = [
      {
        id: 'pos-gpea',
        ticker: 'GPEA.PA',
        name: 'GPEA',
        envelope: 'PEA',
        assetType: 'ETF',
        quantity: 160,
        avgPrice: 5.0,
        currentPrice: 5.0, // 800 €
        currency: 'EUR',
        targetWeight: 0.5,
        themes: ['core'],
      },
      {
        id: 'pos-pust',
        ticker: 'PUST.PA',
        name: 'PUST',
        envelope: 'PEA',
        assetType: 'ETF',
        quantity: 20,
        avgPrice: 10.0,
        currentPrice: 10.0, // 200 €
        currency: 'EUR',
        targetWeight: 0.5,
        themes: ['tech'],
      },
    ];

    const result = calculateActiveRebalance(skewedPositions, { EUR: 1.0, USD: 0.92 });

    const gpea = result.instructions.find((i) => i.ticker === 'GPEA.PA');
    const pust = result.instructions.find((i) => i.ticker === 'PUST.PA');

    expect(gpea?.action).toBe('SELL');
    expect(gpea?.deltaShares).toBeLessThan(0);

    expect(pust?.action).toBe('BUY');
    expect(pust?.deltaShares).toBeGreaterThan(0);
  });

  it('correctly calculates frequency cycles and due months', () => {
    expect(monthsBetweenPurchases('monthly')).toBe(1);
    expect(monthsBetweenPurchases('quarterly')).toBe(3);
    expect(monthsBetweenPurchases('semestrial')).toBe(6);
    expect(monthsBetweenPurchases('annual')).toBe(12);

    // Quarterly: due in March (3), June (6), Sept (9), Dec (12)
    expect(isDueThisMonth('quarterly', 3)).toBe(true);
    expect(isDueThisMonth('quarterly', 6)).toBe(true);
    expect(isDueThisMonth('quarterly', 7)).toBe(false);

    // Semestrial: due in June (6), Dec (12)
    expect(isDueThisMonth('semestrial', 6)).toBe(true);
    expect(isDueThisMonth('semestrial', 12)).toBe(true);
    expect(isDueThisMonth('semestrial', 3)).toBe(false);

    // Annual: due in Dec (12)
    expect(isDueThisMonth('annual', 12)).toBe(true);
    expect(isDueThisMonth('annual', 6)).toBe(false);
  });

  it('calculates monthly investment plan with accumulating cash', () => {
    const multiFreqPositions: Position[] = [
      {
        id: 'pos-1',
        ticker: 'GPEA.PA',
        name: 'GPEA',
        envelope: 'PEA',
        assetType: 'ETF',
        quantity: 100,
        avgPrice: 5.0,
        currentPrice: 5.0,
        currency: 'EUR',
        targetWeight: 0.7,
        dcaFrequency: 'monthly',
        themes: ['core'],
      },
      {
        id: 'pos-2',
        ticker: 'ALRIB.PA',
        name: 'Riber',
        envelope: 'PEA-PME',
        assetType: 'STOCK',
        quantity: 50,
        avgPrice: 2.0,
        currentPrice: 2.0,
        currency: 'EUR',
        targetWeight: 0.3,
        dcaFrequency: 'quarterly', // Due in month 3, 6, 9, 12
        themes: ['semiconductors'],
      },
    ];

    // In month 2 (February, not due for quarterly):
    const planFeb = calculateMonthlyInvestmentPlan(multiFreqPositions, 1000, 2);
    expect(planFeb.accumulating.length).toBe(1);
    expect(planFeb.accumulating[0].ticker).toBe('ALRIB.PA');
    expect(planFeb.accumulating[0].monthlyShare).toBeCloseTo(300, 0);
    expect(planFeb.dueThisMonth.instructions.find((i) => i.ticker === 'GPEA.PA')).toBeDefined();
  });
});

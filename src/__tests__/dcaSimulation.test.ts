import { describe, it, expect } from 'vitest';
import { calculateDCAFromPriceMap } from '@/engines/dcaSimulation';

describe('dcaSimulation Engine', () => {
  const months = ['2023-01', '2023-02', '2023-03', '2023-04'];
  const priceMap = new Map<string, number>([
    ['2023-01', 5.0],
    ['2023-02', 5.2],
    ['2023-03', 4.8],
    ['2023-04', 5.0],
  ]);

  it('respects integer share constraints on PEA envelope', () => {
    const result = calculateDCAFromPriceMap(
      months,
      priceMap,
      200, // 200 € / month
      5.0,
      true, // isIntegerOnly
      'monthly',
      1
    );

    expect(result.totalShares).toBeGreaterThan(0);
    // Total shares must be a strictly integer number
    expect(Number.isInteger(result.totalShares)).toBe(true);
    expect(result.uninvestedCash).toBeGreaterThanOrEqual(0);
    expect(result.monthsCount).toBe(4);
    expect(result.logs.length).toBe(4);

    // In 2023-01: 200 / 5.0 = 40 shares, 0 cash left
    expect(result.logs[0].sharesBought).toBe(40);
    expect(result.logs[0].spent).toBe(200);
    expect(result.logs[0].rolloverCash).toBe(0);

    // In 2023-02: 200 / 5.2 = 38 shares = 197.6 € spent, 2.4 € rollover
    expect(result.logs[1].sharesBought).toBe(38);
    expect(result.logs[1].spent).toBe(197.6);
    expect(result.logs[1].rolloverCash).toBeCloseTo(2.4, 1);
  });

  it('handles non-monthly DCA deposit frequencies (quarterly)', () => {
    const result = calculateDCAFromPriceMap(
      months,
      priceMap,
      300, // 300 € budget on due months
      5.0,
      true,
      'quarterly',
      1 // Due in Jan (01), Apr (04)
    );

    // Jan (month 1, due): spends cash
    expect(result.logs[0].monthlyBudget).toBe(300);
    expect(result.logs[0].sharesBought).toBe(60); // 300 / 5.0 = 60

    // Feb (month 2, not due): budget is 0, sharesBought is 0
    expect(result.logs[1].monthlyBudget).toBe(0);
    expect(result.logs[1].sharesBought).toBe(0);

    // Mar (month 3, not due): budget is 0, sharesBought is 0
    expect(result.logs[2].monthlyBudget).toBe(0);
    expect(result.logs[2].sharesBought).toBe(0);

    // Apr (month 4, due): budget is 300, sharesBought = 60 (300 / 5.0)
    expect(result.logs[3].monthlyBudget).toBe(300);
    expect(result.logs[3].sharesBought).toBe(60);
  });

  it('handles uninvested cash buffer prior to asset inception date', () => {
    const result = calculateDCAFromPriceMap(
      months,
      priceMap,
      200,
      5.0,
      true,
      'monthly',
      1,
      '2023-03' // Asset created only in March 2023
    );

    // Jan and Feb are pre-inception: 0 shares, 200 + 200 = 400 € accumulated
    expect(result.logs[0].sharesBought).toBe(0);
    expect(result.logs[0].rolloverCash).toBe(200);
    expect(result.logs[1].sharesBought).toBe(0);
    expect(result.logs[1].rolloverCash).toBe(400);

    // Mar: Cash available = 400 + 200 = 600 €. Price = 4.8 €. Shares = floor(600 / 4.8) = 125 shares (600 €)
    expect(result.logs[2].cashAvailable).toBe(600);
    expect(result.logs[2].sharesBought).toBe(125);
    expect(result.logs[2].spent).toBe(600);
  });

  it('supports multi-tier historical DCA tranches (e.g. 500€ then 300€)', () => {
    const result = calculateDCAFromPriceMap(
      months, // ['2023-01', '2023-02', '2023-03', '2023-04']
      priceMap,
      0, // default fallback budget
      5.0,
      true,
      'monthly',
      1,
      null,
      [
        { id: 'tr1', startDate: '2023-01-01', endDate: '2023-02-28', amount: 500 }, // Jan & Feb = 500€/m
        { id: 'tr2', startDate: '2023-03-01', endDate: '2023-04-30', amount: 300 }, // Mar & Apr = 300€/m
      ]
    );

    expect(result.logs[0].monthlyBudget).toBe(500); // Jan
    expect(result.logs[1].monthlyBudget).toBe(500); // Feb
    expect(result.logs[2].monthlyBudget).toBe(300); // Mar
    expect(result.logs[3].monthlyBudget).toBe(300); // Apr
  });

  it('supports ad-hoc personal contributions (depositsHistory) combined with DCA', () => {
    const result = calculateDCAFromPriceMap(
      months, // ['2023-01', '2023-02', '2023-03', '2023-04']
      priceMap, // Jan: 5.0, Feb: 5.2, Mar: 4.8, Apr: 5.0
      200, // 200€ / month regular DCA
      5.0,
      true,
      'monthly',
      1,
      null,
      undefined,
      [
        { id: 'dep1', date: '2023-02-15', amount: 1000, label: 'Prime annuelle' },
        { id: 'dep2', date: '2023-04-10', amount: 500, label: 'Apport exceptionnel' },
      ]
    );

    // Jan: 200€ regular DCA => 40 shares @ 5.0€
    expect(result.logs[0].monthlyBudget).toBe(200);
    expect(result.logs[0].sharesBought).toBe(40);

    // Feb: 200€ DCA + 1000€ prime = 1200€ cash => floor(1200 / 5.2) = 230 shares (1196€ spent, 4€ rollover)
    expect(result.logs[1].monthlyBudget).toBe(1200);
    expect(result.logs[1].sharesBought).toBe(230);
    expect(result.logs[1].spent).toBe(1196);
    expect(result.logs[1].rolloverCash).toBeCloseTo(4.0, 1);

    // Mar: 200€ regular DCA + 4€ rollover = 204€ => floor(204 / 4.8) = 42 shares (201.6€ spent, 2.4€ rollover)
    expect(result.logs[2].monthlyBudget).toBe(200);
    expect(result.logs[2].cashAvailable).toBeCloseTo(204.0, 1);
    expect(result.logs[2].sharesBought).toBe(42);

    // Apr: 200€ DCA + 500€ apport + 2.4€ rollover = 702.4€ => floor(702.4 / 5.0) = 140 shares (700€ spent)
    expect(result.logs[3].monthlyBudget).toBe(700);
    expect(result.logs[3].sharesBought).toBe(140);
    expect(result.logs[3].spent).toBe(700);
  });
});

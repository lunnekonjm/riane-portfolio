import { describe, it, expect } from 'vitest';
import { calculatePortfolioRiskMetrics } from '@/engines/riskAnalytics';
import type { Position } from '@/types/portfolio';

describe('riskAnalytics Engine', () => {
  it('returns safe zeros for empty or zero-value positions', () => {
    const emptyResult = calculatePortfolioRiskMetrics([]);
    expect(emptyResult.totalValueEUR).toBe(0);
    expect(emptyResult.annualVolatility).toBe(0);
    expect(emptyResult.var95EUR).toBe(0);
    expect(emptyResult.estimatedSharpeRatio).toBe(0);
    expect(emptyResult.diversificationScore).toBe(0);
  });

  it('calculates single holding concentration and parametric VaR accurately', () => {
    const singleHolding: Position[] = [
      {
        id: 'pos-1',
        ticker: 'CW8.PA',
        name: 'Amundi MSCI World',
        envelope: 'PEA',
        assetType: 'ETF',
        quantity: 100,
        avgPrice: 500.0,
        currentPrice: 500.0,
        currency: 'EUR',
        targetWeight: 1.0,
        themes: ['core'],
      },
    ];

    const result = calculatePortfolioRiskMetrics(singleHolding, { EUR: 1.0, USD: 0.92 });

    expect(result.totalValueEUR).toBe(50000);
    expect(result.topAssetConcentration).toBe(100.0);
    expect(result.annualVolatility).toBeGreaterThan(0);

    // VaR 95% = Value * Vol * 1.645
    const expectedVar95EUR = 50000 * (result.annualVolatility / 100) * 1.645;
    expect(Math.abs(result.var95EUR - expectedVar95EUR)).toBeLessThan(50);

    // VaR 99% = Value * Vol * 2.326
    const expectedVar99EUR = 50000 * (result.annualVolatility / 100) * 2.326;
    expect(Math.abs(result.var99EUR - expectedVar99EUR)).toBeLessThan(50);

    // VaR 99% must be strictly greater than VaR 95%
    expect(result.var99EUR).toBeGreaterThan(result.var95EUR);
  });

  it('rewards diversification across multiple uncorrelated assets', () => {
    const diversifiedPositions: Position[] = [
      {
        id: 'pos-1',
        ticker: 'CW8.PA',
        name: 'Amundi MSCI World',
        envelope: 'PEA',
        assetType: 'ETF',
        quantity: 20,
        avgPrice: 500,
        currentPrice: 500,
        currency: 'EUR',
        targetWeight: 0.2,
        themes: ['core'],
      },
      {
        id: 'pos-2',
        ticker: 'PUST.PA',
        name: 'Amundi Nasdaq-100',
        envelope: 'PEA',
        assetType: 'ETF',
        quantity: 100,
        avgPrice: 100,
        currentPrice: 100,
        currency: 'EUR',
        targetWeight: 0.2,
        themes: ['tech'],
      },
      {
        id: 'pos-3',
        ticker: 'ALRIB.PA',
        name: 'Riber',
        envelope: 'PEA-PME',
        assetType: 'STOCK',
        quantity: 5000,
        avgPrice: 2,
        currentPrice: 2,
        currency: 'EUR',
        targetWeight: 0.2,
        themes: ['semiconductors'],
      },
      {
        id: 'pos-4',
        ticker: 'MEMS.PA',
        name: 'Memscap',
        envelope: 'PEA-PME',
        assetType: 'STOCK',
        quantity: 1000,
        avgPrice: 10,
        currentPrice: 10,
        currency: 'EUR',
        targetWeight: 0.2,
        themes: ['aero'],
      },
      {
        id: 'pos-5',
        ticker: 'CEG',
        name: 'Constellation Energy',
        envelope: 'CTO',
        assetType: 'STOCK',
        quantity: 50,
        avgPrice: 200,
        currentPrice: 200,
        currency: 'USD',
        targetWeight: 0.2,
        themes: ['nuclear'],
      },
    ];

    const result = calculatePortfolioRiskMetrics(diversifiedPositions, { EUR: 1.0, USD: 0.92 });

    expect(result.topAssetConcentration).toBeLessThanOrEqual(30.0);
    expect(result.diversificationScore).toBeGreaterThanOrEqual(70);
    expect(result.estimatedSharpeRatio).toBeGreaterThan(0);
  });
});

import { describe, it, expect } from 'vitest';
import { runStressTest } from '../engines/stressTest';
import type { Position } from '../types/portfolio';
import type { StressScenario } from '../types/simulation';

describe('Stress Test Engine', () => {
  const samplePositions: Position[] = [
    {
      id: 'pos_livret',
      ticker: 'LIVRET-A',
      name: 'Livret A',
      assetType: 'SAVINGS',
      envelope: 'LIVRET',
      quantity: 3576,
      avgPrice: 1,
      currentPrice: 1,
      currency: 'EUR',
      targetWeight: 0.35,
      themes: ['emergency', 'savings'],
      riskScore: 1,
      allocationCategory: 'CASH',
      fees: 0,
      liquidity: 'HIGH',
      pru: 1,
      currentValue: 3576,
      unrealizedGainLoss: 0,
      unrealizedGainLossPercent: 0,
      totalInvested: 3576,
      dividendYield: 0.03,
      volatility: 0,
      isCore: true,
      notes: 'Matelas de sécurité',
      tags: ['garanti'],
      createdAt: 1700000000,
      updatedAt: 1700000000,
    },
    {
      id: 'pos_pea_acwi',
      ticker: 'GPEA.PA',
      name: 'Amundi PEA MSCI World',
      assetType: 'ETF',
      envelope: 'PEA',
      quantity: 10,
      avgPrice: 500,
      currentPrice: 500,
      currency: 'EUR',
      targetWeight: 0.40,
      themes: ['world', 'core'],
      riskScore: 4,
      allocationCategory: 'EQUITY_CORE',
      fees: 0.002,
      liquidity: 'HIGH',
      pru: 500,
      currentValue: 5000,
      unrealizedGainLoss: 0,
      unrealizedGainLossPercent: 0,
      totalInvested: 5000,
      dividendYield: 0.015,
      volatility: 0.15,
      isCore: true,
      notes: 'Socle mondial',
      tags: ['core'],
      createdAt: 1700000000,
      updatedAt: 1700000000,
    },
    {
      id: 'pos_nasdaq',
      ticker: 'PUST.PA',
      name: 'Lyxor PEA Nasdaq 100',
      assetType: 'ETF',
      envelope: 'PEA',
      quantity: 5,
      avgPrice: 100,
      currentPrice: 100,
      currency: 'EUR',
      targetWeight: 0.15,
      themes: ['tech', 'us'],
      riskScore: 5,
      allocationCategory: 'EQUITY_SATELLITE',
      fees: 0.003,
      liquidity: 'HIGH',
      pru: 100,
      currentValue: 500,
      unrealizedGainLoss: 0,
      unrealizedGainLossPercent: 0,
      totalInvested: 500,
      dividendYield: 0.005,
      volatility: 0.22,
      isCore: false,
      notes: 'Tech US',
      tags: ['tech'],
      createdAt: 1700000000,
      updatedAt: 1700000000,
    },
    {
      id: 'pos_target_unbought',
      ticker: 'COHR',
      name: 'Coherent Corp',
      assetType: 'STOCK',
      envelope: 'CTO',
      quantity: 0,
      avgPrice: 85,
      currentPrice: 85,
      currency: 'USD',
      targetWeight: 0.05,
      themes: ['tech', 'optics'],
      riskScore: 6,
      allocationCategory: 'EQUITY_SATELLITE',
      fees: 0.001,
      liquidity: 'HIGH',
      pru: 85,
      currentValue: 0,
      unrealizedGainLoss: 0,
      unrealizedGainLossPercent: 0,
      totalInvested: 0,
      dividendYield: 0,
      volatility: 0.35,
      isCore: false,
      notes: 'Ligne cible',
      tags: ['speculative'],
      createdAt: 1700000000,
      updatedAt: 1700000000,
    },
  ];

  const sampleScenario: StressScenario = {
    name: 'Choc Tech & Taux (2022)',
    type: 'historical',
    description: 'Remontée agressive des taux et correction tech.',
    shocks: {
      global_equities: -0.18,
      technology: -0.30,
      nasdaq_100: -0.28,
    },
  };

  it('guarantees 0% loss and shock for Livret A savings', () => {
    const result = runStressTest(samplePositions, sampleScenario);
    const livret = result.contributionByAsset.find((a) => a.ticker === 'LIVRET-A');

    expect(livret).toBeDefined();
    expect(livret?.priceShockPercent).toBe(0);
    expect(livret?.contribution).toBe(0);
    expect(result.lossByEnvelope['LIVRET']).toBe(0);
  });

  it('computes realistic non-overlapping shocks for equities', () => {
    const result = runStressTest(samplePositions, sampleScenario);
    const nasdaq = result.contributionByAsset.find((a) => a.ticker === 'PUST.PA');

    expect(nasdaq).toBeDefined();
    expect(nasdaq?.priceShockPercent).toBe(-28);
    expect(nasdaq?.contribution).toBe(-140);
  });

  it('correctly calculates price shock for unbought target assets while keeping nominal loss at 0 €', () => {
    const result = runStressTest(samplePositions, sampleScenario);
    const cohr = result.contributionByAsset.find((a) => a.ticker === 'COHR');

    expect(cohr).toBeDefined();
    expect(cohr?.isHeld).toBe(false);
    expect(cohr?.contribution).toBe(0);
    expect(cohr?.priceShockPercent).toBe(-30);
  });

  it('provides constructive anti-crisis governance actions', () => {
    const result = runStressTest(samplePositions, sampleScenario);
    expect(result.governanceActions.length).toBeGreaterThan(0);
    expect(result.governanceActions.some((a) => a.includes('DCA'))).toBe(true);
    expect(result.governanceActions.some((a) => a.includes('Livret A'))).toBe(true);
  });
});

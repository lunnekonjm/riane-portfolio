import { describe, it, expect } from 'vitest';
import { computeEnvelopeSummaries, calculateWithdrawalSimulation } from '@/engines/taxEnvelopeEngine';
import type { Position } from '@/types/portfolio';

describe('taxEnvelopeEngine', () => {
  it('should compute PEA ceilings and combined limit correctly', () => {
    const mockPositions: Position[] = [
      { id: '1', ticker: 'GPEA', name: 'PEA World', envelope: 'PEA', assetClass: 'Bourse', currency: 'EUR', quantity: 1000, avgPrice: 100, targetWeight: 0.5, monthlyDCA: 800 },
      { id: '2', ticker: 'MEMS', name: 'Memscap', envelope: 'PEA-PME', assetClass: 'Bourse', currency: 'EUR', quantity: 200, avgPrice: 10, targetWeight: 0.1, monthlyDCA: 100 },
    ];

    const res = computeEnvelopeSummaries(mockPositions, { EUR: 1 });
    expect(res.peaCost).toBe(100000);
    expect(res.peaPmeCost).toBe(2000);
    expect(res.maxPeaPmeAllowed).toBe(125000); // 225 000 - 100 000
    expect(res.isPeaExceeded).toBe(false);
    expect(res.isCombinedExceeded).toBe(false);
  });

  it('should calculate PEA withdrawal tax after 5 years (0% IR + PS)', () => {
    const mockSummaries = [
      {
        envKey: 'PEA',
        meta: {} as any,
        positions: [],
        totalValue: 200000,
        totalCost: 100000,
        gainLoss: 100000,
        gainLossPercent: 100,
      },
    ];

    const sim = calculateWithdrawalSimulation({
      summaries: mockSummaries,
      simEnvelope: 'PEA',
      simSeniority: 'over5',
      simWithdrawalAmount: 50000,
      ctoTaxRegime: 'pfu',
      ctoTmiRate: 0.30,
      psRate: 0.186,
    });

    // 50,000 withdrawal with 50% gain ratio (100k gain / 200k val)
    // Gain withdrawn = 25,000 €
    // IR = 0%
    // PS (18.6%) = 25,000 * 0.186 = 4,650 €
    // Net received = 50,000 - 4,650 = 45,350 €
    expect(sim.withdrawnGain).toBe(25000);
    expect(sim.irTax).toBe(0);
    expect(sim.psTax).toBe(4650);
    expect(sim.totalTax).toBe(4650);
    expect(sim.netReceived).toBe(45350);
  });
});

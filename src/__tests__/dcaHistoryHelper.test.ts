import { describe, it, expect } from 'vitest';
import {
  getMonthsBetween,
  getActiveDCATranche,
  calculateCumulativeDCA,
  addOrStepUpDCATranche,
  getEffectiveDCAMonthly,
} from '../utils/dcaHistoryHelper';
import type { DCATranche, PortfolioConfig } from '../types/portfolio';

describe('dcaHistoryHelper', () => {
  it('calcule correctement le nombre de mois entre deux dates', () => {
    expect(getMonthsBetween('2024-01-01', '2024-01-31')).toBe(1);
    expect(getMonthsBetween('2024-01-01', '2024-12-31')).toBe(12);
    expect(getMonthsBetween('2024-01-01', '2025-08-31')).toBe(20);
  });

  it('résout la tranche active selon la date cible', () => {
    const tranches: DCATranche[] = [
      { id: 't1', startDate: '2024-01-01', endDate: '2024-06-30', amount: 500, label: 'Palier 1' },
      { id: 't2', startDate: '2024-07-01', endDate: '2024-12-31', amount: 1000, label: 'Palier 2' },
      { id: 't3', startDate: '2025-01-01', amount: 1500, label: 'Palier 3' },
    ];

    expect(getActiveDCATranche(tranches, '2024-03-15')?.amount).toBe(500);
    expect(getActiveDCATranche(tranches, '2024-08-10')?.amount).toBe(1000);
    expect(getActiveDCATranche(tranches, '2025-06-01')?.amount).toBe(1500);
  });

  it('calcule le cumul historique exact avec plusieurs paliers (Step-ups)', () => {
    const tranches: DCATranche[] = [
      // 6 mois à 500€ = 3000€
      { id: 't1', startDate: '2024-01-01', endDate: '2024-06-30', amount: 500 },
      // 6 mois à 1000€ = 6000€
      { id: 't2', startDate: '2024-07-01', endDate: '2024-12-31', amount: 1000 },
      // 8 mois à 1500€ (du 01/2025 au 08/2025) = 12000€
      { id: 't3', startDate: '2025-01-01', amount: 1500 },
    ];

    const result = calculateCumulativeDCA(tranches, 1000, undefined, '2025-08-15');

    expect(result.totalMonths).toBe(20);
    expect(result.totalInvested).toBe(3000 + 6000 + 12000); // 21 000 €
    expect(result.activeMonthly).toBe(1500);
    expect(result.averageMonthly).toBe(Math.round(21000 / 20)); // 1050 €
  });

  it('gère correctement l’ajout d’un palier step-up en fermant automatiquement le précédent', () => {
    const initialTranches: DCATranche[] = [
      { id: 't1', startDate: '2024-01-01', amount: 1000 },
    ];

    const updated = addOrStepUpDCATranche(initialTranches, 1500, '2025-01-01', 'Augmentation de salaire');

    expect(updated).toHaveLength(2);
    expect(updated[0].endDate).toBe('2024-12-31');
    expect(updated[0].amount).toBe(1000);

    expect(updated[1].startDate).toBe('2025-01-01');
    expect(updated[1].endDate).toBeUndefined();
    expect(updated[1].amount).toBe(1500);
    expect(updated[1].label).toBe('Augmentation de salaire');
  });

  it('récupère le budget effectif depuis PortfolioConfig', () => {
    const config: PortfolioConfig = {
      monthlyBudget: 1000,
      annualCTOBudget: 8000,
      annualSpeculativeCap: 2000,
      riskProfile: 'dynamic',
      noLeverage: true,
      rebalanceByFlows: true,
      baseCurrency: 'EUR',
      horizonYears: 15,
      dcaHistory: [
        { id: 't1', startDate: '2024-01-01', endDate: '2024-12-31', amount: 800 },
        { id: 't2', startDate: '2025-01-01', amount: 1200 },
      ],
    };

    expect(getEffectiveDCAMonthly(config, '2024-05-01')).toBe(800);
    expect(getEffectiveDCAMonthly(config, '2025-02-01')).toBe(1200);
  });
});

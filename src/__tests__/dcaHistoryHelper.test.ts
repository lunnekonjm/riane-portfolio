import { describe, it, expect } from 'vitest';
import {
  getMonthsBetween,
  getActiveDCATranche,
  calculateCumulativeDCA,
  addOrStepUpDCATranche,
  getEffectiveDCAMonthly,
  updateChainedTranches,
  deleteChainedTranche,
  addContinuousTranche,
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

  it('ne saute PAS sur un palier futur si la date actuelle est antérieure à tous les paliers (Bug fix 500€ vs 700€)', () => {
    const tranches: DCATranche[] = [
      { id: 't1', startDate: '2026-09-02', endDate: '2026-12-02', amount: 500, label: 'Palier 1' },
      { id: 't2', startDate: '2027-01-02', amount: 700, label: 'Palier 2' },
    ];

    // En août 2026 (avant septembre 2026), le palier attendu est le premier (500€) et JAMAIS le 700€ de 2027
    expect(getActiveDCATranche(tranches, '2026-08-16')?.amount).toBe(500);
    expect(getActiveDCATranche(tranches, '2026-10-15')?.amount).toBe(500);
    expect(getActiveDCATranche(tranches, '2027-02-01')?.amount).toBe(700);
  });

  it('propage automatiquement les dates entre paliers liés sans chevauchement ni rupture', () => {
    const initialTranches: DCATranche[] = [
      { id: 't1', startDate: '2026-06-03', endDate: '2026-08-03', amount: 200, label: 'Palier 1' },
      { id: 't2', startDate: '2026-08-03', endDate: '2026-12-31', amount: 500, label: 'Palier 2' },
      { id: 't3', startDate: '2026-12-31', amount: 700, label: 'Palier 3' },
    ];

    // 1. Déplacer la fin de Palier 1 au 2026-09-15 doit automatiquement mettre à jour le début de Palier 2 au 2026-09-15
    const updated1 = updateChainedTranches(initialTranches, 't1', { endDate: '2026-09-15' });
    expect(updated1[0].endDate).toBe('2026-09-15');
    expect(updated1[1].startDate).toBe('2026-09-15');

    // 2. Déplacer le début de Palier 3 au 2027-02-01 doit automatiquement mettre à jour la fin de Palier 2 au 2027-02-01
    const updated2 = updateChainedTranches(updated1, 't3', { startDate: '2027-02-01' });
    expect(updated2[1].endDate).toBe('2027-02-01');
    expect(updated2[2].startDate).toBe('2027-02-01');
  });

  it('gère la suppression d’un palier intermédiaire en raccordant les paliers adjacents', () => {
    const tranches: DCATranche[] = [
      { id: 't1', startDate: '2026-01-01', endDate: '2026-06-01', amount: 200 },
      { id: 't2', startDate: '2026-06-01', endDate: '2026-12-01', amount: 500 },
      { id: 't3', startDate: '2026-12-01', amount: 700 },
    ];

    const afterDelete = deleteChainedTranche(tranches, 't2');
    expect(afterDelete).toHaveLength(2);
    expect(afterDelete[0].id).toBe('t1');
    expect(afterDelete[0].endDate).toBe('2026-12-01');
    expect(afterDelete[1].id).toBe('t3');
    expect(afterDelete[1].startDate).toBe('2026-12-01');
  });

  it('ajoute un palier continu enchaîné sur la fin du précédent', () => {
    const tranches: DCATranche[] = [
      { id: 't1', startDate: '2026-01-01', endDate: '2026-08-01', amount: 300 },
    ];

    const added = addContinuousTranche(tranches, 500);
    expect(added).toHaveLength(2);
    expect(added[0].endDate).toBe('2026-08-01');
    expect(added[1].startDate).toBe('2026-08-01');
    expect(added[1].amount).toBe(500);
  });
});

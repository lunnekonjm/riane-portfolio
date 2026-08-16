import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AuraRulesView } from '../components/aura/AuraRulesView';
import RevenueBudgetView from '../components/RevenueBudgetView';
import { ErrorBoundary } from '../components/ErrorBoundary';
import {
  analyzeTargetFlows,
  computeEndPeriod,
  isExpenseActiveForPeriod,
  cleanFrenchMerchantName,
  detectTemporaryObligations,
  buildInteractiveFlowCandidates,
  type TargetFlowItem,
} from '../engines/bankingAnalyzerEngine';

describe('AuraRulesView & RevenueBudgetView Robustness Suite', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  it('renders AuraRulesView cleanly with standard net salary', () => {
    const html = renderToString(React.createElement(AuraRulesView, { netSalary: 2713.74 }));
    expect(html).toContain('Règles dynamiques');
    expect(html).toContain('Cible PEA');
  });

  it('renders AuraRulesView with zero, NaN, or undefined salary without throwing', () => {
    expect(() => {
      renderToString(React.createElement(AuraRulesView, { netSalary: 0 }));
    }).not.toThrow();

    expect(() => {
      renderToString(React.createElement(AuraRulesView, { netSalary: NaN }));
    }).not.toThrow();

    expect(() => {
      renderToString(React.createElement(AuraRulesView, { netSalary: undefined }));
    }).not.toThrow();
  });

  it('renders AuraRulesView safely when localStorage contains corrupted or legacy non-array data', () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('aura_rules_savings', JSON.stringify({ invalid: true }));
      window.localStorage.setItem('aura_rules_fixed', 'not-even-json');
      window.localStorage.setItem('aura_temporary_expenses', JSON.stringify([null, { label: undefined, monthlyAmount: NaN }]));
    }

    expect(() => {
      renderToString(React.createElement(AuraRulesView, { netSalary: 2713.74 }));
    }).not.toThrow();
  });

  it('renders RevenueBudgetView with RULES tab and catches any error gracefully', () => {
    const html = renderToString(
      React.createElement(RevenueBudgetView, {
        records: [],
        revenueConfig: { fixedExpenses: 1150, currentSavings: 1600 },
        allocations: [],
        portfolioConfig: null,
        onSaveRecord: async () => {},
        onDeleteRecord: async () => {},
        onSaveRevenueConfig: async () => {},
        onSaveAllocation: async () => {},
        onDeleteAllocation: async () => {},
        onSyncMonthlyBudget: async () => {},
        onShowToast: () => {},
        autoOpenWizard: true, // Forces RULES tab active
      })
    );

    expect(html).toContain('Règles &amp; M+5');
  });

  it('renders ErrorBoundary fallback when a child component throws', () => {
    const derivedState = ErrorBoundary.getDerivedStateFromError(new Error('Deliberate error'));
    expect(derivedState.hasError).toBe(true);
    expect(derivedState.error?.message).toBe('Deliberate error');
  });

  describe('Banking Analyzer & M+5 Date Math Resilience', () => {
    it('handles cleanFrenchMerchantName with valid and dirty/null inputs', () => {
      expect(cleanFrenchMerchantName('PRLV SEPA CDC HABITAT 883920')).toBe('CDC Habitat (Loyer)');
      expect(cleanFrenchMerchantName('VIR SEPA BOURSO PEA DCA')).toBe('Bourse PEA');
      expect(cleanFrenchMerchantName('VIR SEPA LIVRET A BOURSO')).toBe('Livret A');
      expect(cleanFrenchMerchantName('PRLV SEPA SPOTIFY')).toBe('Spotify');
      expect(cleanFrenchMerchantName('')).toBe('Prélèvement Récurrent');
      expect(cleanFrenchMerchantName(null)).toBe('Prélèvement Récurrent');
      expect(cleanFrenchMerchantName(undefined)).toBe('Prélèvement Récurrent');
    });

    it('computes end periods accurately without calendar day overflows', () => {
      expect(computeEndPeriod('2026-08', 1)).toBe('2026-08');
      expect(computeEndPeriod('2026-08', 5)).toBe('2026-12');
      expect(computeEndPeriod('2026-08', 6)).toBe('2027-01');
      expect(computeEndPeriod('invalid', 3)).toBe('invalid');
    });

    it('determines if temporary expenses are active within a given period', () => {
      const exp = {
        id: 'exp-1',
        label: 'Dentiste',
        monthlyAmount: 220,
        startPeriod: '2026-08',
        durationMonths: 3, // active 2026-08, 2026-09, 2026-10
      };

      expect(isExpenseActiveForPeriod(exp, '2026-07')).toBe(false);
      expect(isExpenseActiveForPeriod(exp, '2026-08')).toBe(true);
      expect(isExpenseActiveForPeriod(exp, '2026-09')).toBe(true);
      expect(isExpenseActiveForPeriod(exp, '2026-10')).toBe(true);
      expect(isExpenseActiveForPeriod(exp, '2026-11')).toBe(false);
    });

    it('analyzes target flows with empty and corrupted transaction arrays', () => {
      const summaryEmpty = analyzeTargetFlows([], 2713.74, 30);
      expect(summaryEmpty.totalOutflows).toBeGreaterThan(0); // Uses sample fallback
      expect(summaryEmpty.pea).toBeDefined();

      const dirtyTxs: TargetFlowItem[] = [
        { id: '1', date: '2026-08-01', title: 'SENDWAVE FAMILLE', amount: 200 },
        { id: '2', date: '2026-08-02', title: 'TOPUP REVOLUT', amount: 300 },
        { id: '3', date: 'invalid-date', title: 'TONTINE', amount: 150 },
      ];
      const summaryDirty = analyzeTargetFlows(dirtyTxs, 2713.74, 30);
      expect(summaryDirty.soutien.totalAmount).toBe(200);
      expect(summaryDirty.revolut.totalAmount).toBe(300);
      expect(summaryDirty.tontine.totalAmount).toBe(150);
    });

    it('detects temporary obligations like Turrel or Dentiste', () => {
      const txs: TargetFlowItem[] = [
        { id: '1', date: '2026-08-01', title: 'VIR SEPA TURREL BAPTISTE ECHEANCE', amount: 140 },
        { id: '2', date: '2026-08-02', title: 'PRLV CLINIQUE DENTAIRE LATTES', amount: 250 },
      ];
      const detected = detectTemporaryObligations(txs, []);
      expect(detected.length).toBe(2);
      expect(detected.some((d) => d.label.includes('Turrel'))).toBe(true);
      expect(detected.some((d) => d.label.includes('Dentiste'))).toBe(true);
    });

    it('builds interactive candidates cleanly', () => {
      const summary = analyzeTargetFlows([], 2713.74, 30);
      const candidates = buildInteractiveFlowCandidates(summary, [], 2713.74);
      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates.some((c) => c.categoryKey === 'loyer')).toBe(true);
      expect(candidates.some((c) => c.categoryKey === 'abonnement')).toBe(true);
    });
  });
});


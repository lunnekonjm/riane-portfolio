import { describe, it, expect } from 'vitest';
import {
  cleanFrenchMerchantName,
  analyzeTargetFlows,
  detectTemporaryObligations,
  buildInteractiveFlowCandidates,
  computeEndPeriod,
  isExpenseActiveForPeriod,
  SAMPLE_REAL_TRANSACTIONS,
} from '@/engines/bankingAnalyzerEngine';

describe('bankingAnalyzerEngine', () => {
  describe('cleanFrenchMerchantName', () => {
    it('cleans French banking prefixes and technical references', () => {
      expect(cleanFrenchMerchantName('PRLV SEPA CDC HABITAT REF 883920')).toBe('CDC Habitat (Loyer)');
      expect(cleanFrenchMerchantName('VIR SEPA BOURSO PEA DCA ETF WORLD')).toBe('Bourse PEA');
      expect(cleanFrenchMerchantName('VIR SEPA LIVRET A BOURSOBANK')).toBe('Livret A');
      expect(cleanFrenchMerchantName('PRLV SEPA BOUYGUES TELECOM')).toBe('Bouygues Telecom');
      expect(cleanFrenchMerchantName('PRLV SEPA SENDWAVE SOUTIEN FAMILLE')).toBe('Sendwave (Soutien familial)');
      expect(cleanFrenchMerchantName('TOPUP REVOLUT CARTE')).toBe('Revolut');
    });
  });

  describe('analyzeTargetFlows', () => {
    it("never hallucinates or injects fake fallback transactions when transactions array is empty", () => {
      const emptySummary = analyzeTargetFlows([], 2713.74, 30);
      expect(emptySummary.totalOutflows).toBe(0);
      expect(emptySummary.pea.transactions.length).toBe(0);
      expect(emptySummary.livretA.transactions.length).toBe(0);
      expect(emptySummary.loyer.transactions.length).toBe(0);
      expect(emptySummary.abonnement.transactions.length).toBe(0);
      expect(emptySummary.unclassified.transactions.length).toBe(0);
    });

    it("strictly isolates CDC Habitat in Loyer and keeps Turrel in temporary obligations or unclassified", () => {
      const realTxs = [
        { id: "tx-cdc", date: "2026-08-05", title: "PRLV SEPA CDC HABITAT REF 883920", amount: 757.09, category: "Logement" },
        { id: "tx-turrel", date: "2026-08-05", title: "VIR BAPTISTE TURREL", amount: 140.0, category: "Virement" },
      ];
      const summary = analyzeTargetFlows(realTxs, 2713.74, 30);
      expect(summary.loyer.transactions.length).toBe(1);
      expect(summary.loyer.transactions[0].id).toBe("tx-cdc");
      expect(summary.loyer.totalAmount).toBe(757.09);
      expect(summary.unclassified.transactions.some(t => t.id === "tx-turrel")).toBe(true);

      const tempObs = detectTemporaryObligations(realTxs);
      expect(tempObs.some(t => t.label.includes("Turrel"))).toBe(true);
      expect(tempObs.find(t => t.label.includes("Turrel"))?.category).toBe("Échéancier");
    });

    it('classifies the 7 key targets from sample transactions', () => {
      const summary = analyzeTargetFlows(SAMPLE_REAL_TRANSACTIONS, 2713.74, 30);
      expect(summary.periodDays).toBe(30);
      expect(summary.loyer.monthlyAverage).toBeGreaterThan(700);
      expect(summary.pea.monthlyAverage).toBe(400);
      expect(summary.livretA.monthlyAverage).toBe(700);
      expect(summary.soutien.monthlyAverage).toBeGreaterThanOrEqual(200);
      expect(summary.revolut.monthlyAverage).toBe(200);
      expect(summary.abonnement.monthlyAverage).toBeGreaterThan(30);
      expect(summary.totalOutflows).toBeGreaterThan(2000);
    });
  });

  describe('detectTemporaryObligations', () => {
    it('detects healthcare, split payments, and temporary obligations', () => {
      const txs = [
        { id: 'tx-dent', date: '2026-08-10', title: 'CB DR DENTISTE COURONNE DENTAIRE', amount: 614.0, category: 'Santé' },
        { id: 'tx-klarna', date: '2026-08-08', title: 'PRLV SEPA KLARNA 1/3 COMMERCE', amount: 89.90, category: 'Échéancier' },
        { id: 'tx-turrel', date: '2026-08-05', title: 'VIR BAPTISTE TURREL FRAIS', amount: 145.0, category: 'Logement' },
      ];

      const detected = detectTemporaryObligations(txs);
      expect(detected.length).toBe(3);
      expect(detected.some((d) => d.label.includes('Dentiste'))).toBe(true);
      expect(detected.some((d) => d.label.includes('Klarna'))).toBe(true);
      expect(detected.some((d) => d.label.includes('Turrel'))).toBe(true);
    });
  });

  describe('buildInteractiveFlowCandidates', () => {
    it('generates rich, transparent candidate objects with audit formulas and virement flags', () => {
      const summary = analyzeTargetFlows(SAMPLE_REAL_TRANSACTIONS, 2713.74, 30);
      const candidates = buildInteractiveFlowCandidates(summary, [], 2713.74);

      expect(candidates.length).toBeGreaterThanOrEqual(7);

      const peaCand = candidates.find((c) => c.categoryKey === 'pea');
      expect(peaCand).toBeDefined();
      expect(peaCand?.isVirementEpargne).toBe(true);
      expect(peaCand?.explanation).toContain('virement mensuel régulier et NON le solde');

      const livretCand = candidates.find((c) => c.categoryKey === 'livret_a');
      expect(livretCand).toBeDefined();
      expect(livretCand?.isVirementEpargne).toBe(true);
      expect(livretCand?.explanation).toContain('virement mensuel régulier et NON le solde');

      const loyerCand = candidates.find((c) => c.categoryKey === 'loyer');
      expect(loyerCand).toBeDefined();
      expect(loyerCand?.pillar).toBe('FIXED');
      expect(loyerCand?.transactions.length).toBeGreaterThan(0);
    });
  });

  describe('computeEndPeriod and isExpenseActiveForPeriod', () => {
    it('computes end period correctly across months and years', () => {
      expect(computeEndPeriod('2026-09', 4)).toBe('2026-12');
      expect(computeEndPeriod('2026-11', 3)).toBe('2027-01');
      expect(computeEndPeriod('2026-09', 10)).toBe('2027-06');
    });

    it('checks if an expense is active for a given period', () => {
      const exp = { id: '1', label: 'Dentiste', monthlyAmount: 614, startPeriod: '2026-09', durationMonths: 4 };
      expect(isExpenseActiveForPeriod(exp, '2026-09')).toBe(true);
      expect(isExpenseActiveForPeriod(exp, '2026-11')).toBe(true);
      expect(isExpenseActiveForPeriod(exp, '2026-12')).toBe(true);
      expect(isExpenseActiveForPeriod(exp, '2027-01')).toBe(false);
      expect(isExpenseActiveForPeriod(exp, '2026-08')).toBe(false);
    });
  });
});

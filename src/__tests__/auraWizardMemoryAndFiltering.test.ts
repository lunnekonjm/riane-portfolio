import { describe, it, expect, beforeEach } from 'vitest';
import {
  analyzeTargetFlows,
  buildInteractiveFlowCandidates,
  detectTemporaryObligations,
  type TargetFlowItem,
} from '@/engines/bankingAnalyzerEngine';
import {
  loadWizardMemory,
  saveWizardMemory,
  resetWizardMemory,
  recordUserWizardFeedback,
  isMerchantOrTxRejected,
  getTxSignature,
  type AuraWizardLearningMemory,
} from '@/services/banking/auraWizardMemoryService';
import { isNonPrincipalAccount } from '@/hooks/useAuraBankFlowWizardState';

describe('Aura Wizard Memory & Strict Filtering Suite', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    (global as any).window = {
      dispatchEvent: () => true,
    };
    (global as any).localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
      key: (i: number) => Object.keys(store)[i] || null,
      get length() { return Object.keys(store).length; },
    };
  });

  describe('1. Strict Compte Principal Account Filtering', () => {
    it('correctly identifies non-principal accounts (Joint, Tontine, Mme, Livret, PEA, etc.)', () => {
      expect(isNonPrincipalAccount('COMPTE JOINT M OU MME')).toBe(true);
      expect(isNonPrincipalAccount('COMPTE TONTINE COLLECTIVE')).toBe(true);
      expect(isNonPrincipalAccount('LIVRET A BOURSOBANK')).toBe(true);
      expect(isNonPrincipalAccount('EPARGNE COMMUNE')).toBe(true);
      expect(isNonPrincipalAccount('COMPTE DE MADAME NEGEM')).toBe(true);
      expect(isNonPrincipalAccount('PEA TITRES')).toBe(true);

      // Principal accounts
      expect(isNonPrincipalAccount('COMPTE COURANT INDIVIDUEL')).toBe(false);
      expect(isNonPrincipalAccount('CARTE BANCAIRE')).toBe(false);
      expect(isNonPrincipalAccount('BOURSOBANK INDIVIDUEL')).toBe(false);
    });

    it('filters out transactions from joint and secondary accounts', () => {
      const mixedTxs: TargetFlowItem[] = [
        { id: '1', date: '2026-08-01', title: 'PRLV CDC HABITAT', amount: -757.09, accountName: 'Compte Courant' },
        { id: '2', date: '2026-08-02', title: 'VIR RECU MME', amount: 300, accountName: 'Compte Joint' },
        { id: '3', date: '2026-08-03', title: 'VIR TONTINE', amount: -150, accountName: 'Compte Tontine' },
      ];

      const principalOnly = mixedTxs.filter((tx) => {
        const acc = `${tx.accountId || ''} ${tx.accountType || ''} ${tx.accountName || ''}`.toUpperCase();
        return !isNonPrincipalAccount(acc);
      });

      expect(principalOnly.length).toBe(1);
      expect(principalOnly[0].id).toBe('1');
    });
  });

  describe('2. Inflow / Credit Exclusion from Outflow Categories', () => {
    it('does not classify received credits (+50€ Monsieur Pene or refunds) as Soutien or Loyer expenses', () => {
      const txs: TargetFlowItem[] = [
        { id: 'tx-sendwave', date: '2026-08-10', title: 'PRLV SEPA SENDWAVE SOUTIEN FAMILLE', amount: -230.0, category: 'Soutien' },
        { id: 'tx-pene-credit', date: '2026-08-11', title: 'VIR RECU DE PENE MGOUDA', amount: 50.0, category: 'Virement' },
        { id: 'tx-refund', date: '2026-08-12', title: 'REMBOURSEMENT CDC HABITAT TROP PERCU', amount: 120.0, category: 'Logement' },
      ];

      const summary = analyzeTargetFlows(txs, 2713.74, 30);
      // Soutien should ONLY contain the real debit Sendwave (-230€)
      expect(summary.soutien.transactions.length).toBe(1);
      expect(summary.soutien.transactions[0].id).toBe('tx-sendwave');
      expect(summary.soutien.totalAmount).toBe(230.0);

      // Inbound credits must be routed to unclassified / income, not loyer/soutien
      expect(summary.unclassified.transactions.some((t) => t.id === 'tx-pene-credit')).toBe(true);
      expect(summary.unclassified.transactions.some((t) => t.id === 'tx-refund')).toBe(true);
    });
  });

  describe('3. AI Learning Memory Persistence & Feedback Loop', () => {
    it('records rejected candidate flows and persists them into localStorage', () => {
      const txs: TargetFlowItem[] = [
        { id: 'tx-loyer', date: '2026-08-05', title: 'PRLV CDC HABITAT', amount: -757.09, category: 'Logement' },
        { id: 'tx-soutien', date: '2026-08-10', title: 'PRLV SENDWAVE', amount: -230.0, category: 'Soutien' },
      ];

      const summary = analyzeTargetFlows(txs, 2713.74, 30);
      const candidates = buildInteractiveFlowCandidates(summary, [], 2713.74);

      // User deselects flow-soutien (only keeps flow-loyer)
      const selectedCandidateIds = new Set(['flow-loyer']);
      const candidateTxsMap = {
        'flow-loyer': [txs[0]],
        'flow-soutien': [txs[1]],
      };

      const updatedMem = recordUserWizardFeedback({
        initialCandidates: candidates,
        selectedCandidateIds,
        candidateTxsMap,
        excludedTxIds: new Set(),
        dismissedInsightIds: new Set(['insight-old-tariff']),
        unclassifiedTxs: [],
      });

      expect(updatedMem.rejectedCandidateIds).toContain('flow-soutien');
      expect(updatedMem.dismissedInsightIds).toContain('insight-old-tariff');

      // Next analysis with memory should have flow-soutien defaultSelected = false
      const candidatesWithMem = buildInteractiveFlowCandidates(summary, [], 2713.74, updatedMem);
      const loyerCand = candidatesWithMem.find((c) => c.id === 'flow-loyer');
      const soutienCand = candidatesWithMem.find((c) => c.id === 'flow-soutien');

      expect(loyerCand?.defaultSelected).toBe(true);
      expect(soutienCand?.defaultSelected).toBe(false);
    });

    it('records excluded transactions and does not propose them again', () => {
      const txDevred: TargetFlowItem = {
        id: 'tx-devred',
        date: '2026-08-12',
        title: 'PAYPAL DEVRED ACHAT',
        rawTitle: 'PAYPAL *DEVRED PARIS',
        amount: -120.0,
      };

      const txs = [txDevred];
      const summary = analyzeTargetFlows(txs, 2713.74, 30);
      const candidates = buildInteractiveFlowCandidates(summary, [], 2713.74);

      // User unchecks/excludes the Devred transaction
      const mem = recordUserWizardFeedback({
        initialCandidates: candidates,
        selectedCandidateIds: new Set(candidates.map((c) => c.id)),
        candidateTxsMap: { 'flow-abonnement': [txDevred] },
        excludedTxIds: new Set([txDevred.id]),
        dismissedInsightIds: new Set(),
        unclassifiedTxs: [],
      });

      expect(isMerchantOrTxRejected(txDevred, 'abonnement', mem)).toBe(true);
    });

    it('resets memory completely when resetWizardMemory is invoked', () => {
      const mem: AuraWizardLearningMemory = {
        version: 1,
        rejectedCandidateIds: ['flow-soutien'],
        rejectedMerchantPatterns: [{ pattern: 'PENE', timestamp: Date.now() }],
        excludedTxSignatures: ['2026-08-10:VIR SEPA PENE:50.00'],
        customCategoryMappings: {},
        dismissedInsightIds: ['insight-1'],
        lastUpdated: Date.now(),
      };

      saveWizardMemory(mem);
      expect(loadWizardMemory().rejectedCandidateIds.length).toBe(1);

      const cleaned = resetWizardMemory();
      expect(cleaned.rejectedCandidateIds.length).toBe(0);
      expect(cleaned.rejectedMerchantPatterns.length).toBe(0);
      expect(cleaned.excludedTxSignatures.length).toBe(0);
      expect(cleaned.dismissedInsightIds.length).toBe(0);
    });
  });
});

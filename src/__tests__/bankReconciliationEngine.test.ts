import { describe, it, expect } from 'vitest';
import {
  classifyTransaction,
  buildReconciliationDraft,
  type RawBankTransaction,
} from '@/services/bankReconciliationEngine';
import type { SalaryRecord } from '@/types/revenue';
import { sanitizeForFirestore } from '@/services/firebase/firestore';

describe('Bank Reconciliation Engine', () => {
  it('correctly classifies salary credits', () => {
    const tx: RawBankTransaction = {
      id: 'tx-1',
      date: '2026-08-01',
      description: 'VIR SEPA VESTAS FRANCE SALAIRE',
      amount: 3250,
      accountType: 'Courant',
    };
    const res = classifyTransaction(tx);
    expect(res.category).toBe('SALARY_INCOME');
    expect(res.confidence).toBeGreaterThan(0.9);
  });

  it('correctly classifies PEA investment transfers', () => {
    const tx: RawBankTransaction = {
      id: 'tx-2',
      date: '2026-08-02',
      description: 'Versement PEA BoursoBank',
      amount: -397.44,
      accountType: 'Courant',
    };
    const res = classifyTransaction(tx);
    expect(res.category).toBe('INVEST_PEA');
  });

  it('correctly classifies Tontine transfers', () => {
    const tx: RawBankTransaction = {
      id: 'tx-3',
      date: '2026-08-05',
      description: 'Cotisation Virement Tontine',
      amount: -100,
      accountType: 'Courant',
    };
    const res = classifyTransaction(tx);
    expect(res.category).toBe('INVEST_TONTINE');
  });

  it('correctly classifies Wave family support transfers', () => {
    const tx: RawBankTransaction = {
      id: 'tx-wave',
      date: '2026-08-06',
      description: 'Transfert Wave Soutien Famille',
      amount: -250,
      accountType: 'Courant',
    };
    const res = classifyTransaction(tx);
    expect(res.category).toBe('SUPPORT_WAVE');
  });

  it('correctly classifies Revolut topups and transfers', () => {
    const tx: RawBankTransaction = {
      id: 'tx-revolut',
      date: '2026-08-07',
      description: 'Vir Revolut alimentation',
      amount: -150,
      accountType: 'Courant',
    };
    const res = classifyTransaction(tx);
    expect(res.category).toBe('REVOLUT_TRANSFER');
  });

  it('correctly classifies Rent & Housing expenses', () => {
    const tx: RawBankTransaction = {
      id: 'tx-rent',
      date: '2026-08-05',
      description: 'Prélèvement Loyer Foncia Logement',
      amount: -820,
      accountType: 'Courant',
    };
    const res = classifyTransaction(tx);
    expect(res.category).toBe('RENT_HOUSING');
  });

  it('correctly classifies Subscriptions (Telecom, Streaming, Energy)', () => {
    const tx1: RawBankTransaction = {
      id: 'tx-bouygues',
      date: '2026-08-08',
      description: 'Bouygues Telecom Facture Bbox',
      amount: -32.99,
      accountType: 'Courant',
    };
    const tx2: RawBankTransaction = {
      id: 'tx-spotify',
      date: '2026-08-09',
      description: 'Spotify ABONNEMENT MENSUEL',
      amount: -10.99,
      accountType: 'Courant',
    };
    expect(classifyTransaction(tx1).category).toBe('SUBSCRIPTIONS');
    expect(classifyTransaction(tx2).category).toBe('SUBSCRIPTIONS');
  });

  it('correctly classifies daily card purchases', () => {
    const tx: RawBankTransaction = {
      id: 'tx-daily',
      date: '2026-08-10',
      description: 'CARTE 09/08 MONOPRIX PARIS',
      amount: -45.2,
      accountType: 'Courant',
    };
    const res = classifyTransaction(tx);
    expect(res.category).toBe('DAILY_EXPENSE');
  });

  it('correctly aggregates a month of bank transactions and calculates delta vs plan', () => {
    const testRecord: SalaryRecord = {
      id: 'sal-test-1',
      period: '2026-08',
      periodLabel: 'Août 2026',
      netSalary: 3250,
      regularInvestableAmount: 400,
      savingsRate: 35.0,
      source: 'manual',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const testTransactions: RawBankTransaction[] = [
      { id: 'tx-1', date: '2026-08-01', description: 'VIR SEPA VESTAS FRANCE SALAIRE', amount: 3250, accountType: 'Courant' },
      { id: 'tx-2', date: '2026-08-03', description: 'Versement PEA BoursoBank', amount: -397.44, accountType: 'Courant' },
      { id: 'tx-3', date: '2026-08-05', description: 'Cotisation Virement Tontine', amount: -100, accountType: 'Courant' },
    ];

    const recon = buildReconciliationDraft('2026-08', testRecord, testTransactions);
    expect(recon.actualNetSalaryReceived).toBe(3250);
    expect(recon.actualInvestedPEA).toBeCloseTo(397.44, 2);
    expect(recon.actualInvestedTontine).toBe(100);
    expect(recon.totalActualInvested).toBeCloseTo(497.44, 2);
    expect(recon.deltaVsPlan).toBeCloseTo(97.44, 2); // 497.44 - 400
    expect(recon.status).toBe('OVER_INVESTED');
  });
});

describe('sanitizeForFirestore', () => {
  it('strips undefined fields recursively', () => {
    const input = {
      id: 'sal-1',
      period: '2026-08',
      grossSalary: undefined,
      nested: {
        a: 1,
        b: undefined,
      },
      list: [1, undefined, { c: undefined, d: 2 }],
    };

    const sanitized = sanitizeForFirestore(input) as any;
    expect(sanitized.grossSalary).toBeUndefined();
    expect('grossSalary' in sanitized).toBe(false);
    expect('b' in sanitized.nested).toBe(false);
    expect(sanitized.nested.a).toBe(1);
    expect(sanitized.list[2].d).toBe(2);
    expect('c' in sanitized.list[2]).toBe(false);
  });
});

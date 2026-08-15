import { describe, it, expect } from 'vitest';
import {
  classifyTransaction,
  buildReconciliationDraft,
  getThreeMonthSampleData,
  type RawBankTransaction,
} from '@/services/bankReconciliationEngine';
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

  it('correctly aggregates a month of bank transactions and calculates delta vs plan', () => {
    const { records, transactions } = getThreeMonthSampleData();
    const augRecord = records[0]; // Août 2026

    const recon = buildReconciliationDraft('2026-08', augRecord, transactions);
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

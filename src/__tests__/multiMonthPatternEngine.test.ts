import { describe, it, expect } from 'vitest';
import {
  detectMultiMonthPatterns,
  isEphemeralExpenseKeyword,
  isIncomeMerchant,
  type TargetFlowItem,
} from '@/engines/bankingAnalyzerEngine';

describe('multiMonthPatternEngine', () => {
  const sampleTransactions: TargetFlowItem[] = [
    // August 2026
    { id: 'tx-08-1', date: '2026-08-17', rawTitle: 'PRLV SEPA BPCE ASSURANCES IARD, HABITATION 01', title: 'BPCE Assurances (Habitation)', amount: 22.60 },
    { id: 'tx-08-2', date: '2026-08-12', rawTitle: 'VIR participation epargne commune, M OU MME NEGEM RICHARD', title: 'Participation Épargne Commune (Tontine)', amount: 300.00 },
    { id: 'tx-08-3', date: '2026-08-05', rawTitle: 'PRLV SEPA TotalEnergies Electricite et G', title: 'TotalEnergies (Électricité & Gaz)', amount: 32.00 },
    { id: 'tx-08-4', date: '2026-08-05', rawTitle: 'PRLV SEPA TURREL Baptiste', title: 'Turrel Baptiste', amount: 145.00 },
    { id: 'tx-08-5', date: '2026-08-03', rawTitle: 'PRLV SEPA CDC HABITAT', title: 'CDC Habitat (Loyer)', amount: 612.09 },
    
    // July 2026
    { id: 'tx-07-1', date: '2026-07-31', rawTitle: 'PRLV SEPA BOUYGUES TELECOM (09...)', title: 'Bouygues Telecom (Bbox/Fibre)', amount: 23.99 },
    { id: 'tx-07-2', date: '2026-07-30', rawTitle: 'VIR SEPA Vestas France SAS', title: 'Salaire Vestas France SAS', amount: 2713.74 },
    { id: 'tx-07-3', date: '2026-07-26', rawTitle: 'CARTE Netflix.com', title: 'Netflix.com', amount: 7.99 },
    { id: 'tx-07-4', date: '2026-07-17', rawTitle: 'PRLV SEPA BOUYGUES TELECOM (06...)', title: 'Bouygues Telecom (Mobile)', amount: 7.99 },
    { id: 'tx-07-5', date: '2026-07-15', rawTitle: 'PRLV SEPA BPCE ASSURANCES IARD, HABITATION 01', title: 'BPCE Assurances (Habitation)', amount: 22.60 },
    { id: 'tx-07-6', date: '2026-07-13', rawTitle: 'VIR participation epargne commune', title: 'Participation Épargne Commune (Tontine)', amount: 300.00 },
    { id: 'tx-07-7', date: '2026-07-06', rawTitle: 'PRLV SEPA TURREL Baptiste', title: 'Turrel Baptiste', amount: 145.00 },
    { id: 'tx-07-8', date: '2026-07-06', rawTitle: 'PRLV SEPA TotalEnergies Electricite et G', title: 'TotalEnergies (Électricité & Gaz)', amount: 32.00 },
    { id: 'tx-07-9', date: '2026-07-03', rawTitle: 'PRLV SEPA CDC HABITAT', title: 'CDC Habitat (Loyer)', amount: 612.09 },

    // June 2026
    { id: 'tx-06-1', date: '2026-06-29', rawTitle: 'VIR SEPA Vestas France SAS', title: 'Salaire Vestas France SAS', amount: 2933.68 },
    { id: 'tx-06-2', date: '2026-06-29', rawTitle: 'PRLV SEPA BOUYGUES TELECOM (09...)', title: 'Bouygues Telecom (Bbox/Fibre)', amount: 23.99 },
    { id: 'tx-06-3', date: '2026-06-26', rawTitle: 'CARTE NETFLIX.COM', title: 'Netflix.com', amount: 7.99 },
    { id: 'tx-06-4', date: '2026-06-19', rawTitle: 'PRLV SEPA BOUYGUES TELECOM (06...)', title: 'Bouygues Telecom (Mobile)', amount: 7.99 },
    { id: 'tx-06-5', date: '2026-06-15', rawTitle: 'PRLV SEPA BPCE ASSURANCES IARD, HABITATION 01', title: 'BPCE Assurances (Habitation)', amount: 22.60 },
    { id: 'tx-06-6', date: '2026-06-12', rawTitle: 'VIR participation epargne commune', title: 'Participation Épargne Commune (Tontine)', amount: 300.00 },
    { id: 'tx-06-7', date: '2026-06-05', rawTitle: 'PRLV SEPA TotalEnergies Electricite et G', title: 'TotalEnergies (Électricité & Gaz)', amount: 42.00 },
    { id: 'tx-06-8', date: '2026-06-03', rawTitle: 'PRLV SEPA CDC HABITAT', title: 'CDC Habitat (Loyer)', amount: 612.09 },
  ];

  it('correctly flags ephemeral keywords like Turrel, Dentiste, Alma', () => {
    expect(isEphemeralExpenseKeyword('Turrel Baptiste')).toBe(true);
    expect(isEphemeralExpenseKeyword('Dentiste Lattes')).toBe(true);
    expect(isEphemeralExpenseKeyword('Klarna')).toBe(true);
    expect(isEphemeralExpenseKeyword('CDC Habitat')).toBe(false);
  });

  it('correctly filters out salary and income from tariff changes', () => {
    expect(isIncomeMerchant('Salaire Vestas France SAS')).toBe(true);
    expect(isIncomeMerchant('TotalEnergies')).toBe(false);
  });

  it('detects Dr Turrel as an ephemeral recurring expense with 95% confidence and 12-month schedule', () => {
    const insights = detectMultiMonthPatterns(sampleTransactions);
    const turrelInsight = insights.find((i) => i.merchant.toUpperCase().includes('TURREL'));

    expect(turrelInsight).toBeDefined();
    expect(turrelInsight?.type).toBe('EPHEMERAL_RECURRING');
    expect(turrelInsight?.confidenceScore).toBe(0.95);
    expect(turrelInsight?.currentMonthlyAmount).toBe(145.00);
    expect(turrelInsight?.suggestedDurationMonths).toBe(12);
    expect(turrelInsight?.startPeriod).toBe('2026-07');
    expect(turrelInsight?.primaryActionType).toBe('ADD_TEMPORARY');
  });

  it('detects TotalEnergies tariff change from 42€ in June to 32€ in July/August (-10€ delta)', () => {
    const insights = detectMultiMonthPatterns(sampleTransactions);
    const totalEnergiesInsight = insights.find((i) => i.merchant.toUpperCase().includes('TOTALENERGIES'));

    expect(totalEnergiesInsight).toBeDefined();
    expect(totalEnergiesInsight?.type).toBe('TARIFF_CHANGE');
    expect(totalEnergiesInsight?.confidenceScore).toBe(0.92);
    expect(totalEnergiesInsight?.previousMonthlyAmount).toBe(42.00);
    expect(totalEnergiesInsight?.currentMonthlyAmount).toBe(32.00);
    expect(totalEnergiesInsight?.deltaMonthlyAmount).toBe(-10.00);
    expect(totalEnergiesInsight?.primaryActionType).toBe('APPLY_TARIFF_CHANGE');
  });
});

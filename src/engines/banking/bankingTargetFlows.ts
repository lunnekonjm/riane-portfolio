import { cleanTransactionTitle } from '@/services/reconciliation/transactionClassifier';
import {
  type AuraWizardLearningMemory,
  isMerchantOrTxRejected,
} from '@/services/banking/auraWizardMemoryService';

export interface TargetFlowItem {
  id: string;
  date: string;
  title: string;
  rawTitle?: string;
  amount: number;
  category?: string;
  accountId?: string;
  accountName?: string;
  accountType?: string;
}

export interface TargetFlowCategory {
  key: string;
  label: string;
  totalAmount: number;
  monthlyAverage: number;
  effectivePercent: number; // % of net salary
  transactions: TargetFlowItem[];
  iconType: string;
  color: string;
}

export interface BankTargetAnalysisSummary {
  periodDays: number;
  periodLabel: string;
  totalOutflows: number;
  pea: TargetFlowCategory;
  livretA: TargetFlowCategory;
  loyer: TargetFlowCategory;
  abonnement: TargetFlowCategory;
  tontine: TargetFlowCategory;
  soutien: TargetFlowCategory;
  revolut: TargetFlowCategory;
  unclassified: TargetFlowCategory;
}

export const SAMPLE_REAL_TRANSACTIONS: TargetFlowItem[] = [
  { id: '1', date: '2026-08-05', title: 'PRLV SEPA CDC HABITAT REF 883920', amount: -757.09, category: 'Logement' },
  { id: '2', date: '2026-08-06', title: 'VIR SEPA BOURSO PEA DCA ETF WORLD', amount: -400.0, category: 'Investissement' },
  { id: '3', date: '2026-08-06', title: 'VIR SEPA LIVRET A BOURSOBANK', amount: -700.0, category: 'Épargne' },
  { id: '4', date: '2026-08-08', title: 'PRLV SEPA BOUYGUES TELECOM', amount: -35.99, category: 'Abonnement' },
  { id: '5', date: '2026-08-10', title: 'PRLV SEPA SENDWAVE SOUTIEN FAMILLE', amount: -200.0, category: 'Soutien' },
  { id: '6', date: '2026-08-12', title: 'TOPUP REVOLUT CARTE', amount: -200.0, category: 'Dépenses' },
  { id: '7', date: '2026-08-14', title: 'VIR SEPA PARTICIPATION EPARGNE COMMUNE TONTINE', amount: -150.0, category: 'Tontine' },
];

/**
 * Filter transactions by timeframe in days from the latest date in the dataset
 */
export function filterTransactionsByPeriod(
  transactions: TargetFlowItem[],
  days: number
): TargetFlowItem[] {
  if (!Array.isArray(transactions) || transactions.length === 0) return [];
  if (days <= 0) return transactions; // 0 means all

  // Find the most recent transaction date
  let maxTimestamp = 0;
  for (const t of transactions) {
    if (t.date) {
      const ts = new Date(t.date).getTime();
      if (!isNaN(ts) && ts > maxTimestamp) maxTimestamp = ts;
    }
  }

  if (maxTimestamp === 0) return transactions;

  const minTimestamp = maxTimestamp - days * 24 * 60 * 60 * 1000;
  return transactions.filter((t) => {
    if (!t.date) return true;
    const ts = new Date(t.date).getTime();
    if (isNaN(ts)) return true; // Keep transactions with unparseable/invalid dates
    return ts >= minTimestamp;
  });
}

/**
 * Analyze banking transactions to map them to the 7 core target budget flows
 */
export function analyzeTargetFlows(
  transactions: TargetFlowItem[],
  netSalary: number = 2713.74,
  periodDays: number = 30,
  memory?: AuraWizardLearningMemory
): BankTargetAnalysisSummary {
  const filtered = filterTransactionsByPeriod(transactions, periodDays);

  const peaTxs: TargetFlowItem[] = [];
  const livretATxs: TargetFlowItem[] = [];
  const loyerTxs: TargetFlowItem[] = [];
  const abonnementTxs: TargetFlowItem[] = [];
  const tontineTxs: TargetFlowItem[] = [];
  const soutienTxs: TargetFlowItem[] = [];
  const revolutTxs: TargetFlowItem[] = [];
  const unclassifiedTxs: TargetFlowItem[] = [];

  const hasNegativeAmounts = filtered.some((t) => typeof t.amount === 'number' && t.amount < 0);

  for (const rawTx of filtered) {
    const rawDesc = rawTx.rawTitle || rawTx.title || '';
    const cleanTitle = cleanTransactionTitle(rawDesc);
    const tx: TargetFlowItem = {
      ...rawTx,
      title: cleanTitle,
      rawTitle: rawDesc,
    };

    const upper = (rawDesc + ' ' + (tx.category || '')).toUpperCase();

    // Check if this is an inflow (credit received, salary, refund)
    const isExplicitInflow =
      upper.includes('VIR RECU') ||
      upper.includes('VIREMENT RECU') ||
      upper.includes('RECU DE') ||
      upper.includes('SALAIRE') ||
      upper.includes('PAYE') ||
      upper.includes('PAIE') ||
      upper.includes('REMBOURSEMENT') ||
      upper.includes('AVOIR') ||
      upper.includes('RESTITUTION');

    // Only debits/outflows should be categorized into expense/budget flows
    const isOutflow = hasNegativeAmounts
      ? (typeof tx.amount === 'number' && tx.amount < 0)
      : (!isExplicitInflow && typeof tx.amount === 'number' && Math.abs(tx.amount) > 0);

    if (!isOutflow) {
      unclassifiedTxs.push(tx);
      continue;
    }

    // Check learned memory custom mappings first
    if (memory?.customCategoryMappings) {
      const customCand = memory.customCategoryMappings[cleanTitle] || memory.customCategoryMappings[rawDesc];
      if (customCand) {
        if (customCand === 'flow-loyer') { loyerTxs.push(tx); continue; }
        if (customCand === 'flow-abonnement') { abonnementTxs.push(tx); continue; }
        if (customCand === 'flow-tontine') { tontineTxs.push(tx); continue; }
        if (customCand === 'flow-soutien') { soutienTxs.push(tx); continue; }
        if (customCand === 'flow-pea') { peaTxs.push(tx); continue; }
        if (customCand === 'flow-livret_a') { livretATxs.push(tx); continue; }
        if (customCand === 'flow-revolut') { revolutTxs.push(tx); continue; }
      }
    }

    // 1. Soutien familial (Wave, Remitly, Sendwave) - Exclude Monsieur Pene or non-family transfers
    if (
      (upper.includes('SENDWAVE') ||
       upper.includes('WAVE') ||
       upper.includes('REMITLY') ||
       upper.includes('SOUTIEN FAMILIAL') ||
       upper.includes('AIDE FAMILLE')) &&
      !isMerchantOrTxRejected(tx, 'soutien', memory)
    ) {
      soutienTxs.push(tx);
      continue;
    }

    // 2. Revolut (Transferts Reste à vivre)
    if (
      (upper.includes('REVOLUT') || upper.includes('REV*') || upper.includes('TOPUP')) &&
      !isMerchantOrTxRejected(tx, 'revolut', memory)
    ) {
      revolutTxs.push(tx);
      continue;
    }

    // 3. Tontine & participation collective
    if (
      (upper.includes('TONTINE') ||
       upper.includes('EPARGNE COMMUNE') ||
       upper.includes('PARTICIPATION EPARGNE COMMUNE') ||
       upper.includes('EPARGNE COLLECTIVE') ||
       upper.includes('CISSE ATOUMANE')) &&
      !isMerchantOrTxRejected(tx, 'tontine', memory)
    ) {
      tontineTxs.push(tx);
      continue;
    }

    // 4. Loyer & Logement (CDC Habitat, BPCE Habitation, TotalEnergies, EDF, Engie, Assurances Habitation)
    if (
      (upper.includes('CDC HABITAT') ||
       upper.includes('LOYER') ||
       upper.includes('FONCIA') ||
       upper.includes('NEXITY') ||
       upper.includes('BAILLEUR') ||
       upper.includes('LOGEMENT') ||
       upper.includes('BPCE') ||
       upper.includes('HABITATION') ||
       upper.includes('ASSURANCE HABITATION') ||
       upper.includes('TAXE HABITATION') ||
       upper.includes('TOTALENERGIES') ||
       upper.includes('TOTAL ENERGIES') ||
       upper.includes('EDF') ||
       upper.includes('ENGIE') ||
       upper.includes('PACIFICA') ||
       upper.includes('MACIF') ||
       upper.includes('MAIF') ||
       upper.includes('AXA') ||
       upper.includes('ALLIANZ') ||
       upper.includes('MATMUT')) &&
      !isMerchantOrTxRejected(tx, 'loyer', memory)
    ) {
      loyerTxs.push(tx);
      continue;
    }

    // 5. PEA & Bourse (Virements réguliers d'investissement)
    if (
      (upper.includes('PEA') ||
       upper.includes('BOURSE') ||
       upper.includes('ETF WORLD') ||
       upper.includes('INVEST') ||
       upper.includes('TITRES')) &&
      !isMerchantOrTxRejected(tx, 'pea', memory)
    ) {
      peaTxs.push(tx);
      continue;
    }

    // 6. Livret A & Épargne de précaution
    if (
      (upper.includes('LIVRET A') ||
       upper.includes('LIVRET') ||
       upper.includes('LDDS') ||
       upper.includes('LEP')) &&
      !isMerchantOrTxRejected(tx, 'livret_a', memory)
    ) {
      livretATxs.push(tx);
      continue;
    }

    // 7. Abonnements Télécom / Médias / Services récurrents
    if (
      (upper.includes('BOUYGUES') ||
       upper.includes('BBOX') ||
       upper.includes('FREE MOBILE') ||
       upper.includes('FREE TELECOM') ||
       upper.includes('FREEBOX') ||
       upper.includes('ORANGE') ||
       upper.includes('SFR') ||
       upper.includes('SPOTIFY') ||
       upper.includes('NETFLIX') ||
       upper.includes('AMAZON PRIME') ||
       upper.includes('PRIME VIDEO') ||
       upper.includes('APPLE.COM/BILL') ||
       upper.includes('ICLOUD') ||
       upper.includes('ITUNES') ||
       upper.includes('CHATGPT') ||
       upper.includes('OPENAI') ||
       upper.includes('ABONNEMENT')) &&
      !isMerchantOrTxRejected(tx, 'abonnement', memory)
    ) {
      abonnementTxs.push(tx);
      continue;
    }

    // Otherwise it's unclassified (daily card spending, shopping, one-off purchases)
    unclassifiedTxs.push(tx);
  }

  const divisor = periodDays <= 31 ? 1.0 : periodDays / 30.0;
  const sumList = (list: TargetFlowItem[]) =>
    Array.isArray(list)
      ? list.reduce((sum, t) => sum + (typeof t?.amount === 'number' && !isNaN(t.amount) ? Math.abs(t.amount) : 0), 0)
      : 0;

  const buildCat = (
    key: string,
    label: string,
    list: TargetFlowItem[],
    iconType: string,
    color: string
  ): TargetFlowCategory => {
    const total = sumList(list);
    const monthly = total / divisor;
    const effectivePercent = netSalary > 0 ? (monthly / netSalary) * 100 : 0;
    return {
      key,
      label,
      totalAmount: Math.round(total * 100) / 100,
      monthlyAverage: Math.round(monthly * 100) / 100,
      effectivePercent: Math.round(effectivePercent * 10) / 10,
      transactions: list,
      iconType,
      color,
    };
  };

  const pea = buildCat('pea', 'Cible PEA', peaTxs, 'chart', '#06b6d4');
  const livretA = buildCat('livret_a', 'Livret A', livretATxs, 'shield', '#3b82f6');
  const loyer = buildCat('loyer', 'Loyer & Logement', loyerTxs, 'home', '#f43f5e');
  const abonnement = buildCat('abonnement', 'Abonnements', abonnementTxs, 'video', '#f43f5e');
  const tontine = buildCat('tontine', 'Tontine', tontineTxs, 'people', '#8b5cf6');
  const soutien = buildCat('soutien', 'Soutien familial (Wave)', soutienTxs, 'heart', '#f43f5e');
  const revolut = buildCat('revolut', 'Revolut (Reste à vivre)', revolutTxs, 'card', '#06b6d4');
  const unclassified = buildCat('unclassified', 'Autres flux non classés', unclassifiedTxs, 'help', '#94a3b8');

  const totalOutflows =
    pea.monthlyAverage +
    livretA.monthlyAverage +
    loyer.monthlyAverage +
    abonnement.monthlyAverage +
    tontine.monthlyAverage +
    soutien.monthlyAverage +
    revolut.monthlyAverage;

  const periodLabel =
    periodDays === 30
      ? 'Dernier mois (30j)'
      : periodDays === 90
      ? 'Moyenne 3 mois (90j)'
      : 'Tout';

  return {
    periodDays,
    periodLabel,
    totalOutflows: Math.round(totalOutflows * 100) / 100,
    pea,
    livretA,
    loyer,
    abonnement,
    tontine,
    soutien,
    revolut,
    unclassified,
  };
}

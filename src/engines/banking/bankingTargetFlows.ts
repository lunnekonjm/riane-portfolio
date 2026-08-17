import type { AuraWizardLearningMemory } from '@/services/banking/auraWizardMemoryService';
import { cleanFrenchMerchantName } from '@/utils/bankingSanitizer';

export interface TargetFlowItem {
  id?: string;
  date?: string;
  title: string;
  rawTitle?: string;
  amount: number;
  rawAmount?: number;
  category?: string;
  accountName?: string;
  accountType?: string;
  accountId?: string;
  isCustomExcluded?: boolean;
}

export interface TargetFlowCategory {
  key: string;
  label: string;
  totalAmount: number;
  monthlyAverage: number;
  effectivePercent: number;
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

/**
 * Standard reference sample transactions for testing and fallback budget simulations
 */
export const SAMPLE_REAL_TRANSACTIONS: TargetFlowItem[] = [
  { id: 'tx-cdc', date: '2026-07-05', title: 'PRLV SEPA CDC HABITAT REF 883920', amount: 757.09, category: 'Logement' },
  { id: 'tx-pea', date: '2026-07-06', title: 'VIR SEPA BOURSO PEA DCA ETF WORLD', amount: 400.00, category: 'Investissement' },
  { id: 'tx-livret', date: '2026-07-06', title: 'VIR SEPA LIVRET A BOURSOBANK', amount: 700.00, category: 'Épargne' },
  { id: 'tx-bouygues', date: '2026-07-10', title: 'PRLV SEPA BOUYGUES TELECOM', amount: 35.99, category: 'Abonnements' },
  { id: 'tx-soutien', date: '2026-07-15', title: 'PRLV SEPA SENDWAVE SOUTIEN FAMILLE', amount: 200.00, category: 'Soutien' },
  { id: 'tx-tontine', date: '2026-07-15', title: 'VIR SEPA TONTINE FAMILIALE', amount: 150.00, category: 'Tontine' },
  { id: 'tx-rev', date: '2026-07-20', title: 'TOPUP REVOLUT CARTE', amount: 200.00, category: 'Reste à vivre' },
];

/**
 * Normalizes and cleans transaction titles for accurate classification
 */
export function cleanTransactionTitle(rawTitle: string): string {
  return cleanFrenchMerchantName(rawTitle);
}

/**
 * Checks if a transaction is excluded or re-assigned by the AI memory
 */
function isMerchantOrTxRejected(
  tx: TargetFlowItem,
  categoryKey: string,
  memory?: AuraWizardLearningMemory
): boolean {
  if (!memory) return false;
  const rawDesc = (tx.rawTitle || tx.title || '').trim().toUpperCase();
  const cleanTitle = cleanTransactionTitle(rawDesc).toUpperCase();

  // 1. Check excluded tx signatures
  const amt = Math.abs(tx.amount || 0).toFixed(2);
  const date = (tx.date || '').slice(0, 10);
  const sig = `${date}:${rawDesc}:${amt}`;
  if (memory.excludedTxSignatures?.includes(sig)) return true;

  // 2. Check rejected merchant patterns
  if (memory.rejectedMerchantPatterns?.length) {
    const isMatched = memory.rejectedMerchantPatterns.some((rule) => {
      if (rule.categoryKey && rule.categoryKey !== 'ALL' && rule.categoryKey !== categoryKey) {
        return false;
      }
      return rawDesc.includes(rule.pattern) || cleanTitle.includes(rule.pattern);
    });
    if (isMatched) return true;
  }

  return false;
}

/**
 * Filter transactions by timeframe:
 * - 30: Dernier mois civil complet (ex: 1er au 31 juillet quand août est en cours)
 * - 31: Mois en cours (ex: 1er au 17 août)
 * - 90: Moyenne 3 derniers mois civils complets
 * - 300: 30 jours glissants
 * - 0: Tout l'historique
 */
export function filterTransactionsByPeriod(
  transactions: TargetFlowItem[],
  days: number = 30
): { filtered: TargetFlowItem[]; periodLabel: string; divisor: number } {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return { filtered: [], periodLabel: 'Aucune donnée', divisor: 1 };
  }

  const validDates = transactions
    .map((t) => t.date)
    .filter((d): d is string => Boolean(d && typeof d === 'string' && d.length >= 7 && !isNaN(new Date(d).getTime())))
    .sort();

  if (validDates.length === 0) {
    return { filtered: transactions, periodLabel: 'Toutes les transactions', divisor: 1 };
  }

  const latestDateStr = validDates[validDates.length - 1];
  const latestDate = new Date(latestDateStr);
  const distinctMonths = Array.from(new Set(validDates.map((d) => d.substring(0, 7)))).sort().reverse();
  const monthNamesFr = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const formatMonthName = (mStr: string) => {
    const [y, m] = mStr.split('-');
    const name = monthNamesFr[parseInt(m, 10) - 1] || mStr;
    return `${name} ${y}`;
  };

  if (days === 0) {
    const divisor = Math.max(1, distinctMonths.length);
    return {
      filtered: transactions,
      periodLabel: `Toutes les transactions (${divisor} mois)`,
      divisor,
    };
  }

  if (days === 30) {
    // Mode: Dernier mois civil complet (ex: 1er au 31 juillet si le mois d'août est en cours)
    const targetMonth = distinctMonths.length > 1 && latestDate.getDate() < 28
      ? distinctMonths[1]
      : distinctMonths[0];

    const filtered = transactions.filter((t) => {
      const d = t.date;
      if (!d || isNaN(new Date(d).getTime())) return true;
      return d.startsWith(targetMonth);
    });
    const label = `${formatMonthName(targetMonth)} (Mois complet)`;
    return { filtered, periodLabel: label, divisor: 1 };
  }

  if (days === 31) {
    // Mode: Mois en cours (ex: Août 2026)
    const targetMonth = distinctMonths[0];
    const filtered = transactions.filter((t) => {
      const d = t.date;
      if (!d || isNaN(new Date(d).getTime())) return true;
      return d.startsWith(targetMonth);
    });
    const label = `${formatMonthName(targetMonth)} (En cours)`;
    return { filtered, periodLabel: label, divisor: 1 };
  }

  if (days === 90) {
    // Mode: 3 derniers mois complets (Moyenne)
    const targetMonths = distinctMonths.length > 3 && latestDate.getDate() < 28
      ? distinctMonths.slice(1, 4)
      : distinctMonths.slice(0, 3);

    const filtered = transactions.filter((t) => {
      const d = t.date;
      if (!d || isNaN(new Date(d).getTime())) return true;
      return targetMonths.some((m) => d.startsWith(m));
    });
    const count = Math.max(1, targetMonths.length);
    const startM = targetMonths[targetMonths.length - 1];
    const endM = targetMonths[0];
    const label = `Moyenne ${count} mois (${formatMonthName(startM)} - ${formatMonthName(endM)})`;
    return { filtered, periodLabel: label, divisor: count };
  }

  if (days === 300) {
    // Mode: 30 jours glissants (Temps réel)
    const maxTs = latestDate.getTime();
    const minTs = maxTs - 30 * 24 * 60 * 60 * 1000;
    const filtered = transactions.filter((t) => {
      if (!t.date) return true;
      const ts = new Date(t.date).getTime();
      return isNaN(ts) || ts >= minTs;
    });
    return { filtered, periodLabel: '30 jours glissants', divisor: 1 };
  }

  // Fallback: window by N days
  const maxTs = latestDate.getTime();
  const minTs = maxTs - days * 24 * 60 * 60 * 1000;
  const filtered = transactions.filter((t) => {
    if (!t.date) return true;
    const ts = new Date(t.date).getTime();
    return isNaN(ts) || ts >= minTs;
  });
  return { filtered, periodLabel: `${days} jours`, divisor: 1 };
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
  const { filtered, periodLabel, divisor } = filterTransactionsByPeriod(transactions, periodDays);

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
    // Inflows (credits, salary, incoming transfers from family/sister) must NEVER be counted as expense candidates!
    const isOutflow = typeof tx.rawAmount === 'number'
      ? tx.rawAmount < 0
      : hasNegativeAmounts
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
       upper.includes('TOTALENERGIES') ||
       upper.includes('EDF') ||
       upper.includes('ENGIE')) &&
      !isMerchantOrTxRejected(tx, 'loyer', memory)
    ) {
      loyerTxs.push(tx);
      continue;
    }

    // 5. PEA (Plan d'Epargne en Actions / Bourse / DCA ETF World)
    if (
      (upper.includes('PEA') ||
       upper.includes('BOURSO PEA') ||
       upper.includes('DCA ETF') ||
       upper.includes('ETF WORLD') ||
       upper.includes('TRADE REPUBLIC') ||
       upper.includes('DEGIRO') ||
       upper.includes('BOURSE')) &&
      !isMerchantOrTxRejected(tx, 'pea', memory)
    ) {
      peaTxs.push(tx);
      continue;
    }

    // 6. Livret A / Epargne de précaution
    if (
      (upper.includes('LIVRET A') ||
       upper.includes('EPARGNE DE PRECAUTION') ||
       upper.includes('LIVRET PRECAUTION') ||
       upper.includes('LIVRET DEVELOPPEMENT DURABLE') ||
       upper.includes('LDDS')) &&
      !isMerchantOrTxRejected(tx, 'livret_a', memory)
    ) {
      livretATxs.push(tx);
      continue;
    }

    // 7. Abonnements & Services récurrents (Bbox, Bouygues, Free, Orange, SFR, Netflix, Spotify, iCloud, Canal+)
    if (
      (upper.includes('BOUYGUES') ||
       upper.includes('BBOX') ||
       upper.includes('FREE ') ||
       upper.includes('ORANGE ') ||
       upper.includes('SFR ') ||
       upper.includes('NETFLIX') ||
       upper.includes('SPOTIFY') ||
       upper.includes('APPLE.COM/BILL') ||
       upper.includes('ICLOUD') ||
       upper.includes('AMAZON PRIME') ||
       upper.includes('CANAL+') ||
       upper.includes('DISNEY') ||
       upper.includes('CHATGPT') ||
       upper.includes('OPENAI')) &&
      !isMerchantOrTxRejected(tx, 'abonnement', memory)
    ) {
      abonnementTxs.push(tx);
      continue;
    }

    // Otherwise it's unclassified (daily card spending, shopping, one-off purchases)
    unclassifiedTxs.push(tx);
  }

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

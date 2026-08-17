export interface TargetFlowItem {
  id: string;
  date: string;
  title: string;
  amount: number;
  category?: string;
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

// Sample fallback transactions matching BoursoBank statement reality from Aura Budget Pro
export const SAMPLE_REAL_TRANSACTIONS: TargetFlowItem[] = [
  { id: 'tx-1', date: '2026-08-05', title: 'PRLV SEPA CDC HABITAT REF 883920', amount: 757.09, category: 'Logement' },
  { id: 'tx-2', date: '2026-08-04', title: 'VIR SEPA BOURSO PEA DCA ETF WORLD', amount: 400.0, category: 'Investissement' },
  { id: 'tx-3', date: '2026-08-03', title: 'VIR SEPA LIVRET A BOURSOBANK', amount: 700.0, category: 'Épargne' },
  { id: 'tx-4', date: '2026-08-02', title: 'PRLV SEPA SENDWAVE SOUTIEN FAMILLE', amount: 230.16, category: 'Soutien familial' },
  { id: 'tx-5', date: '2026-08-02', title: 'TOPUP REVOLUT CARTE', amount: 200.0, category: 'Revolut' },
  { id: 'tx-6', date: '2026-08-01', title: 'PRLV SEPA BOUYGUES TELECOM', amount: 35.99, category: 'Abonnements' },
];

/**
 * Analyse des 7 flux cibles : PEA, Livret A, Loyer, Abonnements, Tontine, Soutien Wave, Revolut
 */
export function analyzeTargetFlows(
  transactions: TargetFlowItem[],
  netSalary: number,
  periodDays: number = 30
): BankTargetAnalysisSummary {
  const txSource = Array.isArray(transactions) ? transactions : [];

  const now = new Date();
  const cutoffTime = periodDays > 0 ? now.getTime() - periodDays * 24 * 60 * 60 * 1000 : 0;

  const filtered = txSource.filter((t) => {
    if (!t) return false;
    if (periodDays <= 0) return true;
    const tTime = t.date ? new Date(t.date).getTime() : NaN;
    return isNaN(tTime) || tTime >= cutoffTime;
  });

  const peaTxs: TargetFlowItem[] = [];
  const livretATxs: TargetFlowItem[] = [];
  const loyerTxs: TargetFlowItem[] = [];
  const abonnementTxs: TargetFlowItem[] = [];
  const tontineTxs: TargetFlowItem[] = [];
  const soutienTxs: TargetFlowItem[] = [];
  const revolutTxs: TargetFlowItem[] = [];
  const unclassifiedTxs: TargetFlowItem[] = [];

  for (const tx of filtered) {
    const upper = ((tx?.title || '') + ' ' + (tx?.category || '')).toUpperCase();

    if (
      upper.includes('SENDWAVE') ||
      upper.includes('WAVE') ||
      upper.includes('REMITLY') ||
      upper.includes('SOUTIEN') ||
      upper.includes('FAMILLE')
    ) {
      soutienTxs.push(tx);
      continue;
    }

    if (upper.includes('REVOLUT') || upper.includes('REV*') || upper.includes('TOPUP')) {
      revolutTxs.push(tx);
      continue;
    }

    if (upper.includes('TONTINE') || upper.includes('EPARGNE COLLECTIVE')) {
      tontineTxs.push(tx);
      continue;
    }

    if (
      upper.includes('CDC HABITAT') ||
      upper.includes('LOYER') ||
      upper.includes('FONCIA') ||
      upper.includes('NEXITY') ||
      upper.includes('BAILLEUR') ||
      upper.includes('LOGEMENT')
    ) {
      loyerTxs.push(tx);
      continue;
    }

    if (
      upper.includes('PEA') ||
      upper.includes('BOURSE') ||
      upper.includes('ETF WORLD') ||
      upper.includes('INVEST') ||
      upper.includes('TITRES')
    ) {
      peaTxs.push(tx);
      continue;
    }

    if (
      upper.includes('LIVRET A') ||
      upper.includes('LIVRET') ||
      upper.includes('LDDS') ||
      upper.includes('LEP')
    ) {
      livretATxs.push(tx);
      continue;
    }

    if (
      upper.includes('BOUYGUES') ||
      upper.includes('FREE') ||
      upper.includes('ORANGE') ||
      upper.includes('SFR') ||
      upper.includes('SPOTIFY') ||
      upper.includes('NETFLIX') ||
      upper.includes('EDF') ||
      upper.includes('ENGIE') ||
      upper.includes('TOTALENERGIES') ||
      upper.includes('AMAZON') ||
      upper.includes('APPLE') ||
      upper.includes('ABONNEMENT')
    ) {
      abonnementTxs.push(tx);
      continue;
    }

    // Otherwise it's unclassified
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

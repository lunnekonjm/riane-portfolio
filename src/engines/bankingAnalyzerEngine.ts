/**
 * Moteur d'Analyse Bancaire & Détection des 7 Cibles Clés
 * Porté fidèlement depuis BankingAnalyzerService (Flutter Aura Budget Pro)
 */

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

export interface TemporaryExpenseItem {
  id: string;
  label: string;
  monthlyAmount: number;
  startPeriod: string; // YYYY-MM
  durationMonths: number;
  category?: string;
}

export function computeEndPeriod(startPeriod: string, durationMonths: number): string {
  try {
    const parts = startPeriod.split('-');
    if (parts.length < 2) return startPeriod;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const totalMonths = month - 1 + durationMonths - 1;
    const endYear = year + Math.floor(totalMonths / 12);
    const endMonth = (totalMonths % 12) + 1;
    return `${endYear}-${String(endMonth).padStart(2, '0')}`;
  } catch {
    return startPeriod;
  }
}

export function isExpenseActiveForPeriod(expense: TemporaryExpenseItem, period: string): boolean {
  const end = computeEndPeriod(expense.startPeriod, expense.durationMonths);
  return period >= expense.startPeriod && period <= end;
}

// Sample fallback transactions matching BoursoBank statement reality from Aura Budget Pro
export const SAMPLE_REAL_TRANSACTIONS: TargetFlowItem[] = [
  { id: 'tx-1', date: '2026-08-05', title: 'PRLV SEPA CDC HABITAT REF 883920', amount: 757.09, category: 'Logement' },
  { id: 'tx-2', date: '2026-08-04', title: 'VIR SEPA BOURSO PEA DCA ETF WORLD', amount: 400.0, category: 'Investissement' },
  { id: 'tx-3', date: '2026-08-03', title: 'VIR SEPA LIVRET A BOURSOBANK', amount: 700.0, category: 'Épargne' },
  { id: 'tx-4', date: '2026-08-02', title: 'PRLV SEPA SENDWAVE SOUTIEN FAMILLE', amount: 230.16, category: 'Soutien familial' },
  { id: 'tx-5', date: '2026-08-02', title: 'TOPUP REVOLUT CARTE', amount: 200.0, category: 'Revolut' },
  { id: 'tx-6', date: '2026-08-01', title: 'PRLV SEPA BOUYGUES TELECOM', amount: 35.99, category: 'Abonnements' },
  { id: 'tx-7', date: '2026-08-01', title: 'PRLV SEPA SPOTIFY PREMIUM', amount: 17.99, category: 'Abonnements' },
  { id: 'tx-8', date: '2026-08-01', title: 'PRLV SEPA NETFLIX STANDARD', amount: 10.0, category: 'Abonnements' },
];

export function cleanFrenchMerchantName(raw?: string | null): string {
  let name = (raw || '').toUpperCase();
  name = name.replace(/^(PRLV\s+SEPA|VIR\s+SEPA|PRLV|VIR|CB|PAIEMENT|FACTURE|RETRAIT|CARTE)\s*(\d{2}\/\d{2})?\s*/i, '');
  name = name.replace(/^(DU|LE|POUR)\s+\d{2}\/\d{2}(\/\d{2,4})?\s*/i, '');
  name = name.replace(/,\s*(CACP|RUM|REF|EMETTEUR|ID|CONTRAT|FACTURE|TIERS|DOSSIER|\d{4,}).*$/i, '');
  name = name.replace(/\b(CACP|RUM|REF|EMETTEUR|ID|NOT|CONTRAT|FACTURE|DOSSIER|TIERS)\s*[:.\s]\s*\S+.*$/i, '');
  name = name.replace(/\b\d{2}\/\d{2}(\/\d{2,4})?/g, '');
  name = name.replace(/[-_/]/g, ' ');
  name = name.replace(/\s+/g, ' ').trim();

  if (name.includes('CDC HABITAT')) return 'CDC Habitat (Loyer)';
  if (name.includes('TURREL')) return 'Turrel Baptiste';
  if (name.includes('SENDWAVE')) return 'Sendwave (Soutien familial)';
  if (name.includes('BOUYGUES')) return 'Bouygues Telecom';
  if (name.includes('SPOTIFY')) return 'Spotify';
  if (name.includes('NETFLIX')) return 'Netflix';
  if (name.includes('REVOLUT')) return 'Revolut';
  if (name.includes('PEA')) return 'Bourse PEA';
  if (name.includes('LIVRET')) return 'Livret A';
  return name || 'Prélèvement Récurrent';
}

/**
 * Analyse des 7 flux cibles : PEA, Livret A, Loyer, Abonnements, Tontine, Soutien Wave, Revolut
 */
export function analyzeTargetFlows(
  transactions: TargetFlowItem[],
  netSalary: number,
  periodDays: number = 30
): BankTargetAnalysisSummary {
  const txSource = Array.isArray(transactions) && transactions.length > 0 ? transactions : SAMPLE_REAL_TRANSACTIONS;

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
      upper.includes('TURREL') ||
      upper.includes('LOYER') ||
      upper.includes('FONCIA') ||
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

export interface DetectedFlowCandidate {
  id: string;
  categoryKey: string;
  pillar: 'FIXED' | 'SAVINGS' | 'DAILY' | 'TEMPORARY';
  title: string;
  subtitle: string;
  detectedMonthlyAmount: number;
  isPercentage: boolean;
  defaultPercentage: number;
  transactions: TargetFlowItem[];
  calculationFormula: string;
  explanation: string;
  isVirementEpargne?: boolean;
  defaultSelected: boolean;
  icon: string;
  color: string;
  durationMonths?: number;
  startPeriod?: string;
}

export function detectTemporaryObligations(
  transactions: TargetFlowItem[],
  existingExpenses: TemporaryExpenseItem[] = []
): TemporaryExpenseItem[] {
  const existingLabels = existingExpenses.map((e) => e.label.toUpperCase());
  const detected: TemporaryExpenseItem[] = [];

  for (const tx of transactions) {
    const upper = (tx.title + ' ' + (tx.category || '')).toUpperCase();
    const amount = Math.abs(tx.amount);

    // 1. Health / Dental treatments
    if (upper.includes('DENT') || upper.includes('ORTHO') || upper.includes('CLINIQUE') || upper.includes('HOPITAL') || upper.includes('LATTES')) {
      if (amount >= 50 && !existingLabels.some((l) => l.includes('DENT') || l.includes('ORTHO') || l.includes('SANTE'))) {
        const id = `temp-dent-${tx.id || Math.random().toString(36).slice(2, 6)}`;
        if (!detected.some((d) => d.label.includes('Dentiste') || d.label.includes('Orthodontie'))) {
          detected.push({
            id,
            label: 'Dentiste / Soins orthodontiques',
            monthlyAmount: Math.round(amount * 100) / 100,
            startPeriod: tx.date ? tx.date.slice(0, 7) : new Date().toISOString().slice(0, 7),
            durationMonths: 4,
            category: 'Santé',
          });
        }
      }
    }

    // 2. Specific housing installments (e.g. Turrel)
    if (upper.includes('TURREL')) {
      if (!existingLabels.some((l) => l.includes('TURREL'))) {
        const id = `temp-turrel-${tx.id || Math.random().toString(36).slice(2, 6)}`;
        if (!detected.some((d) => d.label.includes('Turrel'))) {
          detected.push({
            id,
            label: 'Turrel Baptiste',
            monthlyAmount: Math.round(amount * 100) / 100,
            startPeriod: tx.date ? tx.date.slice(0, 7) : new Date().toISOString().slice(0, 7),
            durationMonths: 10,
            category: 'Logement',
          });
        }
      }
    }

    // 3. BNPL Split payments (Klarna, Alma, Floa, 3x/4x)
    if (upper.includes('KLARNA') || upper.includes('ALMA') || upper.includes('FLOA') || upper.includes('3X') || upper.includes('4X') || upper.includes('SOFINCO')) {
      const matchLabel = upper.includes('KLARNA') ? 'Klarna (Paiement 3x)' : upper.includes('ALMA') ? 'Alma (Paiement 3x/4x)' : 'Paiement fractionné (3x/4x)';
      if (!existingLabels.some((l) => l.includes(matchLabel.toUpperCase()))) {
        const id = `temp-bnpl-${tx.id || Math.random().toString(36).slice(2, 6)}`;
        if (!detected.some((d) => d.label === matchLabel)) {
          detected.push({
            id,
            label: matchLabel,
            monthlyAmount: Math.round(amount * 100) / 100,
            startPeriod: tx.date ? tx.date.slice(0, 7) : new Date().toISOString().slice(0, 7),
            durationMonths: 3,
            category: 'Échéancier',
          });
        }
      }
    }
  }

  return detected;
}

export function buildInteractiveFlowCandidates(
  summary: BankTargetAnalysisSummary,
  tempObligations: TemporaryExpenseItem[] = [],
  netSalary: number = 2713.74
): DetectedFlowCandidate[] {
  const candidates: DetectedFlowCandidate[] = [];

  const fmtEur = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

  // 1. Loyer CDC Habitat
  const hasLoyer = summary.loyer.transactions.length > 0 || summary.loyer.monthlyAverage > 0;
  candidates.push({
    id: 'flow-loyer',
    categoryKey: 'loyer',
    pillar: 'FIXED',
    title: 'Loyer & Logement',
    subtitle: 'CDC Habitat, Charges & Assurance Logement',
    detectedMonthlyAmount: summary.loyer.monthlyAverage,
    isPercentage: false,
    defaultPercentage: netSalary > 0 ? Math.round((summary.loyer.monthlyAverage / netSalary) * 100 * 10) / 10 : 0,
    transactions: summary.loyer.transactions,
    calculationFormula: hasLoyer
      ? `${summary.loyer.transactions.length} transaction(s) constatée(s) = ${fmtEur(summary.loyer.totalAmount)} (${summary.periodLabel})`
      : `0 transaction constatée sur ${summary.periodLabel}`,
    explanation: 'Prélèvement obligatoire de loyer et charges locatives.',
    defaultSelected: hasLoyer,
    icon: '🏠',
    color: '#f43f5e',
  });

  // 2. Abonnements (Bouygues, Spotify, Netflix, EDF, etc.)
  const hasAbo = summary.abonnement.transactions.length > 0 || summary.abonnement.monthlyAverage > 0;
  candidates.push({
    id: 'flow-abonnement',
    categoryKey: 'abonnement',
    pillar: 'FIXED',
    title: 'Abonnements & Services',
    subtitle: 'Bouygues Telecom, Streaming (Spotify, Netflix), Énergie',
    detectedMonthlyAmount: summary.abonnement.monthlyAverage,
    isPercentage: false,
    defaultPercentage: netSalary > 0 ? Math.round((summary.abonnement.monthlyAverage / netSalary) * 100 * 10) / 10 : 0,
    transactions: summary.abonnement.transactions,
    calculationFormula: hasAbo
      ? `${summary.abonnement.transactions.length} transaction(s) = ${fmtEur(summary.abonnement.totalAmount)} (${summary.periodLabel})`
      : `0 transaction constatée sur ${summary.periodLabel}`,
    explanation: 'Services numériques, télécoms et abonnements récurrents.',
    defaultSelected: hasAbo,
    icon: '📱',
    color: '#f43f5e',
  });

  // 3. Tontine
  const hasTontine = summary.tontine.transactions.length > 0 || summary.tontine.monthlyAverage > 0;
  candidates.push({
    id: 'flow-tontine',
    categoryKey: 'tontine',
    pillar: 'FIXED',
    title: 'Tontine',
    subtitle: 'Épargne solidaire & collective',
    detectedMonthlyAmount: summary.tontine.monthlyAverage,
    isPercentage: false,
    defaultPercentage: netSalary > 0 ? Math.round((summary.tontine.monthlyAverage / netSalary) * 100 * 10) / 10 : 0,
    transactions: summary.tontine.transactions,
    calculationFormula: hasTontine
      ? `${summary.tontine.transactions.length} versement(s) = ${fmtEur(summary.tontine.totalAmount)} (${summary.periodLabel})`
      : `0 versement constaté sur ${summary.periodLabel}`,
    explanation: 'Cotisation d\'épargne communautaire / tontine.',
    defaultSelected: hasTontine,
    icon: '👥',
    color: '#8b5cf6',
  });

  // 4. Soutien familial (Wave)
  const hasSoutien = summary.soutien.transactions.length > 0 || summary.soutien.monthlyAverage > 0;
  candidates.push({
    id: 'flow-soutien',
    categoryKey: 'soutien',
    pillar: 'FIXED',
    title: 'Soutien Familial',
    subtitle: 'Sendwave, Wave & transferts famille',
    detectedMonthlyAmount: summary.soutien.monthlyAverage,
    isPercentage: false,
    defaultPercentage: netSalary > 0 ? Math.round((summary.soutien.monthlyAverage / netSalary) * 100 * 10) / 10 : 0,
    transactions: summary.soutien.transactions,
    calculationFormula: hasSoutien
      ? `${summary.soutien.transactions.length} virement(s) = ${fmtEur(summary.soutien.totalAmount)} (${summary.periodLabel})`
      : `0 virement constaté sur ${summary.periodLabel}`,
    explanation: 'Aide et transferts financiers réguliers vers la famille.',
    defaultSelected: hasSoutien,
    icon: '❤️',
    color: '#f43f5e',
  });

  // 5. Cible PEA (Investissement)
  const hasPea = summary.pea.transactions.length > 0 || summary.pea.monthlyAverage > 0;
  const peaPercent = netSalary > 0 ? Math.round((summary.pea.monthlyAverage / netSalary) * 100 * 10) / 10 : 35.0;
  candidates.push({
    id: 'flow-pea',
    categoryKey: 'pea',
    pillar: 'SAVINGS',
    title: 'Cible PEA (Investissement)',
    subtitle: 'Virement mensuel régulier vers le PEA (DCA ETF)',
    detectedMonthlyAmount: summary.pea.monthlyAverage,
    isPercentage: true,
    defaultPercentage: peaPercent > 0 ? peaPercent : 35.0,
    transactions: summary.pea.transactions,
    calculationFormula: hasPea
      ? `${summary.pea.transactions.length} virement(s) constatés vers PEA = ${fmtEur(summary.pea.totalAmount)} (${summary.periodLabel})`
      : `0 virement constaté sur ${summary.periodLabel}`,
    explanation: 'Versements d\'épargne débités du compte courant vers le PEA (virement mensuel régulier et NON le solde du compte).',
    isVirementEpargne: true,
    defaultSelected: hasPea,
    icon: '📈',
    color: '#06b6d4',
  });

  // 6. Livret A (Épargne liquide)
  const hasLivret = summary.livretA.transactions.length > 0 || summary.livretA.monthlyAverage > 0;
  const livretPercent = netSalary > 0 ? Math.round((summary.livretA.monthlyAverage / netSalary) * 100 * 10) / 10 : 7.0;
  candidates.push({
    id: 'flow-livret_a',
    categoryKey: 'livret_a',
    pillar: 'SAVINGS',
    title: 'Livret A (Épargne liquide)',
    subtitle: 'Virement mensuel régulier vers le Livret A',
    detectedMonthlyAmount: summary.livretA.monthlyAverage,
    isPercentage: true,
    defaultPercentage: livretPercent > 0 ? livretPercent : 7.0,
    transactions: summary.livretA.transactions,
    calculationFormula: hasLivret
      ? `${summary.livretA.transactions.length} virement(s) constatés vers Livret A = ${fmtEur(summary.livretA.totalAmount)} (${summary.periodLabel})`
      : `0 virement constaté sur ${summary.periodLabel}`,
    explanation: 'Versements d\'épargne débités du compte courant vers le Livret A (virement mensuel régulier et NON le solde du compte).',
    isVirementEpargne: true,
    defaultSelected: hasLivret,
    icon: '🛡️',
    color: '#3b82f6',
  });

  // 7. Revolut (Reste à vivre / Quotidien)
  const hasRevolut = summary.revolut.transactions.length > 0 || summary.revolut.monthlyAverage > 0;
  const revPercent = netSalary > 0 ? Math.round((summary.revolut.monthlyAverage / netSalary) * 100 * 10) / 10 : 7.0;
  candidates.push({
    id: 'flow-revolut',
    categoryKey: 'revolut',
    pillar: 'DAILY',
    title: 'Revolut (Reste à vivre)',
    subtitle: 'Recharges et virements vers Revolut pour dépenses quotidiennes',
    detectedMonthlyAmount: summary.revolut.monthlyAverage,
    isPercentage: true,
    defaultPercentage: revPercent > 0 ? revPercent : 7.0,
    transactions: summary.revolut.transactions,
    calculationFormula: hasRevolut
      ? `${summary.revolut.transactions.length} recharge(s) Revolut = ${fmtEur(summary.revolut.totalAmount)} (${summary.periodLabel})`
      : `0 recharge constatée sur ${summary.periodLabel}`,
    explanation: 'Montant transféré pour vos dépenses du quotidien (alimentation, sorties, imprévus).',
    defaultSelected: hasRevolut,
    icon: '💳',
    color: '#06b6d4',
  });

  // 8. Temporary obligations detected
  for (const temp of tempObligations) {
    candidates.push({
      id: `flow-temp-${temp.id}`,
      categoryKey: `temp_${temp.id}`,
      pillar: 'TEMPORARY',
      title: temp.label,
      subtitle: `Échéancier temporaire (${temp.durationMonths} mois dès ${temp.startPeriod})`,
      detectedMonthlyAmount: temp.monthlyAmount,
      isPercentage: false,
      defaultPercentage: netSalary > 0 ? Math.round((temp.monthlyAmount / netSalary) * 100 * 10) / 10 : 0,
      transactions: [],
      calculationFormula: `Échéance mensuelle temporaire : ${fmtEur(temp.monthlyAmount)} / mois pendant ${temp.durationMonths} mois`,
      explanation: 'Dépense récurrente temporaire à durée déterminée (santé, étalement, crédit court terme).',
      defaultSelected: true,
      icon: '⏳',
      color: '#f59e0b',
      durationMonths: temp.durationMonths,
      startPeriod: temp.startPeriod,
    });
  }

  return candidates;
}


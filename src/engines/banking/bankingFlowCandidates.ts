import type { TargetFlowItem, BankTargetAnalysisSummary } from './bankingTargetFlows';
import type { TemporaryExpenseItem } from '@/utils/bankingSanitizer';
import type { AuraWizardLearningMemory } from '@/services/banking/auraWizardMemoryService';

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

export function buildInteractiveFlowCandidates(
  summary: BankTargetAnalysisSummary,
  tempObligations: TemporaryExpenseItem[] = [],
  netSalary: number = 2713.74,
  memory?: AuraWizardLearningMemory
): DetectedFlowCandidate[] {
  const candidates: DetectedFlowCandidate[] = [];

  const fmtEur = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

  const isCandRejected = (candId: string) => {
    return memory?.rejectedCandidateIds?.includes(candId) ?? false;
  };

  // 1. Loyer CDC Habitat
  const hasLoyer = summary.loyer.transactions.length > 0 || summary.loyer.monthlyAverage > 0;
  candidates.push({
    id: 'flow-loyer',
    categoryKey: 'loyer',
    pillar: 'FIXED',
    title: 'Loyer & Logement',
    subtitle: 'CDC Habitat, Énergie & Assurances',
    detectedMonthlyAmount: summary.loyer.monthlyAverage,
    isPercentage: false,
    defaultPercentage: netSalary > 0 ? Math.round((summary.loyer.monthlyAverage / netSalary) * 100 * 10) / 10 : 0,
    transactions: summary.loyer.transactions,
    calculationFormula: hasLoyer
      ? `${summary.loyer.transactions.length} transaction(s) constatée(s) = ${fmtEur(summary.loyer.totalAmount)} • ${summary.periodLabel}`
      : `0 transaction constatée sur ${summary.periodLabel}`,
    explanation: 'Prélèvement obligatoire de loyer et charges locatives.',
    defaultSelected: hasLoyer && !isCandRejected('flow-loyer'),
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
    subtitle: 'Bouygues Telecom, Streaming & Services',
    detectedMonthlyAmount: summary.abonnement.monthlyAverage,
    isPercentage: false,
    defaultPercentage: netSalary > 0 ? Math.round((summary.abonnement.monthlyAverage / netSalary) * 100 * 10) / 10 : 0,
    transactions: summary.abonnement.transactions,
    calculationFormula: hasAbo
      ? `${summary.abonnement.transactions.length} transaction(s) = ${fmtEur(summary.abonnement.totalAmount)} • ${summary.periodLabel}`
      : `0 transaction constatée sur ${summary.periodLabel}`,
    explanation: 'Services numériques, télécoms et abonnements récurrents.',
    defaultSelected: hasAbo && !isCandRejected('flow-abonnement'),
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
      ? `${summary.tontine.transactions.length} versement(s) = ${fmtEur(summary.tontine.totalAmount)} • ${summary.periodLabel}`
      : `0 versement constaté sur ${summary.periodLabel}`,
    explanation: "Cotisation d'épargne communautaire / tontine.",
    defaultSelected: hasTontine && !isCandRejected('flow-tontine'),
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
      ? `${summary.soutien.transactions.length} virement(s) = ${fmtEur(summary.soutien.totalAmount)} • ${summary.periodLabel}`
      : `0 virement constaté sur ${summary.periodLabel}`,
    explanation: 'Aide et transferts financiers réguliers vers la famille.',
    defaultSelected: hasSoutien && !isCandRejected('flow-soutien'),
    icon: '❤️',
    color: '#f43f5e',
  });

  // 5. Cible PEA (Investissement)
  const hasPea = summary.pea.transactions.length > 0 || summary.pea.monthlyAverage > 0;
  const peaPercent = (netSalary > 0 && summary.pea.monthlyAverage > 0) ? Math.round((summary.pea.monthlyAverage / netSalary) * 100 * 10) / 10 : 0;
  candidates.push({
    id: 'flow-pea',
    categoryKey: 'pea',
    pillar: 'SAVINGS',
    title: 'Cible PEA (Investissement)',
    subtitle: 'Virement mensuel régulier vers le PEA (DCA ETF)',
    detectedMonthlyAmount: summary.pea.monthlyAverage,
    isPercentage: false,
    defaultPercentage: peaPercent,
    transactions: summary.pea.transactions,
    calculationFormula: hasPea
      ? `${summary.pea.transactions.length} virement(s) constatés vers PEA = ${fmtEur(summary.pea.totalAmount)} • ${summary.periodLabel}`
      : `0 virement constaté sur ${summary.periodLabel}`,
    explanation: "Versements d'épargne débités du compte courant vers le PEA (virement mensuel régulier et NON le solde du compte).",
    isVirementEpargne: true,
    defaultSelected: hasPea && !isCandRejected('flow-pea'),
    icon: '📈',
    color: '#06b6d4',
  });

  // 6. Livret A (Épargne liquide)
  const hasLivret = summary.livretA.transactions.length > 0 || summary.livretA.monthlyAverage > 0;
  const livretPercent = (netSalary > 0 && summary.livretA.monthlyAverage > 0) ? Math.round((summary.livretA.monthlyAverage / netSalary) * 100 * 10) / 10 : 0;
  candidates.push({
    id: 'flow-livret_a',
    categoryKey: 'livret_a',
    pillar: 'SAVINGS',
    title: 'Livret A (Épargne liquide)',
    subtitle: 'Virement mensuel régulier vers le Livret A',
    detectedMonthlyAmount: summary.livretA.monthlyAverage,
    isPercentage: false,
    defaultPercentage: livretPercent,
    transactions: summary.livretA.transactions,
    calculationFormula: hasLivret
      ? `${summary.livretA.transactions.length} virement(s) constatés vers Livret A = ${fmtEur(summary.livretA.totalAmount)} • ${summary.periodLabel}`
      : `0 virement constaté sur ${summary.periodLabel}`,
    explanation: "Versements d'épargne débités du compte courant vers le Livret A (virement mensuel régulier et NON le solde du compte).",
    isVirementEpargne: true,
    defaultSelected: hasLivret && !isCandRejected('flow-livret_a'),
    icon: '🛡️',
    color: '#3b82f6',
  });

  // 7. Revolut (Reste à vivre / Quotidien)
  const hasRevolut = summary.revolut.transactions.length > 0 || summary.revolut.monthlyAverage > 0;
  const revPercent = (netSalary > 0 && summary.revolut.monthlyAverage > 0) ? Math.round((summary.revolut.monthlyAverage / netSalary) * 100 * 10) / 10 : 0;
  candidates.push({
    id: 'flow-revolut',
    categoryKey: 'revolut',
    pillar: 'DAILY',
    title: 'Revolut (Reste à vivre)',
    subtitle: 'Recharges et virements vers Revolut pour dépenses quotidiennes',
    detectedMonthlyAmount: summary.revolut.monthlyAverage,
    isPercentage: false,
    defaultPercentage: revPercent,
    transactions: summary.revolut.transactions,
    calculationFormula: hasRevolut
      ? `${summary.revolut.transactions.length} recharge(s) Revolut = ${fmtEur(summary.revolut.totalAmount)} • ${summary.periodLabel}`
      : `0 recharge constatée sur ${summary.periodLabel}`,
    explanation: 'Montant transféré pour vos dépenses du quotidien (alimentation, sorties, imprévus).',
    defaultSelected: hasRevolut && !isCandRejected('flow-revolut'),
    icon: '💳',
    color: '#06b6d4',
  });

  // 8. Temporary obligations detected
  for (const temp of tempObligations) {
    const tempCandId = `flow-temp-${temp.id}`;
    const isTempRejected =
      isCandRejected(tempCandId) ||
      (memory?.rejectedMerchantPatterns?.some((p) => temp.label.toUpperCase().includes(p.pattern.toUpperCase())) ?? false);

    candidates.push({
      id: tempCandId,
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
      defaultSelected: !isTempRejected,
      icon: '⏳',
      color: '#f59e0b',
      durationMonths: temp.durationMonths,
      startPeriod: temp.startPeriod,
    });
  }

  return candidates;
}

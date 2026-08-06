import type { SalaryRecord, SalaryAnalytics, YearlySalarySummary } from '@/types/salary';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

/**
 * Génère un libellé d'affichage pour une période YYYY-MM (ex: "2026-06" -> "Juin 2026")
 */
export function formatPeriodLabel(period: string): string {
  if (!period || !period.includes('-')) return period || '';
  const [yearStr, monthStr] = period.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthName = MONTH_NAMES[monthIdx] || monthStr;
  return `${monthName} ${yearStr}`;
}

/**
 * Trie les bulletins de salaire par période chronologique décroissante (le plus récent en premier)
 */
export function sortSalaryRecordsDescending(records: SalaryRecord[]): SalaryRecord[] {
  return [...records].sort((a, b) => b.period.localeCompare(a.period));
}

/**
 * Détermine le bulletin de salaire référent actif pour la répartition d'investissement.
 * Règle d'or : C'est STRICTEMENT le bulletin le plus récent en date (YYYY-MM).
 */
export function getActiveBaselineSalary(records: SalaryRecord[]): SalaryRecord | null {
  if (!records || records.length === 0) return null;
  const sorted = sortSalaryRecordsDescending(records);
  return sorted[0] || null;
}

/**
 * Calcule l'ensemble des métriques d'analyse et de lissage salarial multi-annuel.
 */
export function computeSalaryAnalytics(records: SalaryRecord[]): SalaryAnalytics {
  if (!records || records.length === 0) {
    return {
      activeBaseline: null,
      overallAverageNet: 0,
      overallAverageInvestable: 0,
      overallSavingsRate: 0,
      growthTrendPercent: 0,
      totalRecordsCount: 0,
      yearlySummaries: [],
    };
  }

  const sortedDesc = sortSalaryRecordsDescending(records);
  const activeBaseline = sortedDesc[0];

  const totalNet = records.reduce((sum, r) => sum + r.netSalary, 0);
  const totalInvestable = records.reduce((sum, r) => sum + r.investableAmount, 0);
  const totalRecordsCount = records.length;

  const overallAverageNet = Math.round(totalNet / totalRecordsCount);
  const overallAverageInvestable = Math.round(totalInvestable / totalRecordsCount);
  const overallSavingsRate = overallAverageNet > 0 ? (overallAverageInvestable / overallAverageNet) * 100 : 0;

  // Calcul du taux de croissance entre le bulletin le plus ancien et le plus récent
  const sortedAsc = [...records].sort((a, b) => a.period.localeCompare(b.period));
  const oldestRecord = sortedAsc[0];
  const newestRecord = sortedAsc[sortedAsc.length - 1];

  let growthTrendPercent = 0;
  if (oldestRecord && newestRecord && oldestRecord.id !== newestRecord.id && oldestRecord.netSalary > 0) {
    growthTrendPercent = ((newestRecord.netSalary - oldestRecord.netSalary) / oldestRecord.netSalary) * 100;
  }

  // Regroupement par année (2025, 2026, etc.)
  const byYear: Record<number, SalaryRecord[]> = {};
  records.forEach((r) => {
    const year = parseInt(r.period.split('-')[0], 10) || new Date().getFullYear();
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(r);
  });

  const yearlySummaries: YearlySalarySummary[] = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a)
    .map((year) => {
      const yearRecords = byYear[year];
      const yCount = yearRecords.length;
      const yTotalNet = yearRecords.reduce((sum, r) => sum + r.netSalary, 0);
      const yTotalInvestable = yearRecords.reduce((sum, r) => sum + r.investableAmount, 0);
      const yAvgNet = Math.round(yTotalNet / yCount);
      const yAvgInvestable = Math.round(yTotalInvestable / yCount);

      return {
        year,
        count: yCount,
        averageNet: yAvgNet,
        averageInvestable: yAvgInvestable,
        totalNet: yTotalNet,
        totalInvestable: yTotalInvestable,
        averageSavingsRate: yAvgNet > 0 ? (yAvgInvestable / yAvgNet) * 100 : 0,
      };
    });

  return {
    activeBaseline,
    overallAverageNet,
    overallAverageInvestable,
    overallSavingsRate,
    growthTrendPercent,
    totalRecordsCount,
    yearlySummaries,
  };
}

/**
 * Données de démo par défaut si aucun bulletin n'existe encore
 */
export const DEFAULT_SALARY_RECORDS: SalaryRecord[] = [
  {
    id: 'sal-2026-06',
    period: '2026-06',
    periodLabel: 'Juin 2026',
    netSalary: 3850,
    grossSalary: 4950,
    investableAmount: 1200,
    savingsRate: 31.2,
    status: 'imported',
    documentName: 'bulletin_paye_2026_06.pdf',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    notes: 'Bulletin référent actuel (Dernier salaire en date)',
  },
  {
    id: 'sal-2026-01',
    period: '2026-01',
    periodLabel: 'Janvier 2026',
    netSalary: 3700,
    grossSalary: 4750,
    investableAmount: 1100,
    savingsRate: 29.7,
    status: 'imported',
    documentName: 'bulletin_paye_2026_01.pdf',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 180,
    notes: 'Ajustement annuel de salaire + prime',
  },
  {
    id: 'sal-2025-09',
    period: '2025-09',
    periodLabel: 'Septembre 2025',
    netSalary: 3500,
    grossSalary: 4500,
    investableAmount: 1000,
    savingsRate: 28.6,
    status: 'imported',
    documentName: 'bulletin_paye_2025_09.pdf',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 320,
    notes: 'Reprise d\'automne',
  },
  {
    id: 'sal-2025-01',
    period: '2025-01',
    periodLabel: 'Janvier 2025',
    netSalary: 3400,
    grossSalary: 4350,
    investableAmount: 950,
    savingsRate: 27.9,
    status: 'imported',
    documentName: 'bulletin_paye_2025_01.pdf',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 550,
    notes: 'Début d\'historique 2025',
  },
];

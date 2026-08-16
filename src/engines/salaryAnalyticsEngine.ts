/**
 * Salary Analytics Engine — Analyse multi-annuelle, lissage et métriques salariales
 * Porté de Flutter (Aura Budget Pro) vers Riane Portfolio (Next.js / TypeScript).
 */

import {
  SalaryRecord,
  ReserveAllocation,
  REFERENCE_NET_RATES,
} from '../types/revenue';

export interface YearlySalarySummary {
  year: number;
  count: number;
  averageNet: number;
  averageInvestable: number;
  totalNet: number;
  totalInvestable: number;
  averageSavingsRate: number;
  totalBonusReserveAccrued: number;
}

export interface DetailedSalaryAnalytics {
  activeBaseline: SalaryRecord | null;
  overallAverageNet: number;
  overallAverageInvestable: number;
  overallSavingsRate: number;
  growthTrendPercent: number;
  totalRecordsCount: number;
  yearlySummaries: YearlySalarySummary[];
  averageEffectiveTaxRate: number;
  averageSocialContributionRate: number;
  totalReserveBalanceAvailable: number;
}

export const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
] as const;

export function formatSalaryPeriodLabel(period: string): string {
  if (!period || !period.includes('-')) return period || '';
  const [yearStr, monthStr] = period.split('-');
  const monthIdx = (parseInt(monthStr, 10) || 1) - 1;
  const monthName = monthIdx >= 0 && monthIdx < 12 ? MONTH_NAMES_FR[monthIdx] : monthStr;
  return `${monthName} ${yearStr}`;
}

export function sortSalaryRecordsDescending(records: SalaryRecord[]): SalaryRecord[] {
  return [...records].sort((a, b) => (b.period || '').localeCompare(a.period || ''));
}

export function getActiveBaselineSalary(records: SalaryRecord[]): SalaryRecord | null {
  if (!records || records.length === 0) return null;
  const sorted = sortSalaryRecordsDescending(records);
  const explicit = sorted.find((r) => (r as any).isLatestActive);
  return explicit || sorted[0] || null;
}

/**
 * Calcule le salaire net récurrent d'un bulletin hors primes ou rachats de RTT
 */
export function calculateRegularNet(record: SalaryRecord): number {
  if (!record) return 0;
  const bonusNet = record.bonusNet ?? (record.bonusAmount ? record.bonusAmount * REFERENCE_NET_RATES.bonus : 0);
  const congesNet = record.congesRachatNet ?? (record.congesRachatGross ? record.congesRachatGross * REFERENCE_NET_RATES.congesRachat : 0);
  const totalExtra = bonusNet + congesNet;
  return Math.max(0, record.netSalary - totalExtra);
}

/**
 * Calcule le pouvoir d'achat global (Net en banque + tickets restaurant employeur)
 */
export function calculatePurchasingPower(record: SalaryRecord): number {
  const mealTicketsEmployer = (record as any).mealTicketsEmployer ?? 0;
  return (record.netSalary || 0) + mealTicketsEmployer;
}

/**
 * Calcul complet des analytiques et tendances salariales multi-annuelles
 */
export function computeDetailedSalaryAnalytics(
  records: SalaryRecord[] = [],
  allocations: ReserveAllocation[] = []
): DetailedSalaryAnalytics {
  if (!records || records.length === 0) {
    return {
      activeBaseline: null,
      overallAverageNet: 0,
      overallAverageInvestable: 0,
      overallSavingsRate: 0,
      growthTrendPercent: 0,
      totalRecordsCount: 0,
      yearlySummaries: [],
      averageEffectiveTaxRate: 0,
      averageSocialContributionRate: 0,
      totalReserveBalanceAvailable: 0,
    };
  }

  const sortedDesc = sortSalaryRecordsDescending(records);
  const activeBaseline = getActiveBaselineSalary(records);

  const totalNet = records.reduce((sum, r) => sum + (r.netSalary || 0), 0);
  const totalInvestable = records.reduce((sum, r) => sum + (r.regularInvestableAmount ?? 0), 0);
  const count = records.length;

  const overallAverageNet = count > 0 ? totalNet / count : 0;
  const overallAverageInvestable = count > 0 ? totalInvestable / count : 0;
  const overallSavingsRate = overallAverageNet > 0 ? (overallAverageInvestable / overallAverageNet) * 100 : 0;

  // Calcul de la tendance de croissance (du plus ancien au plus récent)
  const sortedAsc = [...records].sort((a, b) => (a.period || '').localeCompare(b.period || ''));
  let growthTrendPercent = 0;
  if (sortedAsc.length >= 2) {
    const firstNet = sortedAsc[0].netSalary || 0;
    const lastNet = sortedAsc[sortedAsc.length - 1].netSalary || 0;
    if (firstNet > 0) {
      growthTrendPercent = ((lastNet - firstNet) / firstNet) * 100;
    }
  }

  // Regroupement par année
  const byYear = new Map<number, SalaryRecord[]>();
  for (const r of records) {
    const y = parseInt((r.period || '').split('-')[0], 10) || new Date(r.createdAt || Date.now()).getFullYear();
    if (!byYear.has(y)) {
      byYear.set(y, []);
    }
    byYear.get(y)!.push(r);
  }

  const yearlySummaries: YearlySalarySummary[] = [];
  const sortedYears = Array.from(byYear.keys()).sort((a, b) => b - a);

  for (const yr of sortedYears) {
    const listYr = byYear.get(yr)!;
    const yrTotalNet = listYr.reduce((sum, r) => sum + (r.netSalary || 0), 0);
    const yrTotalInv = listYr.reduce((sum, r) => sum + (r.regularInvestableAmount ?? 0), 0);
    const yrTotalReserve = listYr.reduce((sum, r) => sum + (r.bonusReserveContribution ?? 0), 0);
    const yrCount = listYr.length;

    const yrAvgNet = yrCount > 0 ? yrTotalNet / yrCount : 0;
    const yrAvgInv = yrCount > 0 ? yrTotalInv / yrCount : 0;
    const yrAvgSavings = yrAvgNet > 0 ? (yrAvgInv / yrAvgNet) * 100 : 0;

    yearlySummaries.push({
      year: yr,
      count: yrCount,
      averageNet: yrAvgNet,
      averageInvestable: yrAvgInv,
      totalNet: yrTotalNet,
      totalInvestable: yrTotalInv,
      averageSavingsRate: yrAvgSavings,
      totalBonusReserveAccrued: yrTotalReserve,
    });
  }

  // Taux moyen d'imposition et de cotisations
  const recordsWithTax = records.filter((r) => typeof r.incomeTaxRatePercent === 'number' && r.incomeTaxRatePercent > 0);
  const averageEffectiveTaxRate = recordsWithTax.length > 0
    ? recordsWithTax.reduce((s, r) => s + (r.incomeTaxRatePercent || 0), 0) / recordsWithTax.length
    : 0;

  const recordsWithGross = records.filter((r) => typeof r.grossSalary === 'number' && r.grossSalary > 0 && typeof r.socialContributions === 'number');
  const averageSocialContributionRate = recordsWithGross.length > 0
    ? recordsWithGross.reduce((s, r) => s + (Math.abs(r.socialContributions || 0) / r.grossSalary!) * 100, 0) / recordsWithGross.length
    : 0;

  // Calcul du solde de réserve restant
  const totalAccrued = records.reduce((s, r) => s + (r.bonusReserveContribution || 0), 0);
  const totalAllocated = (allocations || []).reduce((s, a) => s + (a.amount || 0), 0);
  const totalReserveBalanceAvailable = Math.max(0, totalAccrued - totalAllocated);

  return {
    activeBaseline,
    overallAverageNet,
    overallAverageInvestable,
    overallSavingsRate,
    growthTrendPercent,
    totalRecordsCount: count,
    yearlySummaries,
    averageEffectiveTaxRate,
    averageSocialContributionRate,
    totalReserveBalanceAvailable,
  };
}

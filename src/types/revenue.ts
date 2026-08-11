/**
 * Types Revenu & Budget — porté depuis AuraBudget Pro (Flutter)
 * Fusionné dans RIANE Portfolio le 09/08/2026.
 *
 * Un SalaryRecord = une fiche de paie importée (ou saisie manuellement).
 * Le budget mensuel investissable (PortfolioConfig.monthlyBudget) est dérivé
 * de la moyenne glissante des derniers SalaryRecord.investableAmount.
 */

export interface SalaryRecord {
  id: string;
  /** Format YYYY-MM, ex: "2026-08" */
  period: string;
  /** Libellé affichable, ex: "Août 2026" */
  periodLabel: string;
  /** Salaire net versé en banque */
  netSalary: number;
  /** Salaire brut mensuel */
  grossSalary?: number;
  /** Net social / net avant impôt sur le revenu */
  netSocial?: number;
  /** Cotisations sociales (négatif) */
  socialContributions?: number;
  /** Prélèvement à la source (négatif ou 0) */
  incomeTaxAmount?: number;
  /** Taux effectif du prélèvement à la source (%) */
  incomeTaxRatePercent?: number;
  /** Épargne salariale versée sur PEE (Intéressement/Participation non versés en banque) */
  companySavingsPEE?: number;
  /** Montant détecté comme prime / rachat de congés / 13e mois */
  bonusAmount?: number;
  bonusDescription?: string;
  hasExplicitBonus?: boolean;
  /** Montant que l'utilisateur choisit d'allouer à l'investissement ce mois-ci */
  investableAmount: number;
  /** Taux d'épargne = investableAmount / netSalary (%) */
  savingsRate: number;
  /** Source d'origine */
  source: 'manual' | 'pdf-import';
  /** Nom du fichier PDF source, si applicable */
  documentName?: string;
  /** Notes libres */
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface RevenueConfig {
  /** Active la synchronisation automatique PortfolioConfig.monthlyBudget <- moyenne des SalaryRecord */
  autoSyncMonthlyBudget: boolean;
  /** Nombre de mois utilisés pour la moyenne glissante */
  rollingAverageMonths: number;
  /** Répartition cible du montant investissable entre enveloppes (doit sommer à 1) */
  allocationSplit: {
    PEA: number;
    'PEA-PME': number;
    CTO: number;
  };
}

export const DEFAULT_REVENUE_CONFIG: RevenueConfig = {
  autoSyncMonthlyBudget: true,
  rollingAverageMonths: 3,
  allocationSplit: {
    PEA: 0.4,
    'PEA-PME': 0.4,
    CTO: 0.2,
  },
};

export interface SalaryAnalytics {
  latestRecord: SalaryRecord | null;
  averageNetSalary: number;
  averageInvestable: number;
  averageSavingsRate: number;
  totalRecords: number;
  suggestedMonthlyBudget: number;
}

export function computeSalaryAnalytics(
  records: SalaryRecord[],
  rollingMonths: number = 3
): SalaryAnalytics {
  if (records.length === 0) {
    return {
      latestRecord: null,
      averageNetSalary: 0,
      averageInvestable: 0,
      averageSavingsRate: 0,
      totalRecords: 0,
      suggestedMonthlyBudget: 0,
    };
  }

  const sorted = [...records].sort((a, b) => b.period.localeCompare(a.period));
  const window = sorted.slice(0, rollingMonths);

  const averageNetSalary = window.reduce((s, r) => s + r.netSalary, 0) / window.length;
  const averageInvestable = window.reduce((s, r) => s + r.investableAmount, 0) / window.length;
  const averageSavingsRate = window.reduce((s, r) => s + r.savingsRate, 0) / window.length;

  return {
    latestRecord: sorted[0],
    averageNetSalary,
    averageInvestable,
    averageSavingsRate,
    totalRecords: records.length,
    suggestedMonthlyBudget: Math.round(averageInvestable),
  };
}

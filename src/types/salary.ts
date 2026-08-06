/**
 * Types pour la gestion des bulletins de salaire et de la répartition budgétaire RIANE
 */

export type SalaryStatus = 'imported' | 'verified' | 'archived';

export interface SalaryRecord {
  id: string;
  /** Format YYYY-MM (ex: "2026-06") */
  period: string;
  /** Libellé affichable (ex: "Juin 2026") */
  periodLabel: string;
  /** Salaire net à payer en EUR */
  netSalary: number;
  /** Salaire brut mensuel (optionnel) */
  grossSalary?: number;
  /** Budget mensuel alloué aux investissements / DCA en EUR */
  investableAmount: number;
  /** Pourcentage d'épargne alloué (ex: 28.5%) */
  savingsRate: number;
  /** Statut d'importation et de validation */
  status: SalaryStatus;
  /** Nom du fichier d'origine ou source */
  documentName?: string;
  /** Indique s'il s'agit du bulletin référent d'allocation le plus récent */
  isLatestActive?: boolean;
  /** Timestamp de création / modification */
  updatedAt: number;
  /** Notes additionnelles (ex: Prime de fin d'année) */
  notes?: string;
}

export interface YearlySalarySummary {
  year: number;
  count: number;
  averageNet: number;
  averageInvestable: number;
  totalNet: number;
  totalInvestable: number;
  averageSavingsRate: number;
}

export interface SalaryAnalytics {
  /** Bulletin référent actif (chronologiquement le plus récent) */
  activeBaseline: SalaryRecord | null;
  /** Moyenne du salaire net lissé sur l'ensemble de l'historique */
  overallAverageNet: number;
  /** Moyenne du budget mensuel DCA alloué */
  overallAverageInvestable: number;
  /** Taux d'épargne moyen lissé (%) */
  overallSavingsRate: number;
  /** Évolution du salaire net du tout premier au dernier bulletin (%) */
  growthTrendPercent: number;
  /** Nombre total de bulletins importés */
  totalRecordsCount: number;
  /** Synthèse par année (2025, 2026, etc.) */
  yearlySummaries: YearlySalarySummary[];
}

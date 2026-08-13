/**
 * Types Revenu & Budget — porté depuis AuraBudget Pro (Flutter)
 * Fusionné dans RIANE Portfolio le 09/08/2026.
 * Étendu le 12/08/2026 (retour terrain) : fiscalité différenciée par nature de
 * revenu, et séparation capacité régulière (DCA) / réserve primes-rachats (allocation manuelle).
 *
 * Un SalaryRecord = une fiche de paie importée (ou saisie manuellement).
 * Le budget mensuel investissable (PortfolioConfig.monthlyBudget) est dérivé
 * de la moyenne glissante des SalaryRecord.regularInvestableAmount (hors primes/rachats).
 *
 * Taux de référence calibrés sur cas réel (document de référence fourni le 12/08/2026,
 * cas Vestas) — utilisés comme valeurs par défaut si un bulletin ne détaille pas la
 * ventilation net/brut par composante :
 *   - Salaire de base : net ≈ 75,87 % du brut
 *   - Bonus / prime de performance : net ≈ 79,02 % du brut (avant PAS)
 *   - Rachat de jours de repos/congés : net ≈ 79,88 % du brut (avant PAS)
 *   - Prélèvement à la source (PAS) : appliqué ENSUITE sur le net avant impôt de
 *     chaque composante, au taux propre du foyer (7,1 % dans le cas de référence) —
 *     ne pas appliquer un taux moyen unique à l'ensemble du bulletin.
 */

export const REFERENCE_NET_RATES = {
  baseSalary: 0.7587,
  bonus: 0.7902,
  congesRachat: 0.7988,
} as const;

export interface SalaryRecord {
  id: string;
  /** Format YYYY-MM, ex: "2026-08" */
  period: string;
  /** Libellé affichable, ex: "Août 2026" */
  periodLabel: string;
  /** Salaire net versé en banque (total, toutes composantes confondues) */
  netSalary: number;
  /** Salaire brut mensuel (total) */
  grossSalary?: number;
  /** Net social / net avant impôt sur le revenu */
  netSocial?: number;
  /** Cotisations sociales (négatif) */
  socialContributions?: number;
  /** Prélèvement à la source (négatif ou 0) — total, toutes composantes */
  incomeTaxAmount?: number;
  /** Taux effectif du prélèvement à la source (%), appliqué après le calcul net/brut par composante */
  incomeTaxRatePercent?: number;
  /** Épargne salariale versée sur PEE (Intéressement/Participation non versés en banque) */
  companySavingsPEE?: number;

  // ── Composante salaire de base ──
  baseSalaryGross?: number;
  baseSalaryNet?: number;

  // ── Composante bonus / prime (traitement fiscal distinct du salaire de base) ──
  bonusAmount?: number;
  bonusGross?: number;
  bonusNet?: number;
  bonusDescription?: string;
  hasExplicitBonus?: boolean;

  // ── Composante rachat de jours de repos / congés payés (traitement fiscal distinct) ──
  congesRachatGross?: number;
  congesRachatNet?: number;
  congesRachatJours?: number;
  hasCongesRachat?: boolean;

  /**
   * Montant régulier que l'utilisateur alloue à l'investissement ce mois-ci —
   * dérivé du seul salaire de base, JAMAIS des primes/rachats (voir bonusReserveContribution).
   * C'est ce champ qui alimente la moyenne glissante et le monthlyBudget (DCA).
   */
  regularInvestableAmount: number;
  /**
   * Part nette des primes/rachats de ce bulletin qui vient s'ajouter à la réserve
   * (poche séparée, non-DCA — voir computeReserveBalance). Par défaut, la totalité
   * du net bonus + net rachat, mais l'utilisateur peut ajuster.
   */
  bonusReserveContribution: number;
  /** Taux d'épargne régulier = regularInvestableAmount / (netSalary - bonusNet - congesRachatNet) (%) */
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

/** Une allocation manuelle de la réserve primes/rachats vers une enveloppe */
export interface ReserveAllocation {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  envelope: 'PEA' | 'PEA-PME' | 'CTO';
  /** Ticker précis si l'utilisateur a déjà choisi l'instrument, sinon juste l'enveloppe */
  ticker?: string;
  notes?: string;
  createdAt: number;
}

export interface RevenueConfig {
  /** Active la synchronisation automatique PortfolioConfig.monthlyBudget <- moyenne des regularInvestableAmount */
  autoSyncMonthlyBudget: boolean;
  /** Nombre de mois utilisés pour la moyenne glissante */
  rollingAverageMonths: number;
  /** Répartition cible du montant investissable RÉGULIER entre enveloppes (doit sommer à 1) — ne s'applique pas à la réserve primes/rachats, allouée manuellement */
  allocationSplit: {
    PEA: number;
    'PEA-PME': number;
    CTO: number;
  };
  /**
   * Enveloppe par défaut proposée lors de l'allocation manuelle de la réserve
   * (l'utilisateur alloue généralement ses primes/rachats en CTO).
   */
  defaultReserveEnvelope: 'PEA' | 'PEA-PME' | 'CTO';
}

export const DEFAULT_REVENUE_CONFIG: RevenueConfig = {
  autoSyncMonthlyBudget: true,
  rollingAverageMonths: 3,
  allocationSplit: {
    PEA: 0.4,
    'PEA-PME': 0.4,
    CTO: 0.2,
  },
  defaultReserveEnvelope: 'CTO',
};

export interface SalaryAnalytics {
  latestRecord: SalaryRecord | null;
  averageNetSalary: number;
  averageRegularInvestable: number;
  averageSavingsRate: number;
  totalRecords: number;
  suggestedMonthlyBudget: number;
  /** Total accumulé en réserve primes/rachats sur l'année en cours, non encore alloué */
  currentYearReserveAccrued: number;
}

export function computeSalaryAnalytics(
  records: SalaryRecord[] = [],
  allocations: ReserveAllocation[] = [],
  rollingMonths: number = 3
): SalaryAnalytics {
  if (!records || records.length === 0) {
    return {
      latestRecord: null,
      averageNetSalary: 0,
      averageRegularInvestable: 0,
      averageSavingsRate: 0,
      totalRecords: 0,
      suggestedMonthlyBudget: 0,
      currentYearReserveAccrued: 0,
    };
  }

  const sorted = [...records].sort((a, b) => (b.period || '').localeCompare(a.period || ''));
  const window = sorted.slice(0, rollingMonths || 3);

  const averageNetSalary = window.reduce((s, r) => s + (r.netSalary || 0), 0) / (window.length || 1);
  const averageRegularInvestable = window.reduce((s, r) => s + (r.regularInvestableAmount ?? r.netSalary ?? 0), 0) / (window.length || 1);
  const averageSavingsRate = window.reduce((s, r) => s + (r.savingsRate || 0), 0) / (window.length || 1);

  const currentYear = sorted[0]?.period?.slice(0, 4) || new Date().getFullYear().toString();
  const yearRecords = records.filter((r) => r.period && r.period.startsWith(currentYear));
  const totalAccrued = yearRecords.reduce((s, r) => s + (r.bonusReserveContribution || 0), 0);
  const yearAllocations = (allocations || []).filter((a) => a && a.date && a.date.startsWith(currentYear));
  const totalAllocated = yearAllocations.reduce((s, a) => s + (a.amount || 0), 0);

  return {
    latestRecord: sorted[0] || null,
    averageNetSalary: isNaN(averageNetSalary) ? 0 : averageNetSalary,
    averageRegularInvestable: isNaN(averageRegularInvestable) ? 0 : averageRegularInvestable,
    averageSavingsRate: isNaN(averageSavingsRate) ? 0 : averageSavingsRate,
    totalRecords: records.length,
    suggestedMonthlyBudget: Math.round(isNaN(averageRegularInvestable) ? 0 : averageRegularInvestable),
    currentYearReserveAccrued: Math.max(0, totalAccrued - totalAllocated),
  };
}

/** Solde de réserve total (toutes années confondues), non encore alloué */
export function computeReserveBalance(records: SalaryRecord[] = [], allocations: ReserveAllocation[] = []): number {
  const totalAccrued = (records || []).reduce((s, r) => s + (r.bonusReserveContribution || 0), 0);
  const totalAllocated = (allocations || []).filter(Boolean).reduce((s, a) => s + (a.amount || 0), 0);
  return Math.max(0, totalAccrued - totalAllocated);
}


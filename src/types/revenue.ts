/**
 * Types Revenu & Budget — porté depuis AuraBudget Pro (Flutter)
 * Fusionné dans RIANE Portfolio le 09/08/2026.
 * Étendu le 12/08/2026 (retour terrain) : fiscalité différenciée par nature de
 * revenu, et séparation capacité régulière (DCA) / réserve primes-rachats (allocation manuelle).
 * Étendu le 15/08/2026 : Rapprochement Théorie (Fiche) vs Réalité Factuelle (Banque BoursoBank) & Historisation.
 */

export const REFERENCE_NET_RATES = {
  baseSalary: 0.7587,
  bonus: 0.7902,
  congesRachat: 0.7988,
} as const;

export type BankReconciliationCategory =
  | 'SALARY_INCOME'       // 💼 Salaire & Rémunération employeur
  | 'RENT_HOUSING'        // 🏠 Loyer & Logement
  | 'SUBSCRIPTIONS'       // 📱 Abonnements récurrents (Télécom, Streaming, Énergie...)
  | 'INVEST_PEA'          // 📈 Virement PEA (Investissement)
  | 'INVEST_TONTINE'      // 🤝 Virement Tontine
  | 'SUPPORT_WAVE'        // 🌍 Soutien familial (Wave)
  | 'REVOLUT_TRANSFER'    // 💳 Virement / Recharge Revolut
  | 'INVEST_LIVRET_A'     // 🛡️ Livret A / Épargne sécurisée
  | 'INVEST_TAMPON'       // ⚡ Compte Tampon (Sas de réserve)
  | 'INVEST_CTO'          // 🌐 Compte Titres (CTO)
  | 'DAILY_EXPENSE'       // 🛒 Dépense courante / Quotidien (CB, commerces...)
  | 'OTHER_TRANSFER'      // 🔄 Autre virement
  | 'IGNORED';            // ❌ Ignorer

export interface BankTransactionMatch {
  id: string;
  date: string; // YYYY-MM-DD
  rawDescription: string;
  amount: number; // Montant en € (positif pour rentrée ou débit, affiché clairement)
  category: BankReconciliationCategory;
  suggestedCategory: BankReconciliationCategory;
  confidence: number; // 0 à 1
  accountName?: string;
  included: boolean;
}

export interface BankReconciliationRecord {
  reconciled: boolean;
  reconciledAt?: number;
  period: string; // YYYY-MM
  actualNetSalaryReceived: number; // Salaire net réellement encaissé en banque (€)
  actualRent?: number;             // Loyer réel payé (€)
  actualSubscriptions?: number;    // Abonnements récurrents réels (€)
  actualInvestedPEA: number;        // Virement(s) réel(s) vers PEA (€)
  actualInvestedTontine: number;    // Virement(s) réel(s) vers Tontine (€)
  actualSupportWave?: number;       // Virement(s) réel(s) soutien Wave (€)
  actualRevolut?: number;           // Virement(s) réel(s) vers Revolut (€)
  actualInvestedTampon: number;     // Virement(s) réel(s) vers Compte Tampon (€)
  actualInvestedLivretA: number;    // Virement(s) réel(s) vers Livret A (€)
  actualInvestedCTO: number;        // Virement(s) réel(s) vers CTO (€)
  actualDailyExpenses?: number;     // Autres dépenses courantes (€)
  totalActualInvested: number;      // Somme totale investie réellement (PEA + Tontine + CTO + Tampon + Livrets)
  totalActualFixedExpenses?: number;// Somme charges fixes (Loyer + Abonnements)
  totalActualLivingTransfers?: number; // Somme transferts de vie (Revolut + Wave)
  actualSavingsRate: number;        // Taux d'épargne effectif réel (%) = (totalActualInvested / actualNetSalaryReceived) * 100
  deltaVsPlan: number;              // totalActualInvested - regularInvestableAmount
  executionRatePercent: number;     // (totalActualInvested / regularInvestableAmount) * 100
  status: 'ON_TRACK' | 'UNDER_INVESTED' | 'OVER_INVESTED' | 'PENDING';
  detectedTransactions?: BankTransactionMatch[];
  notes?: string;
}

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
   * Montant régulier que l'utilisateur alloue à l'investissement ce mois-ci (Théorie) —
   * dérivé du seul salaire de base, JAMAIS des primes/rachats.
   */
  regularInvestableAmount: number;
  /**
   * Part nette des primes/rachats de ce bulletin qui vient s'ajouter à la réserve
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

  /** 🏦 Réalité factuelle constatée en banque via BoursoBank Open Banking */
  bankReality?: BankReconciliationRecord;

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

export type ExtraCashCategory = 'PRIME' | 'TONTINE' | 'BONUS' | '13EME_MOIS' | 'VENTE' | 'AUTRE';

export interface ExtraCashEntry {
  id: string;
  label: string; // ex: "Prime annuelle Vestas", "Tontine familiale", "13e mois", "Vente d'équipement"
  amount: number; // ex: 2500
  date: string; // YYYY-MM-DD
  category: ExtraCashCategory;
  isAvailable: boolean; // true if available, false if already consumed/invested
  notes?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface RevenueConfig {
  /** Active la synchronisation automatique PortfolioConfig.monthlyBudget <- moyenne des regularInvestableAmount */
  autoSyncMonthlyBudget: boolean;
  /** Nombre de mois utilisés pour la moyenne glissante */
  rollingAverageMonths: number;
  /** Répartition cible du montant investissable RÉGULIER entre enveloppes (doit sommer à 1) */
  allocationSplit: {
    PEA: number;
    'PEA-PME': number;
    CTO: number;
  };
  /**
   * Enveloppe par défaut proposée lors de l'allocation manuelle de la réserve
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

  // Realized Bank Metrics
  averageActualNetSalary: number;
  averageActualInvested: number;
  averageActualSavingsRate: number;
  reconciledMonthsCount: number;
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
      averageActualNetSalary: 0,
      averageActualInvested: 0,
      averageActualSavingsRate: 0,
      reconciledMonthsCount: 0,
    };
  }

  const sorted = [...records].sort((a, b) => (b.period || '').localeCompare(a.period || ''));
  const window = sorted.slice(0, rollingMonths || 3);

  const averageNetSalary = window.reduce((s, r) => s + (r.netSalary || 0), 0) / (window.length || 1);
  const averageRegularInvestable = window.reduce((s, r) => s + (r.regularInvestableAmount ?? r.netSalary ?? 0), 0) / (window.length || 1);
  const averageSavingsRate = window.reduce((s, r) => s + (r.savingsRate || 0), 0) / (window.length || 1);

  // Reconciled bank reality calculations
  const reconciledWindow = window.filter((r) => r.bankReality && r.bankReality.reconciled);
  const reconciledCount = reconciledWindow.length;
  
  const averageActualNetSalary = reconciledCount > 0
    ? reconciledWindow.reduce((s, r) => s + (r.bankReality?.actualNetSalaryReceived || r.netSalary || 0), 0) / reconciledCount
    : averageNetSalary;

  const averageActualInvested = reconciledCount > 0
    ? reconciledWindow.reduce((s, r) => s + (r.bankReality?.totalActualInvested || r.regularInvestableAmount || 0), 0) / reconciledCount
    : averageRegularInvestable;

  const averageActualSavingsRate = reconciledCount > 0
    ? reconciledWindow.reduce((s, r) => s + (r.bankReality?.actualSavingsRate || r.savingsRate || 0), 0) / reconciledCount
    : averageSavingsRate;

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
    suggestedMonthlyBudget: Math.round(isNaN(averageActualInvested && reconciledCount > 0 ? averageActualInvested : averageRegularInvestable) ? 0 : (reconciledCount > 0 ? averageActualInvested : averageRegularInvestable)),
    currentYearReserveAccrued: Math.max(0, totalAccrued - totalAllocated),
    averageActualNetSalary: isNaN(averageActualNetSalary) ? 0 : averageActualNetSalary,
    averageActualInvested: isNaN(averageActualInvested) ? 0 : averageActualInvested,
    averageActualSavingsRate: isNaN(averageActualSavingsRate) ? 0 : averageActualSavingsRate,
    reconciledMonthsCount: reconciledCount,
  };
}

/** Solde de réserve total (toutes années confondues), non encore alloué */
export function computeReserveBalance(records: SalaryRecord[] = [], allocations: ReserveAllocation[] = []): number {
  const totalAccrued = (records || []).reduce((s, r) => s + (r.bonusReserveContribution || 0), 0);
  const totalAllocated = (allocations || []).filter(Boolean).reduce((s, a) => s + (a.amount || 0), 0);
  return Math.max(0, totalAccrued - totalAllocated);
}

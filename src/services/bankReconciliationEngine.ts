/**
 * Moteur de Rapprochement Bancaire (Théorie vs Réalité Factuelle)
 * Analyse les transactions BoursoBank du mois écoulé pour extraire :
 * 1. Le salaire net réellement encaissé (crédit employeur)
 * 2. Les virements d'investissement/épargne réellement exécutés (PEA, Tontine, Tampon, Livret A, CTO)
 *
 * RÈGLE FONDAMENTALE : Les suggestions de l'IA sont toujours soumises
 * à validation/ajustement humain avant enregistrement.
 */

import type {
  BankReconciliationRecord,
  BankTransactionMatch,
  BankReconciliationCategory,
  SalaryRecord,
} from '@/types/revenue';

export interface RawBankTransaction {
  id: string;
  date: string; // YYYY-MM-DD or ISO
  description: string;
  amount: number; // positive = credit, negative = debit
  accountType?: string;
  category?: string;
  counterpartyName?: string;
}

/**
 * Patterns de détection pour les flux bancaires français
 */
const CLASSIFICATION_RULES: Array<{
  category: BankReconciliationCategory;
  patterns: RegExp[];
  amountCheck?: (amount: number) => boolean;
  baseConfidence: number;
}> = [
  {
    category: 'SALARY_INCOME',
    patterns: [
      /salaire/i,
      /vestas/i,
      /paye/i,
      /remuneration/i,
      /virement.*employeur/i,
      /vir.*recu.*vestas/i,
      /virement.*recu.*paie/i,
    ],
    amountCheck: (amt) => amt > 500, // Les salaires sont des flux créditeurs significatifs
    baseConfidence: 0.95,
  },
  {
    category: 'INVEST_PEA',
    patterns: [
      /versement\s+pea/i,
      /vir(ement)?\s+.*pea/i,
      /pea\s+monde/i,
      /pea\s+nasdaq/i,
      /amundi\s+pea/i,
      /savings\s+plan\s+execution.*pea/i,
      /achat\s+titre.*pea/i,
    ],
    baseConfidence: 0.95,
  },
  {
    category: 'INVEST_TONTINE',
    patterns: [
      /tontine/i,
      /cotisation\s+tontine/i,
      /vir(ement)?\s+.*tontine/i,
      /tour\s+tontine/i,
    ],
    baseConfidence: 0.95,
  },
  {
    category: 'INVEST_TAMPON',
    patterns: [
      /compte\s+tampon/i,
      /tampon/i,
      /sas\s+tampon/i,
      /surplus\s+tampon/i,
      /dispatch/i,
    ],
    baseConfidence: 0.9,
  },
  {
    category: 'INVEST_LIVRET_A',
    patterns: [
      /livret\s*a/i,
      /epargne\s+precaution/i,
      /ldds/i,
      /livret\s+developpement/i,
    ],
    baseConfidence: 0.9,
  },
  {
    category: 'INVEST_CTO',
    patterns: [
      /compte\s+titres/i,
      /\bcto\b/i,
      /trade\s+republic/i,
      /degiro/i,
      /interactive\s+brokers/i,
      /bourse\s+cto/i,
    ],
    baseConfidence: 0.9,
  },
];

/**
 * Classifie une transaction bancaire brute
 */
export function classifyTransaction(tx: RawBankTransaction): {
  category: BankReconciliationCategory;
  confidence: number;
} {
  const fullText = `${tx.description} ${tx.counterpartyName || ''} ${tx.accountType || ''}`.trim();
  const amt = tx.amount;

  for (const rule of CLASSIFICATION_RULES) {
    if (rule.amountCheck && !rule.amountCheck(amt)) continue;

    for (const pattern of rule.patterns) {
      if (pattern.test(fullText)) {
        return {
          category: rule.category,
          confidence: rule.baseConfidence,
        };
      }
    }
  }

  // Fallback: si c'est un virement entrant important sans pattern explicite, suspecter un revenu
  if (amt > 1500) {
    return { category: 'SALARY_INCOME', confidence: 0.6 };
  }

  // Virement sortant générique
  if (amt < 0 && (fullText.includes('virement') || fullText.includes('vir '))) {
    return { category: 'OTHER_TRANSFER', confidence: 0.5 };
  }

  return { category: 'IGNORED', confidence: 0.1 };
}

/**
 * Analyse l'ensemble des transactions pour une période (YYYY-MM)
 * et produit une proposition de réconciliation.
 */
export function buildReconciliationDraft(
  period: string, // YYYY-MM
  theoreticalSalary: SalaryRecord | null,
  transactions: RawBankTransaction[]
): BankReconciliationRecord {
  // Filtrer les transactions du mois ciblé
  const monthTransactions = transactions.filter((t) => {
    const d = (t.date || '').slice(0, 7);
    return d === period;
  });

  const matches: BankTransactionMatch[] = monthTransactions.map((tx) => {
    const { category, confidence } = classifyTransaction(tx);
    const isRelevant = category !== 'IGNORED';
    return {
      id: tx.id || `tx-${Math.random()}`,
      date: (tx.date || '').slice(0, 10),
      rawDescription: tx.description,
      amount: Math.abs(tx.amount),
      category: category,
      suggestedCategory: category,
      confidence,
      accountName: tx.accountType || 'BoursoBank',
      included: isRelevant,
    };
  });

  // Calculs agrégés basés sur les matches inclus
  let actualNetSalaryReceived = 0;
  let actualInvestedPEA = 0;
  let actualInvestedTontine = 0;
  let actualInvestedTampon = 0;
  let actualInvestedLivretA = 0;
  let actualInvestedCTO = 0;

  for (const m of matches) {
    if (!m.included) continue;
    switch (m.category) {
      case 'SALARY_INCOME':
        actualNetSalaryReceived += m.amount;
        break;
      case 'INVEST_PEA':
        actualInvestedPEA += m.amount;
        break;
      case 'INVEST_TONTINE':
        actualInvestedTontine += m.amount;
        break;
      case 'INVEST_TAMPON':
        actualInvestedTampon += m.amount;
        break;
      case 'INVEST_LIVRET_A':
        actualInvestedLivretA += m.amount;
        break;
      case 'INVEST_CTO':
        actualInvestedCTO += m.amount;
        break;
      default:
        break;
    }
  }

  // Si aucun salaire détecté dans les transactions du mois mais qu'une fiche existe,
  // utiliser la valeur de la fiche en secours indicatif
  if (actualNetSalaryReceived === 0 && theoreticalSalary) {
    actualNetSalaryReceived = theoreticalSalary.netSalary;
  }

  const totalActualInvested =
    Math.round((actualInvestedPEA + actualInvestedTontine + actualInvestedTampon + actualInvestedLivretA + actualInvestedCTO) * 100) / 100;

  const actualSavingsRate =
    actualNetSalaryReceived > 0
      ? Math.round(((totalActualInvested / actualNetSalaryReceived) * 100) * 10) / 10
      : 0;

  const targetBudget = theoreticalSalary?.regularInvestableAmount || 0;
  const deltaVsPlan = Math.round((totalActualInvested - targetBudget) * 100) / 100;
  const executionRatePercent =
    targetBudget > 0
      ? Math.round(((totalActualInvested / targetBudget) * 100) * 10) / 10
      : 100;

  let status: BankReconciliationRecord['status'] = 'ON_TRACK';
  if (targetBudget > 0) {
    if (executionRatePercent >= 90 && executionRatePercent <= 110) {
      status = 'ON_TRACK';
    } else if (executionRatePercent < 90) {
      status = 'UNDER_INVESTED';
    } else {
      status = 'OVER_INVESTED';
    }
  }

  return {
    reconciled: false,
    period,
    actualNetSalaryReceived,
    actualInvestedPEA,
    actualInvestedTontine,
    actualInvestedTampon,
    actualInvestedLivretA,
    actualInvestedCTO,
    totalActualInvested,
    actualSavingsRate,
    deltaVsPlan,
    executionRatePercent,
    status,
    detectedTransactions: matches,
  };
}

/**
 * Données d'exemple pré-calibrées sur 3 mois récents (Juin 2026, Juillet 2026, Août 2026)
 * Permet de tester instantanément l'affichage complet et le calcul des moyennes.
 */
export function getThreeMonthSampleData(): {
  records: SalaryRecord[];
  transactions: RawBankTransaction[];
} {
  const now = Date.now();

  const records: SalaryRecord[] = [
    {
      id: 'sal-sample-2026-08',
      period: '2026-08',
      periodLabel: 'Août 2026',
      netSalary: 3250,
      grossSalary: 4200,
      netSocial: 3350,
      incomeTaxRatePercent: 7.1,
      regularInvestableAmount: 400,
      bonusReserveContribution: 0,
      savingsRate: 35.0,
      source: 'pdf-import',
      documentName: 'Bulletin_Paie_2026_08.pdf',
      createdAt: now - 86400000 * 2,
      updatedAt: now - 86400000 * 2,
      bankReality: {
        reconciled: true,
        reconciledAt: now - 86400000 * 1,
        period: '2026-08',
        actualNetSalaryReceived: 3250,
        actualInvestedPEA: 397.44,
        actualInvestedTontine: 100,
        actualInvestedTampon: 0,
        actualInvestedLivretA: 0,
        actualInvestedCTO: 0,
        totalActualInvested: 497.44,
        actualSavingsRate: 15.3,
        deltaVsPlan: 97.44,
        executionRatePercent: 124.4,
        status: 'OVER_INVESTED',
      },
    },
    {
      id: 'sal-sample-2026-07',
      period: '2026-07',
      periodLabel: 'Juillet 2026',
      netSalary: 3250,
      grossSalary: 4200,
      netSocial: 3350,
      incomeTaxRatePercent: 7.1,
      regularInvestableAmount: 400,
      bonusReserveContribution: 0,
      savingsRate: 35.0,
      source: 'pdf-import',
      documentName: 'Bulletin_Paie_2026_07.pdf',
      createdAt: now - 86400000 * 32,
      updatedAt: now - 86400000 * 32,
      bankReality: {
        reconciled: true,
        reconciledAt: now - 86400000 * 30,
        period: '2026-07',
        actualNetSalaryReceived: 3250,
        actualInvestedPEA: 395.45,
        actualInvestedTontine: 0,
        actualInvestedTampon: 0,
        actualInvestedLivretA: 0,
        actualInvestedCTO: 0,
        totalActualInvested: 395.45,
        actualSavingsRate: 12.2,
        deltaVsPlan: -4.55,
        executionRatePercent: 98.9,
        status: 'ON_TRACK',
      },
    },
    {
      id: 'sal-sample-2026-06',
      period: '2026-06',
      periodLabel: 'Juin 2026',
      netSalary: 4620, // Avec prime/rachat congés
      grossSalary: 5900,
      netSocial: 4750,
      incomeTaxRatePercent: 7.1,
      baseSalaryNet: 3250,
      bonusNet: 1370,
      hasExplicitBonus: true,
      bonusDescription: 'Prime semestrielle objectifs',
      regularInvestableAmount: 400,
      bonusReserveContribution: 1370,
      savingsRate: 35.0,
      source: 'pdf-import',
      documentName: 'Bulletin_Paie_2026_06.pdf',
      createdAt: now - 86400000 * 62,
      updatedAt: now - 86400000 * 62,
      bankReality: {
        reconciled: true,
        reconciledAt: now - 86400000 * 60,
        period: '2026-06',
        actualNetSalaryReceived: 4620,
        actualInvestedPEA: 397.12,
        actualInvestedTontine: 0,
        actualInvestedTampon: 1370, // Prime virée sur tampon
        actualInvestedLivretA: 0,
        actualInvestedCTO: 0,
        totalActualInvested: 1767.12,
        actualSavingsRate: 38.2,
        deltaVsPlan: 1367.12,
        executionRatePercent: 441.8,
        status: 'OVER_INVESTED',
      },
    },
  ];

  const transactions: RawBankTransaction[] = [
    // Août 2026
    { id: 'tx-20260801-sal', date: '2026-08-01', description: 'VIR SEPA VESTAS FRANCE SALAIRE', amount: 3250, accountType: 'Courant' },
    { id: 'tx-20260802-pea', date: '2026-08-03', description: 'Versement PEA BoursoBank', amount: -397.44, accountType: 'Courant' },
    { id: 'tx-20260803-tont', date: '2026-08-05', description: 'Cotisation Virement Tontine', amount: -100, accountType: 'Courant' },
    // Juillet 2026
    { id: 'tx-20260701-sal', date: '2026-07-01', description: 'VIR SEPA VESTAS FRANCE SALAIRE', amount: 3250, accountType: 'Courant' },
    { id: 'tx-20260702-pea', date: '2026-07-02', description: 'Versement PEA BoursoBank', amount: -395.45, accountType: 'Courant' },
    // Juin 2026
    { id: 'tx-20260601-sal', date: '2026-06-01', description: 'VIR SEPA VESTAS FRANCE SALAIRE & PRIME', amount: 4620, accountType: 'Courant' },
    { id: 'tx-20260602-pea', date: '2026-06-02', description: 'Versement PEA BoursoBank', amount: -397.12, accountType: 'Courant' },
    { id: 'tx-20260603-tam', date: '2026-06-03', description: 'Virement vers Compte Tampon Réserve', amount: -1370, accountType: 'Courant' },
  ];

  return { records, transactions };
}

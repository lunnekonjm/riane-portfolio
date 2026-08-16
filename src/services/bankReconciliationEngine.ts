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
    category: 'RENT_HOUSING',
    patterns: [
      /loyer/i,
      /foncia/i,
      /nexity/i,
      /bailleur/i,
      /proprietaire/i,
      /quittance/i,
      /location\s+logement/i,
    ],
    baseConfidence: 0.95,
  },
  {
    category: 'SUBSCRIPTIONS',
    patterns: [
      /bouygues/i,
      /orange/i,
      /free\s*(mobile|telecom|box)?/i,
      /sfr/i,
      /spotify/i,
      /netflix/i,
      /apple(\.com)?/i,
      /amazon\s*(prime)?/i,
      /chatgpt|openai/i,
      /google\s*(storage|one|services)?/i,
      /edf/i,
      /engie/i,
      /totalenergies/i,
      /assurance\s*(habitation|auto)?/i,
    ],
    baseConfidence: 0.92,
  },
  {
    category: 'SUPPORT_WAVE',
    patterns: [
      /wave/i,
      /transfert.*wave/i,
      /envoi.*wave/i,
      /soutien/i,
    ],
    baseConfidence: 0.95,
  },
  {
    category: 'REVOLUT_TRANSFER',
    patterns: [
      /revolut/i,
      /rev\s*topup/i,
      /vir(ement)?\s+.*revolut/i,
    ],
    baseConfidence: 0.95,
  },
  {
    category: 'INVEST_PEA',
    patterns: [
      /versement\s+pea/i,
      /vir(ement)?\s+.*pea/i,
      /pea\s+bourso/i,
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

  // Dépense courante débitrice (CB, achat magasin...)
  if (amt < 0) {
    return { category: 'DAILY_EXPENSE', confidence: 0.7 };
  }

  return { category: 'IGNORED', confidence: 0.1 };
}

/**
 * Analyse l'ensemble des transactions pour une période (YYYY-MM)
 * et produit une proposition de réconciliation sans filtre restrictif.
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
  let actualRent = 0;
  let actualSubscriptions = 0;
  let actualInvestedPEA = 0;
  let actualInvestedTontine = 0;
  let actualSupportWave = 0;
  let actualRevolut = 0;
  let actualInvestedTampon = 0;
  let actualInvestedLivretA = 0;
  let actualInvestedCTO = 0;
  let actualDailyExpenses = 0;

  for (const m of matches) {
    if (!m.included) continue;
    switch (m.category) {
      case 'SALARY_INCOME':
        actualNetSalaryReceived += m.amount;
        break;
      case 'RENT_HOUSING':
        actualRent += m.amount;
        break;
      case 'SUBSCRIPTIONS':
        actualSubscriptions += m.amount;
        break;
      case 'INVEST_PEA':
        actualInvestedPEA += m.amount;
        break;
      case 'INVEST_TONTINE':
        actualInvestedTontine += m.amount;
        break;
      case 'SUPPORT_WAVE':
        actualSupportWave += m.amount;
        break;
      case 'REVOLUT_TRANSFER':
        actualRevolut += m.amount;
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
      case 'DAILY_EXPENSE':
      case 'OTHER_TRANSFER':
        actualDailyExpenses += m.amount;
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

  const totalActualFixedExpenses = Math.round((actualRent + actualSubscriptions) * 100) / 100;
  const totalActualLivingTransfers = Math.round((actualSupportWave + actualRevolut) * 100) / 100;

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
    actualRent: Math.round(actualRent * 100) / 100,
    actualSubscriptions: Math.round(actualSubscriptions * 100) / 100,
    actualInvestedPEA,
    actualInvestedTontine,
    actualSupportWave: Math.round(actualSupportWave * 100) / 100,
    actualRevolut: Math.round(actualRevolut * 100) / 100,
    actualInvestedTampon,
    actualInvestedLivretA,
    actualInvestedCTO,
    actualDailyExpenses: Math.round(actualDailyExpenses * 100) / 100,
    totalActualInvested,
    totalActualFixedExpenses,
    totalActualLivingTransfers,
    actualSavingsRate,
    deltaVsPlan,
    executionRatePercent,
    status,
    detectedTransactions: matches,
  };
}



export const TRUELAYER_TX_CACHE_KEY = 'truelayer_cached_transactions_v2';
export const TRUELAYER_TX_CACHE_TIMESTAMP_KEY = 'truelayer_cached_transactions_ts_v2';

export interface CachedTransactionsData {
  transactions: RawBankTransaction[];
  timestamp: number;
  months: string[];
}

/**
 * Récupère les transactions mises en cache dans localStorage
 */
export function getCachedTrueLayerTransactions(): CachedTransactionsData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TRUELAYER_TX_CACHE_KEY);
    const rawTs = localStorage.getItem(TRUELAYER_TX_CACHE_TIMESTAMP_KEY);
    if (!raw) return null;
    const transactions: RawBankTransaction[] = JSON.parse(raw);
    const timestamp = rawTs ? Number(rawTs) : Date.now();
    const monthSet = new Set<string>();
    transactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        monthSet.add(t.date.slice(0, 7));
      }
    });
    const months = Array.from(monthSet).sort().reverse();
    return { transactions, timestamp, months };
  } catch {
    return null;
  }
}

/**
 * Interroge l'API TrueLayer pour les N derniers mois complets et met en cache
 */
export async function fetchAndCacheTrueLayerTransactions(
  monthsCount: number = 3
): Promise<{ transactions: RawBankTransaction[]; partialErrors: string[]; months: string[]; requiresReauth?: boolean }> {
  const now = new Date();
  const fromDate = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1), 1);
  const from = fromDate.toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  try {
    const res = await fetch(`/api/integrations/truelayer/transactions?from=${from}&to=${to}`);
    if (!res.ok) {
      const errText = await res.text().catch(() => 'Erreur réseau');
      return {
        transactions: [],
        partialErrors: [`Échec de récupération (${res.status}): ${errText}`],
        months: [],
        requiresReauth: res.status === 401,
      };
    }

    const data = await res.json();
    const txList: RawBankTransaction[] = data.transactions || [];
    const partialErrors: string[] = data.partialErrors || [];
    const requiresReauth: boolean = !!data.requiresReauth;

    if (typeof window !== 'undefined' && txList.length > 0) {
      try {
        localStorage.setItem(TRUELAYER_TX_CACHE_KEY, JSON.stringify(txList));
        localStorage.setItem(TRUELAYER_TX_CACHE_TIMESTAMP_KEY, String(Date.now()));
      } catch (e) {
        console.warn('Could not cache transactions in localStorage:', e);
      }
    }

    const monthSet = new Set<string>();
    txList.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        monthSet.add(t.date.slice(0, 7));
      }
    });
    const months = Array.from(monthSet).sort().reverse();

    return { transactions: txList, partialErrors, months, requiresReauth };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur réseau';
    return {
      transactions: [],
      partialErrors: [msg],
      months: [],
      requiresReauth: false,
    };
  }
}



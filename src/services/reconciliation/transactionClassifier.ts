import type { BankReconciliationCategory } from '@/types/revenue';

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
export const CLASSIFICATION_RULES: Array<{
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

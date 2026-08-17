import type { BankReconciliationCategory } from '@/types/revenue';

export interface RawBankTransaction {
  id: string;
  date: string; // YYYY-MM-DD or ISO
  description: string;
  amount: number; // positive = credit, negative = debit
  accountId?: string;
  accountName?: string;
  accountType?: string;
  category?: string;
  counterpartyName?: string;
  rawDescription?: string;
}

/**
 * Nettoyage intelligent et concis du libellé bancaire brut
 */
export function cleanTransactionTitle(raw: string): string {
  if (!raw) return 'Transaction Bancaire';
  const upper = raw.toUpperCase();

  // Bouygues Telecom
  if (upper.includes('BOUYGUES')) {
    if (upper.includes('BBOX') || upper.includes('BOX') || upper.includes('INTERNET') || upper.includes('FIBRE') || upper.includes('09X') || upper.includes('09') || upper.includes('BT1150WDX')) {
      return 'Bouygues Telecom (Bbox/Fibre)';
    }
    if (upper.includes('MOBILE') || upper.includes('FORFAIT') || upper.includes('TEL') || upper.includes('06X') || upper.includes('06') || upper.includes('07') || upper.includes('BT1150VO')) {
      return 'Bouygues Telecom (Mobile)';
    }
    return 'Bouygues Telecom';
  }

  // Énergie & Charges Logement
  if (upper.includes('TOTALENERGIES') || upper.includes('TOTAL ENERGIES')) return 'TotalEnergies Électricité & Gaz';
  if (upper.includes('EDF')) return 'EDF Électricité';
  if (upper.includes('ENGIE')) return 'Engie Gaz/Électricité';

  // Assurances & Habitation
  if (upper.includes('BPCE') && (upper.includes('HABITATION') || upper.includes('ASSURANCE'))) return 'Assurance Habitation (BPCE)';
  if (upper.includes('PACIFICA')) return 'Assurance Habitation (Pacifica)';
  if (upper.includes('MACIF')) return 'Assurance Habitation (Macif)';
  if (upper.includes('MAIF')) return 'Assurance Habitation (Maif)';
  if (upper.includes('AXA')) return 'Assurance Habitation (AXA)';
  if (upper.includes('ALLIANZ')) return 'Assurance Habitation (Allianz)';
  if (upper.includes('MATMUT')) return 'Assurance Habitation (Matmut)';
  if (upper.includes('HABITATION') || upper.includes('ASSURANCE HABITATION')) return 'Assurance Habitation';

  // Streaming, Numérique & Banques
  if (upper.includes('NETFLIX')) return 'Netflix';
  if (upper.includes('SPOTIFY')) return 'Spotify';
  if (upper.includes('AMAZON PRIME') || upper.includes('PRIME VIDEO')) return 'Amazon Prime';
  if (upper.includes('CHATGPT') || upper.includes('OPENAI')) return 'ChatGPT Plus (OpenAI)';
  if (upper.includes('APPLE.COM') || upper.includes('APPLE') || upper.includes('ICLOUD')) return 'Apple Services / iCloud';
  if (upper.includes('GOOGLE') || upper.includes('GSUITE')) return 'Google Cloud / Storage';
  if (upper.includes('BOURSO PROTECT') || upper.includes('BOURSOPROTECTION')) return 'BoursoProtect (Assurance Bancaire)';

  // Logement & Bailleurs
  if (upper.includes('CDC HABITAT') || upper.includes('CDC')) return 'CDC Habitat (Loyer)';
  if (upper.includes('FONCIA')) return 'Foncia (Loyer)';
  if (upper.includes('NEXITY')) return 'Nexity (Loyer)';
  if (upper.includes('LOYER')) return 'Loyer & Charges';

  // Épargne & Investissement
  if (upper.includes('INVESTISSEMENT PEA') || (upper.includes('PEA') && upper.includes('BOURSO'))) return 'Virement Cible PEA BoursoBank';
  if (upper.includes('INTERACTIVE BROKERS')) return 'Interactive Brokers (CTO/Trading)';
  if (upper.includes('LIVRET A') || upper.includes('COMPTE SUR LIVRET')) return 'Virement Épargne Livret A';
  if (upper.includes('EPARGNE COMMUNE') || upper.includes('TONTINE') || upper.includes('COMPTE JOINT')) return 'Épargne Commune (Tontine)';
  if (upper.includes('CISSE ATOUMANE')) return 'Cotisation Tontine (M. Cissé)';
  if (upper.includes('REVOLUT') || upper.includes('ALLOCATION VAULTS') || upper.includes('TOPUP')) return 'Virement Revolut (Reste à vivre)';
  if (upper.includes('SENDWAVE') || upper.includes('WAVE') || upper.includes('REMITLY')) return 'Sendwave (Soutien Familial)';
  if (upper.includes('PAPE KEBE') || upper.includes('PAPE IBA KEBE')) return 'Virement (Pape Kebe)';

  // Rémunération
  if (upper.includes('VESTAS') || upper.includes('SALAIRE') || upper.includes('PAIE')) return 'Salaire Net (Vestas France)';

  // Santé & Médical
  if (upper.includes('TURREL')) return 'Soins Médicaux (Dr Turrel)';
  if (upper.includes('LATTES ORTHO')) return 'Orthodontie (Lattes Ortho)';
  if (upper.includes('PHAR CROIX') || upper.includes('PHARMACIE')) return "Pharmacie Croix d'Argent";
  if (upper.includes('MERCER')) return 'Remboursement Mutuelle Mercer';

  // Commerces, Achats & Vie Courante
  if (upper.includes('PAYPAL *DEVRED') || upper.includes('DEVRED')) return 'Devred (via PayPal)';
  if (upper.includes('PAYPAL *ALIPAY') || upper.includes('ALIPAY')) return 'AliPay (via PayPal)';
  if (upper.includes('PAYPAL *PAIEMENT') || upper.includes('PAYPAL')) return 'Paiement PayPal';
  if (upper.includes('FOOT LOCKER')) return 'Foot Locker (Shopping)';
  if (upper.includes('CARREFOUR')) return 'Carrefour Lattes (Courses)';
  if (upper.includes('BETM')) return 'B&M Home (Achats)';
  if (upper.includes('MURFY')) return 'Murfy (Réparation Électroménager)';
  if (upper.includes('GARE ORLY') || upper.includes('ORLY')) return 'Transports (Gare Orly)';
  if (upper.includes('LA PETITE AFFAIRE')) return 'La Petite Affaire (Snack/Café)';
  if (upper.includes('BOUMEDIENE')) return 'Commerce Boumediene';
  if (upper.includes('SARL ANDALUS') || upper.includes('ANDALUS')) return 'Alimentation Andalus';
  if (upper.includes('INTER MICOLAS')) return 'Intermarché Nicolas';
  if (upper.includes('AIN HAMRA')) return 'Boulangerie Ain Hamra';
  if (upper.includes('SLICEPIZZA') || upper.includes('SLICE PIZZA')) return 'Slice Pizza';
  if (upper.includes('OMAR MEHDAOUI')) return 'Commerce Omar Mehdaoui';
  if (upper.includes('AUCHAN')) return 'Auchan Supermarché';
  if (upper.includes('DARTY')) return 'Darty Électroménager';
  if (upper.includes('ZALANDO')) return 'Zalando Shopping';
  if (upper.includes('PARRAINAGE')) return 'Prime Parrainage BoursoBank';
  if (upper.includes('GESTE COMMERCIAL')) return 'Geste Commercial BoursoBank';

  // Nettoyage générique des préfixes SEPA, RUM, codes cartes
  let cleaned = raw
    .replace(/^PRLV\s+SEPA\s+/i, '')
    .replace(/^VIR\s+SEPA\s+/i, '')
    .replace(/^CARTE\s+\d{2}\/\d{2}\/\d{2}\s+/i, '')
    .replace(/^PRELEVEMENT\s+/i, '')
    .replace(/^VIREMENT\s+(DE|POUR|VERS|EMIS)?\s+/i, '')
    .replace(/^VIR\s+INST\s+/i, '')
    .replace(/^VIR\s+/i, '')
    .replace(/,\s*RÉF\s*:.*$/i, '')
    .replace(/,\s*REF\s*:.*$/i, '')
    .replace(/,\s*RUM\s+.*$/i, '')
    .replace(/CB\*\d+/i, '')
    .replace(/SCT\d+/i, '')
    .replace(/,\s*REFERENCE\s+.*$/i, '')
    .trim();

  if (cleaned.length > 38) {
    cleaned = cleaned.slice(0, 36) + '...';
  }
  return cleaned || raw;
}

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
    amountCheck: (amt) => amt > 500,
    baseConfidence: 0.95,
  },
  {
    category: 'RENT_HOUSING',
    patterns: [
      /loyer/i,
      /cdc(\s*habitat)?/i,
      /foncia/i,
      /nexity/i,
      /bailleur/i,
      /proprietaire/i,
      /quittance/i,
      /location\s+logement/i,
      /assurance\s*(habitation)?/i,
      /bpce/i,
      /habitation/i,
      /totalenergies/i,
      /total\s*energies/i,
      /edf/i,
      /engie/i,
      /pacifica/i,
      /macif/i,
      /maif/i,
      /axa/i,
      /allianz/i,
      /matmut/i,
    ],
    baseConfidence: 0.95,
  },
  {
    category: 'SUBSCRIPTIONS',
    patterns: [
      /bouygues/i,
      /bbox/i,
      /orange/i,
      /free\s*(mobile|telecom|box)?/i,
      /sfr/i,
      /spotify/i,
      /netflix/i,
      /apple(\.com)?/i,
      /amazon\s*(prime)?/i,
      /chatgpt|openai/i,
      /google\s*(storage|one|services)?/i,
      /bourso\s*protect/i,
      /boursoprotection/i,
      /assurance\s*(auto)?/i,
    ],
    baseConfidence: 0.92,
  },
  {
    category: 'SUPPORT_WAVE',
    patterns: [
      /sendwave/i,
      /wave/i,
      /remitly/i,
      /western\s*union/i,
      /moneygram/i,
      /virement.*famille/i,
      /aide.*famille/i,
    ],
    baseConfidence: 0.90,
  },
  {
    category: 'INVEST_PEA',
    patterns: [
      /pea/i,
      /bourse/i,
      /etf/i,
      /interactive\s*brokers/i,
      /degiro/i,
      /trade\s*republic/i,
      /virement.*bourse/i,
      /investissement.*pea/i,
    ],
    baseConfidence: 0.90,
  },
  {
    category: 'INVEST_LIVRET_A',
    patterns: [
      /livret\s*a/i,
      /compte\s*sur\s*livret/i,
      /epargne\s*precaution/i,
      /csl/i,
    ],
    baseConfidence: 0.90,
  },
  {
    category: 'REVOLUT_TRANSFER',
    patterns: [
      /revolut/i,
      /allocation\s*vaults/i,
      /topup.*revolut/i,
      /carte.*revolut/i,
    ],
    baseConfidence: 0.90,
  },
  {
    category: 'INVEST_TONTINE',
    patterns: [
      /tontine/i,
      /epargne\s*commune/i,
      /participation\s*epargne\s*commune/i,
      /epargne\s*collective/i,
      /compte\s*joint/i,
      /cisse\s*atoumane/i,
    ],
    baseConfidence: 0.90,
  },
];

export function classifyTransaction(tx: RawBankTransaction): {
  category: BankReconciliationCategory;
  confidence: number;
  matchedRule: string;
} {
  const text = `${tx.description} ${tx.counterpartyName || ''} ${tx.rawDescription || ''}`;
  const isPositive = tx.amount > 0;

  for (const rule of CLASSIFICATION_RULES) {
    if (rule.category === 'SALARY_INCOME' && !isPositive) continue;
    if (rule.amountCheck && !rule.amountCheck(Math.abs(tx.amount))) continue;

    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        return {
          category: rule.category,
          confidence: rule.baseConfidence,
          matchedRule: pattern.source,
        };
      }
    }
  }

  if (text.toUpperCase().includes('CARTE') || text.toUpperCase().includes('CB*') || text.toUpperCase().includes('PAYPAL') || !isPositive) {
    return {
      category: 'DAILY_EXPENSE',
      confidence: 0.7,
      matchedRule: 'daily_card_fallback',
    };
  }

  return {
    category: 'OTHER_TRANSFER',
    confidence: 0.3,
    matchedRule: 'none',
  };
}

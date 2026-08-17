export interface EnvelopeTaxRule {
  irRate: number;
  label: string;
}

export interface EnvelopeMetadataItem {
  label: string;
  depositLimit?: number;
  description: string;
  taxRules: {
    under5Years: EnvelopeTaxRule;
    over5Years: EnvelopeTaxRule;
  };
}

export const ENVELOPE_METADATA: Record<string, EnvelopeMetadataItem> = {
  PEA: {
    label: 'PEA (Plan d\'Épargne en Actions)',
    depositLimit: 150000,
    description: 'Exonération d\'impôt sur le revenu après 5 ans (Plafond versement = 150 000 €)',
    taxRules: {
      under5Years: { irRate: 0.128, label: 'Clôture ou PFU (12.8% IR + Prélèvements Sociaux)' },
      over5Years: { irRate: 0.0, label: 'Exonération d\'IR (0%) + Prélèvements Sociaux' },
    },
  },
  'PEA-PME': {
    label: 'PEA-PME',
    depositLimit: 225000,
    description: 'Plafond cumulé PEA + PEA-PME = 225 000 € max au total (75 000 € si PEA à 150 000 €)',
    taxRules: {
      under5Years: { irRate: 0.128, label: 'Clôture ou PFU (12.8% IR + Prélèvements Sociaux)' },
      over5Years: { irRate: 0.0, label: 'Exonération d\'IR (0%) + Prélèvements Sociaux' },
    },
  },
  CTO: {
    label: 'Compte-Titres Ordinaire (CTO)',
    depositLimit: undefined,
    description: 'Aucun plafond de versement, accès universel aux marchés mondiaux',
    taxRules: {
      under5Years: { irRate: 0.128, label: 'Flat Tax / PFU (12.8% IR + Prélèvements Sociaux)' },
      over5Years: { irRate: 0.128, label: 'Flat Tax / PFU (12.8% IR + Prélèvements Sociaux) ou Option Barème IR' },
    },
  },
  PEE: {
    label: 'Plan d\'Épargne Entreprise (PEE)',
    depositLimit: undefined,
    description: 'Épargne salariale (abondement entreprise)',
    taxRules: {
      under5Years: { irRate: 0.128, label: 'Bloqué 5 ans (sauf déblocage anticipé)' },
      over5Years: { irRate: 0.0, label: 'Exonération d\'IR (0%) + Prélèvements Sociaux' },
    },
  },
  LIVRET: {
    label: 'Livrets & Épargne Sécurisée (Livret A, LDDS, LEP, Cash)',
    depositLimit: 22950,
    description: 'Épargne de précaution 100% liquide & sécurisée. Intérêts totalement exonérés d\'impôts et prélèvements sociaux.',
    taxRules: {
      under5Years: { irRate: 0.0, label: 'Exonération totale d\'IR (0%) et de Prélèvements Sociaux (0%)' },
      over5Years: { irRate: 0.0, label: 'Exonération totale d\'IR (0%) et de Prélèvements Sociaux (0%)' },
    },
  },
  ASSURANCE_VIE: {
    label: 'Assurance-Vie',
    depositLimit: undefined,
    description: 'Enveloppe d\'épargne et de transmission avec niche fiscale après 8 ans (abattement annuel de 4 600 € / 9 200 €).',
    taxRules: {
      under5Years: { irRate: 0.128, label: 'Flat Tax / PFU 30% (12.8% IR + 17.2% PS)' },
      over5Years: { irRate: 0.075, label: 'Abattement annuel 4 600 € puis IR réduit 7.5% + PS 17.2%' },
    },
  },
  PER: {
    label: 'Plan d\'Épargne Retraite (PER)',
    depositLimit: undefined,
    description: 'Déduction fiscale des versements à l\'entrée (économie d\'IR à la TMI). Imposé en capital à la sortie.',
    taxRules: {
      under5Years: { irRate: 0.30, label: 'Bloqué jusqu\'à la retraite (Capital à la TMI + Plus-value Flat Tax)' },
      over5Years: { irRate: 0.30, label: 'Capital à la TMI + Plus-value au PFU 30%' },
    },
  },
  IMMOBILIER: {
    label: 'Immobilier & SCPI (Pierre Papier / Locatif)',
    depositLimit: undefined,
    description: 'Patrimoine immobilier locatif, SCPI de rendement ou pierre papier.',
    taxRules: {
      under5Years: { irRate: 0.30, label: 'Revenus fonciers imposés selon TMI + 17.2% Prélèvements Sociaux' },
      over5Years: { irRate: 0.30, label: 'Revenus fonciers (TMI + PS) + Abattements pour durée de détention' },
    },
  },
  SPECULATIVE: {
    label: 'Poche Spéculative',
    depositLimit: 2000,
    description: 'Poche dédiée aux opérations à fort risque / levier',
    taxRules: {
      under5Years: { irRate: 0.128, label: 'Flat Tax 30%' },
      over5Years: { irRate: 0.128, label: 'Flat Tax 30%' },
    },
  },
  OPPORTUNISTIC: {
    label: 'Réserve Opportuniste',
    depositLimit: undefined,
    description: 'Liquidités et opportunités de marché',
    taxRules: {
      under5Years: { irRate: 0.128, label: 'Flat Tax 30%' },
      over5Years: { irRate: 0.128, label: 'Flat Tax 30%' },
    },
  },
};

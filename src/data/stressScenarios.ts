/**
 * Scénarios de stress macroéconomiques rationalisés
 * Focus exclusif sur les chocs réalistes et actionnables pour un portefeuille 40/40/20.
 */

import type { StressScenario } from '@/types/simulation';

export const HISTORICAL_SCENARIOS: StressScenario[] = [
  {
    name: 'Choc de Taux & Compression Tech (Type 2022)',
    type: 'historical',
    shocks: {
      global_equities: -0.18,
      technology: -0.30,
      nasdaq_100: -0.28,
      small_caps: -0.22,
      eur_usd: -0.10,
    },
    durationMonths: 12,
    description: 'Remontée des taux directeurs des banques centrales, compression des ratios de valorisation sur les valeurs de croissance.',
  },
  {
    name: 'Récession Européenne & Choc de Liquidité Small Caps',
    type: 'historical',
    shocks: {
      global_equities: -0.15,
      europe_small: -0.35,
      small_caps: -0.30,
      speculative: -0.40,
    },
    durationMonths: 10,
    description: 'Ralentissement conjoncturel continental, baisse des marges industrielles et décote temporaire sur les Small/Mid caps PEA-PME.',
  },
  {
    name: 'Correction Majeure de Marché (-30%)',
    type: 'historical',
    shocks: {
      global_equities: -0.30,
      technology: -0.35,
      small_caps: -0.35,
      speculative: -0.50,
    },
    durationMonths: 8,
    description: 'Correction boursière globale sévère, créant des points d\'entrée historiques pour les versements DCA mensuels.',
  },
];

export const CUSTOM_RIANE_SCENARIOS: StressScenario[] = [
  {
    name: 'Ralentissement des Investissements IA & Capex',
    type: 'custom',
    shocks: {
      nasdaq_100: -0.22,
      coherent: -0.30,
      symbotic: -0.35,
      small_cap_technology: -0.25,
      constellation_energy: -0.15,
    },
    durationMonths: 6,
    description: 'Normalisation des budgets d\'infrastructure dans les Data Centers et temporisation des commandes technologiques.',
  },
];

export const ALL_SCENARIOS: StressScenario[] = [
  ...HISTORICAL_SCENARIOS,
  ...CUSTOM_RIANE_SCENARIOS,
];

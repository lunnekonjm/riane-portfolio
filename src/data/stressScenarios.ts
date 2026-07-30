/**
 * Scénarios de stress prédéfinis — CDC Sections "Stress tests" et "Stress tests RIANE"
 */

import type { StressScenario } from '@/types/simulation';

/** Stress tests historiques */
export const HISTORICAL_SCENARIOS: StressScenario[] = [
  {
    name: 'Crise financière mondiale (2008)',
    type: 'historical',
    shocks: {
      global_equities: -0.50,
      technology: -0.45,
      small_caps: -0.55,
      speculative: -0.70,
    },
    durationMonths: 18,
    description: 'Crise systémique bancaire mondiale',
  },
  {
    name: 'Choc pandémique (2020)',
    type: 'historical',
    shocks: {
      global_equities: -0.34,
      technology: -0.25,
      small_caps: -0.40,
      energy: -0.45,
    },
    durationMonths: 3,
    description: 'Pandémie COVID-19 avec rebond rapide',
  },
  {
    name: 'Choc inflationniste (2022)',
    type: 'historical',
    shocks: {
      global_equities: -0.20,
      technology: -0.30,
      small_caps: -0.25,
      eur_usd: -0.15,
    },
    durationMonths: 12,
    description: 'Inflation forte et remontée brutale des taux',
  },
  {
    name: 'Bulle technologique (2000)',
    type: 'historical',
    shocks: {
      global_equities: -0.25,
      technology: -0.75,
      small_caps: -0.30,
      speculative: -0.80,
    },
    durationMonths: 30,
    description: 'Éclatement de la bulle internet',
  },
  {
    name: 'Crise souveraine européenne (2011)',
    type: 'historical',
    shocks: {
      global_equities: -0.15,
      europe_small: -0.30,
      eur_usd: -0.10,
    },
    durationMonths: 12,
    description: 'Crise de dette souveraine dans la zone euro',
  },
  {
    name: 'Crise de change EUR/USD',
    type: 'historical',
    shocks: {
      eur_usd: 0.25,
      global_equities: -0.05,
    },
    durationMonths: 6,
    description: 'Appréciation forte de l\'euro contre le dollar',
  },
  {
    name: 'Crise de liquidité small caps',
    type: 'historical',
    shocks: {
      small_caps: -0.45,
      europe_small: -0.50,
      speculative: -0.60,
    },
    durationMonths: 12,
    description: 'Assèchement de la liquidité sur les petites capitalisations',
  },
];

/** Stress tests personnalisés RIANE */
export const CUSTOM_RIANE_SCENARIOS: StressScenario[] = [
  {
    name: 'AI capex reversal',
    type: 'custom',
    shocks: {
      nasdaq_100: -0.30,
      coherent: -0.45,
      symbotic: -0.45,
      small_cap_technology: -0.50,
    },
    correlations: 'crisis-adjusted',
    description: 'Retournement des investissements IA et data centers — coupe budgétaire massive des hyperscalers',
  },
  {
    name: 'European small cap liquidity crisis',
    type: 'custom',
    shocks: {
      europe_small: -0.35,
      riber: -0.55,
      memscap: -0.55,
      speculative_bucket: -0.70,
    },
    correlations: 'crisis-adjusted',
    description: 'Crise de liquidité ciblée sur les micro-caps européennes technologiques',
  },
  {
    name: 'Combined technology and currency shock',
    type: 'custom',
    shocks: {
      global_equities: -0.20,
      technology: -0.35,
      eur_appreciation: 0.20,
    },
    correlations: 'crisis-adjusted',
    description: 'Choc technologique combiné à une appréciation forte de l\'euro — double peine sur le CTO',
  },
];

export const ALL_SCENARIOS = [...HISTORICAL_SCENARIOS, ...CUSTOM_RIANE_SCENARIOS];

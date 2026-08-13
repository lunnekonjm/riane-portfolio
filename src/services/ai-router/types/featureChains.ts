import type { ModelEntry, QuotaKind } from './modelRegistry';

export type FeatureId =
  | 'research'           // Analyse fondamentale avec Ancrage & Live News Scraper
  | 'portfolio-analysis' // Évaluation utilité marginale portefeuille
  | 'risk-assessment'    // Évaluation risque et stress
  | 'critic'             // Contre-analyse et conformité
  | 'synthesis'          // Synthèse orchestrateur
  | 'news-scan'          // Scan d'actualités
  | 'intent-classifier'; // Guardrail de sécurité et périmètre

export interface FeatureRequirement {
  requiredCapability: ModelEntry['capabilities'][number];
  requiredQuotaKind: QuotaKind;
  degradeInsteadOfFallback: boolean;
  chain: string[];
}

export const FEATURE_CHAINS: Record<FeatureId, FeatureRequirement> = {
  research: {
    requiredCapability: 'text',
    requiredQuotaKind: 'generation',
    degradeInsteadOfFallback: false,
    chain: [
      'gemini-3.7-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemma-4-31b-it',
      'gemini-flash-latest',
    ],
  },
  'portfolio-analysis': {
    requiredCapability: 'text',
    requiredQuotaKind: 'generation',
    degradeInsteadOfFallback: false,
    chain: [
      'gemini-3.7-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemma-4-31b-it',
      'gemini-flash-latest',
    ],
  },
  'risk-assessment': {
    requiredCapability: 'reasoning',
    requiredQuotaKind: 'generation',
    degradeInsteadOfFallback: false,
    chain: [
      'gemini-3.7-flash-thinking',
      'gemini-3.7-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemma-4-31b-it',
    ],
  },
  critic: {
    requiredCapability: 'text',
    requiredQuotaKind: 'generation',
    degradeInsteadOfFallback: false,
    chain: [
      'gemini-3.7-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemma-4-31b-it',
      'gemini-flash-latest',
    ],
  },
  synthesis: {
    requiredCapability: 'text',
    requiredQuotaKind: 'generation',
    degradeInsteadOfFallback: false,
    chain: [
      'gemini-3.7-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemma-4-31b-it',
      'gemini-flash-latest',
    ],
  },
  'news-scan': {
    requiredCapability: 'text',
    requiredQuotaKind: 'generation',
    degradeInsteadOfFallback: false,
    chain: [
      'gemini-3.7-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemma-4-31b-it',
      'gemini-flash-latest',
    ],
  },
  'intent-classifier': {
    requiredCapability: 'text',
    requiredQuotaKind: 'generation',
    degradeInsteadOfFallback: false,
    chain: [
      'gemini-3.7-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
      'gemini-flash-latest',
    ],
  },
};

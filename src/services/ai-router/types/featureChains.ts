import type { ModelEntry, QuotaKind } from './modelRegistry';

export type FeatureId =
  | 'research'           // Analyse fondamentale avec Google Search Grounding
  | 'portfolio-analysis' // Évaluation utilité marginale portefeuille
  | 'risk-assessment'    // Évaluation risque et stress
  | 'critic'             // Contre-analyse et conformité
  | 'synthesis'          // Synthèse orchestrateur
  | 'news-scan'          // Scan d'actualités (Google Search obligatoire)
  | 'intent-classifier'; // Guardrail de sécurité et périmètre

export interface FeatureRequirement {
  requiredCapability: ModelEntry['capabilities'][number];
  requiredQuotaKind: QuotaKind;
  degradeInsteadOfFallback: boolean;
  chain: string[];
}

export const FEATURE_CHAINS: Record<FeatureId, FeatureRequirement> = {
  research: {
    requiredCapability: 'grounding',
    requiredQuotaKind: 'groundingSearch',
    degradeInsteadOfFallback: true,
    chain: ['gemini-2.5-flash', 'gemini-flash-latest'],
  },
  'portfolio-analysis': {
    requiredCapability: 'text',
    requiredQuotaKind: 'generation',
    degradeInsteadOfFallback: false,
    chain: [
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-flash-latest',
    ],
  },
  'risk-assessment': {
    requiredCapability: 'text',
    requiredQuotaKind: 'generation',
    degradeInsteadOfFallback: false,
    chain: [
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-flash-latest',
    ],
  },
  critic: {
    requiredCapability: 'text',
    requiredQuotaKind: 'generation',
    degradeInsteadOfFallback: false,
    chain: [
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-flash-latest',
    ],
  },
  synthesis: {
    requiredCapability: 'text',
    requiredQuotaKind: 'generation',
    degradeInsteadOfFallback: false,
    chain: [
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-flash-latest',
    ],
  },
  'news-scan': {
    requiredCapability: 'grounding',
    requiredQuotaKind: 'groundingSearch',
    degradeInsteadOfFallback: true,
    chain: ['gemini-2.5-flash', 'gemini-flash-latest'],
  },
  'intent-classifier': {
    requiredCapability: 'text',
    requiredQuotaKind: 'generation',
    degradeInsteadOfFallback: false,
    chain: ['gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest'],
  },
};

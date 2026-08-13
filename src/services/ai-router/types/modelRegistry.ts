export type QuotaKind = 'generation' | 'groundingSearch';

export interface ModelQuotaLimits {
  rpm: number | null;
  rpd: number | null;
  tpm: number | null;
}

export interface ModelEntry {
  id: string;
  family: 'gemini-2.5' | 'gemini-3' | 'gemini-3.1' | 'gemini-3.5' | 'gemini-3.6' | 'gemini-3.7';
  capabilities: ('text' | 'grounding' | 'reasoning')[];
  quotas: Partial<Record<QuotaKind, ModelQuotaLimits>>;
  knownUnavailable?: boolean;
}

/**
 * Registre des modèles Gemini — RIANE Portfolio
 * Intègre la nouvelle génération Gemini 3.7 Flash
 */
export const MODEL_REGISTRY: ModelEntry[] = [
  // Flagship Tier — Gemini 3.7 (avec raisonnement / thinking paramétrable)
  {
    id: 'gemini-3.7-flash',
    family: 'gemini-3.7',
    capabilities: ['text', 'grounding', 'reasoning'],
    quotas: {
      generation: { rpm: 15, rpd: 1000, tpm: 1000000 },
      groundingSearch: { rpm: 15, rpd: 1500, tpm: 1000000 },
    },
  },

  // High Performance Standard Tier
  {
    id: 'gemini-3.6-flash',
    family: 'gemini-3.6',
    capabilities: ['text'],
    quotas: {
      generation: { rpm: 5, rpd: 20, tpm: 250000 },
    },
  },
  {
    id: 'gemini-3.5-flash',
    family: 'gemini-3.5',
    capabilities: ['text'],
    quotas: {
      generation: { rpm: 5, rpd: 20, tpm: 250000 },
    },
  },
  {
    id: 'gemini-2.5-flash',
    family: 'gemini-2.5',
    capabilities: ['text', 'grounding'],
    quotas: {
      generation: { rpm: 5, rpd: 20, tpm: 250000 },
      groundingSearch: { rpm: 10, rpd: 1500, tpm: 250000 },
    },
  },

  // High Quota Fallback Tier (Lite)
  {
    id: 'gemini-3.5-flash-lite',
    family: 'gemini-3.5',
    capabilities: ['text'],
    quotas: {
      generation: { rpm: 15, rpd: 500, tpm: 250000 },
    },
  },
  {
    id: 'gemini-3.1-flash-lite',
    family: 'gemini-3.1',
    capabilities: ['text'],
    quotas: {
      generation: { rpm: 15, rpd: 500, tpm: 250000 },
    },
  },
  {
    id: 'gemini-flash-latest',
    family: 'gemini-2.5',
    capabilities: ['text'],
    quotas: {
      generation: { rpm: 15, rpd: 1500, tpm: 250000 },
    },
  },
];

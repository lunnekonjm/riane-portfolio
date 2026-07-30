export type QuotaKind = 'generation' | 'groundingSearch';

export interface ModelQuotaLimits {
  rpm: number | null;
  rpd: number | null;
  tpm: number | null;
}

export interface ModelEntry {
  id: string;
  family: 'gemini-2.5' | 'gemini-3' | 'gemini-3.1' | 'gemini-3.5' | 'gemini-3.6';
  capabilities: ('text' | 'grounding')[];
  quotas: Partial<Record<QuotaKind, ModelQuotaLimits>>;
  knownUnavailable?: boolean;
}

/**
 * Registre des modèles Gemini — adapté pour RIANE Portfolio
 * Focus sur text generation et grounding search
 */
export const MODEL_REGISTRY: ModelEntry[] = [
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

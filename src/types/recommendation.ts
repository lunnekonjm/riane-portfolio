/**
 * Types pour les recommandations avec expiration
 * et suivi de la qualité des décisions
 */

import type { RecommendationAction, ConfidenceLevel } from './analysis';

export interface Recommendation {
  id: string;
  ticker: string;
  assetName: string;
  action: RecommendationAction;
  createdAt: number;
  expiresAt: number;
  requiredEvent?: string;
  automaticReassessment: boolean;
  weight: number;
  fundingSource: string;
  conditions: string[];
  confidence: ConfidenceLevel;
  /** Whether this recommendation is still active */
  isActive: boolean;
  /** Linked analysis ID */
  analysisId: string;
}

export interface DecisionQuality {
  recommendationId: string;
  /** Quality metrics per CDC */
  sourceQuality: number;
  sourceFreshness: number;
  limitCompliance: boolean;
  riskAvoided: string[];
  concentrationImproved: boolean;
  feesAvoided: number;
  objectiveCoherence: number;
  reproducible: boolean;
  counterAnalysisQuality: number;
  humanDecisionRespected: boolean;
  /** Financial outcome — separate luck from process */
  financialOutcome?: number;
  outcomeAttribution?: 'process' | 'luck' | 'mixed';
  evaluatedAt: number;
}

export interface ThesisCard {
  id: string;
  ticker: string;
  assetName: string;
  thesis: string;
  catalysts: string[];
  risks: string[];
  targetEnvelope: string;
  initialDate: number;
  lastUpdated: number;
  status: 'active' | 'invalidated' | 'realized';
  updates: Array<{
    date: number;
    event: string;
    impact: string;
    thesisStillValid: boolean;
  }>;
}

/**
 * Types d'analyse — Revue à la demande et pipeline agents
 */

export type AnalysisStatus = 'pending' | 'data-collection' | 'research' | 'portfolio-eval' | 'critique' | 'synthesis' | 'complete' | 'abstention' | 'error';

export type RecommendationAction = 'monitor' | 'wait' | 'initiate' | 'replace' | 'reinforce' | 'reduce' | 'avoid';

export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very-high';

export type AbstentionReason =
  | 'insufficient-data'
  | 'contradictory-sources'
  | 'uncertain-identity'
  | 'stale-positions'
  | 'model-mismatch'
  | 'imminent-binary-event'
  | 'unmeasurable-liquidity'
  | 'no-valid-option'
  | 'pending-audit'
  | 'pea-eligibility-unconfirmed'
  | 'abnormal-spread'
  | 'above-cap'
  | 'contradictory-data';

export interface AnalysisRequest {
  id: string;
  query: string;
  ticker?: string;
  assetName?: string;
  createdAt: number;
  status: AnalysisStatus;
}

export interface MarketDataResult {
  ticker: string;
  name: string;
  price: number;
  currency: string;
  change24h: number;
  change24hPercent: number;
  marketCap?: number;
  peRatio?: number;
  eps?: number;
  dividendYield?: number;
  beta?: number;
  week52High?: number;
  week52Low?: number;
  avgVolume?: number;
  sector?: string;
  industry?: string;
  exchange?: string;
  dataSource: string;
  fetchedAt: number;
}

export interface ResearchResult {
  ticker: string;
  fundamentals: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    catalysts: string[];
    risks: string[];
  };
  valuation: {
    assessment: string;
    metrics: Record<string, string>;
  };
  recentNews: Array<{
    title: string;
    summary: string;
    source: string;
    date: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  thesisStatement: string;
  searchEntryPointHtml?: string;
  isGrounded: boolean;
  modelUsed: string;
}

export interface PortfolioEvalResult {
  marginalUtility: {
    score: number;
    explanation: string;
  };
  overlaps: Array<{
    existingPosition: string;
    overlapType: string;
    degree: number;
  }>;
  envelopeCheck: {
    eligible: boolean;
    envelope: string;
    constraints: string[];
  };
  comparisonWithExisting: Array<{
    position: string;
    comparison: string;
    preference: 'candidate' | 'existing' | 'neutral';
  }>;
  scenarios: [Scenario, Scenario, Scenario];
  proposedAction: RecommendationAction;
  proposedWeight: number;
  fundingSource: string;
  conditions: string[];
  confidence: ConfidenceLevel;
}

export interface Scenario {
  name: string;
  description: string;
  probability: string;
  impact: string;
  portfolioEffect: number;
}

export interface CritiqueResult {
  counterArguments: string[];
  ruleViolations: string[];
  abstentionCheck: {
    shouldAbstain: boolean;
    reasons: AbstentionReason[];
    requiredInfo: string[];
  };
  riskFlags: string[];
  overallAssessment: string;
}

export interface AnalysisResult {
  id: string;
  request: AnalysisRequest;
  marketData?: MarketDataResult;
  research?: ResearchResult;
  portfolioEval?: PortfolioEvalResult;
  critique?: CritiqueResult;
  synthesis?: string;
  recommendation?: {
    action: RecommendationAction;
    weight: number;
    fundingSource: string;
    conditions: string[];
    confidence: ConfidenceLevel;
    expiresAt: number;
  };
  completedAt?: number;
  error?: string;
}

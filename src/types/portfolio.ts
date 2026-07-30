/**
 * Types du portefeuille de RIANE
 * Conformes au cahier des charges V4
 */

export type Envelope = 'PEA' | 'PEA-PME' | 'CTO' | 'PEE' | 'SPECULATIVE' | 'OPPORTUNISTIC';

export type AssetType = 'ETF' | 'STOCK' | 'FUND' | 'BOND' | 'CRYPTO' | 'CASH';

export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF';

export interface Position {
  id: string;
  ticker: string;
  name: string;
  envelope: Envelope;
  assetType: AssetType;
  currency: Currency;
  /** Number of shares/units held */
  quantity: number;
  /** Average purchase price */
  avgPrice: number;
  /** Current market price */
  currentPrice?: number;
  /** Target weight in portfolio (0-1) */
  targetWeight?: number;
  /** Maximum allowed weight (0-1) */
  maxWeight?: number;
  /** Monthly DCA amount in EUR */
  monthlyDCA?: number;
  /** Annual budget in EUR (for CTO) */
  annualBudget?: number;
  /** Thematic tags */
  themes: string[];
  /** Last update timestamp */
  updatedAt: number;
}

export interface PortfolioConfig {
  /** Monthly total contribution budget */
  monthlyBudget: number;
  /** Annual CTO budget */
  annualCTOBudget: number;
  /** Annual speculative budget cap */
  annualSpeculativeCap: number;
  /** Risk profile */
  riskProfile: 'conservative' | 'balanced' | 'dynamic' | 'aggressive';
  /** No leverage allowed */
  noLeverage: boolean;
  /** Rebalance by flows first */
  rebalanceByFlows: boolean;
  /** Base currency */
  baseCurrency: Currency;
  /** Investment horizon in years */
  horizonYears: number;
}

export interface EnvelopeSummary {
  envelope: Envelope;
  totalValue: number;
  totalCost: number;
  gainLoss: number;
  gainLossPercent: number;
  weight: number;
  positions: Position[];
}

export interface PortfolioSnapshot {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  envelopes: EnvelopeSummary[];
  thematicExposure: ThematicExposure[];
  updatedAt: number;
}

export interface ThematicExposure {
  theme: string;
  label: string;
  weight: number;
  positions: string[];
  /** Aggregated across sectors — key insight from CDC */
  crossSectorWeight: number;
}

export interface DCAProposal {
  month: string;
  allocations: Array<{
    positionId: string;
    ticker: string;
    name: string;
    envelope: Envelope;
    amount: number;
    rationale: string;
  }>;
  totalAmount: number;
  generatedAt: number;
  expiresAt: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  action: string;
  agent: string;
  input: string;
  output: string;
  recommendation?: string;
  confidence?: number;
  humanDecision?: 'approved' | 'rejected' | 'deferred';
  humanDecisionAt?: number;
}

export interface LiquidityMetrics {
  ticker: string;
  avgVolume: number;
  medianSpread: number;
  depthScore: number;
  positionInDaysVolume: number;
  normalLiquidationCost: number;
  crisisLiquidationCost: number;
  pastSuspensions: number;
  freeFloatConcentration: number;
  lotConstraints: number;
}

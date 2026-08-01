/**
 * Types pour les moteurs de simulation
 * Monte Carlo, Stress Tests, Sensibilité
 */

export type SimulationMethod =
  | 'parametric-normal'
  | 'student-t'
  | 'historical-bootstrap'
  | 'block-bootstrap'
  | 'market-regime'
  | 'deterministic-scenario';

export interface MonteCarloConfig {
  portfolioValue: number;
  baseCurrency: 'EUR';
  horizonYears: number;
  contributions: ContributionSchedule[];
  withdrawals: WithdrawalSchedule[];
  inflationModel: 'fixed' | 'stochastic';
  inflationRate: number;
  fees: FeeSchedule[];
  taxes: 'simplified';
  expectedReturns: number[];
  volatilities: number[];
  correlations: number[][];
  distribution: SimulationMethod;
  degreesOfFreedom: number;
  simulations: number;
  rebalanceRule: 'contribution-first' | 'threshold' | 'calendar';
  randomSeed: number;
}

export interface ContributionSchedule {
  label: string;
  monthlyAmount: number;
  startMonth: number;
  endMonth?: number;
}

export interface WithdrawalSchedule {
  label: string;
  amount: number;
  month: number;
  recurring: boolean;
}

export interface FeeSchedule {
  label: string;
  annualRate: number;
}

export interface MonteCarloResult {
  config: MonteCarloConfig;
  method: SimulationMethod;
  /** Capital final statistics */
  medianCapital: number;
  meanCapital: number;
  meanWarning: string;
  percentiles: Record<string, number>;
  /** Real capital after inflation */
  realCapitalMedian: number;
  /** Probability of reaching each target */
  targetProbabilities: Array<{
    target: number;
    probability: number;
  }>;
  /** Probability of loss at various horizons */
  lossProbabilities: Record<string, number>;
  /** Max drawdown distribution */
  drawdownDistribution: {
    median: number;
    p5: number;
    p95: number;
  };
  /** Duration under previous peak */
  recoveryDuration: {
    medianMonths: number;
    extremeMonths: number;
  };
  /** Risk limit breaches */
  riskLimitBreachProbability: number;
  /** Engine version and metadata */
  engineVersion: string;
  dataDate: string;
  assumptions: string[];
  parameterSource: string;
  executedAt: number;
  executionTimeMs: number;
  errors: string[];
}

export interface MultiModelComparison {
  models: Array<{
    method: SimulationMethod;
    result: MonteCarloResult;
  }>;
  conclusion: string;
  sensitiveFactors: string[];
}

export interface StressScenario {
  name: string;
  type: 'historical' | 'hypothetical' | 'custom';
  shocks: Record<string, number>;
  correlations?: 'normal' | 'crisis-adjusted';
  durationMonths?: number;
  description: string;
}

export interface StressTestResult {
  scenario: StressScenario;
  portfolioLoss: number;
  portfolioLossPercent: number;
  lossByEnvelope: Record<string, number>;
  contributionByAsset: Array<{
    ticker: string;
    name: string;
    contribution: number;
    contributionPercent: number;
    inceptionYear?: number;
    isProxySimulated?: boolean;
    proxyNote?: string;
  }>;
  concentrationRevealed: string[];
  liquidityAvailable: number;
  limitBreaches: string[];
  rebalanceCostEstimate: number;
  objectiveImpact: string;
  governanceActions: string[];
  actionableGovernancePlans?: Array<{
    id: string;
    title: string;
    diagnostic: string;
    concreteAction: string;
    buttonLabel: string;
    actionType: 'UPDATE_TARGET_WEIGHT' | 'INCREASE_DCA' | 'CAP_CTO_BUDGET';
    targetTicker?: string;
    targetValue?: number;
  }>;
  executedAt: number;
}

export interface SensitivityAnalysis {
  parameter: string;
  baseValue: number;
  variations: Array<{
    value: number;
    resultChange: number;
    resultChangePercent: number;
  }>;
  influence: number;
  rank: number;
}

export interface SensitivityReport {
  analyses: SensitivityAnalysis[];
  rankedFactors: string[];
  conclusion: string;
  executedAt: number;
}

export interface AssumptionRegistry {
  id: string;
  expectedReturnsSource: string;
  historicalWindow: string;
  volatilityMethod: string;
  correlationMethod: string;
  inflationAssumption: number;
  feesIncluded: boolean;
  taxMethod: string;
  distribution: SimulationMethod;
  degreesOfFreedom: number;
  simulations: number;
  randomSeed: number;
  approvedBy: string;
  validUntil: string;
  createdAt: number;
}

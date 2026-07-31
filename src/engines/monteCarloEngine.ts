export type TaxEnvelopeType = 'PEA' | 'CTO' | 'MIXED';

export interface MonteCarloInput {
  initialCapital: number;
  monthlyDCA: number;
  horizonYears: number; // e.g. 5, 10, 15, 20
  annualReturnMean?: number; // e.g. 0.075 (7.5%)
  annualVolatility?: number; // e.g. 0.15 (15%)
  inflationRate?: number; // e.g. 0.021 (2.1%)
  numSimulations?: number; // e.g. 10000
  taxEnvelope?: TaxEnvelopeType; // Tax mode
  peaRatio?: number; // 0.0 to 1.0 (for MIXED mode)
}

export interface MonteCarloYearSummary {
  year: number;
  p1: number;  // 1st percentile (Extreme Tail Crash)
  p10: number; // 10th percentile (Bear market)
  p50: number; // Median expected
  p90: number; // 90th percentile (Bull market)
  p50Net: number; // Post-tax net wealth
  totalInvested: number;
}

export interface MonteCarloResult {
  horizonYears: number;
  numSimulations: number;
  executionTimeMs: number;
  taxEnvelope: TaxEnvelopeType;
  effectiveTaxRate: number; // e.g. 0.172 for PEA, 0.30 for CTO
  totalInvestedFinal: number;
  finalP1: number;  // 1st percentile (Worst 1% Crash)
  finalP10: number;
  finalP50: number;
  finalP90: number;
  finalP50Net: number; // Net cash after French taxes
  monthlyPassiveIncomeP50Gross: number; // 4% rule gross
  monthlyPassiveIncomeP50Net: number; // 4% rule net after taxes
  targetMilestones: {
    targetAmount: number;
    successProbability: number;
  }[];
  yearlySummaries: MonteCarloYearSummary[];
}

/**
 * Standard Normal Random Variable Generator (Box-Muller Transform)
 */
function randomNormal(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Calculates effective French tax rate based on envelope & strict legal deposit caps:
 * PEA: 150,000 € max deposits (18.6% PS on gains). Surplus > 150k is legally taxed at 31.4% CTO Flat Tax.
 * CTO: 31.4% PFU / Flat Tax (12.8% IR + 18.6% PS) on all gains.
 * MIXED: Allocates up to 150,000 € to PEA first, remaining surplus to CTO.
 */
export function getEffectiveTaxRate(envelope: TaxEnvelopeType, totalInvested = 100000, peaRatio = 0.75): number {
  if (envelope === 'CTO') return 0.314; // 31.4% Flat tax / PFU (12.8% IR + 18.6% PS)
  
  const maxPeaDeposit = envelope === 'PEA' ? 150000 : 225000;
  
  if (totalInvested <= maxPeaDeposit) {
    return 0.186; // 18.6% PS (0% IR)
  }

  // Legal Enforcement: Any deposits exceeding 150 000 € (PEA) or 225 000 € (MIXED) overflow into CTO
  const peaPart = maxPeaDeposit;
  const ctoPart = totalInvested - maxPeaDeposit;
  const realPeaRatio = peaPart / totalInvested;

  return realPeaRatio * 0.186 + (1 - realPeaRatio) * 0.314;
}

/**
 * Applies French tax rate ONLY to the capital gain portion (Plus-Value)
 */
export function applyFrenchTax(grossWealth: number, totalInvested: number, taxRate: number): number {
  const capitalGain = Math.max(0, grossWealth - totalInvested);
  const taxAmount = capitalGain * taxRate;
  return grossWealth - taxAmount;
}

/**
 * Runs Adaptive Stochastic Monte Carlo Simulations for Wealth Projection with French Tax Rules
 */
export function runMonteCarloSimulation(input: MonteCarloInput): MonteCarloResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const {
    initialCapital,
    monthlyDCA,
    horizonYears,
    annualReturnMean = 0.075,
    annualVolatility = 0.15,
    inflationRate = 0.021,
    numSimulations = 10000,
    taxEnvelope = 'MIXED',
    peaRatio = 0.75,
  } = input;

  const totalInvestedFinal = initialCapital + monthlyDCA * (horizonYears * 12);
  const effectiveTaxRate = getEffectiveTaxRate(taxEnvelope, totalInvestedFinal, peaRatio);
  const realReturn = annualReturnMean - inflationRate;
  const dt = 1 / 12; // Monthly time step
  const totalMonths = horizonYears * 12;
  const drift = (realReturn - 0.5 * Math.pow(annualVolatility, 2)) * dt;
  const volSqrtDt = annualVolatility * Math.sqrt(dt);

  // Track month-by-month results for N runs
  const simulationResults: number[][] = Array.from({ length: numSimulations }, () => new Array(totalMonths + 1));

  for (let sim = 0; sim < numSimulations; sim++) {
    let currentWealth = initialCapital;
    simulationResults[sim][0] = currentWealth;

    for (let month = 1; month <= totalMonths; month++) {
      const z = randomNormal();
      const growthFactor = Math.exp(drift + volSqrtDt * z);
      currentWealth = currentWealth * growthFactor + monthlyDCA;
      simulationResults[sim][month] = currentWealth;
    }
  }

  // Calculate yearly summaries
  const yearlySummaries: MonteCarloYearSummary[] = [];

  for (let year = 1; year <= horizonYears; year++) {
    const monthIdx = year * 12;
    const yearValues = simulationResults.map((sim) => sim[monthIdx]).sort((a, b) => a - b);

    const p1Idx = Math.max(0, Math.floor(numSimulations * 0.01));
    const p10Idx = Math.floor(numSimulations * 0.1);
    const p50Idx = Math.floor(numSimulations * 0.5);
    const p90Idx = Math.floor(numSimulations * 0.9);

    const totalInvested = initialCapital + monthlyDCA * monthIdx;
    const p50Gross = yearValues[p50Idx];
    const p50Net = applyFrenchTax(p50Gross, totalInvested, effectiveTaxRate);

    yearlySummaries.push({
      year,
      p1: yearValues[p1Idx],
      p10: yearValues[p10Idx],
      p50: p50Gross,
      p90: yearValues[p90Idx],
      p50Net,
      totalInvested,
    });
  }

  const finalYearValues = simulationResults.map((sim) => sim[totalMonths]).sort((a, b) => a - b);
  const finalP1 = finalYearValues[Math.max(0, Math.floor(numSimulations * 0.01))];
  const finalP10 = finalYearValues[Math.floor(numSimulations * 0.1)];
  const finalP50 = finalYearValues[Math.floor(numSimulations * 0.5)];
  const finalP90 = finalYearValues[Math.floor(numSimulations * 0.9)];

  const finalP50Net = applyFrenchTax(finalP50, totalInvestedFinal, effectiveTaxRate);

  // Monthly passive income based on Trinity Study 4% Safe Withdrawal Rate rule
  const monthlyPassiveIncomeP50Gross = (finalP50 * 0.04) / 12;
  const monthlyPassiveIncomeP50Net = (finalP50Net * 0.04) / 12;

  // Success probabilities for key milestones (Net of tax)
  const targets = [100000, 250000, 500000, 1000000];
  const targetMilestones = targets.map((targetAmount) => {
    const successes = finalYearValues.filter((grossWealth) => {
      const netWealth = applyFrenchTax(grossWealth, totalInvestedFinal, effectiveTaxRate);
      return netWealth >= targetAmount;
    }).length;
    return {
      targetAmount,
      successProbability: (successes / numSimulations) * 100,
    };
  });

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const executionTimeMs = Math.round(endTime - startTime);

  return {
    horizonYears,
    numSimulations,
    executionTimeMs,
    taxEnvelope,
    effectiveTaxRate,
    totalInvestedFinal,
    finalP1,
    finalP10,
    finalP50,
    finalP90,
    finalP50Net,
    monthlyPassiveIncomeP50Gross,
    monthlyPassiveIncomeP50Net,
    targetMilestones,
    yearlySummaries,
  };
}

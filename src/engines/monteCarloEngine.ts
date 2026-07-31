export interface MonteCarloInput {
  initialCapital: number;
  monthlyDCA: number;
  horizonYears: number; // e.g. 5, 10, 15, 20
  annualReturnMean?: number; // e.g. 0.075 (7.5%)
  annualVolatility?: number; // e.g. 0.15 (15%)
  inflationRate?: number; // e.g. 0.021 (2.1%)
  numSimulations?: number; // e.g. 10000
}

export interface MonteCarloYearSummary {
  year: number;
  p10: number; // 10th percentile (Bear market)
  p50: number; // Median expected
  p90: number; // 90th percentile (Bull market)
  totalInvested: number;
}

export interface MonteCarloResult {
  horizonYears: number;
  totalInvestedFinal: number;
  finalP10: number;
  finalP50: number;
  finalP90: number;
  monthlyPassiveIncomeP50: number; // 4% rule
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
 * Runs 10,000 Stochastic Monte Carlo Simulations for Wealth Projection
 */
export function runMonteCarloSimulation(input: MonteCarloInput): MonteCarloResult {
  const {
    initialCapital,
    monthlyDCA,
    horizonYears,
    annualReturnMean = 0.075,
    annualVolatility = 0.15,
    inflationRate = 0.021,
    numSimulations = 10000,
  } = input;

  const realReturn = annualReturnMean - inflationRate;
  const dt = 1 / 12; // Monthly time step
  const totalMonths = horizonYears * 12;
  const drift = (realReturn - 0.5 * Math.pow(annualVolatility, 2)) * dt;
  const volSqrtDt = annualVolatility * Math.sqrt(dt);

  // Array to store final trajectories across all 10,000 simulations
  // We track month-by-month results for 10,000 runs
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

  // Calculate yearly summaries for years 1 to horizonYears
  const yearlySummaries: MonteCarloYearSummary[] = [];

  for (let year = 1; year <= horizonYears; year++) {
    const monthIdx = year * 12;
    const yearValues = simulationResults.map((sim) => sim[monthIdx]).sort((a, b) => a - b);

    const p10Idx = Math.floor(numSimulations * 0.1);
    const p50Idx = Math.floor(numSimulations * 0.5);
    const p90Idx = Math.floor(numSimulations * 0.9);

    const totalInvested = initialCapital + monthlyDCA * monthIdx;

    yearlySummaries.push({
      year,
      p10: yearValues[p10Idx],
      p50: yearValues[p50Idx],
      p90: yearValues[p90Idx],
      totalInvested,
    });
  }

  const finalYearValues = simulationResults.map((sim) => sim[totalMonths]).sort((a, b) => a - b);
  const finalP10 = finalYearValues[Math.floor(numSimulations * 0.1)];
  const finalP50 = finalYearValues[Math.floor(numSimulations * 0.5)];
  const finalP90 = finalYearValues[Math.floor(numSimulations * 0.9)];
  const totalInvestedFinal = initialCapital + monthlyDCA * totalMonths;

  // Monthly passive income based on Trinity Study 4% Safe Withdrawal Rate rule
  const monthlyPassiveIncomeP50 = (finalP50 * 0.04) / 12;

  // Success probabilities for key milestones
  const targets = [100000, 250000, 500000, 1000000];
  const targetMilestones = targets.map((targetAmount) => {
    const successes = finalYearValues.filter((v) => v >= targetAmount).length;
    return {
      targetAmount,
      successProbability: (successes / numSimulations) * 100,
    };
  });

  return {
    horizonYears,
    totalInvestedFinal,
    finalP10,
    finalP50,
    finalP90,
    monthlyPassiveIncomeP50,
    targetMilestones,
    yearlySummaries,
  };
}

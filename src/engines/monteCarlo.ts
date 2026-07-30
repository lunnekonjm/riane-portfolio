/**
 * Moteur Monte Carlo — CDC conforme
 * Méthodes : Student-t, Bootstrap historique, Block Bootstrap
 * 50 000 simulations par défaut, graine reproductible
 */

import type { MonteCarloConfig, MonteCarloResult, SimulationMethod } from '@/types/simulation';

/** Seeded PRNG — Mulberry32 for reproducibility */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller for normal distribution */
function normalRandom(rng: () => number): number {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/** Student-t distribution via ratio of uniforms */
function studentTRandom(rng: () => number, df: number): number {
  const normal = normalRandom(rng);
  let chi2 = 0;
  for (let i = 0; i < df; i++) {
    const n = normalRandom(rng);
    chi2 += n * n;
  }
  return normal / Math.sqrt(chi2 / df);
}

/**
 * Run a single simulation path
 */
function simulatePath(
  config: MonteCarloConfig,
  rng: () => number,
  method: SimulationMethod,
  historicalReturns?: number[]
): number[] {
  const months = config.horizonYears * 12;
  const path: number[] = [config.portfolioValue];
  const monthlyReturn = config.expectedReturns.length > 0
    ? config.expectedReturns.reduce((a, b) => a + b, 0) / config.expectedReturns.length / 12
    : 0.07 / 12;
  const monthlyVol = config.volatilities.length > 0
    ? config.volatilities.reduce((a, b) => a + b, 0) / config.volatilities.length / Math.sqrt(12)
    : 0.15 / Math.sqrt(12);

  for (let m = 0; m < months; m++) {
    let shock: number;

    switch (method) {
      case 'student-t':
        shock = studentTRandom(rng, config.degreesOfFreedom || 5) * monthlyVol + monthlyReturn;
        break;
      case 'historical-bootstrap':
        if (historicalReturns && historicalReturns.length > 0) {
          const idx = Math.floor(rng() * historicalReturns.length);
          shock = historicalReturns[idx];
        } else {
          shock = normalRandom(rng) * monthlyVol + monthlyReturn;
        }
        break;
      case 'block-bootstrap':
        if (historicalReturns && historicalReturns.length > 0) {
          const blockSize = 12;
          const startIdx = Math.floor(rng() * (historicalReturns.length - blockSize));
          shock = historicalReturns[startIdx + (m % blockSize)];
        } else {
          shock = normalRandom(rng) * monthlyVol + monthlyReturn;
        }
        break;
      case 'parametric-normal':
      default:
        shock = normalRandom(rng) * monthlyVol + monthlyReturn;
        break;
    }

    let value = path[path.length - 1] * (1 + shock);

    // Add contributions
    const contribution = config.contributions.reduce((sum, c) => {
      if (m >= c.startMonth && (!c.endMonth || m <= c.endMonth)) {
        return sum + c.monthlyAmount;
      }
      return sum;
    }, 0);
    value += contribution;

    // Subtract withdrawals
    config.withdrawals.forEach((w) => {
      if (m === w.month || (w.recurring && m > 0 && m % 12 === w.month % 12)) {
        value -= w.amount;
      }
    });

    // Apply fees
    const monthlyFees = config.fees.reduce((sum, f) => sum + f.annualRate / 12, 0);
    value *= (1 - monthlyFees);

    path.push(Math.max(0, value));
  }

  return path;
}

/**
 * Calculate percentiles from sorted array
 */
function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const frac = idx - lower;
  if (lower + 1 < sorted.length) {
    return sorted[lower] + frac * (sorted[lower + 1] - sorted[lower]);
  }
  return sorted[lower];
}

/**
 * Calculate max drawdown for a path
 */
function maxDrawdown(path: number[]): number {
  let peak = path[0];
  let maxDd = 0;
  for (const value of path) {
    if (value > peak) peak = value;
    const dd = (peak - value) / peak;
    if (dd > maxDd) maxDd = dd;
  }
  return maxDd;
}

/**
 * Run Monte Carlo simulation
 */
export function runMonteCarlo(
  config: MonteCarloConfig,
  historicalReturns?: number[]
): MonteCarloResult {
  const startTime = Date.now();
  const rng = mulberry32(config.randomSeed);
  const method = config.distribution;
  const n = config.simulations;

  const finalValues: number[] = [];
  const drawdowns: number[] = [];
  const recoveryDurations: number[] = [];

  for (let sim = 0; sim < n; sim++) {
    const path = simulatePath(config, rng, method, historicalReturns);
    finalValues.push(path[path.length - 1]);
    drawdowns.push(maxDrawdown(path));

    // Calculate recovery time (months below peak)
    let peak = path[0];
    let belowPeakMonths = 0;
    let maxBelowPeak = 0;
    for (const value of path) {
      if (value < peak) {
        belowPeakMonths++;
        maxBelowPeak = Math.max(maxBelowPeak, belowPeakMonths);
      } else {
        peak = value;
        belowPeakMonths = 0;
      }
    }
    recoveryDurations.push(maxBelowPeak);
  }

  // Sort for percentiles
  finalValues.sort((a, b) => a - b);
  drawdowns.sort((a, b) => a - b);
  recoveryDurations.sort((a, b) => a - b);

  const mean = finalValues.reduce((a, b) => a + b, 0) / n;
  const median = percentile(finalValues, 50);
  const inflationFactor = Math.pow(1 + config.inflationRate, config.horizonYears);

  // Loss probabilities at various horizons
  const lossProbabilities: Record<string, number> = {};
  [1, 3, 5, 10, 15].forEach((year) => {
    if (year <= config.horizonYears) {
      const monthIdx = year * 12;
      // Simplified: estimate from final distribution relative to contributions
      const totalContrib = config.contributions.reduce((sum, c) => {
        const endMonth = c.endMonth || config.horizonYears * 12;
        const months = Math.min(monthIdx, endMonth) - c.startMonth;
        return sum + Math.max(0, months) * c.monthlyAmount;
      }, config.portfolioValue);
      lossProbabilities[`${year}Y`] = finalValues.filter((v) => v < totalContrib).length / n;
    }
  });

  return {
    config,
    method,
    medianCapital: Math.round(median),
    meanCapital: Math.round(mean),
    meanWarning: 'La moyenne est tirée vers le haut par les scénarios extrêmes. La médiane est plus représentative.',
    percentiles: {
      'p5': Math.round(percentile(finalValues, 5)),
      'p10': Math.round(percentile(finalValues, 10)),
      'p25': Math.round(percentile(finalValues, 25)),
      'p50': Math.round(median),
      'p75': Math.round(percentile(finalValues, 75)),
      'p90': Math.round(percentile(finalValues, 90)),
      'p95': Math.round(percentile(finalValues, 95)),
    },
    realCapitalMedian: Math.round(median / inflationFactor),
    targetProbabilities: [],
    lossProbabilities,
    drawdownDistribution: {
      median: parseFloat((percentile(drawdowns, 50) * 100).toFixed(1)),
      p5: parseFloat((percentile(drawdowns, 5) * 100).toFixed(1)),
      p95: parseFloat((percentile(drawdowns, 95) * 100).toFixed(1)),
    },
    recoveryDuration: {
      medianMonths: Math.round(percentile(recoveryDurations, 50)),
      extremeMonths: Math.round(percentile(recoveryDurations, 95)),
    },
    riskLimitBreachProbability: 0,
    engineVersion: '1.0.0',
    dataDate: new Date().toISOString().split('T')[0],
    assumptions: [
      `Distribution: ${method}`,
      `Simulations: ${n}`,
      `Horizon: ${config.horizonYears} ans`,
      `Graine: ${config.randomSeed}`,
      `Inflation: ${(config.inflationRate * 100).toFixed(1)}%`,
    ],
    parameterSource: 'capital_market_assumptions',
    executedAt: Date.now(),
    executionTimeMs: Date.now() - startTime,
    errors: [],
  };
}

/**
 * Add target probability to results
 */
export function addTargetProbability(
  result: MonteCarloResult,
  target: number,
  allFinalValues: number[]
): void {
  const above = allFinalValues.filter((v) => v >= target).length;
  result.targetProbabilities.push({
    target,
    probability: above / allFinalValues.length,
  });
}

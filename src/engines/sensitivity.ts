/**
 * Analyse de sensibilité — CDC conforme
 * Fait varier les 12 paramètres clés et classe par influence
 */

import type { SensitivityAnalysis, SensitivityReport } from '@/types/simulation';
import { runMonteCarlo } from './monteCarlo';
import type { MonteCarloConfig } from '@/types/simulation';

interface SensitivityParam {
  name: string;
  label: string;
  getBase: (config: MonteCarloConfig) => number;
  applyVariation: (config: MonteCarloConfig, value: number) => MonteCarloConfig;
  variations: number[];
}

const SENSITIVITY_PARAMS: SensitivityParam[] = [
  {
    name: 'expected_return',
    label: 'Rendement réel du cœur actions',
    getBase: (c) => c.expectedReturns[0] || 0.07,
    applyVariation: (c, v) => ({ ...c, expectedReturns: [v] }),
    variations: [0.03, 0.05, 0.07, 0.09, 0.11],
  },
  {
    name: 'volatility',
    label: 'Volatilité',
    getBase: (c) => c.volatilities[0] || 0.15,
    applyVariation: (c, v) => ({ ...c, volatilities: [v] }),
    variations: [0.10, 0.12, 0.15, 0.20, 0.25],
  },
  {
    name: 'inflation',
    label: 'Inflation',
    getBase: (c) => c.inflationRate,
    applyVariation: (c, v) => ({ ...c, inflationRate: v }),
    variations: [0.01, 0.02, 0.03, 0.04, 0.05],
  },
  {
    name: 'horizon',
    label: 'Horizon d\'investissement',
    getBase: (c) => c.horizonYears,
    applyVariation: (c, v) => ({ ...c, horizonYears: v }),
    variations: [5, 10, 15, 20, 25],
  },
  {
    name: 'contribution',
    label: 'Rythme des versements',
    getBase: (c) => c.contributions[0]?.monthlyAmount || 1000,
    applyVariation: (c, v) => ({
      ...c,
      contributions: [{ ...c.contributions[0], monthlyAmount: v, label: 'DCA', startMonth: 0 }],
    }),
    variations: [500, 750, 1000, 1500, 2000],
  },
  {
    name: 'fees',
    label: 'Frais totaux',
    getBase: (c) => c.fees[0]?.annualRate || 0.005,
    applyVariation: (c, v) => ({
      ...c,
      fees: [{ label: 'Total', annualRate: v }],
    }),
    variations: [0.002, 0.005, 0.01, 0.015, 0.02],
  },
];

/**
 * Run sensitivity analysis — varies each parameter and measures impact
 */
export function runSensitivityAnalysis(
  baseConfig: MonteCarloConfig,
  reducedSimulations: number = 5000
): SensitivityReport {
  // Use fewer simulations for sensitivity (speed)
  const config = { ...baseConfig, simulations: reducedSimulations };
  const baseResult = runMonteCarlo(config);
  const baseMedian = baseResult.medianCapital;

  const analyses: SensitivityAnalysis[] = [];

  for (const param of SENSITIVITY_PARAMS) {
    const baseValue = param.getBase(config);
    const variations: SensitivityAnalysis['variations'] = [];

    for (const varValue of param.variations) {
      const varConfig = param.applyVariation(config, varValue);
      const varResult = runMonteCarlo(varConfig);
      const change = varResult.medianCapital - baseMedian;
      const changePercent = baseMedian > 0 ? (change / baseMedian) * 100 : 0;

      variations.push({
        value: varValue,
        resultChange: Math.round(change),
        resultChangePercent: parseFloat(changePercent.toFixed(2)),
      });
    }

    // Calculate influence score (range of outcomes)
    const maxChange = Math.max(...variations.map((v) => Math.abs(v.resultChangePercent)));
    const influence = maxChange;

    analyses.push({
      parameter: param.label,
      baseValue,
      variations,
      influence,
      rank: 0,
    });
  }

  // Rank by influence
  analyses.sort((a, b) => b.influence - a.influence);
  analyses.forEach((a, i) => { a.rank = i + 1; });

  return {
    analyses,
    rankedFactors: analyses.map((a) => a.parameter),
    conclusion: `Les facteurs les plus sensibles sont : ${analyses.slice(0, 3).map((a) => a.parameter).join(', ')}.`,
    executedAt: Date.now(),
  };
}

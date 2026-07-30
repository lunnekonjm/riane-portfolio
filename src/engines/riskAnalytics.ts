/**
 * Moteur Analytics de Risque Avancé — VaR (Value at Risk) & Diversification
 * Calcule la VaR paramétrique à 95% et 99% sur 1 an et le score de diversification.
 */

import type { Position } from '@/types/portfolio';

export interface PortfolioRiskMetrics {
  totalValueEUR: number;
  annualVolatility: number; // in %
  var95EUR: number; // Max annual loss with 95% confidence
  var95Percent: number;
  var99EUR: number; // Max annual loss with 99% confidence
  var99Percent: number;
  estimatedSharpeRatio: number;
  diversificationScore: number; // 0 to 100
  topAssetConcentration: number; // % weight of largest single holding
}

/** Estimated asset volatilities */
const ASSET_VOLATILITY: Record<string, number> = {
  'CW8.PA': 0.15,
  'GPEA.PA': 0.15,
  'PUST.PA': 0.22,
  'INDE.PA': 0.18,
  'ALRIB.PA': 0.35,
  'MEMS.PA': 0.38,
  'COHR': 0.32,
  'CEG': 0.26,
  'SYM': 0.42,
};

export function calculatePortfolioRiskMetrics(
  positions: Position[],
  fxRates: Record<string, number> = { EUR: 1.0, USD: 0.92 }
): PortfolioRiskMetrics {
  const filled = positions.filter((p) => p.quantity > 0 && p.avgPrice > 0);

  if (filled.length === 0) {
    return {
      totalValueEUR: 0,
      annualVolatility: 0,
      var95EUR: 0,
      var95Percent: 0,
      var99EUR: 0,
      var99Percent: 0,
      estimatedSharpeRatio: 0,
      diversificationScore: 0,
      topAssetConcentration: 0,
    };
  }

  // Compute total EUR value
  let totalValueEUR = 0;
  const values: number[] = [];

  for (const p of filled) {
    const price = p.currentPrice || p.avgPrice;
    const rate = fxRates[p.currency] || 1.0;
    const val = p.quantity * price * rate;
    totalValueEUR += val;
    values.push(val);
  }

  if (totalValueEUR === 0) {
    return {
      totalValueEUR: 0,
      annualVolatility: 0,
      var95EUR: 0,
      var95Percent: 0,
      var99EUR: 0,
      var99Percent: 0,
      estimatedSharpeRatio: 0,
      diversificationScore: 0,
      topAssetConcentration: 0,
    };
  }

  // Weighted volatility
  let weightedVolSum = 0;
  let maxVal = 0;

  for (let i = 0; i < filled.length; i++) {
    const p = filled[i];
    const val = values[i];
    const weight = val / totalValueEUR;
    if (val > maxVal) maxVal = val;

    const baseVol = ASSET_VOLATILITY[p.ticker] || (p.assetType === 'ETF' ? 0.16 : 0.28);
    weightedVolSum += weight * baseVol;
  }

  // Diversification benefit (correlation factor ~0.7 average across assets)
  const divFactor = Math.max(0.65, 1 / Math.sqrt(filled.length));
  const portfolioVol = weightedVolSum * divFactor;

  // Parametric VaR (Normal distribution Z-scores: Z_95 = 1.645, Z_99 = 2.326)
  const var95Percent = portfolioVol * 1.645 * 100;
  const var95EUR = totalValueEUR * portfolioVol * 1.645;

  const var99Percent = portfolioVol * 2.326 * 100;
  const var99EUR = totalValueEUR * portfolioVol * 2.326;

  // Estimated Sharpe ratio (assuming 3% risk-free rate and 10% expected return)
  const expectedReturn = 0.09;
  const riskFreeRate = 0.03;
  const estimatedSharpeRatio = (expectedReturn - riskFreeRate) / Math.max(0.01, portfolioVol);

  // Top asset concentration
  const topAssetConcentration = (maxVal / totalValueEUR) * 100;

  // Diversification Score (100 = optimal, 0 = single speculative stock)
  let divScore = 50;
  if (filled.length >= 5) divScore += 20;
  if (topAssetConcentration <= 35) divScore += 15;
  if (topAssetConcentration <= 20) divScore += 15;
  if (portfolioVol < 0.20) divScore += 10;
  divScore = Math.min(100, Math.max(0, divScore));

  return {
    totalValueEUR: parseFloat(totalValueEUR.toFixed(2)),
    annualVolatility: parseFloat((portfolioVol * 100).toFixed(1)),
    var95EUR: parseFloat(var95EUR.toFixed(0)),
    var95Percent: parseFloat(var95Percent.toFixed(1)),
    var99EUR: parseFloat(var99EUR.toFixed(0)),
    var99Percent: parseFloat(var99Percent.toFixed(1)),
    estimatedSharpeRatio: parseFloat(estimatedSharpeRatio.toFixed(2)),
    diversificationScore: Math.round(divScore),
    topAssetConcentration: parseFloat(topAssetConcentration.toFixed(1)),
  };
}

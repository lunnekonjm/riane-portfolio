/**
 * Moteur Analytics de Risque Avancé — VaR (Value at Risk) & Diversification
 * Calcule la VaR paramétrique à 95% et 99% sur 1 an et le score de diversification.
 */

import type { Position } from '@/types/portfolio';

export interface PortfolioRiskMetrics {
  totalValueEUR: number;
  annualVolatility: number; // in %
  expectedReturn: number; // in %, rendement moyen pondéré par position (scénario neutre)
  var95EUR: number; // Max annual loss with 95% confidence
  var95Percent: number;
  var99EUR: number; // Max annual loss with 99% confidence
  var99Percent: number;
  estimatedSharpeRatio: number;
  diversificationScore: number; // 0 to 100
  topAssetConcentration: number; // % weight of largest single holding
  coveragePercent: number; // % du portefeuille couvert par une hypothèse spécifique (vs. générique par type d'actif)
}

/**
 * Hypothèses de rendement/risque par instrument — alignées sur l'Annexe C du plan
 * PEA/PEA-PME/CTO (volatilités recherchées, rendements = scénario neutre, betas
 * estimés pour le modèle à facteur de marché unique). Mis à jour le 09/08/2026.
 *
 * Sources : trackers Nasdaq-100 (PUST), catégorie Quantalys Europe Ptes/Moy Cap
 * SRRI 4 (Indépendance), ideal-investisseur.fr (Riber 103%, Memscap 57.4%),
 * beta boursier + amplitude 52 semaines (Symbotic, Coherent, Constellation).
 */
const ASSET_VOLATILITY: Record<string, number> = {
  'CW8.PA': 0.15,
  'GPEA.PA': 0.15,
  'WSEA.PA': 0.15,
  'PUST.PA': 0.23,
  '0P0001DKPM.F': 0.15, // Indépendance Europe Small
  'INDE.PA': 0.15,
  'ALRIB.PA': 1.00, // Riber
  'MEMS.PA': 0.57, // Memscap
  'COHR': 0.70, // Coherent Corp.
  'CEG': 0.40, // Constellation Energy
  'SYM': 0.70, // Symbotic Inc.
};

/** Rendement annuel moyen attendu (scénario neutre, section 02 du plan) */
const ASSET_EXPECTED_RETURN: Record<string, number> = {
  'CW8.PA': 0.075,
  'GPEA.PA': 0.075,
  'WSEA.PA': 0.075,
  'PUST.PA': 0.09,
  '0P0001DKPM.F': 0.07,
  'INDE.PA': 0.07,
  'ALRIB.PA': 0.08,
  'MEMS.PA': 0.08,
  'COHR': 0.10,
  'CEG': 0.10,
  'SYM': 0.10,
};

/** Beta vs facteur de marché commun (sigma_m = 16%/an) — modèle à un facteur, cf. Annexe C */
const ASSET_BETA: Record<string, number> = {
  'CW8.PA': 1.00,
  'GPEA.PA': 1.00,
  'WSEA.PA': 1.00,
  'PUST.PA': 1.10,
  '0P0001DKPM.F': 0.60,
  'INDE.PA': 0.60,
  'ALRIB.PA': 0.30,
  'MEMS.PA': 0.30,
  'COHR': 1.30,
  'CEG': 0.70,
  'SYM': 1.30,
};

const MARKET_FACTOR_VOL = 0.16;

function defaultVolFor(assetType: string): number {
  return assetType === 'ETF' || assetType === 'FUND' ? 0.16 : 0.28;
}
function defaultReturnFor(assetType: string): number {
  return assetType === 'ETF' || assetType === 'FUND' ? 0.075 : 0.09;
}
function defaultBetaFor(): number {
  return 1.0;
}

export function calculatePortfolioRiskMetrics(
  positions: Position[],
  fxRates: Record<string, number> = { EUR: 1.0, USD: 0.92 }
): PortfolioRiskMetrics {
  const filled = positions.filter((p) => p.quantity > 0 && p.avgPrice > 0);

  if (filled.length === 0) {
    return {
      totalValueEUR: 0,
      annualVolatility: 0,
      expectedReturn: 0,
      var95EUR: 0,
      var95Percent: 0,
      var99EUR: 0,
      var99Percent: 0,
      estimatedSharpeRatio: 0,
      diversificationScore: 0,
      topAssetConcentration: 0,
      coveragePercent: 0,
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
      expectedReturn: 0,
      var95EUR: 0,
      var95Percent: 0,
      var99EUR: 0,
      var99Percent: 0,
      estimatedSharpeRatio: 0,
      diversificationScore: 0,
      topAssetConcentration: 0,
      coveragePercent: 0,
    };
  }

  // Weighted volatility (naïve) + rendement pondéré + modèle à facteur unique
  let weightedVolSum = 0;
  let weightedReturn = 0;
  let weightedBeta = 0;
  let idiosyncraticVarianceSum = 0; // Σ w_i² σ_idio,i²
  let coveredWeight = 0; // % couvert par une hypothèse spécifique au ticker (vs. générique)
  let maxVal = 0;

  for (let i = 0; i < filled.length; i++) {
    const p = filled[i];
    const val = values[i];
    const weight = val / totalValueEUR;
    if (val > maxVal) maxVal = val;

    const hasSpecificData = p.ticker in ASSET_VOLATILITY;
    if (hasSpecificData) coveredWeight += weight;

    const baseVol = ASSET_VOLATILITY[p.ticker] ?? defaultVolFor(p.assetType);
    const baseReturn = ASSET_EXPECTED_RETURN[p.ticker] ?? defaultReturnFor(p.assetType);
    const beta = ASSET_BETA[p.ticker] ?? defaultBetaFor();

    weightedVolSum += weight * baseVol;
    weightedReturn += weight * baseReturn;
    weightedBeta += weight * beta;

    // Volatilité idiosyncratique résiduelle après le facteur de marché commun
    const idioVar = Math.max(baseVol ** 2 - (beta * MARKET_FACTOR_VOL) ** 2, 0.02 ** 2);
    idiosyncraticVarianceSum += weight ** 2 * idioVar;
  }

  // Modèle à facteur unique (cf. Annexe C du plan) : variance systématique + variance
  // idiosyncratique résiduelle. Remplace l'heuristique 1/sqrt(N) par une vraie
  // décomposition de corrélation — deux titres à fort beta restent corrélés même
  // s'ils sont nombreux, alors que deux microcaps à faible beta se diversifient bien.
  const systematicVariance = (weightedBeta * MARKET_FACTOR_VOL) ** 2;
  const portfolioVariance = systematicVariance + idiosyncraticVarianceSum;
  const portfolioVol = Math.sqrt(portfolioVariance);

  // Conservé à titre de repère (moyenne pondérée simple, sans bénéfice de corrélation)
  void weightedVolSum;

  // Parametric VaR (Normal distribution Z-scores: Z_95 = 1.645, Z_99 = 2.326)
  const var95Percent = portfolioVol * 1.645 * 100;
  const var95EUR = totalValueEUR * portfolioVol * 1.645;

  const var99Percent = portfolioVol * 2.326 * 100;
  const var99EUR = totalValueEUR * portfolioVol * 2.326;

  // Sharpe ratio estimé avec le rendement réellement pondéré par position (plus le flat 9% générique)
  const expectedReturn = weightedReturn;
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
    expectedReturn: parseFloat((expectedReturn * 100).toFixed(1)),
    var95EUR: parseFloat(var95EUR.toFixed(0)),
    var95Percent: parseFloat(var95Percent.toFixed(1)),
    var99EUR: parseFloat(var99EUR.toFixed(0)),
    var99Percent: parseFloat(var99Percent.toFixed(1)),
    estimatedSharpeRatio: parseFloat(estimatedSharpeRatio.toFixed(2)),
    diversificationScore: Math.round(divScore),
    topAssetConcentration: parseFloat(topAssetConcentration.toFixed(1)),
    coveragePercent: parseFloat((coveredWeight * 100).toFixed(0)),
  };
}

/**
 * Moteur de Stress Tests — CDC conforme
 * Stress historiques, hypothétiques et personnalisés RIANE
 */

import type { StressScenario, StressTestResult } from '@/types/simulation';
import type { Position } from '@/types/portfolio';

/** Map des sensibilités actif → facteur de choc */
const ASSET_SENSITIVITY: Record<string, Record<string, number>> = {
  'CW8.PA': { global_equities: 1.0, technology: 0.3, small_caps: 0.2 },
  'PUST.PA': { global_equities: 0.8, technology: 1.0, nasdaq_100: 1.0, small_caps: 0.1 },
  'INDE.PA': { global_equities: 0.5, europe_small: 1.0, small_caps: 0.9 },
  'ALRIB.PA': { europe_small: 0.8, small_caps: 1.0, small_cap_technology: 1.0, riber: 1.0, speculative: 0.3, speculative_bucket: 0.3 },
  'MEMS.PA': { europe_small: 0.8, small_caps: 1.0, small_cap_technology: 1.0, memscap: 1.0, speculative: 0.3, speculative_bucket: 0.3 },
  'COHR': { technology: 0.7, coherent: 1.0, eur_usd: -0.5, eur_appreciation: -0.5 },
  'CEG': { energy: 0.8, global_equities: 0.5, eur_usd: -0.3, eur_appreciation: -0.3 },
  'SYM': { technology: 0.8, symbotic: 1.0, global_equities: 0.5, eur_usd: -0.4, eur_appreciation: -0.4 },
};

/**
 * Calculate the impact of a stress scenario on a single position
 */
function calculatePositionImpact(
  position: Position,
  scenario: StressScenario
): number {
  const sensitivity = ASSET_SENSITIVITY[position.ticker] || { global_equities: 0.5 };
  let totalShock = 0;
  let shockCount = 0;

  for (const [factor, magnitude] of Object.entries(scenario.shocks)) {
    const sen = sensitivity[factor];
    if (sen !== undefined) {
      totalShock += magnitude * sen;
      shockCount++;
    }
  }

  // If no specific sensitivity found, apply a weighted average
  if (shockCount === 0) {
    const avgShock = Object.values(scenario.shocks).reduce((a, b) => a + b, 0) / Object.values(scenario.shocks).length;
    totalShock = avgShock * 0.5; // 50% sensitivity to average shock
  }

  // Crisis correlation adjustment
  if (scenario.correlations === 'crisis-adjusted') {
    totalShock *= 1.2; // 20% correlation premium in crisis
  }

  return totalShock;
}

/**
 * Run a stress test on the portfolio
 */
export function runStressTest(
  positions: Position[],
  scenario: StressScenario
): StressTestResult {
  const totalValue = positions.reduce((sum, p) => {
    const value = p.quantity * (p.currentPrice || p.avgPrice);
    return sum + value;
  }, 0);

  if (totalValue === 0) {
    return {
      scenario,
      portfolioLoss: 0,
      portfolioLossPercent: 0,
      lossByEnvelope: {},
      contributionByAsset: [],
      concentrationRevealed: [],
      liquidityAvailable: 0,
      limitBreaches: [],
      rebalanceCostEstimate: 0,
      objectiveImpact: 'Non calculable — portefeuille vide',
      governanceActions: ['Configurer les positions du portefeuille'],
      executedAt: Date.now(),
    };
  }

  const lossByEnvelope: Record<string, number> = {};
  const contributionByAsset: StressTestResult['contributionByAsset'] = [];
  let totalLoss = 0;

  for (const position of positions) {
    const posValue = position.quantity * (position.currentPrice || position.avgPrice);
    const impact = calculatePositionImpact(position, scenario);
    const loss = posValue * impact;

    totalLoss += loss;

    // By envelope
    const env = position.envelope;
    lossByEnvelope[env] = (lossByEnvelope[env] || 0) + loss;

    contributionByAsset.push({
      ticker: position.ticker,
      name: position.name,
      contribution: loss,
      contributionPercent: totalValue > 0 ? (loss / totalValue) * 100 : 0,
    });
  }

  // Sort by contribution
  contributionByAsset.sort((a, b) => a.contribution - b.contribution);

  // Concentration analysis
  const concentrationRevealed: string[] = [];
  const techExposure = contributionByAsset
    .filter((a) => {
      const pos = positions.find((p) => p.ticker === a.ticker);
      return pos?.themes.some((t) => t.includes('ai') || t.includes('tech') || t.includes('semi'));
    })
    .reduce((sum, a) => sum + Math.abs(a.contributionPercent), 0);

  if (techExposure > 30) {
    concentrationRevealed.push(`Exposition technologique concentrée : ${techExposure.toFixed(1)}% des pertes`);
  }

  // Limit breaches
  const limitBreaches: string[] = [];
  if (Math.abs(totalLoss / totalValue) > 0.25) {
    limitBreaches.push('Perte totale supérieure à 25% — seuil d\'alerte critique');
  }

  // Governance actions
  const governanceActions: string[] = [];
  if (Math.abs(totalLoss / totalValue) > 0.20) {
    governanceActions.push('Revoir l\'allocation thématique');
    governanceActions.push('Considérer un hedge partiel ou une réduction de l\'exposition');
  }
  governanceActions.push('Documenter le résultat dans le journal d\'audit');

  return {
    scenario,
    portfolioLoss: Math.round(totalLoss),
    portfolioLossPercent: parseFloat(((totalLoss / totalValue) * 100).toFixed(2)),
    lossByEnvelope: Object.fromEntries(
      Object.entries(lossByEnvelope).map(([k, v]) => [k, Math.round(v)])
    ),
    contributionByAsset,
    concentrationRevealed,
    liquidityAvailable: 0,
    limitBreaches,
    rebalanceCostEstimate: Math.abs(totalLoss) * 0.02,
    objectiveImpact: Math.abs(totalLoss / totalValue) > 0.30
      ? 'Impact majeur sur les objectifs datés — réévaluation nécessaire'
      : 'Impact modéré — plan viable avec ajustements',
    governanceActions,
    executedAt: Date.now(),
  };
}

/**
 * Run all stress tests
 */
export function runAllStressTests(
  positions: Position[],
  scenarios: StressScenario[]
): StressTestResult[] {
  return scenarios.map((scenario) => runStressTest(positions, scenario));
}

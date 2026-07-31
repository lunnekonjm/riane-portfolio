/**
 * Moteur de Stress Tests — CDC conforme
 * Stress historiques, hypothétiques et personnalisés RIANE
 */

import type { StressScenario, StressTestResult } from '@/types/simulation';
import type { Position } from '@/types/portfolio';
import { getCleanAssetName } from '@/utils/assetMetadata';

/** Map des sensibilités actif → facteur de choc (connus) */
const KNOWN_SENSITIVITY: Record<string, Record<string, number>> = {
  'GPEA.PA': { global_equities: 1.0, technology: 0.3, small_caps: 0.2 },
  'CW8.PA': { global_equities: 1.0, technology: 0.3, small_caps: 0.2 },
  'PUST.PA': { global_equities: 0.8, technology: 1.0, nasdaq_100: 1.0, small_caps: 0.1 },
  '0P0001DKPM.F': { global_equities: 0.5, europe_small: 1.0, small_caps: 0.9 },
  'INDE.PA': { global_equities: 0.5, europe_small: 1.0, small_caps: 0.9 },
  'ALRIB.PA': { europe_small: 0.8, small_caps: 1.0, small_cap_technology: 1.0, riber: 1.0, speculative: 0.3, speculative_bucket: 0.3 },
  'MEMS.PA': { europe_small: 0.8, small_caps: 1.0, small_cap_technology: 1.0, memscap: 1.0, speculative: 0.3, speculative_bucket: 0.3 },
  'COHR': { technology: 0.7, coherent: 1.0, eur_usd: -0.5, eur_appreciation: -0.5 },
  'CEG': { energy: 0.8, global_equities: 0.5, eur_usd: -0.3, eur_appreciation: -0.3 },
  'SYM': { technology: 0.8, symbotic: 1.0, global_equities: 0.5, eur_usd: -0.4, eur_appreciation: -0.4 },
};

/**
 * Dynamically infer sensitivity for unknown positions based on their metadata
 */
function getSensitivity(position: Position): Record<string, number> {
  // Use known mapping if available
  if (KNOWN_SENSITIVITY[position.ticker]) {
    return KNOWN_SENSITIVITY[position.ticker];
  }

  // Infer from position metadata
  const sensitivity: Record<string, number> = {};

  // Asset type based defaults
  if (position.assetType === 'ETF') {
    sensitivity.global_equities = 0.8;
  } else if (position.assetType === 'STOCK') {
    sensitivity.global_equities = 0.6;
  } else if (position.assetType === 'BOND') {
    sensitivity.global_equities = 0.1;
    sensitivity.interest_rates = 0.8;
  } else if (position.assetType === 'CRYPTO') {
    sensitivity.global_equities = 0.4;
    sensitivity.speculative = 1.0;
  }

  // Theme-based sensitivity
  for (const theme of position.themes) {
    if (theme.includes('tech') || theme.includes('ai') || theme.includes('semi')) {
      sensitivity.technology = 0.8;
      sensitivity.nasdaq_100 = 0.6;
    }
    if (theme.includes('small') || theme.includes('micro')) {
      sensitivity.small_caps = 0.8;
      sensitivity.europe_small = 0.6;
    }
    if (theme.includes('energy') || theme.includes('nuclear')) {
      sensitivity.energy = 0.7;
    }
    if (theme.includes('specul')) {
      sensitivity.speculative = 0.5;
      sensitivity.speculative_bucket = 0.5;
    }
  }

  // Currency exposure — USD assets are affected by EUR/USD
  if (position.currency === 'USD') {
    sensitivity.eur_usd = -0.4;
    sensitivity.eur_appreciation = -0.4;
  }

  // Envelope-based — speculative/opportunistic positions are more volatile
  if (position.envelope === 'SPECULATIVE' || position.envelope === 'OPPORTUNISTIC') {
    sensitivity.speculative = Math.max(sensitivity.speculative || 0, 0.5);
    sensitivity.global_equities = Math.max(sensitivity.global_equities || 0, 0.7);
  }

  // Fallback: at least some market sensitivity
  if (Object.keys(sensitivity).length === 0) {
    sensitivity.global_equities = 0.5;
  }

  return sensitivity;
}

/**
 * Calculate the impact of a stress scenario on a single position
 */
function calculatePositionImpact(
  position: Position,
  scenario: StressScenario
): number {
  const sensitivity = getSensitivity(position);
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

const ASSET_INCEPTION_YEARS: Record<string, number> = {
  'GPEA.PA': 2024,
  'PUST.PA': 2000,
  '0P0001DKPM.F': 2018,
  'ALRIB.PA': 1999,
  'MEMS.PA': 2000,
  'COHR': 2022,
  'CEG': 2022,
  'SYM': 2022,
};

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

  // Extract scenario year from scenario name (e.g. "Crise financière mondiale (2008)" -> 2008)
  const yearMatch = scenario.name.match(/\((20\d\d|19\d\d)\)/);
  const scenarioYear = yearMatch ? parseInt(yearMatch[1], 10) : undefined;

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

    const inceptionYear = ASSET_INCEPTION_YEARS[position.ticker] || 2020;
    const isProxySimulated = scenarioYear ? inceptionYear > scenarioYear : false;
    const proxyNote = isProxySimulated
      ? `Coté à partir de ${inceptionYear} — Modélisé via indice proxy du secteur`
      : undefined;

    contributionByAsset.push({
      ticker: position.ticker,
      name: getCleanAssetName(position.ticker, position.name),
      contribution: loss,
      contributionPercent: totalValue > 0 ? (loss / totalValue) * 100 : 0,
      inceptionYear,
      isProxySimulated,
      proxyNote,
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

/**
 * Moteur de Stress Tests — CDC conforme
 * Stress historiques, hypothétiques et personnalisés RIANE
 */

import type { StressScenario, StressTestResult } from '@/types/simulation';
import type { Position } from '@/types/portfolio';
import { getCleanAssetName } from '@/utils/assetMetadata';

/**
 * Calcul de la sensibilité unitaire d'un actif face à un scénario
 * Évite le multi-comptage cumulatif des facteurs globaux et sectoriels.
 */
function calculateAssetPriceShock(
  position: Position,
  scenario: StressScenario
): number {
  // 1. Épargne garantie (Livrets A / LDDS / Fonds Euro) = 0.0% de perte boursière
  if (
    position.envelope === 'LIVRET' ||
    position.assetType === 'SAVINGS' ||
    position.ticker.toUpperCase().includes('LIVRET') ||
    position.ticker.toUpperCase().includes('LDDS')
  ) {
    return 0.0;
  }

  const shocks = scenario.shocks;
  const ticker = position.ticker.toUpperCase();

  // 2. Chocs directs spécifiques au ticker si définis dans le scénario
  if (ticker.includes('COHR') && shocks.coherent !== undefined) return shocks.coherent;
  if (ticker.includes('SYM') && shocks.symbotic !== undefined) return shocks.symbotic;
  if (ticker.includes('CEG') && shocks.constellation_energy !== undefined) return shocks.constellation_energy;
  if (ticker.includes('ALRIB') && shocks.riber !== undefined) return shocks.riber;
  if (ticker.includes('MEMS') && shocks.memscap !== undefined) return shocks.memscap;

  // 3. Mapping sectoriel et typologique réaliste (sans superposition excessive)
  if (ticker.includes('PUST') || ticker.includes('QQQ') || ticker.includes('NASDAQ')) {
    return shocks.nasdaq_100 ?? shocks.technology ?? (shocks.global_equities ? shocks.global_equities * 1.3 : -0.25);
  }

  if (ticker.includes('0P0001DKPM') || ticker.includes('INDE') || ticker.includes('ALRIB') || ticker.includes('MEMS')) {
    return shocks.europe_small ?? shocks.small_caps ?? (shocks.global_equities ? shocks.global_equities * 1.2 : -0.20);
  }

  if (ticker.includes('COHR') || ticker.includes('SYM')) {
    return shocks.technology ?? shocks.nasdaq_100 ?? -0.30;
  }

  if (ticker.includes('CEG')) {
    return shocks.energy ?? (shocks.global_equities ? shocks.global_equities * 0.8 : -0.15);
  }

  if (ticker.includes('GPEA') || ticker.includes('CW8') || ticker.includes('WSEA') || ticker.includes('WPEA')) {
    return shocks.global_equities ?? -0.18;
  }

  // 4. Fonds actions génériques (PEE actions, ETF non listé)
  if (position.assetType === 'ETF' || position.assetType === 'FUND') {
    return shocks.global_equities ?? -0.18;
  }

  // 5. Action individuelle par défaut
  if (position.themes.some((t) => t.includes('tech') || t.includes('ai'))) {
    return shocks.technology ?? shocks.nasdaq_100 ?? -0.28;
  }
  if (position.themes.some((t) => t.includes('small') || t.includes('micro'))) {
    return shocks.small_caps ?? shocks.europe_small ?? -0.25;
  }

  return shocks.global_equities ?? -0.20;
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
 * Exécute le Stress Test sur le portefeuille
 */
export function runStressTest(
  positions: Position[],
  scenario: StressScenario
): StressTestResult {
  // Calcul de la valeur globale du portefeuille coté + épargne
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
      governanceActions: ['Renseigner vos positions dans le portefeuille'],
      executedAt: Date.now(),
    };
  }

  const yearMatch = scenario.name.match(/\((20\d\d|19\d\d)\)/);
  const scenarioYear = yearMatch ? parseInt(yearMatch[1], 10) : undefined;

  const lossByEnvelope: Record<string, number> = {};
  const contributionByAsset: StressTestResult['contributionByAsset'] = [];
  let totalLoss = 0;

  for (const position of positions) {
    const isGuaranteed = position.envelope === 'LIVRET' || position.assetType === 'SAVINGS';
    const posValue = position.quantity * (position.currentPrice || position.avgPrice);
    const priceShock = isGuaranteed ? 0.0 : calculateAssetPriceShock(position, scenario);
    const loss = posValue === 0 ? 0 : Math.round(posValue * priceShock);

    totalLoss += loss;

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
      contributionPercent: totalValue > 0 ? parseFloat(((loss / totalValue) * 100).toFixed(1)) : 0,
      priceShockPercent: parseFloat((priceShock * 100).toFixed(1)),
      positionValue: Math.round(posValue),
      isHeld: position.quantity > 0,
      envelope: position.envelope,
      inceptionYear,
      isProxySimulated,
      proxyNote,
    });
  }

  // Tri : Actifs détenus subissant le plus de perte d'abord, puis actifs cibles
  contributionByAsset.sort((a, b) => {
    if (a.isHeld && !b.isHeld) return -1;
    if (!a.isHeld && b.isHeld) return 1;
    return (a.priceShockPercent || 0) - (b.priceShockPercent || 0);
  });

  // Recommandations stratégiques pédagogiques et concrètes (SANS mutation d'état destructrice)
  const worstPriceShocks = [...contributionByAsset]
    .filter((a) => (a.priceShockPercent || 0) < -25)
    .map((a) => `${a.name} (${a.priceShockPercent}%)`)
    .slice(0, 2)
    .join(', ');

  const governanceActions: string[] = [
    `Maintenir une discipline DCA stricte : Les actifs les plus décotés (${worstPriceShocks || 'Small Caps & Tech'}) offriront les meilleurs points d'entrée d'accumulation.`,
    `Préservation totale du matelas de sécurité : Vos liquidités Livret A restent 100% intactes pour couvrir vos dépenses courantes.`,
    `Aucune vente panique : 100% des baisses historiques de type "${scenario.name}" ont été résorbées et dépassées sur un horizon 15 ans.`,
  ];

  return {
    scenario,
    portfolioLoss: Math.round(totalLoss),
    portfolioLossPercent: parseFloat(((totalLoss / totalValue) * 100).toFixed(1)),
    lossByEnvelope: Object.fromEntries(
      Object.entries(lossByEnvelope).map(([k, v]) => [k, Math.round(v)])
    ),
    contributionByAsset,
    concentrationRevealed: [],
    liquidityAvailable: 0,
    limitBreaches: Math.abs(totalLoss / totalValue) > 0.25 ? ['Perte supérieure à 25% — phase normale de crise macroéconomique'] : [],
    rebalanceCostEstimate: Math.round(Math.abs(totalLoss) * 0.01),
    objectiveImpact: Math.abs(totalLoss / totalValue) > 0.20
      ? 'Impact temporaire — résorbable en quelques mois de versements DCA'
      : 'Impact modéré — parfaitement absorbé par la structure du portefeuille',
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


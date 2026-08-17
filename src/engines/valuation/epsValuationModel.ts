import type { StockValuationRecord } from '@/data/valuationData';
import type { ValuationEngineResult, ValuationSignalType, AlignmentType } from './valuationTypes';
import { computeSeriesStats } from './valuationTypes';

export function computeEpsValuation(
  stock: StockValuationRecord,
  currentPrice: number,
  priceStats: { total: number | null; cagr: number | null }
): ValuationEngineResult {
  const analystMean = stock.consensus.targetMean;
  const analystHigh = stock.consensus.targetHigh;
  const analystLow = stock.consensus.targetLow;
  const analystUpsidePct = ((analystMean - currentPrice) / currentPrice) * 100;
  const analystRating = stock.consensus.rating;
  const analystCount = stock.consensus.analystCount;

  const allPes: Array<{ i: number; pe: number; eps: number }> = [];
  if (stock.eps) {
    for (let i = 0; i < stock.years.length; i++) {
      const eps = stock.eps[i];
      const p = stock.price[i];
      if (eps !== null && eps !== undefined && eps > 0 && p !== null && p !== undefined) {
        allPes.push({ i, pe: p / eps, eps });
      }
    }
  }

  if (allPes.length === 0) {
    return {
      applicable: false,
      metricType: stock.metric,
      currentPrice,
      ratioName: 'P/E',
      currentRatio: 0,
      avgRatio: 0,
      stdevRatio: 0,
      gapPct: 0,
      zScore: 0,
      signal: 'Non calculable',
      signalClass: 'muted',
      confidence: 'low',
      confidenceLabel: 'Historique insuffisant',
      nPoints: 0,
      fairValue: 0,
      lowerZone: 0,
      upperZone: 0,
      priceZonePosition: 'DANS_FOURCHETTE',
      priceZoneLabel: 'Non calculable',
      growthMetricLabel: stock.metric === 'eps' ? 'BPA' : 'Résultat net',
      growthTotalPct: null,
      growthCagrPct: null,
      priceTotalPct: priceStats.total,
      priceCagrPct: priceStats.cagr,
      pegOrPsg: null,
      analystMean,
      analystHigh,
      analystLow,
      analystUpsidePct,
      analystRating,
      analystCount,
      alignment: 'NEUTRE',
      alignmentLabel: 'Données insuffisantes',
      alignmentClass: 'muted',
      methodExplanation: stock.note || 'Données insuffisantes pour un calcul mécanique.',
      reason: 'Société sans historique de bénéfice net positif suffisant pour un calcul P/E.',
    };
  }

  const current = allPes[allPes.length - 1];
  const priorPes = allPes.slice(0, -1);

  // Écarte les exercices tout juste bénéficiaires (<20% du BPA courant)
  const EPS_FLOOR_RATIO = 0.20;
  const epsFloor = current.eps * EPS_FLOOR_RATIO;
  const historical = priorPes.filter((p) => p.eps >= epsFloor);

  if (historical.length === 0) {
    const epsStats = computeSeriesStats(stock.years, stock.eps);
    return {
      applicable: true,
      metricType: 'eps',
      currentPrice,
      ratioName: 'P/E (Cours / BPA)',
      currentRatio: current.pe,
      avgRatio: current.pe,
      stdevRatio: current.pe * 0.15,
      gapPct: 0,
      zScore: 0,
      signal: 'Neutre',
      signalClass: 'warn',
      confidence: 'low',
      confidenceLabel: 'Fiabilité : 1 seul exercice comparable',
      nPoints: 1,
      fairValue: currentPrice,
      lowerZone: currentPrice * 0.85,
      upperZone: currentPrice * 1.15,
      priceZonePosition: 'DANS_FOURCHETTE',
      priceZoneLabel: 'Fourchette indicative 1er exercice',
      growthMetricLabel: 'BPA (bénéfice par action)',
      growthTotalPct: epsStats.total,
      growthCagrPct: epsStats.cagr,
      priceTotalPct: priceStats.total,
      priceCagrPct: priceStats.cagr,
      pegOrPsg: null,
      analystMean,
      analystHigh,
      analystLow,
      analystUpsidePct,
      analystRating,
      analystCount,
      alignment: 'NEUTRE',
      alignmentLabel: 'Historique récent',
      alignmentClass: 'warn',
      methodExplanation: 'Un seul exercice de bénéfice de référence disponible.',
    };
  }

  const MIN_STDEV_RATIO = 0.10;
  let avgPE: number;
  let stdevPE: number;
  let confidence: 'high' | 'mid' | 'low';
  let confidenceLabel: string;

  if (historical.length === 1) {
    avgPE = historical[0].pe;
    stdevPE = avgPE * MIN_STDEV_RATIO;
    confidence = 'low';
    confidenceLabel = 'Fiabilité : limitée (1 seul exercice de référence)';
  } else {
    avgPE = historical.reduce((s, p) => s + p.pe, 0) / historical.length;
    if (historical.length >= 3) {
      const variance =
        historical.reduce((s, p) => s + Math.pow(p.pe - avgPE, 2), 0) / (historical.length - 1);
      stdevPE = Math.sqrt(variance);
    } else {
      stdevPE = Math.abs(historical[1].pe - historical[0].pe) / 2;
    }
    if (stdevPE < avgPE * MIN_STDEV_RATIO) stdevPE = avgPE * MIN_STDEV_RATIO;

    if (historical.length >= 6) {
      confidence = 'high';
      confidenceLabel = `Fiabilité : excellente (${historical.length} exercices)`;
    } else if (historical.length >= 4) {
      confidence = 'mid';
      confidenceLabel = `Fiabilité : bonne (${historical.length} exercices)`;
    } else {
      confidence = 'low';
      confidenceLabel = `Fiabilité : modérée (${historical.length} exercices)`;
    }
  }

  const z = (current.pe - avgPE) / stdevPE;
  const gapPct = ((current.pe - avgPE) / avgPE) * 100;

  const Z_THRESHOLD = 1.0;
  let signal: ValuationSignalType = 'Neutre';
  let signalClass: 'good' | 'warn' | 'bad' | 'muted' = 'warn';

  if (z < -Z_THRESHOLD) {
    signal = 'Favorable';
    signalClass = 'good';
  } else if (z > Z_THRESHOLD) {
    signal = 'Défavorable';
    signalClass = 'bad';
  } else {
    signal = 'Neutre';
    signalClass = 'warn';
  }

  const epsStats = computeSeriesStats(stock.years, stock.eps);
  let peg: number | null = null;
  if (epsStats.cagr !== null && epsStats.cagr > 0) {
    peg = current.pe / epsStats.cagr;
  }

  const fairValue = current.eps * avgPE;
  const lowerZone = Math.max(0, current.eps * (avgPE - Z_THRESHOLD * stdevPE));
  const upperZone = current.eps * (avgPE + Z_THRESHOLD * stdevPE);

  let priceZonePosition: 'SOUS_FAVORABLE' | 'DANS_FOURCHETTE' | 'AU_DESSUS_VIGILANCE' = 'DANS_FOURCHETTE';
  let priceZoneLabel = 'Dans la fourchette historique habituelle';
  if (currentPrice < lowerZone) {
    priceZonePosition = 'SOUS_FAVORABLE';
    priceZoneLabel = 'Sous le repère favorable historique (-1σ)';
  } else if (currentPrice > upperZone) {
    priceZonePosition = 'AU_DESSUS_VIGILANCE';
    priceZoneLabel = 'Au-dessus du repère de vigilance (+1σ)';
  }

  // Confrontation Consensus
  let alignment: AlignmentType = 'NEUTRE';
  let alignmentLabel = 'Concordance Modérée';
  let alignmentClass: 'good' | 'warn' | 'bad' | 'muted' = 'warn';

  if (signal === 'Favorable' && analystUpsidePct >= 15) {
    alignment = 'CONCORDANCE_HAUSSIERE';
    alignmentLabel = '🎯 Concordance Totale (Modèle décoté & Consensus haussier)';
    alignmentClass = 'good';
  } else if (signal === 'Défavorable' && analystUpsidePct < 10) {
    alignment = 'CONCORDANCE_PRUDENTE';
    alignmentLabel = '🛡️ Prudence Confirmée (Modèle tendu & Faible upside consensus)';
    alignmentClass = 'bad';
  } else if (signal === 'Favorable' && analystUpsidePct < 10) {
    alignment = 'MODELE_PLUS_OFFENSIF';
    alignmentLabel = '⚡ Opportunité Détectée (Modèle plus constructif que le consensus)';
    alignmentClass = 'good';
  } else if (signal === 'Défavorable' && analystUpsidePct >= 20) {
    alignment = 'MODELE_PLUS_PRUDENT';
    alignmentLabel = '⚠️ Modèle plus prudent (Consensus agressif vs multiples historiques)';
    alignmentClass = 'warn';
  }

  return {
    applicable: true,
    metricType: 'eps',
    currentPrice,
    ratioName: 'P/E (Cours / BPA)',
    currentRatio: current.pe,
    avgRatio: avgPE,
    stdevRatio: stdevPE,
    gapPct,
    zScore: z,
    signal,
    signalClass,
    confidence,
    confidenceLabel,
    nPoints: historical.length,
    fairValue,
    lowerZone,
    upperZone,
    priceZonePosition,
    priceZoneLabel,
    growthMetricLabel: 'BPA (bénéfice par action)',
    growthTotalPct: epsStats.total,
    growthCagrPct: epsStats.cagr,
    priceTotalPct: priceStats.total,
    priceCagrPct: priceStats.cagr,
    pegOrPsg: peg,
    analystMean,
    analystHigh,
    analystLow,
    analystUpsidePct,
    analystRating,
    analystCount,
    alignment,
    alignmentLabel,
    alignmentClass,
    methodExplanation: `Score z = ${z >= 0 ? '+' : ''}${z.toFixed(2)}σ. P/E actuel de ${current.pe.toFixed(1)}× vs moyenne de ${avgPE.toFixed(1)}× (${gapPct >= 0 ? '+' : ''}${gapPct.toFixed(0)}% sur ${historical.length} exercices antérieurs). Repères ±1σ : ${lowerZone.toFixed(2)}${stock.currency} / ${fairValue.toFixed(2)}${stock.currency} / ${upperZone.toFixed(2)}${stock.currency}.`,
  };
}

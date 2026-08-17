import type { StockValuationRecord } from '@/data/valuationData';
import type { ValuationEngineResult, ValuationSignalType, AlignmentType } from './valuationTypes';
import { computeSeriesStats } from './valuationTypes';

export function computeRevenueValuation(
  stock: StockValuationRecord,
  currentPrice: number,
  priceStats: { total: number | null; cagr: number | null }
): ValuationEngineResult {
  const sm = stock.salesModel!;
  const currentRatio = sm.currentPsRatio;
  const avgRatio = sm.historicalPsAvg;
  const stdevRatio = sm.historicalPsStdev || avgRatio * 0.20;

  const gapPct = ((currentRatio - avgRatio) / avgRatio) * 100;
  const zScore = (currentRatio - avgRatio) / stdevRatio;

  // Repères de prix proportionnels au multiple P/S et au CA actuel
  const fairValue = currentPrice * (avgRatio / currentRatio);
  const lowerZone = Math.max(0, currentPrice * ((avgRatio - stdevRatio) / currentRatio));
  const upperZone = currentPrice * ((avgRatio + stdevRatio) / currentRatio);

  let signal: ValuationSignalType = 'Neutre';
  let signalClass: 'good' | 'warn' | 'bad' | 'muted' = 'warn';

  if (zScore < -0.85 || sm.psgRatio < 0.20) {
    signal = 'Favorable';
    signalClass = 'good';
  } else if (zScore > 0.85 || sm.psgRatio > 0.45) {
    signal = 'Vigilance';
    signalClass = 'bad';
  } else {
    signal = 'Neutre';
    signalClass = 'warn';
  }

  let priceZonePosition: 'SOUS_FAVORABLE' | 'DANS_FOURCHETTE' | 'AU_DESSUS_VIGILANCE' = 'DANS_FOURCHETTE';
  let priceZoneLabel = 'Dans la fourchette habituelle de valorisation du CA';
  if (currentPrice < lowerZone) {
    priceZonePosition = 'SOUS_FAVORABLE';
    priceZoneLabel = 'Sous le repère favorable de croissance de CA';
  } else if (currentPrice > upperZone) {
    priceZonePosition = 'AU_DESSUS_VIGILANCE';
    priceZoneLabel = 'Au-dessus du repère de vigilance (multiple tendu)';
  }

  // Consensus Analystes
  const analystMean = stock.consensus.targetMean;
  const analystHigh = stock.consensus.targetHigh;
  const analystLow = stock.consensus.targetLow;
  const analystUpsidePct = ((analystMean - currentPrice) / currentPrice) * 100;
  const analystRating = stock.consensus.rating;
  const analystCount = stock.consensus.analystCount;

  // Confrontation Modèle CA vs Consensus Analystes
  let alignment: AlignmentType = 'NEUTRE';
  let alignmentLabel = 'Concordance Partielle';
  let alignmentClass: 'good' | 'warn' | 'bad' | 'muted' = 'warn';

  if (signal === 'Favorable' && analystUpsidePct >= 15) {
    alignment = 'CONCORDANCE_HAUSSIERE';
    alignmentLabel = '🎯 Concordance Forte (Modèle & Analystes haussiers)';
    alignmentClass = 'good';
  } else if (signal === 'Vigilance' && analystUpsidePct < 10) {
    alignment = 'CONCORDANCE_PRUDENTE';
    alignmentLabel = '🛡️ Prudence Confirmée (Marché & Modèle prudents)';
    alignmentClass = 'bad';
  } else if (signal === 'Favorable' && analystUpsidePct < 10) {
    alignment = 'MODELE_PLUS_OFFENSIF';
    alignmentLabel = '⚡ Opportunité Détectée (Modèle plus haussier que le consensus)';
    alignmentClass = 'good';
  } else if (signal === 'Vigilance' && analystUpsidePct >= 20) {
    alignment = 'MODELE_PLUS_PRUDENT';
    alignmentLabel = '⚠️ Modèle plus prudent (Consensus agressif vs fondamentaux de CA)';
    alignmentClass = 'warn';
  }

  const revStats = computeSeriesStats(stock.years, stock.revenue);

  return {
    applicable: true,
    metricType: 'revenue',
    currentPrice,
    ratioName: 'P/S (Cours / CA)',
    currentRatio,
    avgRatio,
    stdevRatio,
    gapPct,
    zScore,
    signal,
    signalClass,
    confidence: 'mid',
    confidenceLabel: 'Modèle Croissance CA & P/S Sectoriel',
    nPoints: stock.years.length,
    fairValue,
    lowerZone,
    upperZone,
    priceZonePosition,
    priceZoneLabel,
    growthMetricLabel: `Chiffre d'affaires (${stock.revenueUnit})`,
    growthTotalPct: revStats.total ?? sm.revenueCagr * 2,
    growthCagrPct: sm.revenueCagr,
    priceTotalPct: priceStats.total,
    priceCagrPct: priceStats.cagr,
    pegOrPsg: sm.psgRatio,
    analystMean,
    analystHigh,
    analystLow,
    analystUpsidePct,
    analystRating,
    analystCount,
    alignment,
    alignmentLabel,
    alignmentClass,
    methodExplanation: `Modèle Chiffre d'Affaires (P/S ajusté de la croissance) : Multiple actuel ${currentRatio.toFixed(1)}× vs moyenne historique de ${avgRatio.toFixed(1)}× (${gapPct >= 0 ? '+' : ''}${gapPct.toFixed(0)}%). Ratio PSG (P/S ÷ Croissance CA ${sm.revenueCagr.toFixed(0)}%) = ${sm.psgRatio.toFixed(2)}. ${sm.backlogOrPipeline ? `Carnet/Pipeline : ${sm.backlogOrPipeline}.` : ''}`,
  };
}

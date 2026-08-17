/**
 * MOTEUR QUANTITATIF DE VALORISATION — RIANE PORTFOLIO
 * Modèle Dual :
 * 1. Modèle Rentabilité : BPA & P/E Z-Score (pour méga-caps et titres rentables)
 * 2. Modèle Croissance & Pipeline : Chiffre d'Affaires & P/S Growth-Adjusted (pour les 8-10 titres en phase d'hypercroissance / pré-revenus)
 * Intègre la confrontation continue avec le Consensus des Analystes de Wall Street & Paris.
 */

import { StockValuationRecord } from '@/data/valuationData';
import type { ValuationEngineResult, ValuationSignalType, AlignmentType } from './valuation/valuationTypes';
import { firstLastValid, computeSeriesStats } from './valuation/valuationTypes';
import { computeRevenueValuation } from './valuation/salesValuationModel';
import { computeEpsValuation } from './valuation/epsValuationModel';

export type { ValuationEngineResult, ValuationSignalType, AlignmentType };

export function computeStockValuation(stock: StockValuationRecord): ValuationEngineResult {
  const { li: lastPriceIdx } = firstLastValid(stock.price);
  const currentPrice = lastPriceIdx >= 0 ? stock.price[lastPriceIdx]! : stock.currentPrice;

  // Calcul des statistiques cours de bourse
  const priceStats = computeSeriesStats(stock.years, stock.price);

  // BRANCHE 1 : MODÈLE PAR LE CHIFFRE D'AFFAIRES (POUR VALEURS NON-RENTABLES / CROISSANCE)
  if (stock.metric === 'revenue' && stock.salesModel?.applicable) {
    return computeRevenueValuation(stock, currentPrice, priceStats);
  }

  // BRANCHE 2 : MODÈLE CLASSIQUE RENTABLE PAR LE BPA (P/E Z-SCORE)
  return computeEpsValuation(stock, currentPrice, priceStats);
}

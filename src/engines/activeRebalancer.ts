/**
 * Moteur de Rééquilibrage Actif (Arbitrage Strict Ventes -> Achats)
 * Règle d'or : On ne peut acheter QUE avec le cash dégagé par les ventes (Autofinancement strict).
 */

import type { Position } from '@/types/portfolio';

const MARKET_ENVELOPES = ['PEA', 'PEA-PME', 'CTO', 'SPECULATIVE', 'OPPORTUNISTIC'];

export interface ActiveRebalanceInstruction {
  positionId: string;
  ticker: string;
  name: string;
  envelope: string;
  currentWeight: number;
  targetWeight: number;
  weightGap: number;
  sharePrice: number;
  currency: string;
  action: 'SELL' | 'BUY' | 'HOLD';
  deltaShares: number; // negative for SELL, positive for BUY
  deltaCostEUR: number;
  newWeightAfter: number;
}

export interface ActiveRebalanceResult {
  totalValueEUR: number;
  totalCashFreedEUR: number;
  totalCashReinvestedEUR: number;
  instructions: ActiveRebalanceInstruction[];
}

export function calculateActiveRebalance(
  positions: Position[],
  fxRates: Record<string, number> = { EUR: 1.0, USD: 0.92 }
): ActiveRebalanceResult {
  // Filtrer STRICTEMENT les positions boursières cotées
  const filledPositions = positions.filter((p) => {
    const isMarket = MARKET_ENVELOPES.includes((p.envelope || '').toUpperCase());
    const hasValueOrTarget = (p.quantity || 0) > 0 || (p.targetWeight && p.targetWeight > 0);
    return isMarket && hasValueOrTarget;
  });

  const totalValueEUR = filledPositions.reduce((sum, p) => {
    const price = p.currentPrice || p.avgPrice || 1;
    const rate = fxRates[p.currency] || 1.0;
    return sum + p.quantity * price * rate;
  }, 0);

  if (totalValueEUR <= 0) {
    return {
      totalValueEUR: 0,
      totalCashFreedEUR: 0,
      totalCashReinvestedEUR: 0,
      instructions: [],
    };
  }

  // Étape 1 : Identifier les positions sur-pondérées à VENDRE pour dégager du cash
  let totalCashFreedEUR = 0;
  const items = filledPositions.map((p) => {
    const priceNative = p.currentPrice || p.avgPrice || 1;
    const rate = fxRates[p.currency] || 1.0;
    const priceEUR = priceNative * rate;
    const currentValEUR = p.quantity * priceEUR;
    const currentWeight = currentValEUR / totalValueEUR;
    const targetWeight = p.targetWeight || (1 / filledPositions.length);
    const targetValEUR = totalValueEUR * targetWeight;
    const diffEUR = targetValEUR - currentValEUR;

    let action: 'SELL' | 'BUY' | 'HOLD' = 'HOLD';
    let deltaShares = 0;
    let deltaCostEUR = 0;

    if (diffEUR < -priceEUR && p.quantity > 0) {
      // Overweighted: SELL shares to reach target weight
      action = 'SELL';
      deltaShares = Math.min(p.quantity, Math.floor(Math.abs(diffEUR) / priceEUR));
      deltaCostEUR = deltaShares * priceEUR;
      totalCashFreedEUR += deltaCostEUR;
    }

    return {
      position: p,
      priceNative,
      priceEUR,
      currentWeight,
      targetWeight,
      diffEUR,
      action: action as 'SELL' | 'BUY' | 'HOLD',
      deltaShares,
      deltaCostEUR,
      boughtShares: 0,
      boughtCostEUR: 0,
    };
  });

  // Étape 2 : Réinvestir le cash dégagé dans les positions sous-pondérées (Autofinancement strict)
  let remainingFreedCashEUR = totalCashFreedEUR;
  let totalCashReinvestedEUR = 0;

  if (totalCashFreedEUR > 0) {
    const underweightItems = items.filter((item) => item.diffEUR > item.priceEUR && item.action === 'HOLD');
    underweightItems.sort((a, b) => b.diffEUR - a.diffEUR);

    for (const item of underweightItems) {
      if (remainingFreedCashEUR >= item.priceEUR) {
        const canBuy = Math.min(
          Math.floor(item.diffEUR / item.priceEUR),
          Math.floor(remainingFreedCashEUR / item.priceEUR)
        );
        if (canBuy > 0) {
          item.action = 'BUY';
          item.boughtShares = canBuy;
          item.boughtCostEUR = canBuy * item.priceEUR;
          remainingFreedCashEUR -= item.boughtCostEUR;
          totalCashReinvestedEUR += item.boughtCostEUR;
        }
      }
    }
  }

  const instructions: ActiveRebalanceInstruction[] = items.map((item) => {
    const p = item.position;
    const finalDeltaShares = item.action === 'SELL' ? -item.deltaShares : item.action === 'BUY' ? item.boughtShares : 0;
    const finalCostEUR = item.action === 'SELL' ? item.deltaCostEUR : item.action === 'BUY' ? item.boughtCostEUR : 0;
    const newQty = p.quantity + finalDeltaShares;
    const newValEUR = newQty * item.priceEUR;
    const newWeightAfter = totalValueEUR > 0 ? (newValEUR / totalValueEUR) * 100 : 0;

    return {
      positionId: p.id,
      ticker: p.ticker,
      name: p.name,
      envelope: p.envelope,
      currentWeight: parseFloat((item.currentWeight * 100).toFixed(1)),
      targetWeight: parseFloat((item.targetWeight * 100).toFixed(1)),
      weightGap: parseFloat(((item.targetWeight - item.currentWeight) * 100).toFixed(1)),
      sharePrice: parseFloat(item.priceNative.toFixed(2)),
      currency: p.currency,
      action: item.action,
      deltaShares: finalDeltaShares,
      deltaCostEUR: parseFloat(finalCostEUR.toFixed(2)),
      newWeightAfter: parseFloat(newWeightAfter.toFixed(1)),
    };
  });

  return {
    totalValueEUR: parseFloat(totalValueEUR.toFixed(2)),
    totalCashFreedEUR: parseFloat(totalCashFreedEUR.toFixed(2)),
    totalCashReinvestedEUR: parseFloat(totalCashReinvestedEUR.toFixed(2)),
    instructions,
  };
}

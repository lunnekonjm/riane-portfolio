/**
 * Moteur de Rebalancement Intelligent par les Flux (Smart Flow Rebalancer)
 * Calcule l'allocation optimale du nouveau versement DCA mensuel
 * pour réduire la dérive d'allocation sans vendre aucun actif (zéro frottement fiscal).
 * Isole STRICTEMENT les actifs boursiers cotés (PEA / PEA-PME / CTO).
 */

import type { Position } from '@/types/portfolio';

const MARKET_ENVELOPES = ['PEA', 'PEA-PME', 'CTO', 'SPECULATIVE', 'OPPORTUNISTIC'];

export interface FlowRebalanceInstruction {
  positionId: string;
  ticker: string;
  name: string;
  envelope: string;
  currentWeight: number;
  targetWeight: number;
  weightGap: number; // targetWeight - currentWeight (positive = underweight)
  sharePrice: number;
  recommendedShares: number;
  recommendedCost: number;
  newWeightAfter: number;
}

export interface FlowRebalanceResult {
  totalDCA: number;
  totalSpent: number;
  uninvestedCash: number;
  instructions: FlowRebalanceInstruction[];
}

export function calculateSmartFlowRebalance(
  positions: Position[],
  monthlyBudget: number,
  fxRates: Record<string, number> = { EUR: 1.0, USD: 0.92 }
): FlowRebalanceResult {
  // Filtrer STRICTEMENT les positions boursières (exclut livrets & PEE)
  const filledPositions = positions.filter((p) => {
    const isMarket = MARKET_ENVELOPES.includes((p.envelope || '').toUpperCase());
    const hasValueOrTarget = (p.quantity || 0) > 0 || (p.targetWeight && p.targetWeight > 0);
    return isMarket && hasValueOrTarget;
  });

  if (filledPositions.length === 0 || monthlyBudget <= 0) {
    return {
      totalDCA: monthlyBudget,
      totalSpent: 0,
      uninvestedCash: monthlyBudget,
      instructions: [],
    };
  }

  // Calculate current total market value in EUR
  const totalValueEUR = filledPositions.reduce((sum, p) => {
    const price = p.currentPrice || p.avgPrice || 1;
    const rate = fxRates[p.currency] || 1.0;
    return sum + p.quantity * price * rate;
  }, 0);

  const newTotalValueEUR = totalValueEUR + monthlyBudget;

  // Calculate weight gap for each position
  const items = filledPositions.map((p) => {
    const priceNative = p.currentPrice || p.avgPrice || 1;
    const rate = fxRates[p.currency] || 1.0;
    const priceEUR = priceNative * rate;
    const currentValEUR = p.quantity * priceEUR;
    const currentWeight = totalValueEUR > 0 ? currentValEUR / totalValueEUR : 0;
    const targetWeight = p.targetWeight || (1 / filledPositions.length);
    const weightGap = targetWeight - currentWeight;

    return {
      position: p,
      priceNative,
      priceEUR,
      currentWeight,
      targetWeight,
      weightGap,
      sharesBought: 0,
      spentEUR: 0,
    };
  });

  // Sort by most underweight first (highest weightGap)
  items.sort((a, b) => b.weightGap - a.weightGap);

  // Compute current PEA deposits
  const currentPeaDeposits = positions
    .filter((p) => p.envelope === 'PEA')
    .reduce((sum, p) => sum + (p.quantity * p.avgPrice * (fxRates[p.currency] || 1)), 0);

  let peaDepositsAllocated = 0;
  let remainingCashEUR = monthlyBudget;

  // Iteratively allocate cash to most underweight items
  let iterations = 0;
  while (remainingCashEUR > 0 && iterations < 500) {
    iterations++;

    const currentSpentEUR = monthlyBudget - remainingCashEUR;
    const currentSimulatedTotalEUR = totalValueEUR + currentSpentEUR;

    items.forEach((item) => {
      const currentValEUR = (item.position.quantity + item.sharesBought) * item.priceEUR;
      const currentWeight = currentSimulatedTotalEUR > 0 ? currentValEUR / currentSimulatedTotalEUR : 0;
      item.weightGap = item.targetWeight - currentWeight;
    });

    items.sort((a, b) => b.weightGap - a.weightGap);

    let allocatedInRound = false;

    for (const item of items) {
      if (item.weightGap <= 0 && items.some((i) => i.weightGap > 0)) continue;

      if (remainingCashEUR >= item.priceEUR) {
        let targetEnvelope: string = item.position.envelope;
        if (item.position.envelope === 'PEA' && (currentPeaDeposits + peaDepositsAllocated + item.priceEUR) > 150000) {
          targetEnvelope = 'CTO (PEA plein)';
        }

        const buyCount = 1;
        const costEUR = buyCount * item.priceEUR;
        item.sharesBought += buyCount;
        item.spentEUR += costEUR;
        if (item.position.envelope === 'PEA' && targetEnvelope === 'PEA') {
          peaDepositsAllocated += costEUR;
        }
        (item as any).effectiveEnvelope = targetEnvelope;
        remainingCashEUR -= costEUR;
        allocatedInRound = true;
        break;
      }
    }

    if (!allocatedInRound) break;
  }

  const totalSpent = monthlyBudget - remainingCashEUR;

  const instructions: FlowRebalanceInstruction[] = items.map((item) => {
    const price = item.priceNative;
    const newQuantity = item.position.quantity + item.sharesBought;
    const newValEUR = newQuantity * item.priceEUR;
    const newWeightAfter = newTotalValueEUR > 0 ? newValEUR / newTotalValueEUR : 0;

    return {
      positionId: item.position.id,
      ticker: item.position.ticker,
      name: item.position.name,
      envelope: (item as any).effectiveEnvelope || item.position.envelope,
      currentWeight: parseFloat((item.currentWeight * 100).toFixed(1)),
      targetWeight: parseFloat((item.targetWeight * 100).toFixed(1)),
      weightGap: parseFloat((item.weightGap * 100).toFixed(1)),
      sharePrice: parseFloat(price.toFixed(2)),
      recommendedShares: item.sharesBought,
      recommendedCost: parseFloat(item.spentEUR.toFixed(2)),
      newWeightAfter: parseFloat((newWeightAfter * 100).toFixed(1)),
    };
  });

  return {
    totalDCA: monthlyBudget,
    totalSpent: parseFloat(totalSpent.toFixed(2)),
    uninvestedCash: parseFloat(remainingCashEUR.toFixed(2)),
    instructions,
  };
}

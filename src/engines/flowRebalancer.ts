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

/**
 * Moteur de Rééquilibrage Actif (Arbitrage Strict Ventes -> Achats)
 * Règle d'or : On ne peut acheter QUE avec le cash dégagé par les ventes (Autofinancement strict).
 */
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

// ──────────────────────────────────────────────────────────────────────────
// Fréquence d'achat réelle par instrument
// ──────────────────────────────────────────────────────────────────────────

export type DcaFrequency = 'monthly' | 'quarterly' | 'semestrial' | 'annual';

/** Nombre de mois d'accumulation entre deux achats pour une fréquence donnée */
export function monthsBetweenPurchases(frequency: DcaFrequency | undefined): number {
  switch (frequency) {
    case 'quarterly': return 3;
    case 'semestrial': return 6;
    case 'annual': return 12;
    case 'monthly':
    default: return 1;
  }
}

/** Indique si un actif à fréquence donnée doit être acheté ce mois-ci (1 = Janvier, 12 = Décembre) */
export function isDueThisMonth(frequency: DcaFrequency | undefined, currentMonth: number): boolean {
  switch (frequency) {
    case 'quarterly':
      return currentMonth % 3 === 0;
    case 'semestrial':
      return currentMonth === 6 || currentMonth === 12;
    case 'annual':
      return currentMonth === 12;
    case 'monthly':
    default:
      return true;
  }
}

export interface MonthlyPlanResult {
  currentMonth: number;
  dueThisMonth: FlowRebalanceResult;
  accumulating: Array<{
    positionId: string;
    ticker: string;
    name: string;
    frequency: DcaFrequency;
    monthlyShare: number;
    accumulatedCash: number;
    nextDueMonth: number;
  }>;
}

export function calculateMonthlyInvestmentPlan(
  positions: Position[],
  monthlyBudget: number,
  currentMonth: number = new Date().getMonth() + 1,
  fxRates: Record<string, number> = { EUR: 1.0, USD: 0.92 }
): MonthlyPlanResult {
  const filled = positions.filter((p) => {
    const isMarket = MARKET_ENVELOPES.includes((p.envelope || '').toUpperCase());
    return isMarket && ((p.quantity || 0) > 0 || (p.targetWeight && p.targetWeight > 0));
  });

  const duePositions: Position[] = [];
  const accumulating: MonthlyPlanResult['accumulating'] = [];

  let allocatedDueBudget = 0;

  filled.forEach((p) => {
    const freq = p.dcaFrequency || 'monthly';
    const isDue = isDueThisMonth(freq, currentMonth);
    const targetW = p.targetWeight || (1 / (filled.length || 1));
    const theoreticalMonthlyEUR = monthlyBudget * targetW;

    if (isDue) {
      duePositions.push(p);
      allocatedDueBudget += theoreticalMonthlyEUR * monthsBetweenPurchases(freq);
    } else {
      accumulating.push({
        positionId: p.id,
        ticker: p.ticker,
        name: p.name,
        frequency: freq,
        monthlyShare: theoreticalMonthlyEUR,
        accumulatedCash: theoreticalMonthlyEUR * (currentMonth % monthsBetweenPurchases(freq)),
        nextDueMonth: currentMonth + (monthsBetweenPurchases(freq) - (currentMonth % monthsBetweenPurchases(freq))),
      });
    }
  });

  const dueResult = calculateSmartFlowRebalance(
    duePositions.length > 0 ? duePositions : filled,
    allocatedDueBudget > 0 ? allocatedDueBudget : monthlyBudget,
    fxRates
  );

  return {
    currentMonth,
    dueThisMonth: dueResult,
    accumulating,
  };
}

/**
 * Moteur de Rebalancement Intelligent par les Flux (Smart Flow Rebalancer)
 * Calcule l'allocation optimale du nouveau versement DCA mensuel
 * pour réduire la dérive d'allocation sans vendre aucun actif (zéro frottement fiscal).
 * Respecte la règle des actions entières (PEA / PEA-PME / CTO).
 */

import type { Position } from '@/types/portfolio';

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
  const filledPositions = positions.filter((p) => p.quantity > 0 || (p.targetWeight && p.targetWeight > 0));

  if (filledPositions.length === 0 || monthlyBudget <= 0) {
    return {
      totalDCA: monthlyBudget,
      totalSpent: 0,
      uninvestedCash: monthlyBudget,
      instructions: [],
    };
  }

  // Calculate current total value in EUR
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
    const weightGap = targetWeight - currentWeight; // higher = more underweight

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

    // Re-evaluate current weight gaps dynamically based on cash spent so far
    const currentSpentEUR = monthlyBudget - remainingCashEUR;
    const currentSimulatedTotalEUR = totalValueEUR + currentSpentEUR;

    items.forEach((item) => {
      const currentValEUR = (item.position.quantity + item.sharesBought) * item.priceEUR;
      const currentWeight = currentSimulatedTotalEUR > 0 ? currentValEUR / currentSimulatedTotalEUR : 0;
      item.weightGap = item.targetWeight - currentWeight;
    });

    // Sort by most underweight first
    items.sort((a, b) => b.weightGap - a.weightGap);

    let allocatedInRound = false;

    for (const item of items) {
      // Only allocate if position is underweight (weightGap > 0)
      if (item.weightGap <= 0 && items.some(i => i.weightGap > 0)) continue;

      const isIntegerOnly = item.position.envelope === 'PEA' || item.position.envelope === 'PEA-PME' || item.position.envelope === 'CTO';

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
 * Moteur de Rééquilibrage Actif (Avec Ventes & Achats de Réalignement)
 * Calcule exactement combien de parts VENDRE (sur-concentrées) et ACHETER (sous-pondérées)
 * pour réaligner à 100% le portefeuille sur ses cibles d'allocation.
 */
export function calculateActiveRebalance(
  positions: Position[],
  fxRates: Record<string, number> = { EUR: 1.0, USD: 0.92 }
): ActiveRebalanceResult {
  const filledPositions = positions.filter((p) => p.quantity > 0 || (p.targetWeight && p.targetWeight > 0));

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

  let totalCashFreedEUR = 0;
  let totalCashReinvestedEUR = 0;

  const instructions: ActiveRebalanceInstruction[] = filledPositions.map((p) => {
    const priceNative = p.currentPrice || p.avgPrice || 1;
    const rate = fxRates[p.currency] || 1.0;
    const priceEUR = priceNative * rate;
    const currentValEUR = p.quantity * priceEUR;
    const currentWeight = currentValEUR / totalValueEUR;
    const targetWeight = p.targetWeight || (1 / filledPositions.length);
    const targetValEUR = totalValueEUR * targetWeight;
    const diffEUR = targetValEUR - currentValEUR; // negative = over-weighted (SELL), positive = under-weighted (BUY)

    let action: 'SELL' | 'BUY' | 'HOLD' = 'HOLD';
    let deltaShares = 0;
    let deltaCostEUR = 0;

    if (diffEUR < -priceEUR) {
      // Overweighted: SELL shares to reach target weight
      action = 'SELL';
      deltaShares = Math.floor(Math.abs(diffEUR) / priceEUR);
      deltaCostEUR = deltaShares * priceEUR;
      totalCashFreedEUR += deltaCostEUR;
    } else if (diffEUR > priceEUR) {
      // Underweighted: BUY shares to reach target weight
      action = 'BUY';
      deltaShares = Math.floor(diffEUR / priceEUR);
      deltaCostEUR = deltaShares * priceEUR;
      totalCashReinvestedEUR += deltaCostEUR;
    }

    const newQty = action === 'SELL' ? p.quantity - deltaShares : action === 'BUY' ? p.quantity + deltaShares : p.quantity;
    const newValEUR = newQty * priceEUR;
    const newWeightAfter = (newValEUR / totalValueEUR) * 100;

    return {
      positionId: p.id,
      ticker: p.ticker,
      name: p.name,
      envelope: p.envelope,
      currentWeight: parseFloat((currentWeight * 100).toFixed(1)),
      targetWeight: parseFloat((targetWeight * 100).toFixed(1)),
      weightGap: parseFloat(((targetWeight - currentWeight) * 100).toFixed(1)),
      sharePrice: parseFloat(priceNative.toFixed(2)),
      currency: p.currency,
      action,
      deltaShares: action === 'SELL' ? -deltaShares : deltaShares,
      deltaCostEUR: parseFloat(deltaCostEUR.toFixed(2)),
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
// Fréquence d'achat réelle par instrument (ajouté le 12/08/2026)
//
// Toutes les positions ne sont pas achetées tous les mois : les frais de
// courtage (~0,5 % chez BoursoBank/Interactive Brokers) pèsent proportion-
// nellement plus lourd sur des petits montants. Seul le PEA classique (PUST,
// Trade Republic, frais quasi nuls) reçoit un vrai virement mensuel. Les
// autres lignes accumulent leur quote-part jusqu'à un mois "dû" (voir
// Position.dcaFrequency dans src/data/portfolio.ts) où elles reçoivent d'un
// coup le cumul des mois précédents, plutôt que d'être fractionnées chaque
// mois.
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

/**
 * Un mois est "dû" pour une fréquence donnée si le mois calendaire (1-12) tombe
 * sur un multiple du cycle, calé pour finir en décembre (ex: semestrial -> juin
 * et décembre ; quarterly -> mars, juin, sept, déc ; annual -> décembre).
 */
export function isDueThisMonth(frequency: DcaFrequency | undefined, calendarMonth: number): boolean {
  const cycle = monthsBetweenPurchases(frequency);
  if (cycle <= 1) return true;
  return calendarMonth % cycle === 0;
}

export interface MonthlyInvestmentPlan {
  calendarMonth: number;
  /** Montant réellement recommandé à virer/investir ce mois-ci (positions dues uniquement) */
  dueThisMonth: FlowRebalanceResult;
  /** Détail de ce qui s'accumule sans être investi ce mois-ci, par position */
  accumulating: { positionId: string; ticker: string; name: string; monthlyShare: number; nextDueMonth: number }[];
  totalAccumulatingEUR: number;
}

/**
 * Variante mensuelle de calculateSmartFlowRebalance qui respecte Position.dcaFrequency :
 * seules les positions "dues" ce mois-ci reçoivent une part du budget (multipliée par le
 * nombre de mois écoulés depuis leur dernier achat, pour que le total annuel investi reste
 * conforme aux pondérations cibles). Les autres positions voient leur quote-part mensuelle
 * simplement reportée à leur prochain mois dû — jamais redistribuée ailleurs.
 */
export function calculateMonthlyInvestmentPlan(
  positions: Position[],
  monthlyBudget: number,
  calendarMonth: number,
  fxRates: Record<string, number> = { EUR: 1.0, USD: 0.92 }
): MonthlyInvestmentPlan {
  const filledPositions = positions.filter((p) => p.quantity > 0 || (p.targetWeight && p.targetWeight > 0));
  const totalTargetWeight = filledPositions.reduce((s, p) => s + (p.targetWeight || 0), 0) || 1;

  const duePositions: Position[] = [];
  const accumulating: MonthlyInvestmentPlan['accumulating'] = [];
  let dueBudget = 0;

  for (const p of filledPositions) {
    const freq = p.dcaFrequency as DcaFrequency | undefined;
    const nominalMonthlyShare = monthlyBudget * ((p.targetWeight || 0) / totalTargetWeight);
    const cycle = monthsBetweenPurchases(freq);

    if (isDueThisMonth(freq, calendarMonth)) {
      duePositions.push(p);
      dueBudget += nominalMonthlyShare * cycle; // rattrape les mois précédents non investis
    } else {
      const nextDueMonth = (Math.floor((calendarMonth - 1) / cycle) + 1) * cycle;
      accumulating.push({
        positionId: p.id,
        ticker: p.ticker,
        name: p.name,
        monthlyShare: parseFloat(nominalMonthlyShare.toFixed(2)),
        nextDueMonth: nextDueMonth > 12 ? cycle : nextDueMonth,
      });
    }
  }

  const dueThisMonth = calculateSmartFlowRebalance(duePositions, dueBudget, fxRates);
  const totalAccumulatingEUR = accumulating.reduce((s, a) => s + a.monthlyShare, 0);

  return { calendarMonth, dueThisMonth, accumulating, totalAccumulatingEUR };
}

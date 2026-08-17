import type { Position } from '@/types/portfolio';
import { calculateSmartFlowRebalance, type FlowRebalanceResult } from './smartFlowRebalance';

const MARKET_ENVELOPES = ['PEA', 'PEA-PME', 'CTO', 'SPECULATIVE', 'OPPORTUNISTIC'];

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

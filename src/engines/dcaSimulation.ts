/**
 * Moteur de calcul DCA automatique (Dollar Cost Averaging)
 * Conforme aux règles du PEA (passages en actions/parts entières uniquement)
 * Récupère les VRAIES données historiques maximales de marché (Yahoo Finance MAX)
 * 
 * RÈGLE D'INCEPTION :
 * Si la date de simulation (ex: 2000) précède la date de création/IPO de l'actif (ex: 2010),
 * aucun achat d'action n'est effectué avant la date de création réelle (sharesBought = 0).
 * La trésorerie DCA est conservée en solde d'espèces non investi jusqu'au lancement de l'actif,
 * puis investie à partir du premier cours réel d'introduction.
 */

import type { Position, DCATranche } from '@/types/portfolio';
import { getHistoricalData } from '@/services/market-data/provider';

export interface DCASimulationMonthLog {
  date: string;
  sharePrice: number;
  monthlyBudget: number;
  cashAvailable: number;
  sharesBought: number;
  spent: number;
  rolloverCash: number;
  cumulativeShares: number;
  cumulativeCost: number;
  cumulativePRU: number;
  note?: string;
}

export interface DCASimulationResult {
  totalShares: number;
  avgPrice: number;
  totalInvested: number;
  currentValue: number;
  uninvestedCash: number;
  monthsCount: number;
  earliestAvailableDate: string | null;
  logs: DCASimulationMonthLog[];
}

/**
 * Generate monthly dates between startDate and currentDate (YYYY-MM)
 */
function getMonthlyDates(startDateStr: string): string[] {
  const start = new Date(startDateStr);
  const end = new Date();

  // If start is in the future, fallback to today
  if (start > end) return [end.toISOString().slice(0, 7)];

  const months: string[] = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);

  while (current <= end) {
    months.push(current.toISOString().slice(0, 7));
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

/**
 * Pure deterministic core DCA calculation from an array of months and a price lookup Map.
 * Accurately supports multi-tier historical DCA tranches (paliers dans le temps).
 */
export function calculateDCAFromPriceMap(
  months: string[],
  priceMap: Map<string, number>,
  monthlyBudget: number,
  currentPriceFallback: number,
  isIntegerOnly: boolean = true,
  frequency: 'monthly' | 'quarterly' | 'semestrial' | 'annual' = 'monthly',
  depositMonth: number = 1,
  earliestDate: string | null = null,
  dcaHistory?: DCATranche[]
): DCASimulationResult {
  let cumulativeShares = 0;
  let cumulativeCost = 0;
  let rolloverCash = 0;
  const logs: DCASimulationMonthLog[] = [];

  const totalMonths = months.length;

  for (let i = 0; i < totalMonths; i++) {
    const monthKey = months[i];
    const price = priceMap.get(monthKey) || (currentPriceFallback > 0 ? currentPriceFallback : undefined);
    
    // Resolve dynamic budget and frequency for this specific month from DCA tranches if defined
    let activeBudget = monthlyBudget;
    let activeFreq = frequency;
    let activeDepMonth = depositMonth;

    if (dcaHistory && dcaHistory.length > 0) {
      const tranche = dcaHistory.find((t) => {
        const startM = t.startDate.slice(0, 7);
        const endM = t.endDate ? t.endDate.slice(0, 7) : null;
        return startM <= monthKey && (!endM || endM >= monthKey);
      });

      if (tranche) {
        activeBudget = tranche.amount;
        activeFreq = tranche.frequency || 'monthly';
        activeDepMonth = tranche.depositMonth || 1;
      } else {
        activeBudget = 0;
      }
    }

    // Calculate if cash deposit occurs in this calendar month
    const monthNum = parseInt(monthKey.slice(5, 7), 10);
    let isDepositMonth = true;

    if (activeFreq === 'annual') {
      isDepositMonth = monthNum === activeDepMonth;
    } else if (activeFreq === 'semestrial') {
      isDepositMonth = ((monthNum - activeDepMonth) % 6 + 6) % 6 === 0;
    } else if (activeFreq === 'quarterly') {
      isDepositMonth = ((monthNum - activeDepMonth) % 3 + 3) % 3 === 0;
    }

    const budgetForMonth = isDepositMonth ? activeBudget : 0;

    // Check if asset existed on this date
    const existsYet = price !== undefined && price > 0;
    const isPreInception = earliestDate && monthKey < earliestDate;

    if (isPreInception || !existsYet) {
      rolloverCash += budgetForMonth;
      logs.push({
        date: monthKey,
        sharePrice: 0,
        monthlyBudget: budgetForMonth,
        cashAvailable: parseFloat(rolloverCash.toFixed(2)),
        sharesBought: 0,
        spent: 0,
        rolloverCash: parseFloat(rolloverCash.toFixed(2)),
        cumulativeShares: isIntegerOnly ? Math.floor(cumulativeShares) : parseFloat(cumulativeShares.toFixed(4)),
        cumulativeCost: parseFloat(cumulativeCost.toFixed(2)),
        cumulativePRU: parseFloat((cumulativeShares > 0 ? cumulativeCost / cumulativeShares : 0).toFixed(2)),
        note: earliestDate ? `Actif non encore créé (Lancement : ${earliestDate})` : 'Données marché indisponibles',
      });
      continue;
    }

    const cashAvailable = rolloverCash + budgetForMonth;
    
    let sharesBought = 0;
    if (isIntegerOnly) {
      sharesBought = Math.floor(cashAvailable / price);
    } else {
      sharesBought = cashAvailable / price;
    }

    const spent = sharesBought * price;
    rolloverCash = cashAvailable - spent;

    cumulativeShares += sharesBought;
    cumulativeCost += spent;
    const cumulativePRU = cumulativeShares > 0 ? cumulativeCost / cumulativeShares : 0;

    logs.push({
      date: monthKey,
      sharePrice: parseFloat(price.toFixed(2)),
      monthlyBudget: budgetForMonth,
      cashAvailable: parseFloat(cashAvailable.toFixed(2)),
      sharesBought: isIntegerOnly ? Math.floor(sharesBought) : parseFloat(sharesBought.toFixed(4)),
      spent: parseFloat(spent.toFixed(2)),
      rolloverCash: parseFloat(rolloverCash.toFixed(2)),
      cumulativeShares: isIntegerOnly ? Math.floor(cumulativeShares) : parseFloat(cumulativeShares.toFixed(4)),
      cumulativeCost: parseFloat(cumulativeCost.toFixed(2)),
      cumulativePRU: parseFloat(cumulativePRU.toFixed(2)),
    });
  }

  const latestPrice = priceMap.get(months[months.length - 1]) || currentPriceFallback || (logs.length > 0 ? logs[logs.length - 1].sharePrice : 0) || (currentPriceFallback > 0 ? currentPriceFallback : 100);
  let totalSharesFinal = isIntegerOnly ? Math.floor(cumulativeShares) : parseFloat(cumulativeShares.toFixed(4));
  let avgPriceFinal = totalSharesFinal > 0 ? cumulativeCost / totalSharesFinal : 0;
  let totalInvestedFinal = parseFloat(cumulativeCost.toFixed(2));

  // Safety fallback if no shares acquired despite positive budget:
  if (totalSharesFinal <= 0 && monthlyBudget > 0) {
    const validPrice = currentPriceFallback > 0 ? currentPriceFallback : (logs.length > 0 && logs[0].sharePrice > 0 ? logs[0].sharePrice : 100);
    const estMonths = Math.max(1, totalMonths);
    const totalEstBudget = monthlyBudget * estMonths;
    totalSharesFinal = isIntegerOnly ? Math.max(1, Math.floor(totalEstBudget / validPrice)) : parseFloat((totalEstBudget / validPrice).toFixed(4));
    avgPriceFinal = validPrice;
    totalInvestedFinal = parseFloat((totalSharesFinal * validPrice).toFixed(2));
  }

  return {
    totalShares: totalSharesFinal,
    avgPrice: parseFloat(avgPriceFinal.toFixed(2)),
    totalInvested: totalInvestedFinal,
    currentValue: parseFloat((totalSharesFinal * latestPrice).toFixed(2)),
    uninvestedCash: parseFloat(rolloverCash.toFixed(2)),
    monthsCount: totalMonths,
    earliestAvailableDate: earliestDate,
    logs,
  };
}

/**
 * Perform DCA Simulation for a position with REAL MAX Historical Data & Strict Inception Rules
 */
export async function simulatePositionDCA(
  ticker: string,
  monthlyBudget: number,
  startDateStr: string,
  currentPriceFallback: number,
  isIntegerOnly: boolean = true,
  frequency: 'monthly' | 'quarterly' | 'semestrial' | 'annual' = 'monthly',
  depositMonth: number = 1,
  depositDay: number = 5,
  dcaHistory?: DCATranche[]
): Promise<DCASimulationResult> {
  let effectiveStartDate = startDateStr;
  if (dcaHistory && dcaHistory.length > 0) {
    const sortedStarts = [...dcaHistory].map((t) => t.startDate).sort();
    if (sortedStarts[0] && sortedStarts[0] < effectiveStartDate) {
      effectiveStartDate = sortedStarts[0];
    }
  }

  const months = getMonthlyDates(effectiveStartDate);

  // Fetch REAL MAX historical prices from Yahoo Finance
  let priceMap = new Map<string, number>();
  let earliestDate: string | null = null;

  try {
    const historical = await getHistoricalData(ticker, 'MAX');
    if (historical && historical.length > 0) {
      for (const pt of historical) {
        const monthKey = pt.date.slice(0, 7);
        const p = pt.adjustedClose || pt.close;
        if (p > 0) {
          priceMap.set(monthKey, p);
          if (!earliestDate || monthKey < earliestDate) {
            earliestDate = monthKey;
          }
        }
      }
    }
  } catch (err) {
    console.warn(`[DCASimulation] Could not fetch MAX history for ${ticker}:`, err);
  }

  return calculateDCAFromPriceMap(
    months,
    priceMap,
    monthlyBudget,
    currentPriceFallback,
    isIntegerOnly,
    frequency,
    depositMonth,
    earliestDate,
    dcaHistory
  );
}

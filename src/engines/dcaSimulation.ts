/**
 * Moteur de calcul DCA automatique (Dollar Cost Averaging)
 * Conforme aux règles du PEA (passages en actions/parts entières uniquement)
 * Récupère les VRAIES données historiques maximales de marché (Yahoo Finance MAX)
 * et applique un back-cast composé réaliste (8%/an) pour la période précédant la création de l'actif.
 */

import type { Position } from '@/types/portfolio';
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
}

export interface DCASimulationResult {
  totalShares: number;
  avgPrice: number;
  totalInvested: number;
  currentValue: number;
  uninvestedCash: number;
  monthsCount: number;
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
 * Perform DCA Simulation for a position with REAL MAX Historical Data
 */
export async function simulatePositionDCA(
  ticker: string,
  monthlyBudget: number,
  startDateStr: string,
  currentPriceFallback: number,
  isIntegerOnly: boolean = true
): Promise<DCASimulationResult> {
  const months = getMonthlyDates(startDateStr);

  // Fetch REAL MAX historical prices from Yahoo Finance
  let priceMap = new Map<string, number>();
  let earliestDate: string | null = null;
  let earliestPrice: number = 0;

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
            earliestPrice = p;
          }
        }
      }
    }
  } catch (err) {
    console.warn(`[DCASimulation] Could not fetch MAX history for ${ticker}:`, err);
  }

  let cumulativeShares = 0;
  let cumulativeCost = 0;
  let rolloverCash = 0;
  const logs: DCASimulationMonthLog[] = [];

  const totalMonths = months.length;
  const fallbackBase = currentPriceFallback > 0 ? currentPriceFallback : (earliestPrice > 0 ? earliestPrice : 100);

  for (let i = 0; i < totalMonths; i++) {
    const monthKey = months[i];
    
    let price = priceMap.get(monthKey);
    
    if (!price || price <= 0) {
      // Pre-IPO or pre-inception period back-casting:
      // Use earliest available real price and discount backwards at ~8% annual market growth rate
      if (earliestDate && earliestPrice > 0) {
        const [earliestYr, earliestMo] = earliestDate.split('-').map(Number);
        const [currYr, currMo] = monthKey.split('-').map(Number);
        const monthsDiff = (earliestYr - currYr) * 12 + (earliestMo - currMo);
        
        if (monthsDiff > 0) {
          const yearsDiff = monthsDiff / 12;
          // Discount backwards by 8% per year
          price = Math.max(0.1, earliestPrice / Math.pow(1.08, yearsDiff));
        } else {
          price = earliestPrice;
        }
      } else {
        // General fallback if no price map available
        const ratio = (i + 1) / totalMonths;
        price = Math.max(1, fallbackBase * Math.pow(1.08, (i - totalMonths) / 12));
      }
    }

    const cashAvailable = rolloverCash + monthlyBudget;
    
    let sharesBought = 0;
    if (isIntegerOnly) {
      // PEA / PEA-PME / CTO Rule: Only full integer shares allowed!
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
      monthlyBudget,
      cashAvailable: parseFloat(cashAvailable.toFixed(2)),
      sharesBought: isIntegerOnly ? Math.floor(sharesBought) : parseFloat(sharesBought.toFixed(4)),
      spent: parseFloat(spent.toFixed(2)),
      rolloverCash: parseFloat(rolloverCash.toFixed(2)),
      cumulativeShares: isIntegerOnly ? Math.floor(cumulativeShares) : parseFloat(cumulativeShares.toFixed(4)),
      cumulativeCost: parseFloat(cumulativeCost.toFixed(2)),
      cumulativePRU: parseFloat(cumulativePRU.toFixed(2)),
    });
  }

  const latestPrice = priceMap.get(months[months.length - 1]) || currentPriceFallback || (logs.length > 0 ? logs[logs.length - 1].sharePrice : 0);
  const totalSharesFinal = isIntegerOnly ? Math.floor(cumulativeShares) : parseFloat(cumulativeShares.toFixed(4));
  const avgPriceFinal = totalSharesFinal > 0 ? cumulativeCost / totalSharesFinal : 0;

  return {
    totalShares: totalSharesFinal,
    avgPrice: parseFloat(avgPriceFinal.toFixed(2)),
    totalInvested: parseFloat(cumulativeCost.toFixed(2)),
    currentValue: parseFloat((totalSharesFinal * latestPrice).toFixed(2)),
    uninvestedCash: parseFloat(rolloverCash.toFixed(2)),
    monthsCount: totalMonths,
    logs,
  };
}

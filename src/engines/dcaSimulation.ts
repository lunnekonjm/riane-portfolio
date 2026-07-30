/**
 * Moteur de calcul DCA automatique (Dollar Cost Averaging)
 * Conforme aux règles du PEA (passages en actions/parts entières uniquement)
 * et gestion des reliquats de trésorerie de mois en mois.
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
 * Perform DCA Simulation for a position
 */
export async function simulatePositionDCA(
  ticker: string,
  monthlyBudget: number,
  startDateStr: string,
  currentPriceFallback: number,
  isIntegerOnly: boolean = true
): Promise<DCASimulationResult> {
  const months = getMonthlyDates(startDateStr);

  // Fetch real historical prices if available
  let priceMap = new Map<string, number>();
  try {
    const historical = await getHistoricalData(ticker, '5Y');
    if (historical && historical.length > 0) {
      for (const pt of historical) {
        const monthKey = pt.date.slice(0, 7);
        // Store close price for month (last available price in month)
        priceMap.set(monthKey, pt.adjustedClose || pt.close);
      }
    }
  } catch (err) {
    console.warn(`[DCASimulation] No historical data for ${ticker}, using trend fallback:`, err);
  }

  let cumulativeShares = 0;
  let cumulativeCost = 0;
  let rolloverCash = 0;
  const logs: DCASimulationMonthLog[] = [];

  // Fallback base price computation if historical price map has gaps
  const baseFallbackPrice = currentPriceFallback > 0 ? currentPriceFallback : 100;
  const totalMonths = months.length;

  for (let i = 0; i < totalMonths; i++) {
    const monthKey = months[i];
    
    // Price estimation: try historical price map first, else simulate linear market progression to fallback price
    let price = priceMap.get(monthKey);
    if (!price || price <= 0) {
      // Simulate historical price curve ending at current price (with modest monthly variation)
      const ratio = (i + 1) / totalMonths;
      const variation = (Math.sin(i * 0.7) * 0.05); // slight wave
      price = Math.max(1, baseFallbackPrice * (0.8 + 0.2 * ratio + variation));
    }

    const cashAvailable = rolloverCash + monthlyBudget;
    
    let sharesBought = 0;
    if (isIntegerOnly) {
      // PEA / PEA-PME Rule: Only full integer shares allowed!
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

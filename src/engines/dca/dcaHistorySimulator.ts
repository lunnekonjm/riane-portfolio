import type { DCATranche, SavingsDeposit } from '@/types/portfolio';
import { getHistoricalData } from '@/services/market-data/provider';
import { calculateDCAFromPriceMap, type DCASimulationResult } from './dcaPriceMapCalculator';

/**
 * Generate monthly dates between startDate and currentDate (YYYY-MM)
 */
export function getMonthlyDates(startDateStr: string): string[] {
  const start = new Date(startDateStr);
  const end = new Date();

  // If start is in the future, fallback to today
  if (start > end) return [end.toISOString().slice(0, 7)];

  const months: string[] = [];
  const curr = new Date(start.getFullYear(), start.getMonth(), 1);

  while (curr <= end) {
    const year = curr.getFullYear();
    const month = String(curr.getMonth() + 1).padStart(2, '0');
    months.push(`${year}-${month}`);
    curr.setMonth(curr.getMonth() + 1);
  }

  return months;
}

/**
 * Perform DCA or One-Shot Simulation for a position with REAL MAX Historical Data & Strict Inception Rules
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
  dcaHistory?: DCATranche[],
  depositsHistory?: SavingsDeposit[],
  simulationMode: 'dca' | 'lump_sum' | 'mixed' = 'dca',
  initialLumpSum: number = 0
): Promise<DCASimulationResult> {
  let effectiveStartDate = startDateStr;
  if (dcaHistory && dcaHistory.length > 0) {
    const sortedStarts = [...dcaHistory].map((t) => t.startDate).sort();
    if (sortedStarts[0] && sortedStarts[0] < effectiveStartDate) {
      effectiveStartDate = sortedStarts[0];
    }
  }

  if (depositsHistory && depositsHistory.length > 0) {
    const sortedDepositDates = [...depositsHistory].map((d) => d.date).sort();
    if (sortedDepositDates[0] && sortedDepositDates[0] < effectiveStartDate) {
      effectiveStartDate = sortedDepositDates[0];
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
    dcaHistory,
    depositsHistory,
    simulationMode,
    initialLumpSum
  );
}

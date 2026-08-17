/**
 * Moteur de calcul d'intérêts pour l'épargne réglementée et patrimoniale
 * Conforme à la Règle des Quinzaines en France (24 quinzaines par an)
 */

import type { Position } from '@/types/portfolio';
import { computeQuinzainesInterest } from './savingsInterestQuinzaines';
import { computeDailyInterest } from './savingsInterestDaily';

export interface SavingsRateMetadata {
  name: string;
  defaultRate: number; // e.g. 0.03 for 3.00%
  legalCap?: number;  // e.g. 22950 € for Livret A
  taxFree: boolean;
}

export const REGULATED_SAVINGS_METADATA: Record<string, SavingsRateMetadata> = {
  LIVRET: { name: 'Livret A / LDDS', defaultRate: 0.03, legalCap: 22950, taxFree: true },
  LEP: { name: 'LEP (Livret Épargne Populaire)', defaultRate: 0.04, legalCap: 10000, taxFree: true },
  ASSURANCE_VIE: { name: 'Assurance-Vie (Fonds Euro)', defaultRate: 0.025, taxFree: false },
  PER: { name: 'PER (Plan Épargne Retraite)', defaultRate: 0.035, taxFree: false },
  PEE: { name: 'PEE / PERCO (FCPE)', defaultRate: 0.04, taxFree: true },
  IMMOBILIER: { name: 'SCPI / Immobilier', defaultRate: 0.045, taxFree: false },
};

export interface SavingsInterestResult {
  currentBalance: number;
  principalDeposited: number;
  interestEarnedToDate: number;
  projectedAnnualInterest: number;
  yearEndProjectedBalance: number;
  legalCap?: number;
  capUtilizationPercent?: number;
  isCapExceeded: boolean;
  quinzainesCount: number;
  daysCount?: number;
  isQuinzaineRule?: boolean;
  effectiveRatePercent: number;
}

export function computeSavingsPositionInterest(
  position: Position,
  referenceDate: Date = new Date()
): SavingsInterestResult {
  const metaKey = position.name.toUpperCase().includes('LEP')
    ? 'LEP'
    : position.envelope;

  const metadata = REGULATED_SAVINGS_METADATA[metaKey] || {
    name: position.name,
    defaultRate: 0.03,
    taxFree: true,
  };

  const annualRate = position.interestRateOverride !== undefined ? position.interestRateOverride : metadata.defaultRate;
  const legalCap = position.customCap !== undefined ? position.customCap : metadata.legalCap;

  const initialAmount = position.avgPrice || 0;
  const hasRecurringDCA = Boolean((position.monthlyDCA && position.monthlyDCA > 0) || (position.annualBudget && position.annualBudget > 0));
  const monthlyDCA = position.monthlyDCA || (position.annualBudget ? position.annualBudget / 12 : 0);

  // Helper to parse YYYY-MM-DD
  const parseDateStr = (str?: string): Date | null => {
    if (!str || typeof str !== 'string') return null;
    const parts = str.trim().split('-');
    if (parts.length >= 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parts[2] ? parseInt(parts[2], 10) : 1;
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d);
      }
    }
    return null;
  };

  const initialDate = parseDateStr(position.initialDepositDate) || (initialAmount > 0 ? parseDateStr(position.dcaStartDate) : null);
  const dcaStart = hasRecurringDCA ? parseDateStr(position.dcaStartDate) : null;

  // Process and sort historical DCA tranches (multi-paliers)
  const validTranches = (position.dcaHistory || [])
    .filter((t) => t && typeof t.amount === 'number' && t.amount > 0 && t.startDate)
    .map((t) => {
      const parsedStart = parseDateStr(t.startDate) || new Date();
      const parsedEnd = t.endDate ? parseDateStr(t.endDate) : null;
      return {
        ...t,
        parsedStart,
        parsedEnd,
      };
    })
    .sort((a, b) => a.parsedStart.getTime() - b.parsedStart.getTime());

  // Process and sort historical ad-hoc deposits
  const validDeposits = (position.depositsHistory || [])
    .filter((d) => d && typeof d.amount === 'number' && d.amount > 0 && d.date)
    .map((d) => {
      const parsed = parseDateStr(d.date) || new Date();
      return {
        ...d,
        parsedDate: parsed,
      };
    })
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

  // Function to evaluate active DCA configuration on any given date
  const getActiveDCAForDate = (date: Date) => {
    if (validTranches.length > 0) {
      const tranche = validTranches.find((t) => {
        const isAfterStart = t.parsedStart <= date;
        const isBeforeEnd = !t.parsedEnd || t.parsedEnd >= date;
        return isAfterStart && isBeforeEnd;
      });
      if (tranche) {
        return {
          amount: tranche.amount,
          frequency: tranche.frequency || position.dcaFrequency || 'monthly',
          depositDay: tranche.depositDay || position.dcaDepositDay || 5,
          depositMonth: tranche.depositMonth || position.dcaDepositMonth || 1,
        };
      }
      return null;
    }

    if (hasRecurringDCA) {
      if (!dcaStart || dcaStart <= date) {
        return {
          amount: monthlyDCA,
          frequency: position.dcaFrequency || 'monthly',
          depositDay: position.dcaDepositDay || 5,
          depositMonth: position.dcaDepositMonth || 1,
        };
      }
    }
    return null;
  };

  // Find the global start date of the timeline
  let earliestDate: Date | null = initialDate;
  if (dcaStart && (!earliestDate || dcaStart < earliestDate)) {
    earliestDate = dcaStart;
  }
  if (validTranches.length > 0) {
    const firstTrancheStart = validTranches[0].parsedStart;
    if (!earliestDate || firstTrancheStart < earliestDate) {
      earliestDate = firstTrancheStart;
    }
  }
  if (validDeposits.length > 0) {
    const firstDepositDate = validDeposits[0].parsedDate;
    if (!earliestDate || firstDepositDate < earliestDate) {
      earliestDate = firstDepositDate;
    }
  }

  const startDate = earliestDate || new Date();

  // If start date is in the future, return base initial balance
  if (startDate > referenceDate && (!initialDate || initialDate > referenceDate)) {
    return {
      currentBalance: initialAmount,
      principalDeposited: initialAmount,
      interestEarnedToDate: 0,
      projectedAnnualInterest: Math.round(initialAmount * annualRate * 100) / 100,
      yearEndProjectedBalance: initialAmount,
      legalCap,
      capUtilizationPercent: legalCap ? Math.min(100, Math.round((initialAmount / legalCap) * 100)) : undefined,
      isCapExceeded: legalCap ? initialAmount >= legalCap : false,
      quinzainesCount: 0,
      effectiveRatePercent: annualRate * 100,
    };
  }

  const isQuinzaineRule = ['LIVRET', 'LEP'].includes(metaKey);

  const calcResult = isQuinzaineRule
    ? computeQuinzainesInterest({
        startDate,
        referenceDate,
        initialAmount,
        initialDate,
        annualRate,
        legalCap,
        validDeposits,
        getActiveDCAForDate,
      })
    : computeDailyInterest({
        startDate,
        referenceDate,
        initialAmount,
        initialDate,
        annualRate,
        legalCap,
        validDeposits,
        getActiveDCAForDate,
      });

  const {
    currentBalance,
    principalDeposited,
    accumulatedInterestYear,
    totalInterestEarned,
  } = calcResult;

  const quinzainesCount = 'quinzainesCount' in calcResult ? calcResult.quinzainesCount : 0;
  const daysCount = 'daysCount' in calcResult ? calcResult.daysCount : undefined;

  const currentYearEndInterest = currentBalance * annualRate;
  const yearEndProjectedBalance = Math.round((currentBalance + currentYearEndInterest) * 100) / 100;

  return {
    currentBalance: Math.round((currentBalance + accumulatedInterestYear) * 100) / 100,
    principalDeposited: Math.round(principalDeposited * 100) / 100,
    interestEarnedToDate: Math.round((totalInterestEarned + accumulatedInterestYear) * 100) / 100,
    projectedAnnualInterest: Math.round(currentYearEndInterest * 100) / 100,
    yearEndProjectedBalance,
    legalCap,
    capUtilizationPercent: legalCap ? Math.min(100, Math.round((principalDeposited / legalCap) * 100)) : undefined,
    isCapExceeded: legalCap ? principalDeposited >= legalCap : false,
    quinzainesCount,
    daysCount,
    isQuinzaineRule,
    effectiveRatePercent: annualRate * 100,
  };
}

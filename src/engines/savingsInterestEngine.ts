/**
 * Moteur de calcul d'intérêts pour l'épargne réglementée et patrimoniale
 * Conforme à la Règle des Quinzaines en France (24 quinzaines par an)
 */

import type { Position } from '@/types/portfolio';

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

/**
 * Calculates real bi-weekly compound interest according to the French "Règle des Quinzaines".
 * Deposits made on day 1-15 accrue interest starting day 16.
 * Deposits made on day 16-31 accrue interest starting 1st of next month.
 */
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
  const monthlyDCA = position.monthlyDCA || 0;

  let startDate = new Date();
  if (position.dcaStartDate) {
    const parts = position.dcaStartDate.split('-');
    if (parts.length === 3) {
      startDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
  }

  // If start date is in the future, return base balance
  if (startDate > referenceDate) {
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

  // Simulate bi-weekly quinzaines or daily interest from startDate to referenceDate
  let currentBalance = initialAmount;
  let principalDeposited = initialAmount;
  let accumulatedInterestYear = 0;
  let totalInterestEarned = 0;
  let quinzainesCount = 0;
  let daysCount = 0;

  if (isQuinzaineRule) {
    // Exact French Banking Regulation: 24 calendar quinzaines per year (1st and 16th of each month)
    let year = startDate.getFullYear();
    let month = startDate.getMonth(); // 0-11
    let quinzaineInMonth = startDate.getDate() <= 15 ? 1 : 2; // 1 (1st-15th) or 2 (16th-end)

    const targetYear = referenceDate.getFullYear();
    const targetMonth = referenceDate.getMonth();
    const targetQuinzaine = referenceDate.getDate() <= 15 ? 1 : 2;

    while (
      year < targetYear ||
      (year === targetYear && month < targetMonth) ||
      (year === targetYear && month === targetMonth && quinzaineInMonth < targetQuinzaine)
    ) {
      // Apply monthly DCA deposit on the 1st quinzaine of the month
      if (quinzaineInMonth === 1 && monthlyDCA > 0) {
        if (!legalCap || principalDeposited < legalCap) {
          const allowedDeposit = legalCap ? Math.min(monthlyDCA, legalCap - principalDeposited) : monthlyDCA;
          if (allowedDeposit > 0) {
            currentBalance += allowedDeposit;
            principalDeposited += allowedDeposit;
          }
        }
      }

      // Accrue 1 quinzaine interest
      const quinzaineRate = annualRate / 24;
      accumulatedInterestYear += currentBalance * quinzaineRate;
      quinzainesCount += 1;

      // Advance to next quinzaine
      if (quinzaineInMonth === 1) {
        quinzaineInMonth = 2;
      } else {
        quinzaineInMonth = 1;
        month += 1;
        if (month > 11) {
          month = 0;
          year += 1;
          // Capitalize interest at year-end
          currentBalance += accumulatedInterestYear;
          totalInterestEarned += accumulatedInterestYear;
          accumulatedInterestYear = 0;
        }
      }
    }
  } else {
    // Daily compounding for other vehicles (e.g. Assurance-Vie, SCPI)
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    while (cursor <= referenceDate) {
      if (cursor.getMonth() === 0 && cursor.getDate() === 1 && accumulatedInterestYear > 0) {
        currentBalance += accumulatedInterestYear;
        totalInterestEarned += accumulatedInterestYear;
        accumulatedInterestYear = 0;
      }

      const dailyRate = annualRate / 365;
      accumulatedInterestYear += currentBalance * dailyRate;
      daysCount += 1;

      if (cursor.getDate() === 5 && monthlyDCA > 0) {
        if (!legalCap || principalDeposited < legalCap) {
          const allowedDeposit = legalCap ? Math.min(monthlyDCA, legalCap - principalDeposited) : monthlyDCA;
          if (allowedDeposit > 0) {
            currentBalance += allowedDeposit;
            principalDeposited += allowedDeposit;
          }
        }
      }

      cursor.setDate(cursor.getDate() + 1);
    }
  }

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

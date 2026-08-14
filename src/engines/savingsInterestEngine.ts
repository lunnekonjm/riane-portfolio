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
/**
 * Calculates real bi-weekly compound interest according to the French "Règle des Quinzaines"
 * or daily compounding for corporate savings (PEE), PER, and Assurance-Vie.
 * Accurately supports ad-hoc deposits, employer matching (abondement), and annual bonuses (intéressement/participation).
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

  let currentBalance = 0;
  let principalDeposited = 0;

  // If initial amount exists and its date is <= referenceDate, apply it at initial date
  if (initialAmount > 0) {
    if (!initialDate || initialDate <= referenceDate) {
      currentBalance += initialAmount;
      principalDeposited += initialAmount;
    }
  }

  let accumulatedInterestYear = 0;
  let totalInterestEarned = 0;
  let quinzainesCount = 0;
  let daysCount = 0;

  if (isQuinzaineRule) {
    // Map each ad-hoc deposit to its quinzaine when interest begins accruing:
    // - Day 1 to 15: Interest starts 16th of same month (quinzaine 2 of month M)
    // - Day 16 to 31: Interest starts 1st of next month (quinzaine 1 of month M+1)
    const depositsWithQuinzaine = validDeposits.map((dep) => {
      const depY = dep.parsedDate.getFullYear();
      const depM = dep.parsedDate.getMonth();
      const depD = dep.parsedDate.getDate();

      let targetY = depY;
      let targetM = depM;
      let targetQ = 1;

      if (depD <= 15) {
        targetQ = 2;
      } else {
        targetQ = 1;
        targetM += 1;
        if (targetM > 11) {
          targetM = 0;
          targetY += 1;
        }
      }

      return {
        ...dep,
        targetY,
        targetM,
        targetQ,
        applied: false,
      };
    });

    let year = startDate.getFullYear();
    let month = startDate.getMonth(); // 0-11
    let quinzaineInMonth = startDate.getDate() <= 15 ? 1 : 2;

    const targetYear = referenceDate.getFullYear();
    const targetMonth = referenceDate.getMonth();
    const targetQuinzaine = referenceDate.getDate() <= 15 ? 1 : 2;

    const checkDepositMonth = (m: number, freq?: string, targetDepMonth?: number) => {
      if (!freq || freq === 'monthly') return true;
      if (freq === 'quarterly') return (m % 3) === 0;
      if (freq === 'semestrial') return (m % 6) === 0;
      if (freq === 'annual') {
        const targetM = (targetDepMonth !== undefined ? targetDepMonth - 1 : 0);
        return m === targetM;
      }
      return true;
    };

    while (
      year < targetYear ||
      (year === targetYear && month < targetMonth) ||
      (year === targetYear && month === targetMonth && quinzaineInMonth < targetQuinzaine)
    ) {
      // 1. Apply any ad-hoc deposits scheduled for this quinzaine
      for (const dep of depositsWithQuinzaine) {
        if (!dep.applied && dep.targetY === year && dep.targetM === month && dep.targetQ === quinzaineInMonth) {
          dep.applied = true;
          if (!legalCap || principalDeposited < legalCap) {
            const allowed = legalCap ? Math.min(dep.amount, legalCap - principalDeposited) : dep.amount;
            if (allowed > 0) {
              currentBalance += allowed;
              principalDeposited += allowed;
            }
          }
        }
      }

      // 2. Apply recurring DCA deposit if active on this quinzaine
      const quinzaineMidDate = new Date(year, month, quinzaineInMonth === 1 ? 5 : 20);
      const activeDCA = getActiveDCAForDate(quinzaineMidDate);

      if (activeDCA && activeDCA.amount > 0) {
        const targetQ = activeDCA.depositDay > 15 ? 2 : 1;
        if (quinzaineInMonth === targetQ && checkDepositMonth(month, activeDCA.frequency, activeDCA.depositMonth)) {
          if (!legalCap || principalDeposited < legalCap) {
            const allowedDeposit = legalCap ? Math.min(activeDCA.amount, legalCap - principalDeposited) : activeDCA.amount;
            if (allowedDeposit > 0) {
              currentBalance += allowedDeposit;
              principalDeposited += allowedDeposit;
            }
          }
        }
      }

      // 3. Accrue 1 quinzaine interest on currentBalance
      const quinzaineRate = annualRate / 24;
      accumulatedInterestYear += currentBalance * quinzaineRate;
      quinzainesCount += 1;

      // 4. Advance to next quinzaine
      if (quinzaineInMonth === 1) {
        quinzaineInMonth = 2;
      } else {
        quinzaineInMonth = 1;
        month += 1;
        if (month > 11) {
          month = 0;
          year += 1;
          // Capitalize interest on December 31st
          currentBalance += accumulatedInterestYear;
          totalInterestEarned += accumulatedInterestYear;
          accumulatedInterestYear = 0;
        }
      }
    }
  } else {
    // Daily compounding for other vehicles (PEE, Assurance-Vie, PER, SCPI)
    const checkDepositMonthDaily = (m: number, freq?: string, targetDepMonth?: number) => {
      if (!freq || freq === 'monthly') return true;
      if (freq === 'quarterly') return (m % 3) === 0;
      if (freq === 'semestrial') return (m % 6) === 0;
      if (freq === 'annual') {
        const targetM = (targetDepMonth !== undefined ? targetDepMonth - 1 : 0);
        return m === targetM;
      }
      return true;
    };

    const depositsWithDaily = validDeposits.map((dep) => ({
      ...dep,
      applied: false,
    }));

    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    while (cursor <= referenceDate) {
      if (cursor.getMonth() === 0 && cursor.getDate() === 1 && accumulatedInterestYear > 0) {
        currentBalance += accumulatedInterestYear;
        totalInterestEarned += accumulatedInterestYear;
        accumulatedInterestYear = 0;
      }

      // Apply ad-hoc deposits on their exact calendar date
      for (const dep of depositsWithDaily) {
        if (
          !dep.applied &&
          dep.parsedDate.getFullYear() === cursor.getFullYear() &&
          dep.parsedDate.getMonth() === cursor.getMonth() &&
          dep.parsedDate.getDate() === cursor.getDate()
        ) {
          dep.applied = true;
          if (!legalCap || principalDeposited < legalCap) {
            const allowed = legalCap ? Math.min(dep.amount, legalCap - principalDeposited) : dep.amount;
            if (allowed > 0) {
              currentBalance += allowed;
              principalDeposited += allowed;
            }
          }
        }
      }

      // Apply active recurring DCA deposit on scheduled day
      const activeDCA = getActiveDCAForDate(cursor);
      if (activeDCA && activeDCA.amount > 0) {
        const targetDay = activeDCA.depositDay || 5;
        if (cursor.getDate() === targetDay && checkDepositMonthDaily(cursor.getMonth(), activeDCA.frequency, activeDCA.depositMonth)) {
          if (!legalCap || principalDeposited < legalCap) {
            const allowedDeposit = legalCap ? Math.min(activeDCA.amount, legalCap - principalDeposited) : activeDCA.amount;
            if (allowedDeposit > 0) {
              currentBalance += allowedDeposit;
              principalDeposited += allowedDeposit;
            }
          }
        }
      }

      const dailyRate = annualRate / 365;
      accumulatedInterestYear += currentBalance * dailyRate;
      daysCount += 1;

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

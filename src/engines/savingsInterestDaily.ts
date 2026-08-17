/**
 * Moteur de calcul d'intérêts quotidiens pour PEE, Assurance-Vie, PER, SCPI
 */

export interface DailyCalculationParams {
  startDate: Date;
  referenceDate: Date;
  initialAmount: number;
  initialDate: Date | null;
  annualRate: number;
  legalCap?: number;
  validDeposits: Array<{
    amount: number;
    date: string;
    parsedDate: Date;
  }>;
  getActiveDCAForDate: (date: Date) => {
    amount: number;
    frequency: string;
    depositDay: number;
    depositMonth: number;
  } | null;
}

export function computeDailyInterest(params: DailyCalculationParams) {
  const {
    startDate,
    referenceDate,
    initialAmount,
    initialDate,
    annualRate,
    legalCap,
    validDeposits,
    getActiveDCAForDate,
  } = params;

  let currentBalance = 0;
  let principalDeposited = 0;

  if (initialAmount > 0) {
    if (!initialDate || initialDate <= referenceDate) {
      currentBalance += initialAmount;
      principalDeposited += initialAmount;
    }
  }

  let accumulatedInterestYear = 0;
  let totalInterestEarned = 0;
  let daysCount = 0;

  const checkDepositMonthDaily = (m: number, freq?: string, targetDepMonth?: number) => {
    if (!freq || freq === 'monthly') return true;
    if (freq === 'quarterly') return (m % 3) === 0;
    if (freq === 'semestrial') return (m % 6) === 0;
    if (freq === 'annual') {
      const targetM = targetDepMonth !== undefined ? targetDepMonth - 1 : 0;
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

  return {
    currentBalance,
    principalDeposited,
    accumulatedInterestYear,
    totalInterestEarned,
    daysCount,
  };
}

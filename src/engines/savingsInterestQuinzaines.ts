/**
 * Moteur de calcul d'intérêts pour la Règle des Quinzaines en France (Livret A, LDDS, LEP)
 * 24 quinzaines par an.
 */

export interface QuinzainesCalculationParams {
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

export function computeQuinzainesInterest(params: QuinzainesCalculationParams) {
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
  let quinzainesCount = 0;

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
      const targetM = targetDepMonth !== undefined ? targetDepMonth - 1 : 0;
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

  return {
    currentBalance,
    principalDeposited,
    accumulatedInterestYear,
    totalInterestEarned,
    quinzainesCount,
  };
}

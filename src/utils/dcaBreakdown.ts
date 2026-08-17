import type { Position } from '@/types/portfolio';

export interface DcaBreakdownResult {
  monthlySum: number;
  monthlyCount: number;
  quarterlySum: number;
  quarterlyCount: number;
  semestrialSum: number;
  semestrialCount: number;
  annualSum: number;
  annualCount: number;
  totalAnnualCumulative: number;
  monthlyEquivalent: number;
  activeFrequenciesCount: number;
}

export function computeDcaBreakdown(positions: Position[]): DcaBreakdownResult {
  let monthlySum = 0;
  let monthlyCount = 0;
  let quarterlySum = 0;
  let quarterlyCount = 0;
  let semestrialSum = 0;
  let semestrialCount = 0;
  let annualSum = 0;
  let annualCount = 0;

  positions.forEach((p) => {
    const hasDCA = (p.monthlyDCA && p.monthlyDCA > 0) || (p.annualBudget && p.annualBudget > 0);
    if (!hasDCA) return;

    const freqStr = (p.dcaFrequency || (p.annualBudget && p.annualBudget > 0 ? 'annual' : 'monthly')) as string;

    if (freqStr === 'annual' || (p.annualBudget && p.annualBudget > 0)) {
      annualCount++;
      const val = p.annualBudget || (p.monthlyDCA ? p.monthlyDCA * 12 : 0);
      annualSum += val;
    } else if (freqStr === 'quarterly') {
      quarterlyCount++;
      const val = p.monthlyDCA ? p.monthlyDCA * 3 : (p.annualBudget ? p.annualBudget / 4 : 0);
      quarterlySum += val;
    } else if (freqStr === 'semestrial') {
      semestrialCount++;
      const val = p.monthlyDCA ? p.monthlyDCA * 6 : (p.annualBudget ? p.annualBudget / 2 : 0);
      semestrialSum += val;
    } else {
      monthlyCount++;
      const val = p.monthlyDCA || (p.annualBudget ? p.annualBudget / 12 : 0);
      monthlySum += val;
    }
  });

  const totalAnnualCumulative = (monthlySum * 12) + (quarterlySum * 4) + (semestrialSum * 2) + annualSum;
  const monthlyEquivalent = totalAnnualCumulative > 0 ? totalAnnualCumulative / 12 : 0;
  const activeFrequenciesCount = [monthlyCount, quarterlyCount, semestrialCount, annualCount].filter((c) => c > 0).length;

  return {
    monthlySum,
    monthlyCount,
    quarterlySum,
    quarterlyCount,
    semestrialSum,
    semestrialCount,
    annualSum,
    annualCount,
    totalAnnualCumulative,
    monthlyEquivalent,
    activeFrequenciesCount,
  };
}

'use client';

import { useMemo } from 'react';
import type { RuleCategoryItem } from '@/types/auraRules';
import type { TemporaryExpenseItem } from '@/engines/bankingAnalyzerEngine';
import { isExpenseActiveForPeriod } from '@/engines/bankingAnalyzerEngine';

export const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
export const MONTHS_SHORT_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

export function getDateForOffset(offset: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d;
}

export function getPeriodForOffset(offset: number) {
  const d = getDateForOffset(offset);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${m}`;
}

export function getEffectiveAmount(item: RuleCategoryItem | null | undefined, netSalary: number) {
  if (!item) return 0;
  const amt = typeof item.amount === 'number' && !isNaN(item.amount) ? item.amount : 0;
  if (item.isPercentage) {
    return ((netSalary || 0) * amt) / 100;
  }
  return amt;
}

export function getEffectivePercent(item: RuleCategoryItem | null | undefined, netSalary: number) {
  if (!item) return 0;
  const amt = typeof item.amount === 'number' && !isNaN(item.amount) ? item.amount : 0;
  if (item.isPercentage) return amt;
  if (!netSalary || netSalary <= 0) return 0;
  return (amt / netSalary) * 100;
}

interface UseAuraForecastCalculationsParams {
  netSalary: number;
  savingsCategories: RuleCategoryItem[];
  fixedCategories: RuleCategoryItem[];
  dailyCategories: RuleCategoryItem[];
  temporaryExpenses: TemporaryExpenseItem[];
  bufferMultiplier: number;
  selectedForecastOffset: number;
}

export function useAuraForecastCalculations({
  netSalary,
  savingsCategories,
  fixedCategories,
  dailyCategories,
  temporaryExpenses,
  bufferMultiplier,
  selectedForecastOffset,
}: UseAuraForecastCalculationsParams) {
  const selectedPeriod = getPeriodForOffset(selectedForecastOffset);
  const selectedDate = getDateForOffset(selectedForecastOffset);
  const selectedMonthLong = (selectedDate && MONTHS_FR[selectedDate.getMonth()]) || 'Mois';

  const activeTempExpensesForSelectedPeriod = useMemo(() => {
    if (!Array.isArray(temporaryExpenses)) return [];
    return temporaryExpenses.filter((e) => e && isExpenseActiveForPeriod(e, selectedPeriod));
  }, [temporaryExpenses, selectedPeriod]);

  const activeTempMonthlyTotal = useMemo(() => {
    return activeTempExpensesForSelectedPeriod.reduce((sum, e) => sum + (typeof e?.monthlyAmount === 'number' ? e.monthlyAmount : 0), 0);
  }, [activeTempExpensesForSelectedPeriod]);

  const totalSavings = useMemo(() => {
    if (!Array.isArray(savingsCategories)) return 0;
    return savingsCategories.reduce((sum, c) => sum + getEffectiveAmount(c, netSalary), 0);
  }, [savingsCategories, netSalary]);

  const baseFixed = useMemo(() => {
    if (!Array.isArray(fixedCategories)) return 0;
    return fixedCategories.reduce((sum, c) => sum + getEffectiveAmount(c, netSalary), 0);
  }, [fixedCategories, netSalary]);

  const totalFixed = baseFixed + activeTempMonthlyTotal;

  const totalDaily = useMemo(() => {
    if (!Array.isArray(dailyCategories)) return 0;
    return dailyCategories.reduce((sum, c) => sum + getEffectiveAmount(c, netSalary), 0);
  }, [dailyCategories, netSalary]);

  const resteAVivre = (netSalary || 0) - totalSavings - totalFixed - totalDaily;
  const seuilSecurite = totalFixed * bufferMultiplier;

  return {
    selectedPeriod,
    selectedDate,
    selectedMonthLong,
    monthsShortFr: MONTHS_SHORT_FR,
    activeTempExpensesForSelectedPeriod,
    activeTempMonthlyTotal,
    totalSavings,
    baseFixed,
    totalFixed,
    totalDaily,
    resteAVivre,
    seuilSecurite,
  };
}

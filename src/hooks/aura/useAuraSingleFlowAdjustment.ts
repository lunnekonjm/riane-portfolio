'use client';

import type { TargetFlowCategory } from '@/engines/bankingAnalyzerEngine';
import type { RuleCategoryItem, BudgetAuditLogEntry } from '@/types/auraRules';

interface UseAuraSingleFlowAdjustmentParams {
  netSalary: number;
  setSavingsCategories: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>;
  setFixedCategories: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>;
  setDailyCategories: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>;
  logBudgetChange: (entry: Omit<BudgetAuditLogEntry, 'id' | 'timestamp'>) => void;
  getEffectiveAmount: (cat: RuleCategoryItem) => number;
  periodLabel: string;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

export function useAuraSingleFlowAdjustment({
  netSalary,
  setSavingsCategories,
  setFixedCategories,
  setDailyCategories,
  logBudgetChange,
  getEffectiveAmount,
  periodLabel,
  onShowToast,
}: UseAuraSingleFlowAdjustmentParams) {
  const handleAdjustSingleFlow = (flow: TargetFlowCategory) => {
    const rowKey = flow.key;
    const avgMonthly = flow.monthlyAverage;
    if (!netSalary || netSalary <= 0 || avgMonthly <= 0) return;

    if (rowKey === 'pea' || rowKey === 'livret_a') {
      setSavingsCategories((prev) =>
        prev.map((c) => {
          const match = rowKey === 'pea' ? (c?.name || '').toUpperCase().includes('PEA') : (c?.name || '').toUpperCase().includes('LIVRET');
          if (match) {
            const oldAmt = c.amount;
            const newAmt = c.isPercentage ? Math.round((avgMonthly / netSalary) * 100 * 10) / 10 : avgMonthly;
            logBudgetChange({
              categoryName: c.name,
              pillar: 'Épargne',
              actionLabel: 'Ajustement Réel Unitaire',
              actionType: 'APPLY_REAL',
              previousAmount: oldAmt,
              newAmount: newAmt,
              effectiveDeltaEuro: avgMonthly - getEffectiveAmount(c),
              note: `Ajusté sur flux réel (${periodLabel})`,
            });
            return { ...c, amount: newAmt };
          }
          return c;
        })
      );
    } else if (['loyer', 'abonnement', 'tontine', 'soutien'].includes(rowKey)) {
      setFixedCategories((prev) =>
        prev.map((c) => {
          const match =
            (rowKey === 'loyer' && (c?.name || '').toUpperCase().includes('LOYER')) ||
            (rowKey === 'abonnement' && (c?.name || '').toUpperCase().includes('ABONNEMENT')) ||
            (rowKey === 'tontine' && (c?.name || '').toUpperCase().includes('TONTINE')) ||
            (rowKey === 'soutien' && (c?.name || '').toUpperCase().includes('SOUTIEN'));
          if (match) {
            const oldAmt = c.amount;
            const newAmt = c.isPercentage ? Math.round((avgMonthly / netSalary) * 100 * 10) / 10 : avgMonthly;
            logBudgetChange({
              categoryName: c.name,
              pillar: 'Charges Fixes',
              actionLabel: 'Ajustement Réel Unitaire',
              actionType: 'APPLY_REAL',
              previousAmount: oldAmt,
              newAmount: newAmt,
              effectiveDeltaEuro: avgMonthly - getEffectiveAmount(c),
              note: `Ajusté sur flux réel (${periodLabel})`,
            });
            return { ...c, amount: newAmt };
          }
          return c;
        })
      );
    } else if (rowKey === 'revolut') {
      setDailyCategories((prev) =>
        prev.map((c) => {
          if ((c?.name || '').toUpperCase().includes('REVOLUT')) {
            const oldAmt = c.amount;
            const newAmt = c.isPercentage ? Math.round((avgMonthly / netSalary) * 100 * 10) / 10 : avgMonthly;
            logBudgetChange({
              categoryName: c.name,
              pillar: 'Dépenses Quotidiennes',
              actionLabel: 'Ajustement Réel Unitaire',
              actionType: 'APPLY_REAL',
              previousAmount: oldAmt,
              newAmount: newAmt,
              effectiveDeltaEuro: avgMonthly - getEffectiveAmount(c),
              note: `Ajusté sur flux réel (${periodLabel})`,
            });
            return { ...c, amount: newAmt };
          }
          return c;
        })
      );
    }

    onShowToast?.(`Poste ajusté avec succès sur la moyenne réelle (${avgMonthly.toFixed(2)} €/mois).`, 'success');
  };

  return { handleAdjustSingleFlow };
}

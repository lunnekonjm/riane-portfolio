'use client';

import type {
  TemporaryExpenseItem,
  DetectedFlowCandidate,
} from '@/engines/bankingAnalyzerEngine';
import type { RuleCategoryItem, BudgetAuditLogEntry } from '@/types/auraRules';

interface UseAuraWizardApplicatorParams {
  netSalary: number;
  setSavingsCategories: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>;
  setFixedCategories: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>;
  setDailyCategories: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>;
  setTemporaryExpenses: React.Dispatch<React.SetStateAction<TemporaryExpenseItem[]>>;
  logBudgetChange: (entry: Omit<BudgetAuditLogEntry, 'id' | 'timestamp'>) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

export function useAuraWizardApplicator({
  netSalary,
  setSavingsCategories,
  setFixedCategories,
  setDailyCategories,
  setTemporaryExpenses,
  logBudgetChange,
  onShowToast,
}: UseAuraWizardApplicatorParams) {
  const handleApplyFlowWizardSelection = (
    approvedCandidates: Array<{
      candidate: DetectedFlowCandidate;
      amount: number;
      isPercentage: boolean;
    }>,
    approvedTempExpenses: TemporaryExpenseItem[]
  ) => {
    for (const item of approvedCandidates) {
      const { candidate, amount, isPercentage } = item;

      const updateCategory = (
        setCategories: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>,
        pillar: 'SAVINGS' | 'FIXED' | 'DAILY'
      ) => {
        setCategories((prev) => {
          const index = prev.findIndex(
            (c) =>
              (c?.name || '').toUpperCase().includes(candidate.categoryKey.toUpperCase()) ||
              candidate.title.toUpperCase().includes((c?.name || '').toUpperCase())
          );

          if (index >= 0) {
            const oldItem = prev[index];
            const updated = {
              ...oldItem,
              amount,
              isPercentage,
              note: `Validé via Radar Bancaire (${candidate.calculationFormula})`,
            };
            const next = [...prev];
            next[index] = updated;

            const oldEuro = oldItem.isPercentage ? (netSalary * oldItem.amount) / 100 : oldItem.amount;
            const newEuro = isPercentage ? (netSalary * amount) / 100 : amount;

            logBudgetChange({
              categoryName: updated.name,
              pillar,
              actionLabel: 'Validation Radar Bancaire',
              actionType: 'AUTO_ADJUST',
              previousAmount: oldItem.amount,
              previousIsPercentage: oldItem.isPercentage,
              newAmount: amount,
              newIsPercentage: isPercentage,
              effectiveDeltaEuro: newEuro - oldEuro,
              note: `Ajustement validé depuis relevé (${candidate.calculationFormula})`,
            });

            return next;
          } else {
            const newCat: RuleCategoryItem = {
              id: `${pillar.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: candidate.title,
              amount,
              isPercentage,
              isLocked: false,
              categoryType: pillar,
              iconType: candidate.icon || 'chart',
              iconBgColor: candidate.color || '#06b6d4',
              note: `Ajouté via Radar Bancaire (${candidate.calculationFormula})`,
            };

            const newEuro = isPercentage ? (netSalary * amount) / 100 : amount;
            logBudgetChange({
              categoryName: newCat.name,
              pillar,
              actionLabel: 'Ajout Poste Radar',
              actionType: 'EDIT_CAT',
              newAmount: amount,
              newIsPercentage: isPercentage,
              effectiveDeltaEuro: newEuro,
              note: candidate.calculationFormula,
            });

            return [...prev, newCat];
          }
        });
      };

      if (candidate.pillar === 'SAVINGS') {
        updateCategory(setSavingsCategories, 'SAVINGS');
      } else if (candidate.pillar === 'FIXED') {
        updateCategory(setFixedCategories, 'FIXED');
      } else if (candidate.pillar === 'DAILY') {
        updateCategory(setDailyCategories, 'DAILY');
      }
    }

    if (approvedTempExpenses.length > 0) {
      setTemporaryExpenses((prev) => {
        const next = [...prev];
        for (const exp of approvedTempExpenses) {
          const idx = next.findIndex((t) => t.id === exp.id || t.label.toLowerCase() === exp.label.toLowerCase());
          if (idx >= 0) {
            next[idx] = exp;
          } else {
            next.push(exp);
          }
        }
        return next;
      });
    }

    onShowToast?.(`✓ ${approvedCandidates.length} règle(s) mise(s) à jour avec succès depuis le relevé bancaire.`, 'success');
  };

  return { handleApplyFlowWizardSelection };
}

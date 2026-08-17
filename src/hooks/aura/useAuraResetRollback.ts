'use client';

import type { RuleCategoryItem, BudgetAuditLogEntry } from '@/types/auraRules';
import { DEFAULT_SAVINGS, DEFAULT_FIXED, DEFAULT_DAILY } from '@/hooks/useAuraRulesState';

interface UseAuraResetRollbackParams {
  savingsCategories: RuleCategoryItem[];
  setSavingsCategories: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>;
  fixedCategories: RuleCategoryItem[];
  setFixedCategories: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>;
  dailyCategories: RuleCategoryItem[];
  setDailyCategories: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>;
  logBudgetChange: (entry: Omit<BudgetAuditLogEntry, 'id' | 'timestamp'>) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

export function useAuraResetRollback({
  savingsCategories,
  setSavingsCategories,
  fixedCategories,
  setFixedCategories,
  dailyCategories,
  setDailyCategories,
  logBudgetChange,
  onShowToast,
}: UseAuraResetRollbackParams) {
  const handleResetInitial = () => {
    setSavingsCategories(DEFAULT_SAVINGS);
    setFixedCategories(DEFAULT_FIXED);
    setDailyCategories(DEFAULT_DAILY);
    logBudgetChange({
      categoryName: 'Toutes les catégories',
      pillar: 'Général',
      actionLabel: 'Règles Initiales',
      actionType: 'RESET_INITIAL',
      effectiveDeltaEuro: 0,
      note: 'Restauration complète des règles de référence Aura Pro',
    });
    onShowToast?.('Règles de répartition réinitialisées aux valeurs de référence.', 'success');
  };

  const handleClearAllRules = () => {
    setSavingsCategories([]);
    setFixedCategories([]);
    setDailyCategories([]);
    logBudgetChange({
      categoryName: 'Toutes les catégories',
      pillar: 'Général',
      actionLabel: 'Effacement Total',
      actionType: 'CLEAR_ALL',
      effectiveDeltaEuro: 0,
      note: 'Toutes les règles ont été effacées pour repartir de zéro',
    });
    onShowToast?.('Toutes les catégories ont été effacées. Page blanche.', 'error');
  };

  const handleRollbackAudit = (entry: BudgetAuditLogEntry) => {
    if (entry.previousAmount === undefined || entry.previousAmount === null) return;

    const restoreInList = (
      list: RuleCategoryItem[],
      setList: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>
    ) => {
      setList((prev) =>
        prev.map((c) => {
          if ((c?.name || '').trim().toLowerCase() === entry.categoryName.trim().toLowerCase()) {
            return {
              ...c,
              amount: entry.previousAmount!,
              isPercentage: entry.previousIsPercentage ?? c.isPercentage,
            };
          }
          return c;
        })
      );
    };

    restoreInList(savingsCategories, setSavingsCategories);
    restoreInList(fixedCategories, setFixedCategories);
    restoreInList(dailyCategories, setDailyCategories);

    logBudgetChange({
      categoryName: entry.categoryName,
      pillar: entry.pillar,
      actionLabel: 'Annulation (Rollback)',
      actionType: 'ROLLBACK',
      previousAmount: entry.newAmount,
      newAmount: entry.previousAmount,
      effectiveDeltaEuro: -entry.effectiveDeltaEuro,
      note: `Annulation du changement du ${new Date(entry.timestamp).toLocaleDateString()}`,
    });

    onShowToast?.(`Changement annulé pour "${entry.categoryName}".`, 'success');
  };

  return {
    handleResetInitial,
    handleClearAllRules,
    handleRollbackAudit,
  };
}

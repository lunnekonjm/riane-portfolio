'use client';

import { useState } from 'react';
import type {
  TargetFlowCategory,
  TemporaryExpenseItem,
} from '@/engines/bankingAnalyzerEngine';
import type { RuleCategoryItem, BudgetAuditLogEntry, AuraModalType } from '@/types/auraRules';
import { useAuraResetRollback } from './aura/useAuraResetRollback';
import { useAuraSingleFlowAdjustment } from './aura/useAuraSingleFlowAdjustment';
import { useAuraWizardApplicator } from './aura/useAuraWizardApplicator';

export interface UseAuraRulesActionsParams {
  netSalary: number;
  savingsCategories: RuleCategoryItem[];
  setSavingsCategories: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>;
  fixedCategories: RuleCategoryItem[];
  setFixedCategories: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>;
  dailyCategories: RuleCategoryItem[];
  setDailyCategories: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>;
  temporaryExpenses: TemporaryExpenseItem[];
  setTemporaryExpenses: React.Dispatch<React.SetStateAction<TemporaryExpenseItem[]>>;
  logBudgetChange: (entry: Omit<BudgetAuditLogEntry, 'id' | 'timestamp'>) => void;
  getEffectiveAmount: (cat: RuleCategoryItem) => number;
  periodLabel: string;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

export function useAuraRulesActions({
  netSalary,
  savingsCategories,
  setSavingsCategories,
  fixedCategories,
  setFixedCategories,
  dailyCategories,
  setDailyCategories,
  temporaryExpenses,
  setTemporaryExpenses,
  logBudgetChange,
  getEffectiveAmount,
  periodLabel,
  onShowToast,
}: UseAuraRulesActionsParams) {
  const [activeModal, setActiveModal] = useState<AuraModalType | null>(null);
  const [selectedFlowModalCat, setSelectedFlowModalCat] = useState<TargetFlowCategory | null>(null);
  const [editingTempExpense, setEditingTempExpense] = useState<TemporaryExpenseItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<RuleCategoryItem | null>(null);
  const [editingCategoryPillar, setEditingCategoryPillar] = useState<'SAVINGS' | 'FIXED' | 'DAILY'>('FIXED');

  const openCategoryEditor = (cat: RuleCategoryItem | null, pillar: 'SAVINGS' | 'FIXED' | 'DAILY') => {
    if (cat) {
      setEditingCategory(cat);
      setEditingCategoryPillar(pillar);
    } else {
      const isSav = pillar === 'SAVINGS';
      const isDaily = pillar === 'DAILY';
      const newCat: RuleCategoryItem = {
        id: `${pillar.toLowerCase().slice(0, 3)}-${Date.now()}`,
        name: '',
        amount: isSav ? 5.0 : isDaily ? 7.0 : 50,
        isPercentage: isSav || isDaily,
        isLocked: false,
        categoryType: pillar,
        iconType: isSav ? '📈' : isDaily ? '💳' : '🏠',
        iconBgColor: isSav ? '#06b6d4' : isDaily ? '#f59e0b' : '#f43f5e',
        note: '',
      };
      setEditingCategory(newCat);
      setEditingCategoryPillar(pillar);
    }
    setActiveModal('EDIT_CATEGORY');
  };

  const { handleResetInitial, handleClearAllRules, handleRollbackAudit } = useAuraResetRollback({
    savingsCategories,
    setSavingsCategories,
    fixedCategories,
    setFixedCategories,
    dailyCategories,
    setDailyCategories,
    logBudgetChange,
    onShowToast,
  });

  const { handleAdjustSingleFlow } = useAuraSingleFlowAdjustment({
    netSalary,
    setSavingsCategories,
    setFixedCategories,
    setDailyCategories,
    logBudgetChange,
    getEffectiveAmount,
    periodLabel,
    onShowToast,
  });

  const { handleApplyFlowWizardSelection } = useAuraWizardApplicator({
    netSalary,
    setSavingsCategories,
    setFixedCategories,
    setDailyCategories,
    setTemporaryExpenses,
    logBudgetChange,
    onShowToast,
  });

  return {
    activeModal,
    setActiveModal,
    selectedFlowModalCat,
    setSelectedFlowModalCat,
    editingTempExpense,
    setEditingTempExpense,
    editingCategory,
    setEditingCategory,
    editingCategoryPillar,
    setEditingCategoryPillar,
    openCategoryEditor,
    handleResetInitial,
    handleClearAllRules,
    handleAdjustSingleFlow,
    handleRollbackAudit,
    handleApplyFlowWizardSelection,
  };
}

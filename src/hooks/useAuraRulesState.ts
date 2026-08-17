'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  TemporaryExpenseItem,
  TargetFlowItem,
  BankTargetAnalysisSummary,
} from '@/engines/bankingAnalyzerEngine';
import {
  analyzeTargetFlows,
  SAMPLE_REAL_TRANSACTIONS,
} from '@/engines/bankingAnalyzerEngine';
import { getCachedTrueLayerTransactions, fetchAndCacheTrueLayerTransactions, type CachedTransactionsData } from '@/services/bankReconciliationEngine';
import type { RuleCategoryItem, BudgetAuditLogEntry } from '@/types/auraRules';
import {
  DEFAULT_SAVINGS,
  DEFAULT_FIXED,
  DEFAULT_DAILY,
  DEFAULT_TEMP_EXPENSES,
} from './aura/auraDefaultRules';
import {
  useAuraForecastCalculations,
  getDateForOffset,
  getPeriodForOffset,
  getEffectiveAmount as calcEffectiveAmount,
  getEffectivePercent as calcEffectivePercent,
} from './aura/useAuraForecastCalculations';

export {
  DEFAULT_SAVINGS,
  DEFAULT_FIXED,
  DEFAULT_DAILY,
  DEFAULT_TEMP_EXPENSES,
};

export function useAuraRulesState(netSalary: number) {
  const [savingsCategories, setSavingsCategories] = useState<RuleCategoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aura_rules_savings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((item) => ({
              ...item,
              name: item.name || 'Épargne',
              amount: typeof item.amount === 'number' && !isNaN(item.amount) ? item.amount : 0,
              isPercentage: Boolean(item.isPercentage),
              isLocked: Boolean(item.isLocked),
              categoryType: 'SAVINGS' as const,
              iconType: item.iconType || 'chart',
              iconBgColor: item.iconBgColor || '#06b6d4',
            }));
          }
        } catch {}
      }
    }
    return DEFAULT_SAVINGS;
  });

  const [fixedCategories, setFixedCategories] = useState<RuleCategoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aura_rules_fixed');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((item) => ({
              ...item,
              name: item.name || 'Charge Fixe',
              amount: typeof item.amount === 'number' && !isNaN(item.amount) ? item.amount : 0,
              isPercentage: Boolean(item.isPercentage),
              isLocked: Boolean(item.isLocked),
              categoryType: 'FIXED' as const,
              iconType: item.iconType || 'home',
              iconBgColor: item.iconBgColor || '#f43f5e',
            }));
          }
        } catch {}
      }
    }
    return DEFAULT_FIXED;
  });

  const [dailyCategories, setDailyCategories] = useState<RuleCategoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aura_rules_daily');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((item) => ({
              ...item,
              name: item.name || 'Quotidien',
              amount: typeof item.amount === 'number' && !isNaN(item.amount) ? item.amount : 0,
              isPercentage: Boolean(item.isPercentage),
              isLocked: Boolean(item.isLocked),
              categoryType: 'DAILY' as const,
              iconType: item.iconType || 'card',
              iconBgColor: item.iconBgColor || '#06b6d4',
            }));
          }
        } catch {}
      }
    }
    return DEFAULT_DAILY;
  });

  const [temporaryExpenses, setTemporaryExpenses] = useState<TemporaryExpenseItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aura_temporary_expenses');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.map((item) => ({
              ...item,
              label: item.label || 'Échéance',
              monthlyAmount: typeof item.monthlyAmount === 'number' && !isNaN(item.monthlyAmount) ? item.monthlyAmount : 0,
              durationMonths: typeof item.durationMonths === 'number' && !isNaN(item.durationMonths) ? item.durationMonths : 1,
              startPeriod: item.startPeriod || '2026-09',
            }));
          }
        } catch {}
      }
    }
    return DEFAULT_TEMP_EXPENSES;
  });

  const [accountBalance, setAccountBalance] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aura_account_balance');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val)) return val;
      }
    }
    return -182.0;
  });

  const [bufferMultiplier, setBufferMultiplier] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aura_buffer_multiplier');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val > 0) return val;
      }
    }
    return 1.0;
  });

  const [selectedForecastOffset, setSelectedForecastOffset] = useState<number>(0);
  const [selectedTargetPeriodDays, setSelectedTargetPeriodDays] = useState<number>(30);
  const [auditLogs, setAuditLogs] = useState<BudgetAuditLogEntry[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aura_rules_audit_logs');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }
    return [];
  });

  // Persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('aura_rules_savings', JSON.stringify(savingsCategories));
        localStorage.setItem('aura_rules_fixed', JSON.stringify(fixedCategories));
        localStorage.setItem('aura_rules_daily', JSON.stringify(dailyCategories));
        localStorage.setItem('aura_temporary_expenses', JSON.stringify(temporaryExpenses));
        localStorage.setItem('aura_account_balance', accountBalance.toString());
        localStorage.setItem('aura_buffer_multiplier', bufferMultiplier.toString());
        localStorage.setItem('aura_rules_audit_logs', JSON.stringify(auditLogs));
      } catch {}
    }
  }, [savingsCategories, fixedCategories, dailyCategories, temporaryExpenses, accountBalance, bufferMultiplier, auditLogs]);

  // Read transactions from TrueLayer cache (Dynamic state)
  const [cachedData, setCachedData] = useState<CachedTransactionsData | null>(() => getCachedTrueLayerTransactions());
  const [isSyncingTrueLayer, setIsSyncingTrueLayer] = useState(false);

  const refreshTrueLayerTransactions = useCallback(async (monthsCount = 3) => {
    setIsSyncingTrueLayer(true);
    try {
      const res = await fetchAndCacheTrueLayerTransactions(monthsCount);
      const updated = getCachedTrueLayerTransactions();
      if (updated) {
        setCachedData(updated);
      } else if (res.transactions.length > 0) {
        setCachedData({
          transactions: res.transactions,
          timestamp: Date.now(),
          months: res.months,
        });
      }
      return res;
    } finally {
      setIsSyncingTrueLayer(false);
    }
  }, []);

  // Listen for storage and custom sync updates
  useEffect(() => {
    const handleUpdate = () => {
      setCachedData(getCachedTrueLayerTransactions());
    };
    window.addEventListener('truelayer_transactions_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Auto-fetch if token exists in localStorage but cache is empty
    if (!cachedData || !cachedData.transactions || cachedData.transactions.length === 0) {
      const token = localStorage.getItem('truelayer_access_token');
      if (token) {
        refreshTrueLayerTransactions(3).catch(() => {});
      }
    }

    return () => {
      window.removeEventListener('truelayer_transactions_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshTrueLayerTransactions]);

  const bankTransactions: TargetFlowItem[] = useMemo(() => {
    if (cachedData && Array.isArray(cachedData.transactions) && cachedData.transactions.length > 0) {
      return cachedData.transactions.map((t) => ({
        id: t.id,
        date: t.date,
        title: t.description || t.counterpartyName || 'Prélèvement',
        amount: Math.abs(typeof t.amount === 'number' ? t.amount : 0),
        category: t.category,
      }));
    }
    return [];
  }, [cachedData]);

  const targetSummary: BankTargetAnalysisSummary = useMemo(() => {
    return analyzeTargetFlows(bankTransactions, netSalary, selectedTargetPeriodDays);
  }, [bankTransactions, netSalary, selectedTargetPeriodDays]);

  const forecast = useAuraForecastCalculations({
    netSalary,
    savingsCategories,
    fixedCategories,
    dailyCategories,
    temporaryExpenses,
    bufferMultiplier,
    selectedForecastOffset,
  });

  const getEffectiveAmount = (item?: RuleCategoryItem | null) => calcEffectiveAmount(item, netSalary);
  const getEffectivePercent = (item?: RuleCategoryItem | null) => calcEffectivePercent(item, netSalary);

  const logBudgetChange = (params: {
    categoryName: string;
    pillar: string;
    actionLabel: string;
    actionType: string;
    previousAmount?: number | null;
    previousIsPercentage?: boolean | null;
    newAmount?: number | null;
    newIsPercentage?: boolean | null;
    effectiveDeltaEuro: number;
    note?: string;
  }) => {
    const entry: BudgetAuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      categoryName: params.categoryName,
      pillar: params.pillar,
      actionLabel: params.actionLabel,
      actionType: params.actionType,
      previousAmount: params.previousAmount,
      previousIsPercentage: params.previousIsPercentage,
      newAmount: params.newAmount,
      newIsPercentage: params.newIsPercentage,
      effectiveDeltaEuro: Math.round(params.effectiveDeltaEuro * 100) / 100,
      note: params.note,
    };
    setAuditLogs((prev) => [entry, ...prev.slice(0, 49)]);
  };

  return {
    savingsCategories,
    setSavingsCategories,
    fixedCategories,
    setFixedCategories,
    dailyCategories,
    setDailyCategories,
    temporaryExpenses,
    setTemporaryExpenses,
    accountBalance,
    setAccountBalance,
    bufferMultiplier,
    setBufferMultiplier,
    selectedForecastOffset,
    setSelectedForecastOffset,
    selectedTargetPeriodDays,
    setSelectedTargetPeriodDays,
    auditLogs,
    setAuditLogs,
    bankTransactions,
    isSyncingTrueLayer,
    refreshTrueLayerTransactions,
    targetSummary,
    getEffectiveAmount,
    getEffectivePercent,
    getDateForOffset,
    getPeriodForOffset,
    logBudgetChange,
    ...forecast,
  };
}

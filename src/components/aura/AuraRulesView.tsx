'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  analyzeTargetFlows,
  cleanFrenchMerchantName,
  computeEndPeriod,
  isExpenseActiveForPeriod,
  type BankTargetAnalysisSummary,
  type TargetFlowCategory,
  type TargetFlowItem,
  type TemporaryExpenseItem,
  type DetectedFlowCandidate,
  SAMPLE_REAL_TRANSACTIONS,
} from '@/engines/bankingAnalyzerEngine';
import {
  getCachedTrueLayerTransactions,
} from '@/services/bankReconciliationEngine';
import { AuraBankFlowWizardModal } from './AuraBankFlowWizardModal';

export interface RuleCategoryItem {
  id: string;
  name: string;
  amount: number;
  isPercentage: boolean;
  isLocked: boolean;
  categoryType: 'FIXED' | 'SAVINGS' | 'DAILY';
  iconType: string;
  iconBgColor: string;
  note?: string;
}

export interface BudgetAuditLogEntry {
  id: string;
  timestamp: number;
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
}

interface AuraRulesViewProps {
  netSalary?: number;
  autoOpenWizard?: boolean;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
  onSyncBank?: () => Promise<void> | Promise<boolean>;
}

const DEFAULT_SAVINGS: RuleCategoryItem[] = [
  { id: 'sav-1', name: 'Cible PEA', amount: 35.0, isPercentage: true, isLocked: true, categoryType: 'SAVINGS', iconType: 'chart', iconBgColor: '#06b6d4', note: 'DCA ETF MSCI World / S&P 500' },
  { id: 'sav-2', name: 'Livret A', amount: 7.0, isPercentage: true, isLocked: true, categoryType: 'SAVINGS', iconType: 'shield', iconBgColor: '#3b82f6', note: 'Sas de précaution liquide' },
];

const DEFAULT_FIXED: RuleCategoryItem[] = [
  { id: 'fix-1', name: 'Loyer', amount: 677, isPercentage: false, isLocked: true, categoryType: 'FIXED', iconType: 'home', iconBgColor: '#f43f5e', note: 'CDC Habitat' },
  { id: 'fix-2', name: 'Abonnement', amount: 41, isPercentage: false, isLocked: true, categoryType: 'FIXED', iconType: 'video', iconBgColor: '#f43f5e', note: 'Free / Telecom / Streaming' },
  { id: 'fix-3', name: 'Tontine', amount: 300, isPercentage: false, isLocked: true, categoryType: 'FIXED', iconType: 'people', iconBgColor: '#8b5cf6', note: 'Cotisation d\'épargne solidaire' },
  { id: 'fix-4', name: 'Soutien', amount: 231, isPercentage: false, isLocked: true, categoryType: 'FIXED', iconType: 'heart', iconBgColor: '#f43f5e', note: 'Sendwave / Soutien familial' },
];

const DEFAULT_DAILY: RuleCategoryItem[] = [
  { id: 'day-1', name: 'Revolut (Reste à vivre)', amount: 7.0, isPercentage: true, isLocked: false, categoryType: 'DAILY', iconType: 'card', iconBgColor: '#06b6d4', note: 'Alimentation, sorties et imprévus' },
];

const DEFAULT_TEMP_EXPENSES: TemporaryExpenseItem[] = [
  { id: 'temp-1', label: 'Dentiste Couronne', monthlyAmount: 614.0, startPeriod: '2026-09', durationMonths: 4, category: 'Santé' },
  { id: 'temp-2', label: 'Turrel Baptiste', monthlyAmount: 145.0, startPeriod: '2026-09', durationMonths: 10, category: 'Logement' },
];

export const AuraRulesView: React.FC<AuraRulesViewProps> = ({
  netSalary = 2713.74,
  autoOpenWizard = false,
  onShowToast,
  onSyncBank,
}) => {
  const [isFlowWizardOpen, setIsFlowWizardOpen] = useState<boolean>(false);

  useEffect(() => {
    if (autoOpenWizard) {
      setIsFlowWizardOpen(true);
    } else if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('open_wizard') === 'true' || sp.get('truelayer_status') === 'success') {
        setIsFlowWizardOpen(true);
      }
    }
  }, [autoOpenWizard]);
  // State categories with strict validation against corrupted localStorage
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

  // State temporary expenses
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

  // Bank balance & buffer settings
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

  // Period / Horizon & Target Period
  const [selectedForecastOffset, setSelectedForecastOffset] = useState<number>(0);
  const [selectedTargetPeriodDays, setSelectedTargetPeriodDays] = useState<number>(30); // 30, 90, 0
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

  // Modals state
  const [activeModal, setActiveModal] = useState<
    | null
    | 'AUDIT_HISTORY'
    | 'FORECAST_MATRIX'
    | 'ARBITRAGE'
    | 'EDIT_BALANCE'
    | 'EDIT_BUFFER_MULT'
    | 'ADD_TEMP_EXPENSE'
    | 'EDIT_TEMP_EXPENSE'
    | 'FLOW_TRANSACTIONS'
    | 'EDIT_CATEGORY'
    | 'GLOBAL_RESET'
  >(null);

  const [selectedFlowModalCat, setSelectedFlowModalCat] = useState<TargetFlowCategory | null>(null);
  const [editingTempExpense, setEditingTempExpense] = useState<TemporaryExpenseItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<RuleCategoryItem | null>(null);
  const [editingCategoryPillar, setEditingCategoryPillar] = useState<'SAVINGS' | 'FIXED' | 'DAILY'>('FIXED');
  const [editingCatName, setEditingCatName] = useState<string>('');
  const [editingCatNote, setEditingCatNote] = useState<string>('');
  const [editingCatAmount, setEditingCatAmount] = useState<number>(0);
  const [editingCatIsPercentage, setEditingCatIsPercentage] = useState<boolean>(false);
  const [editingCatPillar, setEditingCatPillar] = useState<'SAVINGS' | 'FIXED' | 'DAILY'>('FIXED');
  const [editingCatIcon, setEditingCatIcon] = useState<string>('🏠');
  const [editingCatColor, setEditingCatColor] = useState<string>('#06b6d4');

  const AVAILABLE_ICONS = ['🏠', '📱', '📈', '🛡️', '👥', '❤️', '💳', '🛒', '⚡', '🏥', '🚗', '✈️', '🎓', '🍕', '🎮', '🏋️', '💼', '🎁'];
  const AVAILABLE_COLORS = ['#06b6d4', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899', '#64748b'];

  const renderCategoryIcon = (iconType: string | undefined, defaultEmoji: string = '💳') => {
    if (!iconType) return defaultEmoji;
    if (iconType === 'home') return '🏠';
    if (iconType === 'video') return '📱';
    if (iconType === 'people') return '👥';
    if (iconType === 'heart') return '❤️';
    if (iconType === 'chart') return '📈';
    if (iconType === 'shield') return '🛡️';
    if (iconType === 'card') return '💳';
    return iconType;
  };

  const openCategoryEditor = (cat: RuleCategoryItem | null, pillar: 'SAVINGS' | 'FIXED' | 'DAILY') => {
    if (cat) {
      setEditingCategory(cat);
      setEditingCategoryPillar(pillar);
      setEditingCatName(cat.name || '');
      setEditingCatNote(cat.note || '');
      setEditingCatAmount(typeof cat.amount === 'number' ? cat.amount : 0);
      setEditingCatIsPercentage(Boolean(cat.isPercentage));
      setEditingCatPillar(pillar);
      setEditingCatIcon(renderCategoryIcon(cat.iconType, pillar === 'SAVINGS' ? '📈' : pillar === 'DAILY' ? '💳' : '🏠'));
      setEditingCatColor(cat.iconBgColor || (pillar === 'SAVINGS' ? '#06b6d4' : pillar === 'DAILY' ? '#f59e0b' : '#f43f5e'));
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
      setEditingCatName('');
      setEditingCatNote('');
      setEditingCatAmount(newCat.amount);
      setEditingCatIsPercentage(newCat.isPercentage);
      setEditingCatPillar(pillar);
      setEditingCatIcon(newCat.iconType);
      setEditingCatColor(newCat.iconBgColor);
    }
    setActiveModal('EDIT_CATEGORY');
  };

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

  // Read transactions from TrueLayer cache if available
  const cachedData = useMemo(() => getCachedTrueLayerTransactions(), []);
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
    return SAMPLE_REAL_TRANSACTIONS;
  }, [cachedData]);

  // Target summary analysis
  const targetSummary: BankTargetAnalysisSummary = useMemo(() => {
    return analyzeTargetFlows(bankTransactions, netSalary, selectedTargetPeriodDays);
  }, [bankTransactions, netSalary, selectedTargetPeriodDays]);

  // Forecast month helpers
  const monthsFr = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const monthsShortFr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

  const getDateForOffset = (offset: number) => {
    const d = new Date();
    d.setDate(1); // Crucial to avoid month overflow on the 29th/30th/31st!
    d.setMonth(d.getMonth() + offset);
    return d;
  };

  const getPeriodForOffset = (offset: number) => {
    const d = getDateForOffset(offset);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  };

  const selectedPeriod = getPeriodForOffset(selectedForecastOffset);
  const selectedDate = getDateForOffset(selectedForecastOffset);
  const selectedMonthLong = (selectedDate && monthsFr[selectedDate.getMonth()]) || 'Mois';

  // Active temporary expenses for selected period
  const activeTempExpensesForSelectedPeriod = useMemo(() => {
    if (!Array.isArray(temporaryExpenses)) return [];
    return temporaryExpenses.filter((e) => e && isExpenseActiveForPeriod(e, selectedPeriod));
  }, [temporaryExpenses, selectedPeriod]);

  const activeTempMonthlyTotal = useMemo(() => {
    return activeTempExpensesForSelectedPeriod.reduce((sum, e) => sum + (typeof e?.monthlyAmount === 'number' ? e.monthlyAmount : 0), 0);
  }, [activeTempExpensesForSelectedPeriod]);

  // Effective amounts
  const getEffectiveAmount = (item?: RuleCategoryItem | null) => {
    if (!item) return 0;
    const amt = typeof item.amount === 'number' && !isNaN(item.amount) ? item.amount : 0;
    if (item.isPercentage) {
      return ((netSalary || 0) * amt) / 100;
    }
    return amt;
  };

  const getEffectivePercent = (item?: RuleCategoryItem | null) => {
    if (!item) return 0;
    const amt = typeof item.amount === 'number' && !isNaN(item.amount) ? item.amount : 0;
    if (item.isPercentage) return amt;
    if (!netSalary || netSalary <= 0) return 0;
    return (amt / netSalary) * 100;
  };

  const totalSavings = useMemo(() => {
    if (!Array.isArray(savingsCategories)) return 0;
    return savingsCategories.reduce((sum, c) => sum + getEffectiveAmount(c), 0);
  }, [savingsCategories, netSalary]);

  const baseFixed = useMemo(() => {
    if (!Array.isArray(fixedCategories)) return 0;
    return fixedCategories.reduce((sum, c) => sum + getEffectiveAmount(c), 0);
  }, [fixedCategories, netSalary]);

  const totalFixed = baseFixed + activeTempMonthlyTotal;

  const totalDaily = useMemo(() => {
    if (!Array.isArray(dailyCategories)) return 0;
    return dailyCategories.reduce((sum, c) => sum + getEffectiveAmount(c), 0);
  }, [dailyCategories, netSalary]);

  const resteAVivre = (netSalary || 0) - totalSavings - totalFixed - totalDaily;
  const seuilSecurite = totalFixed * bufferMultiplier;

  // Log budget modification
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

  // 1-Click Master Apply Real Flows to Rules
  const handleApplyRealFlows = () => {
    if (!netSalary || netSalary <= 0) return;

    // 1. PEA
    if (targetSummary.pea.monthlyAverage > 0) {
      setSavingsCategories((prev) =>
        prev.map((c) => {
          if ((c?.name || '').toUpperCase().includes('PEA')) {
            const oldAmt = c.amount;
            const newAmt = c.isPercentage
              ? Math.round((targetSummary.pea.monthlyAverage / netSalary) * 100 * 10) / 10
              : targetSummary.pea.monthlyAverage;
            logBudgetChange({
              categoryName: c.name,
              pillar: 'Épargne',
              actionLabel: 'Ajustement Réel Bancaire',
              actionType: 'APPLY_REAL',
              previousAmount: oldAmt,
              newAmount: newAmt,
              effectiveDeltaEuro: targetSummary.pea.monthlyAverage - getEffectiveAmount(c),
              note: `Ajustement auto basé sur flux réels (${targetSummary.periodLabel})`,
            });
            return { ...c, amount: newAmt };
          }
          return c;
        })
      );
    }

    // 2. Livret A
    if (targetSummary.livretA.monthlyAverage > 0) {
      setSavingsCategories((prev) =>
        prev.map((c) => {
          if ((c?.name || '').toUpperCase().includes('LIVRET')) {
            const oldAmt = c.amount;
            const newAmt = c.isPercentage
              ? Math.round((targetSummary.livretA.monthlyAverage / netSalary) * 100 * 10) / 10
              : targetSummary.livretA.monthlyAverage;
            logBudgetChange({
              categoryName: c.name,
              pillar: 'Épargne',
              actionLabel: 'Ajustement Réel Bancaire',
              actionType: 'APPLY_REAL',
              previousAmount: oldAmt,
              newAmount: newAmt,
              effectiveDeltaEuro: targetSummary.livretA.monthlyAverage - getEffectiveAmount(c),
              note: `Ajustement auto basé sur flux réels (${targetSummary.periodLabel})`,
            });
            return { ...c, amount: newAmt };
          }
          return c;
        })
      );
    }

    // 3. Loyer
    if (targetSummary.loyer.monthlyAverage > 0) {
      setFixedCategories((prev) =>
        prev.map((c) => {
          if ((c?.name || '').toUpperCase().includes('LOYER')) {
            const oldAmt = c.amount;
            const newAmt = c.isPercentage
              ? Math.round((targetSummary.loyer.monthlyAverage / netSalary) * 100 * 10) / 10
              : targetSummary.loyer.monthlyAverage;
            logBudgetChange({
              categoryName: c.name,
              pillar: 'Charges Fixes',
              actionLabel: 'Ajustement Réel Bancaire',
              actionType: 'APPLY_REAL',
              previousAmount: oldAmt,
              newAmount: newAmt,
              effectiveDeltaEuro: targetSummary.loyer.monthlyAverage - getEffectiveAmount(c),
              note: `Ajustement auto basé sur flux réels (${targetSummary.periodLabel})`,
            });
            return { ...c, amount: newAmt };
          }
          return c;
        })
      );
    }

    // 4. Abonnements
    if (targetSummary.abonnement.monthlyAverage > 0) {
      setFixedCategories((prev) =>
        prev.map((c) => {
          if ((c?.name || '').toUpperCase().includes('ABONNEMENT')) {
            const oldAmt = c.amount;
            const newAmt = c.isPercentage
              ? Math.round((targetSummary.abonnement.monthlyAverage / netSalary) * 100 * 10) / 10
              : targetSummary.abonnement.monthlyAverage;
            logBudgetChange({
              categoryName: c.name,
              pillar: 'Charges Fixes',
              actionLabel: 'Ajustement Réel Bancaire',
              actionType: 'APPLY_REAL',
              previousAmount: oldAmt,
              newAmount: newAmt,
              effectiveDeltaEuro: targetSummary.abonnement.monthlyAverage - getEffectiveAmount(c),
              note: `Ajustement auto basé sur flux réels (${targetSummary.periodLabel})`,
            });
            return { ...c, amount: newAmt };
          }
          return c;
        })
      );
    }

    // 5. Soutien
    if (targetSummary.soutien.monthlyAverage > 0) {
      setFixedCategories((prev) =>
        prev.map((c) => {
          if ((c?.name || '').toUpperCase().includes('SOUTIEN')) {
            const oldAmt = c.amount;
            const newAmt = c.isPercentage
              ? Math.round((targetSummary.soutien.monthlyAverage / netSalary) * 100 * 10) / 10
              : targetSummary.soutien.monthlyAverage;
            logBudgetChange({
              categoryName: c.name,
              pillar: 'Charges Fixes',
              actionLabel: 'Ajustement Réel Bancaire',
              actionType: 'APPLY_REAL',
              previousAmount: oldAmt,
              newAmount: newAmt,
              effectiveDeltaEuro: targetSummary.soutien.monthlyAverage - getEffectiveAmount(c),
              note: `Ajustement auto basé sur flux réels (${targetSummary.periodLabel})`,
            });
            return { ...c, amount: newAmt };
          }
          return c;
        })
      );
    }

    // 6. Revolut
    if (targetSummary.revolut.monthlyAverage > 0) {
      setDailyCategories((prev) =>
        prev.map((c) => {
          if ((c?.name || '').toUpperCase().includes('REVOLUT')) {
            const oldAmt = c.amount;
            const newAmt = c.isPercentage
              ? Math.round((targetSummary.revolut.monthlyAverage / netSalary) * 100 * 10) / 10
              : targetSummary.revolut.monthlyAverage;
            logBudgetChange({
              categoryName: c.name,
              pillar: 'Dépenses Quotidiennes',
              actionLabel: 'Ajustement Réel Bancaire',
              actionType: 'APPLY_REAL',
              previousAmount: oldAmt,
              newAmount: newAmt,
              effectiveDeltaEuro: targetSummary.revolut.monthlyAverage - getEffectiveAmount(c),
              note: `Ajustement auto basé sur flux réels (${targetSummary.periodLabel})`,
            });
            return { ...c, amount: newAmt };
          }
          return c;
        })
      );
    }

    onShowToast?.(`Les 7 flux bancaires réels ont été appliqués aux règles de répartition.`, 'success');
  };

  // Reset to initial rules
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

  // Clear all rules (start from scratch)
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

  // Single flow adjust
  const handleAdjustSingleFlow = (flow: TargetFlowCategory) => {
    const applyToCatList = (
      list: RuleCategoryItem[],
      setList: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>,
      filterKey: string,
      pillar: string
    ) => {
      let matched = false;
      setList((prev) =>
        prev.map((c) => {
          if ((c?.name || '').toUpperCase().includes(filterKey.toUpperCase())) {
            matched = true;
            const oldAmt = c.amount;
            const newAmt = c.isPercentage
              ? Math.round((flow.monthlyAverage / (netSalary || 1)) * 100 * 10) / 10
              : flow.monthlyAverage;
            logBudgetChange({
              categoryName: c.name,
              pillar,
              actionLabel: `Ajustement ${flow.label}`,
              actionType: 'APPLY_REAL',
              previousAmount: oldAmt,
              newAmount: newAmt,
              effectiveDeltaEuro: flow.monthlyAverage - getEffectiveAmount(c),
              note: `Ajustement auto basé sur flux réel ${flow.label} (${targetSummary.periodLabel})`,
            });
            return { ...c, amount: newAmt };
          }
          return c;
        })
      );
      return matched;
    };

    if (flow.key === 'pea') {
      applyToCatList(savingsCategories, setSavingsCategories, 'PEA', 'Épargne');
    } else if (flow.key === 'livret_a') {
      applyToCatList(savingsCategories, setSavingsCategories, 'LIVRET', 'Épargne');
    } else if (flow.key === 'loyer') {
      applyToCatList(fixedCategories, setFixedCategories, 'LOYER', 'Charges Fixes');
    } else if (flow.key === 'abonnement') {
      applyToCatList(fixedCategories, setFixedCategories, 'ABONNEMENT', 'Charges Fixes');
    } else if (flow.key === 'tontine') {
      applyToCatList(fixedCategories, setFixedCategories, 'TONTINE', 'Charges Fixes');
    } else if (flow.key === 'soutien') {
      applyToCatList(fixedCategories, setFixedCategories, 'SOUTIEN', 'Charges Fixes');
    } else if (flow.key === 'revolut') {
      applyToCatList(dailyCategories, setDailyCategories, 'REVOLUT', 'Dépenses Quotidiennes');
    }

    onShowToast?.(`La règle ${flow.label} a été alignée sur la réalité bancaire (${flow.monthlyAverage.toFixed(2)} €/m).`, 'success');
  };

  // Rollback audit log
  const handleRollbackAudit = (entry: BudgetAuditLogEntry) => {
    if (entry.previousAmount === undefined || entry.previousAmount === null) return;

    const restoreInList = (list: RuleCategoryItem[], setList: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>) => {
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

  const handleApplyFlowWizardSelection = (
    approvedCandidates: Array<{
      candidate: DetectedFlowCandidate;
      amount: number;
      isPercentage: boolean;
    }>,
    approvedTempExpenses: TemporaryExpenseItem[]
  ) => {
    // 1. Process candidate updates
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
            // New category
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

    // 2. Process approved temporary expenses
    if (approvedTempExpenses.length > 0) {
      setTemporaryExpenses((prev) => {
        const next = [...prev];
        for (const temp of approvedTempExpenses) {
          const existsIdx = next.findIndex((e) => e.id === temp.id || (e?.label || '').toUpperCase() === (temp?.label || '').toUpperCase());
          if (existsIdx >= 0) {
            next[existsIdx] = temp;
          } else {
            next.push(temp);
          }
        }
        return next;
      });
    }

    onShowToast?.('✅ Règles budgétaires mises à jour avec succès depuis vos flux bancaires validés !', 'success');
  };

  // 7 Rows Config mapping
  const targetRows = useMemo(() => {
    const findCat = (key: string, list?: RuleCategoryItem[]) => {
      if (!Array.isArray(list)) return undefined;
      return list.find((c) => (c?.name || '').toUpperCase().includes(key.toUpperCase()));
    };

    const currentPea = findCat('PEA', savingsCategories);
    const currentLivretA = findCat('LIVRET', savingsCategories);
    const currentLoyer = findCat('LOYER', fixedCategories);
    const currentAbo = findCat('ABONNEMENT', fixedCategories);
    const currentTontine = findCat('TONTINE', fixedCategories);
    const currentSoutien = findCat('SOUTIEN', fixedCategories);
    const currentRevolut = findCat('REVOLUT', dailyCategories);

    return [
      {
        key: 'pea',
        title: 'Cible PEA',
        subtitle: 'Flux mensuel versé vers PEA (virement débité, non le solde)',
        flow: targetSummary.pea,
        currentRule: currentPea,
        color: '#06b6d4',
        icon: '📈',
        isPercent: currentPea?.isPercentage ?? true,
        isVirementEpargne: true,
      },
      {
        key: 'livret_a',
        title: 'Livret A',
        subtitle: 'Flux mensuel versé vers Livret A (virement débité, non le solde)',
        flow: targetSummary.livretA,
        currentRule: currentLivretA,
        color: '#3b82f6',
        icon: '🛡️',
        isPercent: currentLivretA?.isPercentage ?? true,
        isVirementEpargne: true,
      },
      {
        key: 'loyer',
        title: 'Loyer & Logement',
        subtitle: 'CDC Habitat & charges logement',
        flow: targetSummary.loyer,
        currentRule: currentLoyer,
        color: '#f43f5e',
        icon: '🏠',
        isPercent: currentLoyer?.isPercentage ?? false,
      },
      {
        key: 'abonnement',
        title: 'Abonnements',
        subtitle: 'Bouygues, Spotify, Netflix, EDF...',
        flow: targetSummary.abonnement,
        currentRule: currentAbo,
        color: '#f43f5e',
        icon: '📱',
        isPercent: currentAbo?.isPercentage ?? false,
      },
      {
        key: 'tontine',
        title: 'Tontine',
        subtitle: 'Épargne solidaire collective',
        flow: targetSummary.tontine,
        currentRule: currentTontine,
        color: '#8b5cf6',
        icon: '👥',
        isPercent: currentTontine?.isPercentage ?? false,
      },
      {
        key: 'soutien',
        title: 'Soutien familial (Wave)',
        subtitle: 'Sendwave / Transferts famille',
        flow: targetSummary.soutien,
        currentRule: currentSoutien,
        color: '#f43f5e',
        icon: '❤️',
        isPercent: currentSoutien?.isPercentage ?? false,
      },
      {
        key: 'revolut',
        title: 'Revolut (Reste à vivre)',
        subtitle: 'Recharges et virements vers Revolut',
        flow: targetSummary.revolut,
        currentRule: currentRevolut,
        color: '#06b6d4',
        icon: '💳',
        isPercent: currentRevolut?.isPercentage ?? true,
      },
    ];
  }, [targetSummary, savingsCategories, fixedCategories, dailyCategories]);

  // Arbitrage Simulation State
  const [arbitragePeaAmount, setArbitragePeaAmount] = useState<number>(() => {
    const c = savingsCategories.find((s) => (s?.name || '').toUpperCase().includes('PEA'));
    return c ? (c.isPercentage ? (netSalary * c.amount) / 100 : c.amount) : 950;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 🟣 NOTICE HEADER BANNER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          padding: '14px 18px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.16) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              padding: 8,
              borderRadius: 10,
              background: 'rgba(139, 92, 246, 0.2)',
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            💡
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#f8fafc' }}>
              Règles dynamiques (% & Nominal €) basées sur votre revenu net de{' '}
              <strong style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>
                {netSalary.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </strong>
            </div>
            <div style={{ fontSize: 11.5, color: '#cbd5e1', marginTop: 2 }}>
              Chaque règle recalcule immédiatement vos équivalences en euros et votre reste à vivre.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveModal('AUDIT_HISTORY')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: 10,
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#e2e8f0',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <span>📜 Audit</span>
          {auditLogs.length > 0 && (
            <span
              style={{
                padding: '2px 7px',
                borderRadius: 999,
                background: 'rgba(6, 182, 212, 0.2)',
                color: 'var(--accent-cyan)',
                fontSize: 10.5,
                fontWeight: 800,
              }}
            >
              {auditLogs.length}
            </span>
          )}
        </button>
      </div>

      {/* 🎯 SECTION 1: FLUX RÉELS BANCAIRES VS CIBLES DE RÉPARTITION (7 CIBLES CLÉS) */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(11, 19, 43, 0.95) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          padding: 20,
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: 'var(--accent-cyan)',
                fontSize: 20,
                lineHeight: 1,
              }}
            >
              📊
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.2px' }}>
                  Flux Réels Bancaires vs Cibles de Répartition
                </h3>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: 'rgba(6, 182, 212, 0.2)',
                    border: '1px solid rgba(6, 182, 212, 0.4)',
                    color: 'var(--accent-cyan)',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                  }}
                >
                  7 CIBLES CLÉS
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                Rapprochement automatique de vos flux réels sur BoursoBank (PEA, Livret A, Loyer, Abonnements, Tontine, Wave, Revolut) pour que vos règles reflètent la réalité constatée.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Chips & Master Action Buttons Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Period Filter Chips */}
          <div
            style={{
              display: 'flex',
              padding: 3,
              borderRadius: 10,
              background: 'rgba(10, 14, 23, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              gap: 2,
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedTargetPeriodDays(30)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                background: selectedTargetPeriodDays === 30 ? 'var(--accent-cyan)' : 'transparent',
                color: selectedTargetPeriodDays === 30 ? '#0a0e17' : '#94a3b8',
                fontWeight: selectedTargetPeriodDays === 30 ? 800 : 600,
                fontSize: 11.5,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Dernier mois (30j)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTargetPeriodDays(90)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                background: selectedTargetPeriodDays === 90 ? 'var(--accent-cyan)' : 'transparent',
                color: selectedTargetPeriodDays === 90 ? '#0a0e17' : '#94a3b8',
                fontWeight: selectedTargetPeriodDays === 90 ? 800 : 600,
                fontSize: 11.5,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Moyenne 3 mois (90j)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTargetPeriodDays(0)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                background: selectedTargetPeriodDays === 0 ? 'var(--accent-cyan)' : 'transparent',
                color: selectedTargetPeriodDays === 0 ? '#0a0e17' : '#94a3b8',
                fontWeight: selectedTargetPeriodDays === 0 ? 800 : 600,
                fontSize: 11.5,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Tout
            </button>
          </div>

          {/* Master Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <a
              href="/api/integrations/truelayer/auth-url?view=revenue&open_wizard=true"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 10,
                background: 'rgba(99, 102, 241, 0.18)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#818cf8',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="Se connecter ou se reconnecter à BoursoBank via DSP2"
            >
              <span>🏦</span> Connecter BoursoBank
            </a>

            <button
              type="button"
              onClick={() => setIsFlowWizardOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                border: 'none',
                color: '#082f49',
                fontSize: 12,
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              <span>🪄</span> Analyser &amp; Valider les Flux (Radar)
            </button>

            <button
              type="button"
              onClick={handleResetInitial}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 10,
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="Restaurer les ratios de référence recommandés (50% charges / 30% quotidien / 20% épargne)"
            >
              <span>🔄</span> Ratios Référence (50/30/20)
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('GLOBAL_RESET')}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                fontSize: 12,
                cursor: 'pointer',
              }}
              title="Options & Réinitialisation"
            >
              ⋮
            </button>
          </div>
        </div>

        {/* Info Banner Summary */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(10, 14, 23, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0' }}>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>ℹ️</span>
            <span>
              Total flux réels identifiés ({targetSummary.periodLabel}) :{' '}
              <strong style={{ color: '#ffffff', fontWeight: 800 }}>{targetSummary.totalOutflows.toFixed(2)} € / mois</strong>
            </span>
          </div>
          <div style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>
            {netSalary > 0 ? ((targetSummary.totalOutflows / netSalary) * 100).toFixed(1) : '0.0'}% du salaire net ({netSalary.toFixed(2)} €)
          </div>
        </div>

        {/* 7 Target Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {targetRows.map((row) => {
            const currentEffectiveEuro = row.currentRule ? getEffectiveAmount(row.currentRule) : 0;
            const realEuroMonthly = row.flow.monthlyAverage;
            const deltaEuro = realEuroMonthly - currentEffectiveEuro;
            const isAligned = Math.abs(deltaEuro) < 1.0;

            return (
              <div
                key={row.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(10, 14, 23, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  transition: 'border 0.2s',
                }}
              >
                {/* Icon & Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200, flex: 1 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: `${row.color}22`,
                      color: row.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {row.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{row.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.subtitle}</div>
                  </div>
                </div>

                {/* Column Règle Actuelle */}
                <div style={{ textAlign: 'right', minWidth: 110 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.4px' }}>
                    Règle Actuelle
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginTop: 2 }}>
                    {row.currentRule ? (
                      row.currentRule.isPercentage ? (
                        `${row.currentRule.amount.toFixed(1)}% (${currentEffectiveEuro.toFixed(0)} €)`
                      ) : (
                        `${row.currentRule.amount.toFixed(2)} €`
                      )
                    ) : (
                      <span style={{ color: '#64748b', fontStyle: 'italic' }}>Non configuré</span>
                    )}
                  </div>
                </div>

                {/* Column Réel Bancaire */}
                <div style={{ textAlign: 'right', minWidth: 110 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-cyan)', letterSpacing: '0.4px' }}>
                    Réel Bancaire
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
                    {realEuroMonthly > 0 ? (
                      row.isPercent && netSalary > 0 ? (
                        `${((realEuroMonthly / netSalary) * 100).toFixed(1)}% (${realEuroMonthly.toFixed(0)} €)`
                      ) : (
                        `${realEuroMonthly.toFixed(2)} €`
                      )
                    ) : (
                      <span style={{ color: '#64748b' }}>0.00 €</span>
                    )}
                  </div>
                </div>

                {/* Delta Badge */}
                <div style={{ minWidth: 120, textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 800,
                      background: isAligned ? 'rgba(16, 185, 129, 0.18)' : deltaEuro > 0 ? 'rgba(245, 158, 11, 0.18)' : 'rgba(59, 130, 246, 0.18)',
                      color: isAligned ? 'var(--accent-emerald)' : deltaEuro > 0 ? 'var(--accent-amber)' : '#60a5fa',
                      border: isAligned ? '1px solid rgba(16, 185, 129, 0.35)' : deltaEuro > 0 ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(59, 130, 246, 0.35)',
                    }}
                    title={isAligned ? 'Écart inférieur à 1 €' : deltaEuro > 0 ? 'Le montant réel constaté est supérieur à votre règle' : 'Le montant réel constaté est inférieur à votre règle'}
                  >
                    {isAligned ? '✓ Aligné (< 1 €)' : `${deltaEuro > 0 ? '+' : ''}${deltaEuro.toFixed(1)} € (${deltaEuro > 0 ? 'Réel > Règle' : 'Réel < Règle'})`}
                  </span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFlowModalCat(row.flow);
                      setActiveModal('FLOW_TRANSACTIONS');
                    }}
                    style={{
                      padding: '5px 9px',
                      borderRadius: 8,
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#cbd5e1',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {row.flow.transactions.length} tx
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdjustSingleFlow(row.flow)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 8,
                      background: 'rgba(6, 182, 212, 0.18)',
                      border: '1px solid rgba(6, 182, 212, 0.4)',
                      color: 'var(--accent-cyan)',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Ajuster
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 📈 SECTION 2: HORIZON PRÉVISIONNEL & SIMULATION */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid var(--border-subtle)',
          padding: 18,
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--accent-cyan)', fontSize: 16 }}>📈</span>
            <strong style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#cbd5e1' }}>
              HORIZON PRÉVISIONNEL & SIMULATION
            </strong>
          </div>
          <button
            type="button"
            onClick={() => setActiveModal('FORECAST_MATRIX')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              color: 'var(--accent-cyan)',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <span>📊</span> Matrice 6 Mois
          </button>
        </div>

        {/* 6 Month Horizon Selector Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
          {[0, 1, 2, 3, 4, 5].map((offset) => {
            const d = getDateForOffset(offset);
            const p = getPeriodForOffset(offset);
            const mShort = monthsShortFr[d.getMonth()];
            const isSelected = selectedForecastOffset === offset;

            const extraTemp = temporaryExpenses
              .filter((e) => isExpenseActiveForPeriod(e, p))
              .reduce((sum, e) => sum + e.monthlyAmount, 0);

            return (
              <button
                key={offset}
                type="button"
                onClick={() => setSelectedForecastOffset(offset)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  textAlign: 'left',
                  border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'rgba(10, 14, 23, 0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: isSelected ? 'var(--accent-cyan)' : '#f8fafc' }}>
                    {offset === 0 ? `${mShort} (En cours)` : `${mShort} (M+${offset})`}
                  </span>
                  {offset === 0 && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-emerald)', display: 'inline-block' }} />
                  )}
                </div>

                <div style={{ marginTop: 4 }}>
                  {extraTemp > 0 ? (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'rgba(244, 63, 94, 0.2)',
                        color: 'var(--accent-rose)',
                        fontSize: 9.5,
                        fontWeight: 800,
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                      }}
                    >
                      +{extraTemp.toFixed(0)} € échéances
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>Socle standard</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ⚖️ SECTION 3: DUAL HERO CARDS (RESTE À VIVRE THÉORIQUE & SOLDE BANCAIRE RÉEL) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Left Hero: Reste à Vivre Théorique / Modèle 50/30/20 */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1px solid var(--border-subtle)',
            padding: 20,
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
              {selectedForecastOffset === 0
                ? 'RESTE À VIVRE THÉORIQUE — MODÈLE MENSUEL'
                : `RESTE À VIVRE PRÉVISIONNEL — ${selectedMonthLong.toUpperCase()} ${selectedDate.getFullYear()}`}
            </span>
            <span
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: 'var(--accent-emerald)',
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              Modèle 50/30/20
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: resteAVivre < 0 ? 'var(--accent-rose)' : '#ffffff', letterSpacing: '-0.5px' }}>
              {resteAVivre.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </span>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(10, 14, 23, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                fontSize: 11.5,
                fontWeight: 700,
              }}
            >
              {netSalary > 0 ? ((resteAVivre / netSalary) * 100).toFixed(1) : 0} % du net récurrent
            </span>
          </div>

          <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Marge mensuelle non allouée issue de votre salaire net ({netSalary.toFixed(2)} €), après déduction des charges fixes ({totalFixed.toFixed(2)} €), de l&apos;épargne ({totalSavings.toFixed(2)} €) et du quotidien ({totalDaily.toFixed(2)} €).
          </p>

          {/* Segmented Multi-Color Progress Bar */}
          <div
            style={{
              height: 10,
              borderRadius: 999,
              background: 'rgba(10, 14, 23, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            {netSalary > 0 && (
              <>
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, (totalFixed / netSalary) * 100))}%`,
                    background: '#f43f5e',
                    transition: 'width 0.3s',
                  }}
                  title={`Charges Fixes: ${totalFixed.toFixed(2)} €`}
                />
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, (totalSavings / netSalary) * 100))}%`,
                    background: '#3b82f6',
                    transition: 'width 0.3s',
                  }}
                  title={`Épargne & PEA: ${totalSavings.toFixed(2)} €`}
                />
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, (totalDaily / netSalary) * 100))}%`,
                    background: '#f59e0b',
                    transition: 'width 0.3s',
                  }}
                  title={`Quotidien: ${totalDaily.toFixed(2)} €`}
                />
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, (Math.max(0, resteAVivre) / netSalary) * 100))}%`,
                    background: '#10b981',
                    transition: 'width 0.3s',
                  }}
                  title={`Reste à vivre: ${Math.max(0, resteAVivre).toFixed(2)} €`}
                />
              </>
            )}
          </div>

          {/* Progress Bar Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e' }} />
              Charges: {totalFixed.toFixed(0)}€
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
              Épargne: {totalSavings.toFixed(0)}€
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
              Quotidien: {totalDaily.toFixed(0)}€
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--accent-emerald)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
              Reste: {Math.max(0, resteAVivre).toFixed(0)}€
            </span>
          </div>
        </div>

        {/* Right Hero: Solde Bancaire Réel & Live BoursoBank */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: accountBalance < 0 ? '1px solid rgba(244, 63, 94, 0.5)' : '1px solid rgba(16, 185, 129, 0.4)',
            padding: 20,
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Découvert Warning Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 800,
                  background: accountBalance < 0 ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: accountBalance < 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                  border: accountBalance < 0 ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                <span>{accountBalance < 0 ? '⚠️' : '🛡️'}</span>
                {accountBalance < 0 ? 'Découvert bancaire actuel' : 'Trésorerie sécurisée'}
              </span>

              <span
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--accent-emerald)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                NEGEM RICHARD • Live
              </span>
            </div>

            <div>
              <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
                SOLDE BANCAIRE RÉEL
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span
                  style={{
                    fontSize: 30,
                    fontWeight: 900,
                    color: accountBalance < 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {accountBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </span>

                <button
                  type="button"
                  onClick={() => setActiveModal('EDIT_BUFFER_MULT')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'rgba(6, 182, 212, 0.12)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    color: 'var(--accent-cyan)',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ⚙️ Seuil cible : {bufferMultiplier.toFixed(1)}x ({seuilSecurite.toFixed(0)} €)
                </button>
              </div>
            </div>

            {/* Deficit Callout & Arbitrage Button */}
            {accountBalance < 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  fontSize: 11,
                }}
              >
                <span style={{ color: '#cbd5e1', lineHeight: 1.4 }}>
                  ⚡ Découvert de {Math.abs(accountBalance).toFixed(2)} € : Vous pouvez moduler l&apos;épargne PEA pour résorber ce découvert.
                </span>
                <button
                  type="button"
                  onClick={() => setActiveModal('ARBITRAGE')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: 'var(--accent-cyan)',
                    border: 'none',
                    color: '#0a0e17',
                    fontWeight: 900,
                    fontSize: 11.5,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  Arbitrer
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons: Corriger & Synchro Directe */}
          <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              type="button"
              onClick={() => setActiveModal('EDIT_BALANCE')}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 10,
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e2e8f0',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              ✏️ Corriger
            </button>

            <button
              type="button"
              onClick={async () => {
                if (onSyncBank) {
                  onShowToast?.('Synchronisation bancaire en cours...', 'success');
                  await onSyncBank();
                  onShowToast?.('Solde et transactions synchronisés !', 'success');
                } else {
                  onShowToast?.('Synchronisation bancaire locale effectuée.', 'success');
                }
              }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 10,
                background: 'rgba(6, 182, 212, 0.18)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                color: 'var(--accent-cyan)',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              🔄 Synchro Directe
            </button>
          </div>
        </div>
      </div>

      {/* 📅 SECTION 4: DÉPENSES ÉCHÉANCÉES & TEMPORAIRES */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid var(--border-subtle)',
          padding: 18,
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--accent-cyan)', fontSize: 18 }}>📅</span>
            <strong style={{ fontSize: 13.5, color: '#ffffff' }}>Dépenses Échéancées & Temporaires</strong>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingTempExpense(null);
              setActiveModal('ADD_TEMP_EXPENSE');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 10,
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#93c5fd',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <span>+</span> Déclarer un Échéancier
          </button>
        </div>

        {temporaryExpenses.length === 0 ? (
          <div style={{ padding: 14, textAlign: 'center', borderRadius: 10, background: 'rgba(10, 14, 23, 0.5)', color: '#64748b', fontSize: 12 }}>
            Aucune dépense temporaire déclarée.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {temporaryExpenses.map((exp) => {
              const isActiveOnSelected = isExpenseActiveForPeriod(exp, selectedPeriod);
              const endP = computeEndPeriod(exp.startPeriod, exp.durationMonths);

              return (
                <div
                  key={exp.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: isActiveOnSelected ? 'rgba(10, 14, 23, 0.85)' : 'rgba(10, 14, 23, 0.4)',
                    border: isActiveOnSelected ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 13, color: '#ffffff' }}>{exp.label}</strong>
                      <span
                        style={{
                          padding: '2px 7px',
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 800,
                          background: isActiveOnSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                          color: isActiveOnSelected ? 'var(--accent-emerald)' : '#94a3b8',
                          border: isActiveOnSelected ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        {isActiveOnSelected ? `Actif sur ${selectedPeriod}` : `Inactif sur ${selectedPeriod}`}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Début {exp.startPeriod} • Durée : {exp.durationMonths} mois (Fin {endP})
                    </div>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-rose)' }}>
                    -{exp.monthlyAmount.toFixed(2)} €/mois
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTempExpense(exp);
                        setActiveModal('EDIT_TEMP_EXPENSE');
                      }}
                      style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14 }}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTemporaryExpenses((prev) => prev.filter((e) => e.id !== exp.id));
                        onShowToast?.(`Échéancier "${exp.label}" supprimé.`, 'error');
                      }}
                      style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14 }}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🏛️ SECTION 5: LES 3 PILIERS DE BUDGET (ÉPARGNE, CHARGES FIXES, QUOTIDIEN) */}

      {/* PILIER 1: ALLOCATION MENSUELLE D'ÉPARGNE */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
          <strong style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8' }}>
            ALLOCATION MENSUELLE D&apos;ÉPARGNE
          </strong>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.18)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              color: '#93c5fd',
              fontSize: 11.5,
              fontWeight: 800,
            }}
          >
            Total : {totalSavings.toFixed(2)} € • {netSalary > 0 ? ((totalSavings / netSalary) * 100).toFixed(1) : 0}%
          </span>
        </div>

        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1px solid var(--border-subtle)',
            padding: 12,
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {savingsCategories.map((item) => {
            const effAmt = getEffectiveAmount(item);
            const effPct = getEffectivePercent(item);

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(10, 14, 23, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200, flex: 1 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: `${item.iconBgColor || '#06b6d4'}22`,
                      color: item.iconBgColor || '#06b6d4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {renderCategoryIcon(item.iconType, '📈')}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <strong style={{ fontSize: 13, color: '#ffffff' }}>{item.name}</strong>
                      <button
                        type="button"
                        onClick={() => {
                          setSavingsCategories((prev) =>
                            prev.map((c) => {
                              if (c.id === item.id) {
                                return {
                                  ...c,
                                  isPercentage: !c.isPercentage,
                                  amount: !c.isPercentage ? effPct : effAmt,
                                };
                              }
                              return c;
                            })
                          );
                        }}
                        style={{
                          padding: '2px 7px',
                          borderRadius: 6,
                          background: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid rgba(6, 182, 212, 0.4)',
                          color: 'var(--accent-cyan)',
                          fontSize: 10,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {item.isPercentage ? '% Ratio ⇄' : '€ Fixe ⇄'}
                      </button>
                    </div>
                    {item.note && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.note}</div>}
                  </div>
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>
                  {item.isPercentage ? `= ${effAmt.toFixed(2)} €` : `= ${effPct.toFixed(1)} %`}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => openCategoryEditor(item, 'SAVINGS')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 10,
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(6, 182, 212, 0.45)',
                      color: 'var(--accent-cyan)',
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {item.isPercentage ? `${item.amount.toFixed(1)} % ✏️` : `${item.amount.toFixed(0)} € ✏️`}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSavingsCategories((prev) => prev.filter((c) => c.id !== item.id));
                      onShowToast?.(`Catégorie "${item.name}" supprimée.`, 'error');
                    }}
                    style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => openCategoryEditor(null, 'SAVINGS')}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 12,
              border: '1px dashed rgba(6, 182, 212, 0.35)',
              background: 'transparent',
              color: 'var(--accent-cyan)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            ⊕ Ajouter une catégorie d&apos;épargne
          </button>
        </div>
      </div>

      {/* PILIER 2: CHARGES FIXES INCOMPRESSIBLES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
          <strong style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8' }}>
            CHARGES FIXES INCOMPRESSIBLES
          </strong>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              background: 'rgba(244, 63, 94, 0.18)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              color: 'var(--accent-rose)',
              fontSize: 11.5,
              fontWeight: 800,
            }}
          >
            Total : {totalFixed.toFixed(2)} € • {netSalary > 0 ? ((totalFixed / netSalary) * 100).toFixed(1) : 0}%
          </span>
        </div>

        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1px solid var(--border-subtle)',
            padding: 12,
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {activeTempMonthlyTotal > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                fontSize: 11.5,
              }}
            >
              <strong style={{ color: 'var(--accent-rose)' }}>
                Échéances actives sur {selectedPeriod} ({activeTempExpensesForSelectedPeriod.length})
              </strong>
              <strong style={{ color: 'var(--accent-rose)' }}>+{activeTempMonthlyTotal.toFixed(2)} €/mois</strong>
            </div>
          )}

          {fixedCategories.map((item) => {
            const effAmt = getEffectiveAmount(item);
            const effPct = getEffectivePercent(item);

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(10, 14, 23, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200, flex: 1 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: `${item.iconBgColor || '#f43f5e'}22`,
                      color: item.iconBgColor || '#f43f5e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {renderCategoryIcon(item.iconType, '🏠')}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <strong style={{ fontSize: 13, color: '#ffffff' }}>{item.name}</strong>
                      <button
                        type="button"
                        onClick={() => {
                          setFixedCategories((prev) =>
                            prev.map((c) => {
                              if (c.id === item.id) {
                                return {
                                  ...c,
                                  isPercentage: !c.isPercentage,
                                  amount: !c.isPercentage ? effPct : effAmt,
                                };
                              }
                              return c;
                            })
                          );
                        }}
                        style={{
                          padding: '2px 7px',
                          borderRadius: 6,
                          background: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid rgba(244, 63, 94, 0.4)',
                          color: 'var(--accent-rose)',
                          fontSize: 10,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {item.isPercentage ? '% Ratio ⇄' : '€ Fixe ⇄'}
                      </button>
                    </div>
                    {item.note && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.note}</div>}
                  </div>
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>
                  {item.isPercentage ? `= ${effAmt.toFixed(2)} €` : `= ${effPct.toFixed(1)} %`}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => openCategoryEditor(item, 'FIXED')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 10,
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(244, 63, 94, 0.45)',
                      color: 'var(--accent-rose)',
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {item.isPercentage ? `${item.amount.toFixed(1)} % ✏️` : `${item.amount.toFixed(0)} € ✏️`}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFixedCategories((prev) => prev.filter((c) => c.id !== item.id));
                      onShowToast?.(`Catégorie "${item.name}" supprimée.`, 'error');
                    }}
                    style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => openCategoryEditor(null, 'FIXED')}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 12,
              border: '1px dashed rgba(244, 63, 94, 0.35)',
              background: 'transparent',
              color: 'var(--accent-rose)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            ⊕ Ajouter une charge fixe
          </button>
        </div>
      </div>

      {/* PILIER 3: DÉPENSES QUOTIDIENNES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
          <strong style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8' }}>
            DÉPENSES QUOTIDIENNES
          </strong>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              background: 'rgba(245, 158, 11, 0.18)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: 'var(--accent-amber)',
              fontSize: 11.5,
              fontWeight: 800,
            }}
          >
            Total : {totalDaily.toFixed(2)} € • {netSalary > 0 ? ((totalDaily / netSalary) * 100).toFixed(1) : 0}%
          </span>
        </div>

        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1px solid var(--border-subtle)',
            padding: 12,
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {dailyCategories.map((item) => {
            const effAmt = getEffectiveAmount(item);
            const effPct = getEffectivePercent(item);

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(10, 14, 23, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200, flex: 1 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: `${item.iconBgColor || '#f59e0b'}22`,
                      color: item.iconBgColor || '#f59e0b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {renderCategoryIcon(item.iconType, '💳')}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <strong style={{ fontSize: 13, color: '#ffffff' }}>{item.name}</strong>
                      <button
                        type="button"
                        onClick={() => {
                          setDailyCategories((prev) =>
                            prev.map((c) => {
                              if (c.id === item.id) {
                                return {
                                  ...c,
                                  isPercentage: !c.isPercentage,
                                  amount: !c.isPercentage ? effPct : effAmt,
                                };
                              }
                              return c;
                            })
                          );
                        }}
                        style={{
                          padding: '2px 7px',
                          borderRadius: 6,
                          background: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid rgba(6, 182, 212, 0.4)',
                          color: 'var(--accent-cyan)',
                          fontSize: 10,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {item.isPercentage ? '% Ratio ⇄' : '€ Fixe ⇄'}
                      </button>
                    </div>
                    {item.note && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.note}</div>}
                  </div>
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>
                  {item.isPercentage ? `= ${effAmt.toFixed(2)} €` : `= ${effPct.toFixed(1)} %`}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => openCategoryEditor(item, 'DAILY')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 10,
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(6, 182, 212, 0.45)',
                      color: 'var(--accent-cyan)',
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {item.isPercentage ? `${item.amount.toFixed(1)} % ✏️` : `${item.amount.toFixed(0)} € ✏️`}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDailyCategories((prev) => prev.filter((c) => c.id !== item.id));
                      onShowToast?.(`Catégorie "${item.name}" supprimée.`, 'error');
                    }}
                    style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => openCategoryEditor(null, 'DAILY')}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 12,
              border: '1px dashed rgba(6, 182, 212, 0.35)',
              background: 'transparent',
              color: 'var(--accent-cyan)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            ⊕ Ajouter un poste de dépense courante
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🔮 MODALS POPUPS                                                          */}
      {/* ========================================================================= */}

      {/* 1. Modal Matrice 6 Mois */}
      {activeModal === 'FORECAST_MATRIX' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 860,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              borderRadius: 20,
              background: '#0f172a',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>📊</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#ffffff' }}>Matrice Prévisionnelle 6 Mois</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ padding: '6px 12px', borderRadius: 8, background: '#1e293b', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Poste Budgétaire</th>
                    {[0, 1, 2, 3, 4, 5].map((off) => {
                      const d = getDateForOffset(off);
                      return (
                        <th key={off} style={{ padding: '10px 12px', textAlign: 'right' }}>
                          {monthsShortFr[d.getMonth()]} {d.getFullYear()}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 800, color: '#ffffff' }}>Salaire Net Récurrent</td>
                    {[0, 1, 2, 3, 4, 5].map((off) => (
                      <td key={off} style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                        {netSalary.toFixed(2)} €
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '10px 12px', color: 'var(--accent-rose)' }}>Charges Fixes Socle</td>
                    {[0, 1, 2, 3, 4, 5].map((off) => (
                      <td key={off} style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--accent-rose)' }}>
                        -{baseFixed.toFixed(2)} €
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '10px 12px', color: 'var(--accent-rose)' }}>Échéances Temporaires</td>
                    {[0, 1, 2, 3, 4, 5].map((off) => {
                      const p = getPeriodForOffset(off);
                      const amt = temporaryExpenses
                        .filter((e) => isExpenseActiveForPeriod(e, p))
                        .reduce((sum, e) => sum + e.monthlyAmount, 0);
                      return (
                        <td key={off} style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--accent-rose)' }}>
                          {amt > 0 ? `-${amt.toFixed(2)} €` : '0.00 €'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '10px 12px', color: '#93c5fd' }}>Épargne & Cible PEA</td>
                    {[0, 1, 2, 3, 4, 5].map((off) => (
                      <td key={off} style={{ padding: '10px 12px', textAlign: 'right', color: '#93c5fd' }}>
                        -{totalSavings.toFixed(2)} €
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '10px 12px', color: 'var(--accent-amber)' }}>Quotidien & Revolut</td>
                    {[0, 1, 2, 3, 4, 5].map((off) => (
                      <td key={off} style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--accent-amber)' }}>
                        -{totalDaily.toFixed(2)} €
                      </td>
                    ))}
                  </tr>
                  <tr style={{ background: 'rgba(10, 14, 23, 0.8)', borderTop: '2px solid rgba(255, 255, 255, 0.15)' }}>
                    <td style={{ padding: '12px', fontWeight: 900, color: '#ffffff' }}>Reste à Vivre Prévisionnel</td>
                    {[0, 1, 2, 3, 4, 5].map((off) => {
                      const p = getPeriodForOffset(off);
                      const tempAmt = temporaryExpenses
                        .filter((e) => isExpenseActiveForPeriod(e, p))
                        .reduce((sum, e) => sum + e.monthlyAmount, 0);
                      const res = netSalary - baseFixed - tempAmt - totalSavings - totalDaily;
                      return (
                        <td
                          key={off}
                          style={{
                            padding: '12px',
                            textAlign: 'right',
                            fontWeight: 900,
                            color: res < 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                          }}
                        >
                          {res.toFixed(2)} €
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Transactions Réelles Détail */}
      {activeModal === 'FLOW_TRANSACTIONS' && selectedFlowModalCat && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 620,
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: 24,
              borderRadius: 20,
              background: '#0f172a',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{selectedFlowModalCat.key === 'pea' ? '📈' : '💳'}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#ffffff' }}>{selectedFlowModalCat.label}</h3>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    {selectedFlowModalCat.transactions.length} transactions • Total : {selectedFlowModalCat.totalAmount.toFixed(2)} € ({selectedFlowModalCat.monthlyAverage.toFixed(2)} €/mois)
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ padding: '6px 12px', borderRadius: 8, background: '#1e293b', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedFlowModalCat.transactions.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: '#64748b' }}>
                  Aucune transaction détectée sur la période.
                </div>
              ) : (
                selectedFlowModalCat.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(10, 14, 23, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      fontSize: 12,
                    }}
                  >
                    <div>
                      <strong style={{ color: '#ffffff' }}>{cleanFrenchMerchantName(tx.title)}</strong>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                        {tx.date} • {tx.title}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-rose)' }}>
                      -{Math.abs(tx.amount).toFixed(2)} €
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Arbitrage Anti-Découvert */}
      {activeModal === 'ARBITRAGE' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 500,
              padding: 24,
              borderRadius: 20,
              background: '#0f172a',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>⚡</span>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#ffffff' }}>Arbitrage Anti-Découvert Proactif</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ padding: '6px 12px', borderRadius: 8, background: '#1e293b', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                fontSize: 12,
              }}
            >
              <strong style={{ color: 'var(--accent-rose)' }}>Déficit constaté : {accountBalance.toFixed(2)} €</strong>
              <p style={{ margin: '4px 0 0 0', color: '#cbd5e1', lineHeight: 1.4 }}>
                Vous pouvez moduler temporairement votre allocation PEA pour absorber ce découvert sans impacter vos charges incompressibles.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Allocation PEA Simulée
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="range"
                  min="0"
                  max="1500"
                  step="50"
                  value={arbitragePeaAmount}
                  onChange={(e) => setArbitragePeaAmount(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--accent-cyan)' }}
                />
                <strong style={{ fontSize: 14, fontWeight: 900, color: 'var(--accent-cyan)', minWidth: 70, textAlign: 'right' }}>
                  {arbitragePeaAmount.toFixed(0)} €
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ padding: '8px 14px', borderRadius: 10, background: '#1e293b', border: 'none', color: '#cbd5e1', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setSavingsCategories((prev) =>
                    prev.map((c) => {
                      if ((c?.name || '').toUpperCase().includes('PEA')) {
                        return {
                          ...c,
                          isPercentage: false,
                          amount: arbitragePeaAmount,
                        };
                      }
                      return c;
                    })
                  );
                  logBudgetChange({
                    categoryName: 'Cible PEA',
                    pillar: 'Épargne',
                    actionLabel: 'Arbitrage Anti-Découvert',
                    actionType: 'ARBITRAGE',
                    newAmount: arbitragePeaAmount,
                    effectiveDeltaEuro: arbitragePeaAmount - 950,
                    note: 'Ajustement proactif pour absorption du découvert',
                  });
                  setActiveModal(null);
                  onShowToast?.(`PEA ajusté à ${arbitragePeaAmount} € pour résorber le découvert.`, 'success');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: 'var(--accent-cyan)',
                  border: 'none',
                  color: '#0a0e17',
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                Appliquer l&apos;arbitrage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal Journal d'Audit */}
      {activeModal === 'AUDIT_HISTORY' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 620,
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: 24,
              borderRadius: 20,
              background: '#0f172a',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>📜</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#ffffff' }}>Journal d&apos;Audit Budgétaire</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ padding: '6px 12px', borderRadius: 8, background: '#1e293b', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {auditLogs.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#64748b' }}>
                  Aucun historique de modification pour le moment.
                </div>
              ) : (
                auditLogs.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      background: 'rgba(10, 14, 23, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      fontSize: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#ffffff' }}>{entry.categoryName}</strong>
                      <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                        {new Date(entry.timestamp).toLocaleString('fr-FR')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                      <span>{entry.actionLabel} ({entry.pillar})</span>
                      {entry.effectiveDeltaEuro !== 0 && (
                        <strong style={{ color: entry.effectiveDeltaEuro >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                          {entry.effectiveDeltaEuro >= 0 ? '+' : ''}{entry.effectiveDeltaEuro.toFixed(2)} €
                        </strong>
                      )}
                    </div>

                    {entry.note && <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>{entry.note}</div>}

                    {entry.previousAmount !== undefined && entry.previousAmount !== null && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => handleRollbackAudit(entry)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: 'rgba(6, 182, 212, 0.15)',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            color: 'var(--accent-cyan)',
                            fontSize: 10.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          ↩ Rétablir valeur précédente
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Modifier Solde Bancaire Réel */}
      {activeModal === 'EDIT_BALANCE' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 380,
              padding: 24,
              borderRadius: 20,
              background: '#0f172a',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#ffffff' }}>Solde Réel Compte Courant</h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
              Indiquez le solde réel de votre compte bancaire pour calibrer le tampon de sécurité :
            </p>
            <input
              type="number"
              step="0.01"
              defaultValue={accountBalance}
              id="input-account-balance"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(10, 14, 23, 0.95)',
                border: '1px solid rgba(6, 182, 212, 0.5)',
                color: 'var(--accent-emerald)',
                fontSize: 18,
                fontWeight: 800,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ padding: '8px 14px', borderRadius: 10, background: '#1e293b', border: 'none', color: '#cbd5e1', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat((document.getElementById('input-account-balance') as HTMLInputElement).value);
                  if (!isNaN(val)) {
                    setAccountBalance(val);
                    onShowToast?.(`Solde mis à jour : ${val.toFixed(2)} €`, 'success');
                  }
                  setActiveModal(null);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: 'var(--accent-emerald)',
                  border: 'none',
                  color: '#042f2e',
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Multiplicateur Seuil Sécurité */}
      {activeModal === 'EDIT_BUFFER_MULT' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 380,
              padding: 24,
              borderRadius: 20,
              background: '#0f172a',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#ffffff' }}>Seuil de Sécurité Bancaire</h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
              Multiplicateur des charges fixes incompressibles à conserver en permanence (ex: 1.0x = 1 mois complet) :
            </p>
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="6.0"
              defaultValue={bufferMultiplier}
              id="input-buffer-multiplier"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(10, 14, 23, 0.95)',
                border: '1px solid rgba(6, 182, 212, 0.5)',
                color: 'var(--accent-cyan)',
                fontSize: 18,
                fontWeight: 800,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ padding: '8px 14px', borderRadius: 10, background: '#1e293b', border: 'none', color: '#cbd5e1', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat((document.getElementById('input-buffer-multiplier') as HTMLInputElement).value);
                  if (!isNaN(val)) {
                    setBufferMultiplier(val);
                    onShowToast?.(`Multiplicateur mis à jour : ${val.toFixed(1)}x`, 'success');
                  }
                  setActiveModal(null);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: 'var(--accent-cyan)',
                  border: 'none',
                  color: '#0a0e17',
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Ajouter / Modifier Dépense Échéancée */}
      {(activeModal === 'ADD_TEMP_EXPENSE' || activeModal === 'EDIT_TEMP_EXPENSE') && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 440,
              padding: 24,
              borderRadius: 20,
              background: '#0f172a',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#ffffff' }}>
              {activeModal === 'EDIT_TEMP_EXPENSE' ? 'Modifier l\'Échéancier' : 'Déclarer un Échéancier Temporaire'}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
              Dépense étalée à durée déterminée (ex: soins dentaires, prêt personnel, achat N fois) :
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>Intitulé</label>
                <input
                  type="text"
                  id="input-temp-label"
                  defaultValue={editingTempExpense?.label || 'Dentiste Couronne'}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(10, 14, 23, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontWeight: 700,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>Montant Mensuel (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="input-temp-amount"
                    defaultValue={editingTempExpense?.monthlyAmount || 164.5}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(10, 14, 23, 0.95)',
                      border: '1px solid rgba(244, 63, 94, 0.4)',
                      color: 'var(--accent-rose)',
                      fontWeight: 800,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>Durée (Mois)</label>
                  <input
                    type="number"
                    id="input-temp-duration"
                    defaultValue={editingTempExpense?.durationMonths || 12}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(10, 14, 23, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontWeight: 700,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>Mois Début (AAAA-MM)</label>
                <input
                  type="text"
                  id="input-temp-start"
                  defaultValue={editingTempExpense?.startPeriod || selectedPeriod}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(10, 14, 23, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontWeight: 700,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ padding: '8px 14px', borderRadius: 10, background: '#1e293b', border: 'none', color: '#cbd5e1', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  const label = (document.getElementById('input-temp-label') as HTMLInputElement).value;
                  const amt = parseFloat((document.getElementById('input-temp-amount') as HTMLInputElement).value) || 0;
                  const dur = parseInt((document.getElementById('input-temp-duration') as HTMLInputElement).value, 10) || 12;
                  const start = (document.getElementById('input-temp-start') as HTMLInputElement).value || selectedPeriod;

                  if (activeModal === 'EDIT_TEMP_EXPENSE' && editingTempExpense) {
                    setTemporaryExpenses((prev) =>
                      prev.map((e) => (e.id === editingTempExpense.id ? { ...e, label, monthlyAmount: amt, durationMonths: dur, startPeriod: start } : e))
                    );
                    onShowToast?.(`Échéancier "${label}" mis à jour.`, 'success');
                  } else {
                    const newExp: TemporaryExpenseItem = {
                      id: `temp-${Date.now()}`,
                      label,
                      monthlyAmount: amt,
                      durationMonths: dur,
                      startPeriod: start,
                    };
                    setTemporaryExpenses((prev) => [...prev, newExp]);
                    onShowToast?.(`Échéancier "${label}" ajouté.`, 'success');
                  }
                  setActiveModal(null);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: 'var(--accent-cyan)',
                  border: 'none',
                  color: '#0a0e17',
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal Éditer / Créer Catégorie Complète (Icônes, Couleurs, Piliers, % / €) */}
      {activeModal === 'EDIT_CATEGORY' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(16px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              borderRadius: 22,
              background: 'linear-gradient(135deg, #0b132b 0%, #0f172a 100%)',
              border: `1px solid ${editingCatColor}66`,
              boxShadow: `0 24px 64px rgba(0, 0, 0, 0.7), 0 0 32px ${editingCatColor}22`,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: `${editingCatColor}25`,
                    color: editingCatColor,
                    border: `1px solid ${editingCatColor}55`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  {editingCatIcon}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
                    {editingCategory?.name ? `Éditer "${editingCategory.name}"` : 'Nouvelle Catégorie'}
                  </h3>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    Personnalisez le pilier, le mode de calcul, l&apos;icône et la couleur
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: 8,
                  width: 30,
                  height: 30,
                  color: '#cbd5e1',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* 1. Sélecteur de Pilier */}
            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, fontSize: 11.5, marginBottom: 6 }}>
                PILIER BUDGÉTAIRE
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {[
                  { key: 'FIXED', label: 'Charges Fixes', sub: 'Incompressibles', color: '#f43f5e' },
                  { key: 'SAVINGS', label: 'Épargne & Inv.', sub: 'PEA, Livret A', color: '#06b6d4' },
                  { key: 'DAILY', label: 'Quotidien', sub: 'Revolut / Loisirs', color: '#f59e0b' },
                ].map((p) => {
                  const isPillarActive = editingCatPillar === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setEditingCatPillar(p.key as any)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: isPillarActive ? `${p.color}22` : 'rgba(10, 14, 23, 0.8)',
                        border: isPillarActive ? `1.5px solid ${p.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isPillarActive ? '#ffffff' : '#94a3b8',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 11.5, fontWeight: 800 }}>{p.label}</div>
                      <div style={{ fontSize: 9.5, opacity: 0.75 }}>{p.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Nom & Note */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, fontSize: 11.5, marginBottom: 4 }}>
                  Nom de la catégorie
                </label>
                <input
                  type="text"
                  value={editingCatName}
                  onChange={(e) => setEditingCatName(e.target.value)}
                  placeholder="ex: Loyer CDC Habitat, Abonnement Bouygues..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 10,
                    background: 'rgba(10, 14, 23, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, fontSize: 11.5, marginBottom: 4 }}>
                  Note / Sous-postes (optionnel)
                </label>
                <input
                  type="text"
                  value={editingCatNote}
                  onChange={(e) => setEditingCatNote(e.target.value)}
                  placeholder="ex: Spotify + Netflix + Freebox..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: 'rgba(10, 14, 23, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#cbd5e1',
                    fontSize: 12,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* 3. Mode de Calcul & Montant */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 11.5 }}>
                  TYPE DE VALEUR & MONTANT
                </label>
                <div style={{ display: 'flex', borderRadius: 8, background: 'rgba(10, 14, 23, 0.9)', padding: 2, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <button
                    type="button"
                    onClick={() => setEditingCatIsPercentage(false)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: !editingCatIsPercentage ? 'var(--accent-cyan)' : 'transparent',
                      color: !editingCatIsPercentage ? '#0a0e17' : '#94a3b8',
                      fontWeight: 800,
                      fontSize: 11,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    € Fixe
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCatIsPercentage(true)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: editingCatIsPercentage ? 'var(--accent-cyan)' : 'transparent',
                      color: editingCatIsPercentage ? '#0a0e17' : '#94a3b8',
                      fontWeight: 800,
                      fontSize: 11,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    % Ratio
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="number"
                  step={editingCatIsPercentage ? '0.1' : '1'}
                  value={editingCatAmount}
                  onChange={(e) => setEditingCatAmount(parseFloat(e.target.value) || 0)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(10, 14, 23, 0.95)',
                    border: '1px solid rgba(6, 182, 212, 0.5)',
                    color: 'var(--accent-cyan)',
                    fontSize: 18,
                    fontWeight: 900,
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', minWidth: 30 }}>
                  {editingCatIsPercentage ? '%' : '€'}
                </span>
              </div>

              {/* Live projection */}
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  fontSize: 11.5,
                  color: 'var(--accent-cyan)',
                  fontWeight: 700,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Impact mensuel effectif :</span>
                <strong>
                  {editingCatIsPercentage
                    ? `${((netSalary * editingCatAmount) / 100).toFixed(2)} € / mois`
                    : `${editingCatAmount.toFixed(2)} € / mois (${netSalary > 0 ? ((editingCatAmount / netSalary) * 100).toFixed(1) : 0}% du salaire)`}
                </strong>
              </div>
            </div>

            {/* 4. Sélecteur d'Icône (18 icônes) */}
            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, fontSize: 11.5, marginBottom: 6 }}>
                ICÔNE VISUELLE
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 6 }}>
                {AVAILABLE_ICONS.map((ico) => {
                  const isSelected = editingCatIcon === ico;
                  return (
                    <button
                      key={ico}
                      type="button"
                      onClick={() => setEditingCatIcon(ico)}
                      style={{
                        height: 36,
                        borderRadius: 8,
                        background: isSelected ? `${editingCatColor}33` : 'rgba(10, 14, 23, 0.8)',
                        border: isSelected ? `2px solid ${editingCatColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                        fontSize: 17,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {ico}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Sélecteur de Couleur (8 couleurs) */}
            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, fontSize: 11.5, marginBottom: 6 }}>
                COULEUR DU THÈME
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
                {AVAILABLE_COLORS.map((col) => {
                  const isSelected = editingCatColor === col;
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setEditingCatColor(col)}
                      style={{
                        height: 28,
                        borderRadius: 8,
                        background: col,
                        border: isSelected ? '2px solid #ffffff' : 'none',
                        boxShadow: isSelected ? `0 0 10px ${col}` : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      {isSelected ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 10,
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {editingCategory && (
                <button
                  type="button"
                  onClick={() => {
                    if (editingCategoryPillar === 'SAVINGS') setSavingsCategories((prev) => prev.filter((c) => c.id !== editingCategory.id));
                    else if (editingCategoryPillar === 'FIXED') setFixedCategories((prev) => prev.filter((c) => c.id !== editingCategory.id));
                    else setDailyCategories((prev) => prev.filter((c) => c.id !== editingCategory.id));

                    onShowToast?.(`Catégorie "${editingCategory.name || 'Nouvelle'}" supprimée.`, 'error');
                    setActiveModal(null);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.4)',
                    color: 'var(--accent-rose)',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🗑️ Supprimer
                </button>
              )}

              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    color: '#cbd5e1',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const finalName = editingCatName.trim() || 'Sans titre';
                    const updated: RuleCategoryItem = {
                      id: editingCategory?.id || `cat-${Date.now()}`,
                      name: finalName,
                      note: editingCatNote.trim() || undefined,
                      amount: editingCatAmount,
                      isPercentage: editingCatIsPercentage,
                      isLocked: editingCategory?.isLocked || false,
                      categoryType: editingCatPillar,
                      iconType: editingCatIcon,
                      iconBgColor: editingCatColor,
                    };

                    // Remove from previous lists in case pillar changed
                    setSavingsCategories((prev) => prev.filter((c) => c.id !== updated.id));
                    setFixedCategories((prev) => prev.filter((c) => c.id !== updated.id));
                    setDailyCategories((prev) => prev.filter((c) => c.id !== updated.id));

                    // Add to target pillar list
                    if (editingCatPillar === 'SAVINGS') {
                      setSavingsCategories((prev) => [...prev, updated]);
                    } else if (editingCatPillar === 'FIXED') {
                      setFixedCategories((prev) => [...prev, updated]);
                    } else {
                      setDailyCategories((prev) => [...prev, updated]);
                    }

                    logBudgetChange({
                      categoryName: finalName,
                      pillar: editingCatPillar,
                      actionLabel: editingCategory ? 'Modification Catégorie' : 'Création Catégorie',
                      actionType: 'EDIT_CAT',
                      newAmount: editingCatAmount,
                      newIsPercentage: editingCatIsPercentage,
                      effectiveDeltaEuro: 0,
                      note: `Icône: ${editingCatIcon}, Couleur: ${editingCatColor}`,
                    });

                    onShowToast?.(`Catégorie "${finalName}" enregistrée avec succès.`, 'success');
                    setActiveModal(null);
                  }}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                    border: 'none',
                    color: '#0a0e17',
                    fontSize: 12.5,
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Modal Reset Options */}
      {activeModal === 'GLOBAL_RESET' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 380,
              padding: 24,
              borderRadius: 20,
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#ffffff' }}>Options & Réinitialisation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  handleResetInitial();
                  setActiveModal(null);
                }}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: 'rgba(10, 14, 23, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--accent-cyan)',
                  fontWeight: 700,
                  fontSize: 12,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                🔄 Restaurer les règles initiales
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClearAllRules();
                  setActiveModal(null);
                }}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: 'rgba(10, 14, 23, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--accent-rose)',
                  fontWeight: 700,
                  fontSize: 12,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                🗑️ Tout effacer (Partir de zéro)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuditLogs([]);
                  setActiveModal(null);
                  onShowToast?.('Journal d\'audit vidé.', 'success');
                }}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: 'rgba(10, 14, 23, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: 12,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                📜 Vider le journal d&apos;audit
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ padding: '8px 14px', borderRadius: 10, background: '#1e293b', border: 'none', color: '#cbd5e1', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Radar & Validation des Flux Bancaires (Wizard Modal) */}
      <AuraBankFlowWizardModal
        isOpen={isFlowWizardOpen}
        onClose={() => setIsFlowWizardOpen(false)}
        netSalary={netSalary}
        bankTransactions={bankTransactions}
        currentSavings={savingsCategories}
        currentFixed={fixedCategories}
        currentDaily={dailyCategories}
        currentTempExpenses={temporaryExpenses}
        onApplySelection={handleApplyFlowWizardSelection}
      />
    </div>
  );
};

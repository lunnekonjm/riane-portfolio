'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { SalaryRecord, RevenueConfig, ReserveAllocation } from '@/types/revenue';
import type { PortfolioConfig } from '@/types/portfolio';
import { useBoursoLive } from '@/hooks/useBoursoLive';
import {
  getCachedTrueLayerTransactions,
  fetchAndCacheTrueLayerTransactions,
  type RawBankTransaction,
} from '@/services/bankReconciliationEngine';

export type AuraActiveTab =
  | 'DASHBOARD'
  | 'RULES'
  | 'SALARY_AUDIT'
  | 'SAVINGS_FUNNEL'
  | 'CRISIS'
  | 'BANK_RECONCILIATION';

function currentPeriod(): { period: string; label: string } {
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const label = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return { period, label: label.charAt(0).toUpperCase() + label.slice(1) };
}

export interface UseRevenueBudgetStateParams {
  records: SalaryRecord[];
  portfolioConfig: PortfolioConfig | null;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  autoOpenWizard?: boolean;
}

export function useRevenueBudgetState({
  records,
  portfolioConfig,
  onShowToast,
  autoOpenWizard = false,
}: UseRevenueBudgetStateParams) {
  const [activeTab, setActiveTab] = useState<AuraActiveTab>(() => {
    if (autoOpenWizard) return 'RULES';
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('open_wizard') === 'true' || sp.get('truelayer_status') === 'success') {
        return 'RULES';
      }
    }
    return 'DASHBOARD';
  });

  useEffect(() => {
    if (autoOpenWizard) {
      setActiveTab('RULES');
    } else if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('open_wizard') === 'true' || sp.get('truelayer_status') === 'success') {
        setActiveTab('RULES');
      }
    }
  }, [autoOpenWizard]);

  const [allBankTransactions, setAllBankTransactions] = useState<RawBankTransaction[]>([]);
  const [isSyncingTrueLayer, setIsSyncingTrueLayer] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => currentPeriod().period);

  const boursoLive = useBoursoLive();
  const targetMonthlyBudget = portfolioConfig?.monthlyBudget || 400;

  const cleanRecords = useMemo(() => {
    return records.filter((r) => !r.id?.startsWith('sal-sample-') && !r.id?.includes('sample'));
  }, [records]);

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const activeRecord = useMemo(() => {
    if (selectedRecordId) {
      const found = cleanRecords.find((r) => r.id === selectedRecordId);
      if (found) return found;
    }
    return cleanRecords[0] || null;
  }, [cleanRecords, selectedRecordId]);

  const netSalary = activeRecord?.netSalary ?? 2713.74;

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(currentPeriod().period);
    for (const r of cleanRecords) {
      if (r.period) months.add(r.period);
    }
    for (const tx of allBankTransactions) {
      if (tx.date && tx.date.length >= 7) {
        months.add(tx.date.slice(0, 7));
      }
    }
    return Array.from(months).sort().reverse();
  }, [cleanRecords, allBankTransactions]);

  useEffect(() => {
    const cached = getCachedTrueLayerTransactions();
    if (cached && cached.transactions.length > 0) {
      setAllBankTransactions(cached.transactions);
    }
  }, []);

  const handleSyncBoursoBank = useCallback(async () => {
    setIsSyncingTrueLayer(true);
    try {
      const result = await fetchAndCacheTrueLayerTransactions();
      setAllBankTransactions(result.transactions);
      if (result.requiresReauth) {
        setNeedsReauth(true);
        onShowToast('Session BoursoBank expirée. Veuillez vous reconnecter.', 'error');
      } else {
        setNeedsReauth(false);
        onShowToast(`🏦 ${result.transactions.length} transactions synchronisées depuis BoursoBank !`, 'success');
      }
    } catch (err: any) {
      if (err.message === 'TRUE_LAYER_REAUTH_REQUIRED') {
        setNeedsReauth(true);
        onShowToast('Session BoursoBank expirée. Veuillez vous reconnecter.', 'error');
      } else {
        onShowToast(`Erreur lors de la synchronisation : ${err.message}`, 'error');
      }
    } finally {
      setIsSyncingTrueLayer(false);
    }
  }, [onShowToast]);

  const handleClearCache = useCallback(() => {
    try {
      localStorage.removeItem('truelayer_transactions_cache_v2');
      localStorage.removeItem('truelayer_raw_transactions');
    } catch {
      // ignore
    }
    setAllBankTransactions([]);
    onShowToast('Cache des transactions bancaires vidé.', 'success');
  }, [onShowToast]);

  const emergencySavings = boursoLive.livretAEUR > 0 ? boursoLive.livretAEUR : 1600;

  return {
    activeTab,
    setActiveTab,
    cleanRecords,
    activeRecord,
    setSelectedRecordId,
    netSalary,
    allBankTransactions,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    isSyncingTrueLayer,
    needsReauth,
    handleSyncBoursoBank,
    handleClearCache,
    emergencySavings,
    targetMonthlyBudget,
  };
}

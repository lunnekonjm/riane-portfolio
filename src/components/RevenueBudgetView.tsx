'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  SalaryRecord,
  RevenueConfig,
  ReserveAllocation,
  ExtraCashEntry,
} from '@/types/revenue';
import type { PortfolioConfig } from '@/types/portfolio';
import { useBoursoLive } from '@/hooks/useBoursoLive';
import {
  getCachedTrueLayerTransactions,
  fetchAndCacheTrueLayerTransactions,
  type RawBankTransaction,
} from '@/services/bankReconciliationEngine';
import { AuraDashboardView } from '@/components/aura/AuraDashboardView';
import { AuraRulesView } from '@/components/aura/AuraRulesView';
import { AuraSalaryAuditView } from '@/components/aura/AuraSalaryAuditView';
import { AuraSavingsFunnelView } from '@/components/aura/AuraSavingsFunnelView';
import { AuraCrisisView } from '@/components/aura/AuraCrisisView';
import { AuraBankReconciliationView } from '@/components/aura/AuraBankReconciliationView';

import { ErrorBoundary } from '@/components/ErrorBoundary';

export type AuraActiveTab =
  | 'DASHBOARD'
  | 'RULES'
  | 'SALARY_AUDIT'
  | 'SAVINGS_FUNNEL'
  | 'CRISIS'
  | 'BANK_RECONCILIATION';

interface RevenueBudgetViewProps {
  records: SalaryRecord[];
  revenueConfig: RevenueConfig;
  allocations: ReserveAllocation[];
  extraCashEntries?: ExtraCashEntry[];
  portfolioConfig: PortfolioConfig | null;
  onSaveRecord: (record: SalaryRecord) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  onSaveRevenueConfig: (config: RevenueConfig) => Promise<void>;
  onSaveAllocation: (allocation: ReserveAllocation) => Promise<void>;
  onDeleteAllocation: (id: string) => Promise<void>;
  onSaveExtraCashEntry?: (entry: ExtraCashEntry) => Promise<void>;
  onDeleteExtraCashEntry?: (id: string) => Promise<void>;
  onOpenRebalancerWithBudget?: (budget: number) => void;
  onSyncMonthlyBudget: (amount: number) => Promise<void>;
  onOpenIntegrationsHub?: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  autoOpenWizard?: boolean;
}

function currentPeriod(): { period: string; label: string } {
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const label = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return { period, label: label.charAt(0).toUpperCase() + label.slice(1) };
}

export default function RevenueBudgetView({
  records,
  revenueConfig,
  allocations = [],
  portfolioConfig,
  onSaveRecord,
  onDeleteRecord,
  onOpenRebalancerWithBudget,
  onSyncMonthlyBudget,
  onOpenIntegrationsHub,
  onShowToast,
  autoOpenWizard = false,
}: RevenueBudgetViewProps) {
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

  // Real transactions from TrueLayer cache
  const [allBankTransactions, setAllBankTransactions] = useState<RawBankTransaction[]>([]);
  const [isSyncingTrueLayer, setIsSyncingTrueLayer] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);

  // Active month for bank reconciliation
  const [selectedMonth, setSelectedMonth] = useState<string>(() => currentPeriod().period);

  const boursoLive = useBoursoLive();
  const targetMonthlyBudget = portfolioConfig?.monthlyBudget || 400;

  const cleanRecords = useMemo(() => {
    return records.filter((r) => !r.id?.startsWith('sal-sample-') && !r.id?.includes('sample'));
  }, [records]);

  // Selected baseline payslip
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

  // Load cached bank transactions
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 🧭 NAVIGATION SUPÉRIEURE DE LA SUITE AURA BUDGET PRO */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.98) 0%, rgba(10, 14, 25, 0.98) 100%)',
          borderRadius: 16,
          padding: 8,
          border: '1px solid rgba(6, 182, 212, 0.3)',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('DASHBOARD')}
          style={{
            flex: 1,
            minWidth: 140,
            padding: '10px 14px',
            fontSize: 12.5,
            fontWeight: activeTab === 'DASHBOARD' ? 800 : 600,
            borderRadius: 10,
            border: activeTab === 'DASHBOARD' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
            background: activeTab === 'DASHBOARD' ? 'rgba(6, 182, 212, 0.18)' : 'transparent',
            color: activeTab === 'DASHBOARD' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}
        >
          <span>📊 Dashboard &amp; Donut</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('RULES')}
          style={{
            flex: 1,
            minWidth: 150,
            padding: '10px 14px',
            fontSize: 12.5,
            fontWeight: activeTab === 'RULES' ? 800 : 600,
            borderRadius: 10,
            border: activeTab === 'RULES' ? '1px solid var(--accent-rose)' : '1px solid transparent',
            background: activeTab === 'RULES' ? 'rgba(244, 63, 94, 0.18)' : 'transparent',
            color: activeTab === 'RULES' ? 'var(--accent-rose)' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}
        >
          <span>⚖️ Règles &amp; M+5</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SALARY_AUDIT')}
          style={{
            flex: 1,
            minWidth: 150,
            padding: '10px 14px',
            fontSize: 12.5,
            fontWeight: activeTab === 'SALARY_AUDIT' ? 800 : 600,
            borderRadius: 10,
            border: activeTab === 'SALARY_AUDIT' ? '1px solid #818cf8' : '1px solid transparent',
            background: activeTab === 'SALARY_AUDIT' ? 'rgba(129, 140, 248, 0.18)' : 'transparent',
            color: activeTab === 'SALARY_AUDIT' ? '#818cf8' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}
        >
          <span>💼 Fiches &amp; Caviardage</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SAVINGS_FUNNEL')}
          style={{
            flex: 1,
            minWidth: 150,
            padding: '10px 14px',
            fontSize: 12.5,
            fontWeight: activeTab === 'SAVINGS_FUNNEL' ? 800 : 600,
            borderRadius: 10,
            border: activeTab === 'SAVINGS_FUNNEL' ? '1px solid var(--accent-emerald)' : '1px solid transparent',
            background: activeTab === 'SAVINGS_FUNNEL' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
            color: activeTab === 'SAVINGS_FUNNEL' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}
        >
          <span>🎯 Entonnoir d'Épargne</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CRISIS')}
          style={{
            flex: 1,
            minWidth: 150,
            padding: '10px 14px',
            fontSize: 12.5,
            fontWeight: activeTab === 'CRISIS' ? 800 : 600,
            borderRadius: 10,
            border: activeTab === 'CRISIS' ? '1px solid var(--accent-amber)' : '1px solid transparent',
            background: activeTab === 'CRISIS' ? 'rgba(245, 158, 11, 0.18)' : 'transparent',
            color: activeTab === 'CRISIS' ? 'var(--accent-amber)' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}
        >
          <span>🛡️ Crise &amp; CLIC</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BANK_RECONCILIATION')}
          style={{
            flex: 1,
            minWidth: 150,
            padding: '10px 14px',
            fontSize: 12.5,
            fontWeight: activeTab === 'BANK_RECONCILIATION' ? 800 : 600,
            borderRadius: 10,
            border: activeTab === 'BANK_RECONCILIATION' ? '1px solid #6366f1' : '1px solid transparent',
            background: activeTab === 'BANK_RECONCILIATION' ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
            color: activeTab === 'BANK_RECONCILIATION' ? '#818cf8' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}
        >
          <span>🏦 Banque BoursoBank</span>
        </button>
      </div>

      {/* --- ONGLET 1 : DASHBOARD AURA PRO --- */}
      {activeTab === 'DASHBOARD' && (
        <ErrorBoundary fallbackTitle="Erreur dans le tableau de bord Aura">
          <AuraDashboardView
            records={cleanRecords}
            activeRecord={activeRecord}
            onSelectRecord={(rec) => setSelectedRecordId(rec.id)}
            onOpenSalaryAudit={() => setActiveTab('SALARY_AUDIT')}
            onOpenRules={() => setActiveTab('RULES')}
            onOpenIntegrationsHub={onOpenIntegrationsHub}
          />
        </ErrorBoundary>
      )}

      {/* --- ONGLET 2 : RÈGLES BUDGÉTAIRES --- */}
      {activeTab === 'RULES' && (
        <ErrorBoundary fallbackTitle="Erreur dans les Règles & M+5">
          <AuraRulesView
            netSalary={netSalary}
            autoOpenWizard={autoOpenWizard}
            onShowToast={onShowToast}
            onSyncBank={handleSyncBoursoBank}
          />
        </ErrorBoundary>
      )}

      {/* --- ONGLET 3 : AUDIT SALARIAL & CAVIARDAGE RGPD --- */}
      {activeTab === 'SALARY_AUDIT' && (
        <ErrorBoundary fallbackTitle="Erreur dans l'Audit Salarial">
          <AuraSalaryAuditView
            records={cleanRecords}
            allocations={allocations}
            onSaveRecord={onSaveRecord}
            onDeleteRecord={onDeleteRecord}
            onShowToast={onShowToast}
          />
        </ErrorBoundary>
      )}

      {/* --- ONGLET 4 : ENTONNOIR D'ÉPARGNE --- */}
      {activeTab === 'SAVINGS_FUNNEL' && (
        <ErrorBoundary fallbackTitle="Erreur dans l'Entonnoir d'Épargne">
          <AuraSavingsFunnelView
            netSalary={netSalary}
            onShowToast={onShowToast}
          />
        </ErrorBoundary>
      )}

      {/* --- ONGLET 5 : SIMULATEURS CRISE & CLIC --- */}
      {activeTab === 'CRISIS' && (
        <ErrorBoundary fallbackTitle="Erreur dans le Simulateur de Crise">
          <AuraCrisisView
            emergencySavings={emergencySavings}
            vitalExpenses={1150}
            netIncome={netSalary}
            onShowToast={onShowToast}
          />
        </ErrorBoundary>
      )}

      {/* --- ONGLET 6 : RAPPROCHEMENT BANCAIRE --- */}
      {activeTab === 'BANK_RECONCILIATION' && (
        <ErrorBoundary fallbackTitle="Erreur dans le Rapprochement Bancaire">
          <AuraBankReconciliationView
            records={cleanRecords}
            allBankTransactions={allBankTransactions}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            availableMonths={availableMonths}
            isSyncingTrueLayer={isSyncingTrueLayer}
            needsReauth={needsReauth}
            onSyncBoursoBank={handleSyncBoursoBank}
            onClearCache={handleClearCache}
            onSaveRecord={onSaveRecord}
            onDeleteRecord={onDeleteRecord}
            onOpenIntegrationsHub={onOpenIntegrationsHub}
            onOpenRebalancerWithBudget={onOpenRebalancerWithBudget}
            onShowToast={onShowToast}
            targetMonthlyBudget={targetMonthlyBudget}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}

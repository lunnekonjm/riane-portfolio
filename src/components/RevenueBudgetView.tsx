'use client';

import React from 'react';
import type {
  SalaryRecord,
  RevenueConfig,
  ReserveAllocation,
  ExtraCashEntry,
} from '@/types/revenue';
import type { PortfolioConfig } from '@/types/portfolio';
import { useRevenueBudgetState, type AuraActiveTab } from '@/hooks/useRevenueBudgetState';
import { AuraTabsNavBar } from '@/components/aura/AuraTabsNavBar';
import { AuraDashboardView } from '@/components/aura/AuraDashboardView';
import { AuraRulesView } from '@/components/aura/AuraRulesView';
import { AuraSalaryAuditView } from '@/components/aura/AuraSalaryAuditView';
import { AuraSavingsFunnelView } from '@/components/aura/AuraSavingsFunnelView';
import { AuraCrisisView } from '@/components/aura/AuraCrisisView';
import { AuraBankReconciliationView } from '@/components/aura/AuraBankReconciliationView';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export type { AuraActiveTab };

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

export default function RevenueBudgetView({
  records,
  allocations = [],
  portfolioConfig,
  onSaveRecord,
  onDeleteRecord,
  onOpenRebalancerWithBudget,
  onOpenIntegrationsHub,
  onShowToast,
  autoOpenWizard = false,
}: RevenueBudgetViewProps) {
  const {
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
  } = useRevenueBudgetState({
    records,
    portfolioConfig,
    onShowToast,
    autoOpenWizard,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 🧭 NAVIGATION SUPÉRIEURE DE LA SUITE AURA BUDGET PRO */}
      <AuraTabsNavBar activeTab={activeTab} onSelectTab={setActiveTab} />

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

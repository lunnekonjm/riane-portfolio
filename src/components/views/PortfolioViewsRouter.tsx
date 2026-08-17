'use client';

import React from 'react';
import type { PageView } from '@/types/navigation';
import type { Position, PortfolioConfig } from '@/types/portfolio';
import type { StressTestResult } from '@/types/simulation';
import { DashboardViewWrapper, type DashboardViewWrapperProps } from './DashboardViewWrapper';
import RevenueBudgetView from '@/components/RevenueBudgetView';
import EnvelopesTaxView from '@/components/EnvelopesTaxView';
import { AnalysisChatView } from '@/components/AnalysisChatView';
import { ValuationDashboard } from '@/components/valuation/ValuationDashboard';
import RiskAnalysisView from '@/components/RiskAnalysisView';
import { AuditJournalView } from '@/components/AuditJournalView';
import ReportsView from '@/components/ReportsView';

interface PortfolioViewsRouterProps extends Omit<DashboardViewWrapperProps, 'onNavigateView'> {
  currentView: PageView;
  setCurrentView: (view: PageView) => void;
  salaryRecords: any[];
  revenueConfig: any;
  reserveAllocations: any[];
  extraCashEntries: any[];
  config: PortfolioConfig | null;
  saveSalaryRecord: (record: any) => Promise<void>;
  deleteSalaryRecord: (id: string) => Promise<void>;
  saveRevenueConfig: (cfg: any) => Promise<void>;
  saveReserveAllocation: (alloc: any) => Promise<void>;
  deleteReserveAllocation: (id: string) => Promise<void>;
  saveExtraCashEntry: (entry: any) => Promise<void>;
  deleteExtraCashEntry: (id: string) => Promise<void>;
  updateConfig: (cfg: PortfolioConfig) => Promise<void>;
  autoOpenBudgetWizard: boolean;
  investorProfile: any;
  marketVal: number;
  simulatedMarketDrop: number;
  setSimulatedMarketDrop: (drop: number) => void;
  setShowMonteCarloModal: (show: boolean) => void;
  selectedStressResult: StressTestResult | null;
  handleRunStressTest: (sc: any) => void;
  hideProxyAssets: boolean;
  setHideProxyAssets: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveProxyModalAsset: (asset: any) => void;
  envelopeGroups: any;
  history: any[];
  clearResult: () => void;
  handleTestEmail: () => Promise<void>;
}

export function PortfolioViewsRouter({
  currentView,
  setCurrentView,
  salaryRecords,
  revenueConfig,
  reserveAllocations,
  extraCashEntries,
  config,
  saveSalaryRecord,
  deleteSalaryRecord,
  saveRevenueConfig,
  saveReserveAllocation,
  deleteReserveAllocation,
  saveExtraCashEntry,
  deleteExtraCashEntry,
  updateConfig,
  autoOpenBudgetWizard,
  investorProfile,
  marketVal,
  simulatedMarketDrop,
  setSimulatedMarketDrop,
  setShowMonteCarloModal,
  selectedStressResult,
  handleRunStressTest,
  hideProxyAssets,
  setHideProxyAssets,
  setActiveProxyModalAsset,
  envelopeGroups,
  history,
  clearResult,
  handleTestEmail,
  ...dashboardProps
}: PortfolioViewsRouterProps) {
  const {
    user,
    positions,
    fxRates,
    dcaGlobalStartDate,
    adjustInflation,
    inflationRate,
    showToast,
    openGlossary,
    openRebalanceModal,
    setShowIntegrationsModal,
    updatePosition,
  } = dashboardProps;

  return (
    <>
      {/* ═══ DASHBOARD ═══ */}
      {currentView === 'dashboard' && (
        <DashboardViewWrapper
          {...dashboardProps}
          onNavigateView={setCurrentView}
        />
      )}

      {/* ═══ REVENU & BUDGET ═══ */}
      {currentView === 'revenue' && (
        <RevenueBudgetView
          records={salaryRecords}
          revenueConfig={revenueConfig}
          allocations={reserveAllocations}
          extraCashEntries={extraCashEntries}
          portfolioConfig={config}
          onSaveRecord={saveSalaryRecord}
          onDeleteRecord={deleteSalaryRecord}
          onSaveRevenueConfig={saveRevenueConfig}
          onSaveAllocation={saveReserveAllocation}
          onDeleteAllocation={deleteReserveAllocation}
          onSaveExtraCashEntry={saveExtraCashEntry}
          onDeleteExtraCashEntry={deleteExtraCashEntry}
          onOpenRebalancerWithBudget={openRebalanceModal}
          onSyncMonthlyBudget={async (amount: number) => {
            if (!config) return;
            await updateConfig({ ...config, monthlyBudget: amount });
          }}
          onOpenIntegrationsHub={() => setShowIntegrationsModal(true)}
          onShowToast={showToast}
          autoOpenWizard={autoOpenBudgetWizard}
        />
      )}

      {/* ═══ ENVELOPES & FISCALITÉ ═══ */}
      {currentView === 'envelopes' && (() => {
        const startYear = parseInt(dcaGlobalStartDate.slice(0, 4)) || 2024;
        const currentYear = new Date().getFullYear();
        const yearsElapsed = Math.max(0, (currentYear - startYear) + (new Date().getMonth() / 12));
        const cumulativeInflationFactor = adjustInflation ? Math.pow(1 + inflationRate, yearsElapsed) : 1.0;
        return (
          <EnvelopesTaxView
            positions={positions}
            fxRates={fxRates}
            adjustInflation={adjustInflation}
            cumulativeInflationFactor={cumulativeInflationFactor}
            inflationRate={inflationRate}
            yearsElapsed={yearsElapsed}
          />
        );
      })()}

      {/* ═══ ANALYSIS ═══ */}
      {currentView === 'analysis' && (
        <AnalysisChatView
          userUid={user?.uid || ''}
          positions={positions}
          config={config}
          investorProfile={investorProfile}
          updatePosition={updatePosition}
          updateConfig={updateConfig}
          onOpenGlossary={openGlossary}
          showToast={(msg, type) => showToast(msg, type)}
        />
      )}

      {/* ═══ PRIX ≠ VALEUR ═══ */}
      {currentView === 'valuation' && (
        <ValuationDashboard positions={positions} />
      )}

      {/* ═══ RISK ═══ */}
      {currentView === 'risk' && (
        <RiskAnalysisView
          marketVal={marketVal}
          savingsVal={dashboardProps.savingsVal}
          config={config}
          simulatedMarketDrop={simulatedMarketDrop}
          setSimulatedMarketDrop={setSimulatedMarketDrop}
          onOpenMonteCarlo={() => setShowMonteCarloModal(true)}
          selectedStressResult={selectedStressResult}
          onRunStressTest={handleRunStressTest}
          hideProxyAssets={hideProxyAssets}
          setHideProxyAssets={setHideProxyAssets}
          setActiveProxyModalAsset={setActiveProxyModalAsset}
        />
      )}

      {/* ═══ AUDIT ═══ */}
      {currentView === 'audit' && (
        <AuditJournalView
          positions={positions}
          envelopeGroups={envelopeGroups}
          history={history}
          onClearResult={clearResult}
          onNavigateAnalysis={() => setCurrentView('analysis')}
        />
      )}

      {/* ═══ REPORTS & NEWSLETTERS ═══ */}
      {currentView === 'reports' && (
        <ReportsView
          positions={positions}
          config={config}
          fxRates={fxRates}
          adjustInflation={adjustInflation}
          cumulativeInflationFactor={Math.pow(1 + inflationRate, Math.max(0, (new Date().getFullYear() - (parseInt(dcaGlobalStartDate.slice(0, 4)) || 2024)) + (new Date().getMonth() / 12)))}
          inflationRate={inflationRate}
          yearsElapsed={Math.max(0, (new Date().getFullYear() - (parseInt(dcaGlobalStartDate.slice(0, 4)) || 2024)) + (new Date().getMonth() / 12))}
          onShowToast={showToast}
          onTestEmail={handleTestEmail}
          uid={user?.uid}
          userEmail={user?.email}
        />
      )}
    </>
  );
}

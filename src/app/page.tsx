'use client';

import React, { useState } from 'react';
import { isFirebaseConfigured } from '@/services/firebase/config';
import { signOut } from '@/services/firebase/auth';
import { AuthScreen, ConfigNeeded } from '@/components/auth/AuthScreens';
import InvestorOnboarding from '@/components/InvestorOnboarding';
import { SidebarNav } from '@/components/navigation/SidebarNav';
import { TopHeaderBar } from '@/components/navigation/TopHeaderBar';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import BenchmarkWidget from '@/components/BenchmarkWidget';
import { PortfolioViewsRouter } from '@/components/views/PortfolioViewsRouter';
import { PortfolioModalsContainer } from '@/components/modals';
import { GlobalToastWithUndo } from '@/components/common/GlobalToastWithUndo';
import { BenchmarkFab } from '@/components/common/BenchmarkFab';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useRevenue } from '@/hooks/useRevenue';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useBoursoLive } from '@/hooks/useBoursoLive';
import { useHomePageState } from '@/hooks/useHomePageState';
import { useHomePageActions } from '@/hooks/useHomePageActions';
import { clearAnalysisCache } from '@/utils/analysisCache';
import type { AnalysisStatus } from '@/types/analysis';

const PIPELINE_STEPS: Array<{ key: AnalysisStatus; label: string; icon: string }> = [
  { key: 'data-collection', label: 'Données', icon: '📊' },
  { key: 'research', label: 'Recherche', icon: '🔬' },
  { key: 'portfolio-eval', label: 'Portefeuille', icon: '⚖️' },
  { key: 'critique', label: 'Contradicteur', icon: '🛡️' },
  { key: 'synthesis', label: 'Synthèse', icon: '🎯' },
];

export default function HomePage() {
  const {
    positions, config, investorProfile, isOnboardingPending,
    totalValue, totalCost, gainLoss, gainLossPercent,
    bourseVal, bourseCostVal, bourseGain, bourseDCAVal,
    cryptoVal, cryptoCostVal, cryptoGain, cryptoDCAVal,
    marketVal, marketCostVal, marketGain, marketDCAVal,
    savingsVal, savingsCostVal, savingsGain, savingsAnnualInt, savingsDCAVal,
    netLiquidationDetails, peaSeniority, setPeaSeniority,
    monthlyDCATotal, saving, pendingCount, filledPositions, fxRates, lastPricesUpdated, marketStatusLabel,
    canUndo, undoLastAction, canRedo, redoLastAction, transactions, recordTransaction,
    addPosition, updatePosition, removePosition, upsertPositionsBatch, updateConfig, updateInvestorProfile,
    refreshing, refreshPrices, refreshAllPortfolios, refreshMarketPrices, refreshCryptoPrices, refreshSavingsPrices, resetPortfolio,
  } = usePortfolio();

  const {
    records: salaryRecords, revenueConfig, allocations: reserveAllocations,
    extraCashEntries, totalAvailableExtraCash,
    saveRecord: saveSalaryRecord, deleteRecord: deleteSalaryRecord, saveConfig: saveRevenueConfig,
    saveAllocation: saveReserveAllocation, deleteAllocation: deleteReserveAllocation,
    saveExtraCashEntry, deleteExtraCashEntry,
  } = useRevenue();

  const { result, status, statusMessage, isRunning, isFromCache, runAnalysis, history, clearResult } = useAnalysis();
  const boursoLive = useBoursoLive();

  const {
    user,
    authLoading,
    currentView,
    setCurrentView,
    queryInput,
    setQueryInput,
    selectedStressResult,
    setSelectedStressResult,
    editingPosition,
    setEditingPosition,
    showConfigEditor,
    setShowConfigEditor,
    showFlowRebalanceModal,
    setShowFlowRebalanceModal,
    showConfirmExecuteFlowRebalance,
    setShowConfirmExecuteFlowRebalance,
    showProfileModal,
    setShowProfileModal,
    showConfirmSignOut,
    setShowConfirmSignOut,
    showNotificationModal,
    setShowNotificationModal,
    notificationSettings,
    setNotificationSettings,
    readNotificationIds,
    setReadNotificationIds,
    clearedNotificationIds,
    setClearedNotificationIds,
    mockNotifications,
    setMockNotifications,
    activeProxyModalAsset,
    setActiveProxyModalAsset,
    flowRebalanceResult,
    setFlowRebalanceResult,
    activeRebalanceResult,
    setActiveRebalanceResult,
    rebalanceTab,
    setRebalanceTab,
    dcaGlobalStartDate,
    setDcaGlobalStartDate,
    autoOpenBudgetWizard,
    setAutoOpenBudgetWizard,
    adjustInflation,
    setAdjustInflation,
    inflationRate,
    setInflationRate,
    toast,
    setToast,
    showToast,
    refreshingPrices,
    setRefreshingPrices,
    showEmptyThemes,
    setShowEmptyThemes,
    hideProxyAssets,
    setHideProxyAssets,
    showThemeInfoModal,
    setShowThemeInfoModal,
    showGlossaryModal,
    setShowGlossaryModal,
    showMonteCarloModal,
    setShowMonteCarloModal,
    showIntegrationsModal,
    setShowIntegrationsModal,
    showTransactionModal,
    setShowTransactionModal,
    selectedHistoryTicker,
    setSelectedHistoryTicker,
    glossaryInitialTerm,
    openGlossary,
    rebalanceBudgetMode,
    setRebalanceBudgetMode,
    customRebalanceAmount,
    setCustomRebalanceAmount,
    simulatedMarketDrop,
    setSimulatedMarketDrop,
    showEditProfile,
    setShowEditProfile,
    showBenchmark,
    setShowBenchmark,
    showDcaFrequencyDropdown,
    setShowDcaFrequencyDropdown,
    showTotalValueDropdown,
    setShowTotalValueDropdown,
    showTotalCostDropdown,
    setShowTotalCostDropdown,
    showGainLossDropdown,
    setShowGainLossDropdown,
    showNetDetailsModal,
    setShowNetDetailsModal,
    handleRunGlobalDCACalculation,
    handleUpdateDcaStartDate,
    dcaBreakdown,
    notifications,
    unreadNotificationsCount,
    handleTestNotification,
  } = useHomePageState({
    positions,
    fxRates,
    config,
    investorProfile,
    canUndo,
    canRedo,
    saving,
    undoLastAction,
    redoLastAction,
    updatePosition,
    analysisResult: result,
    analysisStatus: status,
    isAnalysisRunning: isRunning,
  });

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const {
    handleTestEmail,
    handleSavePosition,
    handleDeletePosition,
    handleSaveConfig,
    handleRunAnalysis,
    handleDirectAnalysis,
    openRebalanceModal,
    handleRunStressTest,
  } = useHomePageActions({
    user,
    positions,
    filledPositions,
    config,
    fxRates,
    isRunning,
    queryInput,
    setQueryInput,
    setCurrentView,
    setEditingPosition,
    setShowConfigEditor,
    setRebalanceBudgetMode,
    setCustomRebalanceAmount,
    setFlowRebalanceResult,
    setShowFlowRebalanceModal,
    setSelectedStressResult,
    showToast,
    updatePosition,
    addPosition,
    removePosition,
    updateConfig,
    runAnalysis,
  });

  const envelopeGroups = positions.reduce((acc, p) => {
    if (!acc[p.envelope]) acc[p.envelope] = [];
    acc[p.envelope].push(p);
    return acc;
  }, {} as Record<string, typeof positions>);

  if (!isFirebaseConfigured()) return <ConfigNeeded />;
  if (authLoading) return <div className="auth-screen"><div className="loading-spinner" style={{ width: 40, height: 40 }} /></div>;
  if (!user) return <AuthScreen />;

  return (
    <div className="app-layout">
      {/* 🎯 Investor Onboarding Wizard */}
      {(isOnboardingPending || showEditProfile) && (
        <InvestorOnboarding
          existingProfile={investorProfile}
          onComplete={async (profile) => {
            await updateInvestorProfile(profile);
            setShowEditProfile(false);
            showToast('Profil investisseur sauvegardé ✅');
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <SidebarNav
        currentView={currentView}
        onNavigate={setCurrentView}
        user={user}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* Main Content */}
      <main className="main-content">
        <TopHeaderBar
          currentView={currentView}
          unreadNotificationsCount={unreadNotificationsCount}
          onOpenNotifications={() => setShowNotificationModal(true)}
          onOpenGlossary={() => openGlossary()}
          onOpenMonteCarlo={() => setShowMonteCarloModal(true)}
          onOpenIntegrations={() => setShowIntegrationsModal(true)}
          refreshingPrices={refreshingPrices}
          refreshing={refreshing}
          onRefreshAll={async () => {
            setRefreshingPrices(true);
            try {
              const res = await refreshAllPortfolios({ forceOnChain: true });
              showToast(
                `⚡ Actualisation globale réussie : ${res.totalUpdated} actifs mis à jour (${res.marketCount} Bourse, ${res.cryptoCount} Cryptos & On-Chain, ${res.savingsCount} Épargne)`,
                'success'
              );
            } catch {
              showToast('Erreur lors de l\'actualisation globale', 'error');
            } finally {
              setRefreshingPrices(false);
            }
          }}
          adjustInflation={adjustInflation}
          setAdjustInflation={setAdjustInflation}
          isRunning={isRunning}
          analysisStatus={status}
          pipelineSteps={PIPELINE_STEPS}
          user={user}
          onOpenProfile={() => setShowProfileModal(true)}
          onNavigate={setCurrentView}
          isMobileDrawerOpen={isMobileDrawerOpen}
          setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        />

        <div className="page-body">
          <PortfolioViewsRouter
            currentView={currentView}
            setCurrentView={setCurrentView}
            user={user}
            positions={positions}
            filledPositions={filledPositions}
            transactions={transactions}
            fxRates={fxRates}
            totalValue={totalValue}
            totalCost={totalCost}
            bourseVal={bourseVal}
            bourseCostVal={bourseCostVal}
            cryptoVal={cryptoVal}
            cryptoCostVal={cryptoCostVal}
            savingsVal={savingsVal}
            savingsCostVal={savingsCostVal}
            savingsAnnualInt={savingsAnnualInt}
            monthlyDCATotal={monthlyDCATotal}
            bourseDCAVal={bourseDCAVal}
            cryptoDCAVal={cryptoDCAVal}
            savingsDCAVal={savingsDCAVal}
            dcaBreakdown={dcaBreakdown}
            notifications={notifications}
            pendingCount={pendingCount}
            marketStatusLabel={marketStatusLabel}
            lastPricesUpdated={lastPricesUpdated}
            dcaGlobalStartDate={dcaGlobalStartDate}
            handleUpdateDcaStartDate={handleUpdateDcaStartDate}
            adjustInflation={adjustInflation}
            inflationRate={inflationRate}
            peaSeniority={peaSeniority}
            netLiquidationDetails={netLiquidationDetails}
            showTotalValueDropdown={showTotalValueDropdown}
            setShowTotalValueDropdown={setShowTotalValueDropdown}
            showTotalCostDropdown={showTotalCostDropdown}
            setShowTotalCostDropdown={setShowTotalCostDropdown}
            showGainLossDropdown={showGainLossDropdown}
            setShowGainLossDropdown={setShowGainLossDropdown}
            showDcaFrequencyDropdown={showDcaFrequencyDropdown}
            setShowDcaFrequencyDropdown={setShowDcaFrequencyDropdown}
            queryInput={queryInput}
            setQueryInput={setQueryInput}
            isRunning={isRunning}
            handleRunAnalysis={handleRunAnalysis}
            refreshingPrices={refreshingPrices}
            setRefreshingPrices={setRefreshingPrices}
            showToast={showToast}
            openGlossary={openGlossary}
            openRebalanceModal={openRebalanceModal}
            setShowIntegrationsModal={setShowIntegrationsModal}
            setRebalanceBudgetMode={setRebalanceBudgetMode}
            setFlowRebalanceResult={setFlowRebalanceResult}
            setShowFlowRebalanceModal={setShowFlowRebalanceModal}
            setShowNotificationModal={setShowNotificationModal}
            setShowNetDetailsModal={setShowNetDetailsModal}
            setShowConfigEditor={setShowConfigEditor}
            setShowThemeInfoModal={setShowThemeInfoModal}
            setShowTransactionModal={setShowTransactionModal}
            setSelectedHistoryTicker={setSelectedHistoryTicker}
            setEditingPosition={setEditingPosition}
            handleDeletePosition={handleDeletePosition}
            handleSavePosition={handleSavePosition}
            upsertPositionsBatch={upsertPositionsBatch}
            refreshSavingsPrices={refreshSavingsPrices}
            refreshMarketPrices={refreshMarketPrices}
            refreshCryptoPrices={refreshCryptoPrices}
            resetPortfolio={resetPortfolio}
            updatePosition={updatePosition}
            addPosition={addPosition}
            undoLastAction={undoLastAction}
            redoLastAction={redoLastAction}
            canUndo={canUndo}
            canRedo={canRedo}
            saving={saving}
            salaryRecords={salaryRecords}
            revenueConfig={revenueConfig}
            reserveAllocations={reserveAllocations}
            extraCashEntries={extraCashEntries}
            config={config}
            saveSalaryRecord={saveSalaryRecord}
            deleteSalaryRecord={deleteSalaryRecord}
            saveRevenueConfig={saveRevenueConfig}
            saveReserveAllocation={saveReserveAllocation}
            deleteReserveAllocation={deleteReserveAllocation}
            saveExtraCashEntry={saveExtraCashEntry}
            deleteExtraCashEntry={deleteExtraCashEntry}
            updateConfig={updateConfig}
            autoOpenBudgetWizard={autoOpenBudgetWizard}
            investorProfile={investorProfile}
            marketVal={marketVal}
            simulatedMarketDrop={simulatedMarketDrop}
            setSimulatedMarketDrop={setSimulatedMarketDrop}
            setShowMonteCarloModal={setShowMonteCarloModal}
            selectedStressResult={selectedStressResult}
            handleRunStressTest={handleRunStressTest}
            hideProxyAssets={hideProxyAssets}
            setHideProxyAssets={setHideProxyAssets}
            setActiveProxyModalAsset={setActiveProxyModalAsset}
            envelopeGroups={envelopeGroups}
            history={history}
            clearResult={clearResult}
            handleTestEmail={handleTestEmail}
          />
        </div>
      </main>

      {/* ═══ MODALS ═══ */}
      <PortfolioModalsContainer
        editingPosition={editingPosition}
        setEditingPosition={setEditingPosition}
        positions={positions}
        handleSavePosition={handleSavePosition}
        handleDeletePosition={handleDeletePosition}
        showConfigEditor={showConfigEditor}
        setShowConfigEditor={setShowConfigEditor}
        config={config}
        investorProfile={investorProfile}
        handleSaveConfig={handleSaveConfig}
        updateInvestorProfile={updateInvestorProfile}
        handleTestNotification={handleTestNotification}
        handleTestEmail={handleTestEmail}
        showFlowRebalanceModal={showFlowRebalanceModal}
        setShowFlowRebalanceModal={setShowFlowRebalanceModal}
        flowRebalanceResult={flowRebalanceResult}
        setFlowRebalanceResult={setFlowRebalanceResult}
        rebalanceBudgetMode={rebalanceBudgetMode}
        setRebalanceBudgetMode={setRebalanceBudgetMode}
        customRebalanceAmount={customRebalanceAmount}
        setCustomRebalanceAmount={setCustomRebalanceAmount}
        fxRates={fxRates}
        boursoLive={boursoLive}
        totalAvailableExtraCash={totalAvailableExtraCash}
        extraCashEntries={extraCashEntries}
        saveExtraCashEntry={saveExtraCashEntry}
        updatePosition={updatePosition}
        clearAnalysisCache={clearAnalysisCache}
        setReadNotificationIds={setReadNotificationIds}
        setClearedNotificationIds={setClearedNotificationIds}
        notifications={notifications}
        showToast={showToast}
        showProfileModal={showProfileModal}
        setShowProfileModal={setShowProfileModal}
        user={user}
        setShowEditProfile={setShowEditProfile}
        signOut={signOut}
        showNotificationModal={showNotificationModal}
        setShowNotificationModal={setShowNotificationModal}
        notificationSettings={notificationSettings}
        setNotificationSettings={setNotificationSettings}
        handleDirectAnalysis={handleDirectAnalysis}
        setCurrentView={setCurrentView}
        openRebalanceModal={openRebalanceModal}
        activeProxyModalAsset={activeProxyModalAsset}
        setActiveProxyModalAsset={setActiveProxyModalAsset}
        showThemeInfoModal={showThemeInfoModal}
        setShowThemeInfoModal={setShowThemeInfoModal}
        showGlossaryModal={showGlossaryModal}
        setShowGlossaryModal={setShowGlossaryModal}
        glossaryInitialTerm={glossaryInitialTerm}
        showMonteCarloModal={showMonteCarloModal}
        setShowMonteCarloModal={setShowMonteCarloModal}
        totalValue={totalValue}
        monthlyDCATotal={monthlyDCATotal}
        showIntegrationsModal={showIntegrationsModal}
        setShowIntegrationsModal={setShowIntegrationsModal}
        showTransactionModal={showTransactionModal}
        setShowTransactionModal={setShowTransactionModal}
        transactions={transactions}
        selectedHistoryTicker={selectedHistoryTicker}
        showNetDetailsModal={showNetDetailsModal}
        setShowNetDetailsModal={setShowNetDetailsModal}
        netLiquidationDetails={netLiquidationDetails}
        peaSeniority={peaSeniority}
        setPeaSeniority={setPeaSeniority}
      />

      {/* Toast with Undo Action Button */}
      <GlobalToastWithUndo
        toast={toast}
        setToast={setToast}
        canUndo={canUndo}
        undoLastAction={undoLastAction}
      />

      {/* 🧪 Benchmark Étalon Boursobank */}
      <BenchmarkFab
        showBenchmark={showBenchmark}
        onOpen={() => setShowBenchmark(true)}
      />

      {/* 📱 Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenDrawer={() => setIsMobileDrawerOpen(true)}
      />

      <BenchmarkWidget visible={showBenchmark} onClose={() => setShowBenchmark(false)} />
    </div>
  );
}

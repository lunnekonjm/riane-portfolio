'use client';

import React from 'react';
import WelcomeBanner from './WelcomeBanner';
import BoursoLiveBar from './BoursoLiveBar';
import WealthBreakdownCards from './WealthBreakdownCards';
import DcaSimulationBar from './DcaSimulationBar';
import { calculateSmartFlowRebalance } from '@/engines/flowRebalancer';
import { useDashboardCalculations } from '@/hooks/useDashboardCalculations';
import { DashboardHeaderBanners } from './dashboard/DashboardHeaderBanners';
import { DashboardSummaryKpis } from './dashboard/DashboardSummaryKpis';
import { DashboardQuickAnalysisBar } from './dashboard/DashboardQuickAnalysisBar';
import { DashboardTablesSection } from './dashboard/DashboardTablesSection';
import type { DashboardViewProps } from '@/types/dashboardProps';

export type { DashboardViewProps };

export function DashboardView({
  user,
  positions,
  filledPositions,
  transactions,
  fxRates,
  totalValue,
  totalCost,
  bourseVal,
  bourseCostVal,
  cryptoVal,
  cryptoCostVal,
  savingsVal,
  savingsCostVal,
  savingsAnnualInt,
  monthlyDCATotal,
  bourseDCAVal,
  cryptoDCAVal,
  savingsDCAVal,
  dcaBreakdown,
  notifications,
  pendingCount,
  marketStatusLabel,
  lastPricesUpdated,
  dcaGlobalStartDate,
  handleUpdateDcaStartDate,
  adjustInflation,
  inflationRate,
  peaSeniority,
  netLiquidationDetails,
  showTotalValueDropdown,
  setShowTotalValueDropdown,
  showTotalCostDropdown,
  setShowTotalCostDropdown,
  showGainLossDropdown,
  setShowGainLossDropdown,
  showDcaFrequencyDropdown,
  setShowDcaFrequencyDropdown,
  queryInput,
  setQueryInput,
  isRunning,
  handleRunAnalysis,
  refreshingPrices,
  setRefreshingPrices,
  showToast,
  openGlossary,
  openRebalanceModal,
  setShowIntegrationsModal,
  setRebalanceBudgetMode,
  setFlowRebalanceResult,
  setShowFlowRebalanceModal,
  setShowNotificationModal,
  setShowNetDetailsModal,
  setShowConfigEditor,
  setShowThemeInfoModal,
  setShowTransactionModal,
  setSelectedHistoryTicker,
  setEditingPosition,
  handleDeletePosition,
  handleSavePosition,
  upsertPositionsBatch,
  refreshSavingsPrices,
  refreshMarketPrices,
  refreshCryptoPrices,
  resetPortfolio,
  updatePosition,
  addPosition,
  undoLastAction,
  redoLastAction,
  canUndo,
  canRedo,
  saving,
  onNavigateView,
}: DashboardViewProps) {
  const {
    yearsElapsed,
    cumulativeInflationFactor,
    displayTotalValue,
    displayTotalCost,
    displayGainLoss,
    displayGainLossPercent,
    boursePos,
    cryptoPos,
    savingsPos,
    displayBourseVal,
    displayBourseCostVal,
    displayBourseGain,
    displayBourseGainPct,
    displayCryptoVal,
    displayCryptoCostVal,
    displayCryptoGain,
    displayCryptoGainPct,
    displaySavingsVal,
    displaySavingsCostVal,
    displaySavingsGain,
    displaySavingsAnnualInt,
  } = useDashboardCalculations({
    dcaGlobalStartDate,
    adjustInflation,
    inflationRate,
    totalValue,
    totalCost,
    bourseVal,
    bourseCostVal,
    cryptoVal,
    cryptoCostVal,
    savingsVal,
    savingsCostVal,
    savingsAnnualInt,
    positions,
  });

  return (
    <>
      {/* 👋 Executive Welcome & Briefing Banner */}
      <WelcomeBanner
        userName={user?.displayName || user?.email || undefined}
        totalValue={totalValue}
        totalCost={totalCost}
        monthlyDCA={monthlyDCATotal}
        positions={positions}
        notifications={notifications}
        onOpenAnalysis={() => onNavigateView('analysis')}
        onNavigateView={onNavigateView}
        onOpenRebalance={openRebalanceModal}
      />

      {/* 🏦 Hub Bancaire BoursoBank & Liquidités Live */}
      <BoursoLiveBar
        onOpenIntegrations={() => setShowIntegrationsModal(true)}
        onOpenRebalanceWithTampon={(amount) => {
          setRebalanceBudgetMode('tampon');
          setFlowRebalanceResult(calculateSmartFlowRebalance(positions, amount, fxRates));
          setShowFlowRebalanceModal(true);
        }}
      />

      {/* 📅 Status, Outlier Alert, Onboarding & Inflation Banners */}
      <DashboardHeaderBanners
        marketStatusLabel={marketStatusLabel}
        lastPricesUpdated={lastPricesUpdated}
        notifications={notifications}
        setShowNotificationModal={setShowNotificationModal}
        pendingCount={pendingCount}
        positionsCount={positions.length}
        adjustInflation={adjustInflation}
        inflationRate={inflationRate}
        yearsElapsed={yearsElapsed}
        cumulativeInflationFactor={cumulativeInflationFactor}
      />

      {/* 📊 Summary Cards — 4 KPIs */}
      <DashboardSummaryKpis
        adjustInflation={adjustInflation}
        cumulativeInflationFactor={cumulativeInflationFactor}
        displayTotalValue={displayTotalValue}
        displayTotalCost={displayTotalCost}
        displayGainLoss={displayGainLoss}
        displayGainLossPercent={displayGainLossPercent}
        displayBourseVal={displayBourseVal}
        displayCryptoVal={displayCryptoVal}
        displaySavingsVal={displaySavingsVal}
        displayBourseCostVal={displayBourseCostVal}
        displayCryptoCostVal={displayCryptoCostVal}
        displaySavingsCostVal={displaySavingsCostVal}
        displayBourseGain={displayBourseGain}
        displayCryptoGain={displayCryptoGain}
        displaySavingsGain={displaySavingsGain}
        positions={positions}
        filledPositions={filledPositions}
        showTotalValueDropdown={showTotalValueDropdown}
        setShowTotalValueDropdown={setShowTotalValueDropdown}
        showTotalCostDropdown={showTotalCostDropdown}
        setShowTotalCostDropdown={setShowTotalCostDropdown}
        showGainLossDropdown={showGainLossDropdown}
        setShowGainLossDropdown={setShowGainLossDropdown}
        showDcaFrequencyDropdown={showDcaFrequencyDropdown}
        setShowDcaFrequencyDropdown={setShowDcaFrequencyDropdown}
        openGlossary={openGlossary}
        setShowNetDetailsModal={setShowNetDetailsModal}
        peaSeniority={peaSeniority}
        netLiquidationDetails={netLiquidationDetails}
        setShowConfigEditor={setShowConfigEditor}
        dcaBreakdown={dcaBreakdown}
      />

      {/* 360° Wealth Breakdown Sub-Cards: Actions & ETF, Cryptos, Épargne */}
      <WealthBreakdownCards
        boursePos={boursePos}
        cryptoPos={cryptoPos}
        savingsPos={savingsPos}
        displayBourseVal={displayBourseVal}
        displayBourseCostVal={displayBourseCostVal}
        displayBourseGain={displayBourseGain}
        displayBourseGainPct={displayBourseGainPct}
        bourseDCAVal={bourseDCAVal}
        displayCryptoVal={displayCryptoVal}
        displayCryptoCostVal={displayCryptoCostVal}
        displayCryptoGain={displayCryptoGain}
        displayCryptoGainPct={displayCryptoGainPct}
        cryptoDCAVal={cryptoDCAVal}
        displaySavingsVal={displaySavingsVal}
        displaySavingsCostVal={displaySavingsCostVal}
        displaySavingsGain={displaySavingsGain}
        displaySavingsAnnualInt={displaySavingsAnnualInt}
        savingsDCAVal={savingsDCAVal}
      />

      {/* Quick Analysis Bar */}
      <DashboardQuickAnalysisBar
        queryInput={queryInput}
        setQueryInput={setQueryInput}
        isRunning={isRunning}
        onRunAnalysis={handleRunAnalysis}
      />

      {/* ⚡ Console de Simulation DCA & Période d'Accumulation */}
      <DcaSimulationBar
        dcaGlobalStartDate={dcaGlobalStartDate}
        onUpdateDcaStartDate={handleUpdateDcaStartDate}
        positions={positions}
        updatePosition={updatePosition}
        refreshingPrices={refreshingPrices}
        setRefreshingPrices={setRefreshingPrices}
        showToast={showToast}
      />

      {/* Tables Section (Savings, Listed Bourse, Cryptos, Core/Satellite) */}
      <DashboardTablesSection
        positions={positions}
        fxRates={fxRates}
        totalValue={totalValue}
        transactions={transactions}
        refreshingPrices={refreshingPrices}
        setRefreshingPrices={setRefreshingPrices}
        showToast={showToast}
        setEditingPosition={setEditingPosition}
        handleDeletePosition={handleDeletePosition}
        handleSavePosition={handleSavePosition}
        upsertPositionsBatch={upsertPositionsBatch}
        refreshSavingsPrices={refreshSavingsPrices}
        refreshMarketPrices={refreshMarketPrices}
        refreshCryptoPrices={refreshCryptoPrices}
        resetPortfolio={resetPortfolio}
        addPosition={addPosition}
        undoLastAction={undoLastAction}
        redoLastAction={redoLastAction}
        canUndo={canUndo}
        canRedo={canRedo}
        saving={saving}
        dcaGlobalStartDate={dcaGlobalStartDate}
        handleUpdateDcaStartDate={handleUpdateDcaStartDate}
        openRebalanceModal={openRebalanceModal}
        setSelectedHistoryTicker={setSelectedHistoryTicker}
        setShowTransactionModal={setShowTransactionModal}
        setShowThemeInfoModal={setShowThemeInfoModal}
      />
    </>
  );
}

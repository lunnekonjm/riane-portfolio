'use client';

import React from 'react';
import PositionEditor from '@/components/PositionEditor';
import ConfigEditor from '@/components/ConfigEditor';
import { FlowRebalanceModal } from '@/components/FlowRebalanceModal';
import { UserProfileModal } from './UserProfileModal';
import { ProxyAssetModal } from './ProxyAssetModal';
import { ThemeStrategyModal } from './ThemeStrategyModal';
import { NetLiquidationModal } from './NetLiquidationModal';
import NotificationCenterModal from '@/components/NotificationCenterModal';
import GlossaryInfoModal from '@/components/GlossaryInfoModal';
import MonteCarloModal from '@/components/MonteCarloModal';
import { IntegrationsHubModal } from '@/components/integrations/IntegrationsHubModal';
import TransactionHistoryModal from '@/components/TransactionHistoryModal';
import type { PortfolioModalsContainerProps } from '@/types/portfolioModals';

export function PortfolioModalsContainer({
  editingPosition,
  setEditingPosition,
  positions,
  handleSavePosition,
  handleDeletePosition,
  showConfigEditor,
  setShowConfigEditor,
  config,
  investorProfile,
  handleSaveConfig,
  updateInvestorProfile,
  handleTestNotification,
  handleTestEmail,
  showFlowRebalanceModal,
  setShowFlowRebalanceModal,
  flowRebalanceResult,
  setFlowRebalanceResult,
  rebalanceBudgetMode,
  setRebalanceBudgetMode,
  customRebalanceAmount,
  setCustomRebalanceAmount,
  fxRates,
  boursoLive,
  totalAvailableExtraCash,
  extraCashEntries,
  saveExtraCashEntry,
  updatePosition,
  clearAnalysisCache,
  setReadNotificationIds,
  setClearedNotificationIds,
  notifications,
  showToast,
  showProfileModal,
  setShowProfileModal,
  user,
  setShowEditProfile,
  signOut,
  showNotificationModal,
  setShowNotificationModal,
  notificationSettings,
  setNotificationSettings,
  handleDirectAnalysis,
  setCurrentView,
  openRebalanceModal,
  activeProxyModalAsset,
  setActiveProxyModalAsset,
  showThemeInfoModal,
  setShowThemeInfoModal,
  showGlossaryModal,
  setShowGlossaryModal,
  glossaryInitialTerm,
  showMonteCarloModal,
  setShowMonteCarloModal,
  totalValue,
  monthlyDCATotal,
  showIntegrationsModal,
  setShowIntegrationsModal,
  showTransactionModal,
  setShowTransactionModal,
  transactions,
  selectedHistoryTicker,
  showNetDetailsModal,
  setShowNetDetailsModal,
  netLiquidationDetails,
  peaSeniority,
  setPeaSeniority,
}: PortfolioModalsContainerProps) {
  return (
    <>
      {/* Position Editor */}
      {editingPosition && (
        <PositionEditor
          position={(editingPosition === 'new' || editingPosition === 'new_savings' || editingPosition === 'new_crypto') ? null : editingPosition}
          initialEnvelope={editingPosition === 'new_crypto' ? 'CRYPTO' : editingPosition === 'new_savings' ? 'LIVRET' : 'PEA'}
          existingPositions={positions}
          onSave={handleSavePosition}
          onClose={() => setEditingPosition(null)}
          onDelete={(editingPosition !== 'new' && editingPosition !== 'new_savings' && editingPosition !== 'new_crypto') ? handleDeletePosition : undefined}
        />
      )}

      {/* Config Editor */}
      {showConfigEditor && config && (
        <ConfigEditor
          config={config}
          investorProfile={investorProfile}
          onSave={handleSaveConfig}
          onSyncProfile={updateInvestorProfile}
          onClose={() => setShowConfigEditor(false)}
          onTestNotification={handleTestNotification}
          onTestEmail={handleTestEmail}
        />
      )}

      {/* Smart Flow Rebalancer Modal */}
      <FlowRebalanceModal
        isOpen={showFlowRebalanceModal}
        flowRebalanceResult={flowRebalanceResult}
        setFlowRebalanceResult={setFlowRebalanceResult}
        rebalanceBudgetMode={rebalanceBudgetMode}
        setRebalanceBudgetMode={setRebalanceBudgetMode}
        customRebalanceAmount={customRebalanceAmount}
        setCustomRebalanceAmount={setCustomRebalanceAmount}
        config={config}
        positions={positions}
        fxRates={fxRates}
        boursoLive={boursoLive}
        totalAvailableExtraCash={totalAvailableExtraCash}
        extraCashEntries={extraCashEntries}
        saveExtraCashEntry={saveExtraCashEntry}
        updatePosition={updatePosition}
        clearAnalysisCache={clearAnalysisCache}
        setReadNotificationIds={setReadNotificationIds}
        notifications={notifications}
        showToast={showToast}
        onClose={() => setShowFlowRebalanceModal(false)}
      />

      {/* 👤 User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        user={user}
        investorProfile={investorProfile}
        onTestNotification={handleTestNotification}
        onTestEmail={handleTestEmail}
        onEditProfile={() => setShowEditProfile(true)}
        onSignOut={async () => {
          await signOut();
        }}
        onClose={() => setShowProfileModal(false)}
      />

      {/* 🔔 Notification Center Modal */}
      {showNotificationModal && (
        <NotificationCenterModal
          notifications={notifications}
          settings={notificationSettings}
          onClose={() => setShowNotificationModal(false)}
          onMarkAllAsRead={() => setReadNotificationIds(notifications.map((n) => n.id))}
          onClearAll={() => setClearedNotificationIds(notifications.map((n) => n.id))}
          onUpdateSettings={(newSettings) => setNotificationSettings(newSettings)}
          onOpenAnalysis={(promptQuery?: string) => {
            const query = promptQuery || "Analyse globale de mon portefeuille";
            handleDirectAnalysis(query);
          }}
          onNavigateView={setCurrentView}
          onOpenRebalance={openRebalanceModal}
          onTestNotification={handleTestNotification}
          onTestEmail={handleTestEmail}
        />
      )}

      {/* 🔒 Modal d'Explication de la Simulation par Proxy */}
      <ProxyAssetModal
        asset={activeProxyModalAsset}
        onClose={() => setActiveProxyModalAsset(null)}
      />

      {/* 💡 Modal Stratégie Core / Satellite (CDC V4) */}
      <ThemeStrategyModal
        isOpen={showThemeInfoModal}
        onClose={() => setShowThemeInfoModal(false)}
      />

      {/* 📚 Modal Lexique & Explications Financières */}
      {showGlossaryModal && (
        <GlossaryInfoModal
          onClose={() => setShowGlossaryModal(false)}
          initialTerm={glossaryInitialTerm}
        />
      )}

      {/* 🎲 Modal Simulation Monte Carlo & Indépendance (FIRE) */}
      {showMonteCarloModal && (
        <MonteCarloModal
          initialCapital={totalValue}
          monthlyDCA={monthlyDCATotal || (config?.monthlyBudget || 1000)}
          positions={positions}
          fxRates={fxRates}
          onClose={() => setShowMonteCarloModal(false)}
        />
      )}

      {/* 🔗 Modal Hub Multi-Comptes & Sync API Directe */}
      {showIntegrationsModal && (
        <IntegrationsHubModal
          isOpen={showIntegrationsModal}
          onClose={() => setShowIntegrationsModal(false)}
          fxRateEURUSD={fxRates['USD'] || 1.08}
        />
      )}

      {/* 📜 Modal Historique des Arbitrages & Transaction Journal */}
      {showTransactionModal && (
        <TransactionHistoryModal
          transactions={transactions}
          initialTicker={selectedHistoryTicker}
          onClose={() => setShowTransactionModal(false)}
        />
      )}

      {/* 💰 Modal Montant Net Réel Viré en Compte */}
      <NetLiquidationModal
        isOpen={showNetDetailsModal}
        netLiquidationDetails={netLiquidationDetails}
        peaSeniority={peaSeniority}
        setPeaSeniority={setPeaSeniority}
        onNavigateEnvelopes={() => setCurrentView('envelopes')}
        onClose={() => setShowNetDetailsModal(false)}
      />
    </>
  );
}

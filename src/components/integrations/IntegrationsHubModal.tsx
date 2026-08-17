'use client';

import React from 'react';
import { IntegrationsOverviewTab } from './tabs/IntegrationsOverviewTab';
import { IntegrationsIbkrTab } from './tabs/IntegrationsIbkrTab';
import { IntegrationsBoursoBankTab } from './tabs/IntegrationsBoursoBankTab';
import { IntegrationsTradeRepublicTab } from './tabs/IntegrationsTradeRepublicTab';
import { IntegrationsHubHeader } from './IntegrationsHubHeader';
import { IntegrationsHubNavTabs } from './IntegrationsHubNavTabs';
import { IntegrationsHubFooter } from './IntegrationsHubFooter';
import { useIntegrationsHubState } from '@/hooks/useIntegrationsHubState';

interface IntegrationsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  fxRateEURUSD?: number;
}

export type { BoursoAccountConfig } from '@/hooks/useIntegrationsHubState';

export const IntegrationsHubModal: React.FC<IntegrationsHubModalProps> = ({
  isOpen,
  onClose,
  fxRateEURUSD = 1.08,
}) => {
  const {
    loading,
    snaptradeData,
    truelayerData,
    lastSyncTime,
    activeTab,
    setActiveTab,
    connectingBourso,
    livretABalanceInput,
    setLivretABalanceInput,
    livretARateInput,
    setLivretARateInput,
    peaPmeBalanceInput,
    setPeaPmeBalanceInput,
    tontineBalanceInput,
    setTontineBalanceInput,
    manualSavedSuccess,
    handleSaveManualAssets,
    livretAYearlyInterest,
    processedBoursoAccounts,
    saveBoursoConfig,
    handleConnectBourso,
    syncAll,
    ibkrTotalEUR,
    ibkrCashEUR,
    ibkrInvestedEUR,
    boursoCheckingEUR,
    boursoTamponEUR,
    boursoTontineEUR,
    boursoSavingsEUR,
    boursoInvestedEUR,
    boursoTotalEUR,
    consolidatedTotalEUR,
    isIbkrConnected,
    formatEUR,
  } = useIntegrationsHubState({ isOpen, fxRateEURUSD });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 920,
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-medium)',
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        }}
      >
        {/* Header & Sync Status */}
        <IntegrationsHubHeader
          loading={loading}
          onSyncAll={syncAll}
          onClose={onClose}
          lastSyncTime={lastSyncTime}
        />

        {/* Navigation Tabs */}
        <IntegrationsHubNavTabs
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isIbkrConnected={isIbkrConnected}
        />

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {activeTab === 'overview' && (
            <IntegrationsOverviewTab
              consolidatedTotalEUR={consolidatedTotalEUR}
              boursoCheckingEUR={boursoCheckingEUR}
              boursoSavingsEUR={boursoSavingsEUR}
              ibkrCashEUR={ibkrCashEUR}
              ibkrInvestedEUR={ibkrInvestedEUR}
              boursoInvestedEUR={boursoInvestedEUR}
              ibkrTotalEUR={ibkrTotalEUR}
              boursoTotalEUR={boursoTotalEUR}
              isIbkrConnected={isIbkrConnected}
              truelayerData={truelayerData}
              boursoTamponEUR={boursoTamponEUR}
              formatEUR={formatEUR}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'ibkr' && (
            <IntegrationsIbkrTab
              snaptradeData={snaptradeData}
              formatEUR={formatEUR}
            />
          )}

          {activeTab === 'boursobank' && (
            <IntegrationsBoursoBankTab
              connectingBourso={connectingBourso}
              onConnectBourso={handleConnectBourso}
              boursoTotalEUR={boursoTotalEUR}
              boursoCheckingEUR={boursoCheckingEUR}
              boursoTamponEUR={boursoTamponEUR}
              boursoTontineEUR={boursoTontineEUR}
              processedBoursoAccounts={processedBoursoAccounts}
              onSaveBoursoConfig={saveBoursoConfig}
              livretABalanceInput={livretABalanceInput}
              setLivretABalanceInput={setLivretABalanceInput}
              livretARateInput={livretARateInput}
              setLivretARateInput={setLivretARateInput}
              peaPmeBalanceInput={peaPmeBalanceInput}
              setPeaPmeBalanceInput={setPeaPmeBalanceInput}
              tontineBalanceInput={tontineBalanceInput}
              setTontineBalanceInput={setTontineBalanceInput}
              livretAYearlyInterest={livretAYearlyInterest}
              onSaveManualAssets={handleSaveManualAssets}
              manualSavedSuccess={manualSavedSuccess}
              formatEUR={formatEUR}
            />
          )}

          {activeTab === 'traderepublic' && (
            <IntegrationsTradeRepublicTab />
          )}
        </div>

        {/* Footer */}
        <IntegrationsHubFooter onClose={onClose} />
      </div>
    </div>
  );
};

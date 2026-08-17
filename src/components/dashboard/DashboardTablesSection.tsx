'use client';

import React from 'react';
import type { Position, TransactionRecord } from '@/types/portfolio';
import SavingsPortfolioTable from '../SavingsPortfolioTable';
import BoursePortfolioTable from '../BoursePortfolioTable';
import CryptoPortfolioTable from '../CryptoPortfolioTable';
import CoreSatelliteView from '../CoreSatelliteView';

interface DashboardTablesSectionProps {
  positions: Position[];
  fxRates: Record<string, number>;
  totalValue: number;
  transactions: TransactionRecord[];
  refreshingPrices: boolean;
  setRefreshingPrices: (r: boolean) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  setEditingPosition: (pos: Position | null | 'new' | 'new_savings' | 'new_crypto') => void;
  handleDeletePosition: (id: string) => void;
  handleSavePosition: (pos: Position) => Promise<void>;
  upsertPositionsBatch: (batch: Position[]) => Promise<void>;
  refreshSavingsPrices: () => Promise<any>;
  refreshMarketPrices: () => Promise<any>;
  refreshCryptoPrices: (v?: boolean) => Promise<any>;
  resetPortfolio: () => Promise<void>;
  addPosition: (pos: Position) => Promise<void>;
  undoLastAction: () => any;
  redoLastAction: () => any;
  canUndo: boolean;
  canRedo: boolean;
  saving: boolean;
  dcaGlobalStartDate: string;
  handleUpdateDcaStartDate: (dateStr: string) => void;
  openRebalanceModal: () => void;
  setSelectedHistoryTicker: (ticker: string | undefined) => void;
  setShowTransactionModal: (v: boolean) => void;
  setShowThemeInfoModal: (v: boolean) => void;
}

export function DashboardTablesSection({
  positions,
  fxRates,
  totalValue,
  transactions,
  refreshingPrices,
  setRefreshingPrices,
  showToast,
  setEditingPosition,
  handleDeletePosition,
  handleSavePosition,
  upsertPositionsBatch,
  refreshSavingsPrices,
  refreshMarketPrices,
  refreshCryptoPrices,
  resetPortfolio,
  addPosition,
  undoLastAction,
  redoLastAction,
  canUndo,
  canRedo,
  saving,
  dcaGlobalStartDate,
  handleUpdateDcaStartDate,
  openRebalanceModal,
  setSelectedHistoryTicker,
  setShowTransactionModal,
  setShowThemeInfoModal,
}: DashboardTablesSectionProps) {
  return (
    <>
      {/* Dedicated Savings & Non-Listed Wealth Table */}
      <SavingsPortfolioTable
        positions={positions}
        onEditPosition={(pos) => setEditingPosition(pos)}
        onDeletePosition={(id) => handleDeletePosition(id)}
        onAddSavingsPosition={() => setEditingPosition('new_savings')}
        onRefreshSavings={async () => {
          setRefreshingPrices(true);
          try {
            const res = await refreshSavingsPrices();
            showToast(`🛡️ ${res.count} livrets & calculs d'intérêts actualisés`);
          } catch {
            showToast('Erreur actualisation épargne', 'error');
          } finally {
            setRefreshingPrices(false);
          }
        }}
        refreshing={refreshingPrices}
      />

      {/* Stock Market Portfolio Card (Listed Assets) */}
      <BoursePortfolioTable
        positions={positions}
        fxRates={fxRates as any}
        refreshingPrices={refreshingPrices}
        onRefreshPrices={async () => {
          setRefreshingPrices(true);
          try {
            const res = await refreshMarketPrices();
            showToast(`📈 ${res.count} cours boursiers actualisés (Yahoo Finance)`);
          } catch {
            showToast('Impossible de récupérer les cours', 'error');
          } finally {
            setRefreshingPrices(false);
          }
        }}
        onEditPosition={(pos) => setEditingPosition(pos)}
        onDeletePosition={(id) => handleDeletePosition(id)}
        onResetPortfolio={async () => {
          if (confirm('Réinitialiser toutes les positions à zéro ?\nVous pourrez ensuite entrer vos données réelles.')) {
            await resetPortfolio();
            const todayStr = new Date().toISOString().split('T')[0];
            handleUpdateDcaStartDate(todayStr);
            showToast('Portefeuille réinitialisé — remis à la date d\'aujourd\'hui');
          }
        }}
        onOpenTransactions={(ticker) => {
          setSelectedHistoryTicker(ticker);
          setShowTransactionModal(true);
        }}
        onOpenRebalance={openRebalanceModal}
        undoLastAction={undoLastAction}
        redoLastAction={redoLastAction}
        canUndo={canUndo}
        canRedo={canRedo}
        saving={saving}
        transactionsCount={transactions.length}
        dcaGlobalStartDate={dcaGlobalStartDate}
        onAddDefaultPositions={async () => {
          const { DEFAULT_POSITIONS } = await import('@/data/portfolio');
          for (const pos of DEFAULT_POSITIONS) {
            await addPosition({ ...pos, updatedAt: Date.now() });
          }
          showToast(`📋 ${DEFAULT_POSITIONS.length} positions prédéfinies chargées — complétez vos quantités et PRU`);
        }}
      />

      {/* Dedicated Crypto-Assets Table (24/7 Live Pricing) */}
      <CryptoPortfolioTable
        positions={positions}
        fxRates={fxRates as any}
        totalNetWorthEUR={totalValue}
        refreshingPrices={refreshingPrices}
        onRefreshPrices={async () => {
          setRefreshingPrices(true);
          try {
            const res = await refreshCryptoPrices(true);
            showToast(`🪙 ${res.count} cryptos & soldes on-chain actualisés en direct`);
          } catch {
            showToast('Impossible de récupérer les cours cryptos', 'error');
          } finally {
            setRefreshingPrices(false);
          }
        }}
        onEditPosition={(pos) => setEditingPosition(pos)}
        onDeletePosition={(id) => handleDeletePosition(id)}
        onAddCryptoPosition={() => setEditingPosition('new_crypto')}
        onSavePosition={handleSavePosition}
        onBatchImportPositions={async (batch) => {
          await upsertPositionsBatch(batch);
          showToast(`✓ ${batch.length} crypto-actif(s) importé(s) instantanément !`);
        }}
      />

      {/* Strategic Core vs Satellite View (CDC V4) */}
      <CoreSatelliteView
        positions={positions}
        fxRates={fxRates}
        onOpenInfoModal={() => setShowThemeInfoModal(true)}
        onOpenRebalance={openRebalanceModal}
      />
    </>
  );
}

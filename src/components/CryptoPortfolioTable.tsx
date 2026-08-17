'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';
import { useCryptoTableState } from '@/hooks/useCryptoTableState';
import { CryptoTableToolbar } from './portfolio/CryptoTableToolbar';
import { CryptoTableRow } from './portfolio/CryptoTableRow';
import CryptoLotModal from './crypto/CryptoLotModal';
import OnChainWalletImportModal from './crypto/OnChainWalletImportModal';

interface CryptoPortfolioTableProps {
  positions: Position[];
  fxRates: Record<string, number>;
  totalNetWorthEUR?: number;
  refreshingPrices: boolean;
  onRefreshPrices: () => void;
  onEditPosition: (pos: Position) => void;
  onDeletePosition: (id: string) => void;
  onAddCryptoPosition: () => void;
  onSavePosition?: (pos: Position) => void;
  onBatchImportPositions?: (positions: Position[]) => void;
}

export default function CryptoPortfolioTable({
  positions,
  fxRates,
  totalNetWorthEUR = 0,
  refreshingPrices,
  onRefreshPrices,
  onEditPosition,
  onDeletePosition,
  onAddCryptoPosition,
  onSavePosition,
  onBatchImportPositions,
}: CryptoPortfolioTableProps) {
  const {
    selectedWalletFilter,
    setSelectedWalletFilter,
    selectedPositionForLot,
    setSelectedPositionForLot,
    showOnChainImportModal,
    setShowOnChainImportModal,
    sortKey,
    sortDir,
    handleSort,
    cryptoPositions,
    totalCryptoValEUR,
    totalCryptoFeesEUR,
    totalCryptoPLEUR,
    totalCryptoPLPct,
    globalTaxMetrics,
    totalCryptoMonthlyDCA,
    cryptoWeightInWealth,
    walletFilterTabs,
    sortedPositions,
  } = useCryptoTableState(positions, fxRates, totalNetWorthEUR);

  const handleLotSaved = (updated: Position) => {
    if (onSavePosition) {
      onSavePosition(updated);
    } else {
      onEditPosition(updated);
    }
    setSelectedPositionForLot(null);
  };

  const handleBatchImport = (importedAssets: Position[]) => {
    if (onBatchImportPositions) {
      onBatchImportPositions(importedAssets);
    }
    setShowOnChainImportModal(false);
  };

  return (
    <div className="card" style={{ marginBottom: 28, padding: 18 }}>
      {/* Header & KPI Summary */}
      <CryptoTableToolbar
        cryptoPositionsCount={cryptoPositions.length}
        refreshingPrices={refreshingPrices}
        onRefreshPrices={onRefreshPrices}
        onOpenOnChainImportModal={() => setShowOnChainImportModal(true)}
        onAddCryptoPosition={onAddCryptoPosition}
        totalCryptoValEUR={totalCryptoValEUR}
        totalCryptoFeesEUR={totalCryptoFeesEUR}
        totalCryptoPLEUR={totalCryptoPLEUR}
        totalCryptoPLPct={totalCryptoPLPct}
        totalCryptoMonthlyDCA={totalCryptoMonthlyDCA}
        globalTaxMetrics={globalTaxMetrics}
        cryptoWeightInWealth={cryptoWeightInWealth}
        walletFilterTabs={walletFilterTabs}
        selectedWalletFilter={selectedWalletFilter}
        setSelectedWalletFilter={setSelectedWalletFilter}
      />

      {cryptoPositions.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div className="empty-state-icon" style={{ fontSize: 36, marginBottom: 12 }}>🪙</div>
          <div className="empty-state-text" style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
            Aucun crypto-actif dans votre portefeuille pour le moment.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onAddCryptoPosition}
              style={{ fontSize: 13, padding: '8px 16px', fontWeight: 700 }}
            >
              ➕ Ajouter mon premier crypto-actif
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowOnChainImportModal(true)}
              style={{ fontSize: 13, padding: '8px 16px' }}
            >
              🔗 Importer Wallet On-Chain
            </button>
          </div>
        </div>
      ) : (
        /* Table with Touch Responsive Scrolling */
        <div className="table-responsive" style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', borderRadius: 'var(--radius-md)' }}>
          <table className="portfolio-table">
            <thead>
              <tr>
                <th className={`sortable ${sortKey === 'name' ? 'active' : ''}`} onClick={() => handleSort('name')} title="Trier par Nom / Symbole">
                  <span data-tooltip="Nom complet du crypto-actif, ticker et wallets détenteurs">Actif</span>
                  <span className="sort-icon">{sortKey === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                </th>
                <th className={`sortable ${sortKey === 'envelope' ? 'active' : ''}`} onClick={() => handleSort('envelope')} title="Trier par Enveloppe fiscale">
                  <span data-tooltip="Enveloppe fiscale (CRYPTO / Déclaratif 2086)">Enveloppe</span>
                  <span className="sort-icon">{sortKey === 'envelope' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                </th>
                <th className={`sortable ${sortKey === 'price' ? 'active' : ''}`} onClick={() => handleSort('price')} title="Trier par Prix unitaire">
                  <span data-tooltip="Cours en temps réel 24/7 et Prix de Revient Unitaire moyen (PRU)">Prix / Rendement</span>
                  <span className="sort-icon">{sortKey === 'price' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                </th>
                <th className={`sortable ${sortKey === 'value' ? 'active' : ''}`} onClick={() => handleSort('value')} title="Trier par Valeur totale détenue">
                  <span data-tooltip="Valeur totale détenue et solde en jetons">Valeur / Solde</span>
                  <span className="sort-icon">{sortKey === 'value' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                </th>
                <th className={`sortable ${sortKey === 'perf' ? 'active' : ''}`} onClick={() => handleSort('perf')} title="Trier par Performance et Plus-value">
                  <span data-tooltip="Plus ou Moins-value latente totale et nette après PFU 30%">Gains &amp; Performance</span>
                  <span className="sort-icon">{sortKey === 'perf' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                </th>
                <th className={`sortable ${sortKey === 'dca' ? 'active' : ''}`} onClick={() => handleSort('dca')} title="Trier par Versement DCA">
                  <span data-tooltip="Budget mensuel programmé d'accumulation DCA">DCA</span>
                  <span className="sort-icon">{sortKey === 'dca' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                </th>
                <th className={`sortable ${sortKey === 'weight' ? 'active' : ''}`} onClick={() => handleSort('weight')} title="Trier par Poids d'allocation">
                  <span data-tooltip="Poids de la crypto dans votre patrimoine total comparé au seuil max de 10%">Plafond &amp; Risque</span>
                  <span className="sort-icon">{sortKey === 'weight' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                </th>
                <th style={{ width: 90, textAlign: 'center' }}>
                  <span data-tooltip="Actions : Gérer les lots par wallet, Éditer, Supprimer">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPositions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-secondary)' }}>
                    🔍 Aucun crypto-actif ne correspond au filtre sélectionné.
                  </td>
                </tr>
              ) : (
                sortedPositions.map((pos) => (
                  <CryptoTableRow
                    key={pos.id}
                    pos={pos}
                    totalNetWorthEUR={totalNetWorthEUR}
                    onEditPosition={onEditPosition}
                    onDeletePosition={onDeletePosition}
                    onOpenLotModal={setSelectedPositionForLot}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Lot Manager for Multi-Wallets */}
      {selectedPositionForLot && (
        <CryptoLotModal
          position={selectedPositionForLot}
          onClose={() => setSelectedPositionForLot(null)}
          onSave={handleLotSaved}
        />
      )}

      {/* Modal On-Chain Import */}
      <OnChainWalletImportModal
        isOpen={showOnChainImportModal}
        onClose={() => setShowOnChainImportModal(false)}
        onImportAssets={handleBatchImport}
        existingPositions={positions}
      />
    </div>
  );
}

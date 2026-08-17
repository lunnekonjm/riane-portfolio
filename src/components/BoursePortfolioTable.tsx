'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';
import { useBourseTableState } from '@/hooks/useBourseTableState';
import { BourseTableToolbar } from './portfolio/BourseTableToolbar';
import { BourseTableRow } from './portfolio/BourseTableRow';

interface BoursePortfolioTableProps {
  positions: Position[];
  fxRates: Record<string, number>;
  refreshingPrices: boolean;
  onRefreshPrices: () => Promise<void>;
  onEditPosition: (pos: Position | 'new') => void;
  onDeletePosition: (id: string) => void;
  onResetPortfolio: () => Promise<void>;
  onOpenTransactions: (ticker?: string) => void;
  onOpenRebalance: () => void;
  undoLastAction: () => Promise<boolean>;
  redoLastAction: () => Promise<boolean>;
  canUndo: boolean;
  canRedo: boolean;
  saving: boolean;
  transactionsCount: number;
  dcaGlobalStartDate?: string;
  onAddDefaultPositions?: () => Promise<void>;
}

export default function BoursePortfolioTable({
  positions,
  fxRates,
  refreshingPrices,
  onRefreshPrices,
  onEditPosition,
  onDeletePosition,
  onOpenTransactions,
  onOpenRebalance,
  undoLastAction,
  redoLastAction,
  canUndo,
  canRedo,
  saving,
  transactionsCount,
  dcaGlobalStartDate = '2024-01-01',
  onAddDefaultPositions,
}: BoursePortfolioTableProps) {
  const {
    selectedEnvelopeFilter,
    setSelectedEnvelopeFilter,
    bourseSortKey,
    bourseSortDir,
    handleBourseSort,
    marketPositionsAll,
    totalMarketValEUR,
    totalMarketPLEUR,
    totalMarketPLPct,
    totalMarketMonthlyDCA,
    sortedPositions,
  } = useBourseTableState(positions, fxRates);

  return (
    <div className="card" style={{ marginBottom: 28, padding: 18 }}>
      {/* 🛠️ Header Toolbar & KPI Summary */}
      <BourseTableToolbar
        refreshingPrices={refreshingPrices}
        onRefreshPrices={onRefreshPrices}
        undoLastAction={undoLastAction}
        redoLastAction={redoLastAction}
        canUndo={canUndo}
        canRedo={canRedo}
        saving={saving}
        transactionsCount={transactionsCount}
        positions={positions}
        fxRates={fxRates}
        onOpenTransactions={onOpenTransactions}
        onOpenRebalance={onOpenRebalance}
        onEditPosition={onEditPosition}
        totalMarketValEUR={totalMarketValEUR}
        totalMarketPLEUR={totalMarketPLEUR}
        totalMarketPLPct={totalMarketPLPct}
        totalMarketMonthlyDCA={totalMarketMonthlyDCA}
      />

      {positions.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 24px' }}>
          <div className="empty-state-icon">📂</div>
          <div className="empty-state-text" style={{ marginBottom: 20 }}>
            Aucune position dans votre portefeuille.
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => onEditPosition('new')}>
              ➕ Ajouter une position
            </button>
            {onAddDefaultPositions && (
              <button
                className="btn btn-secondary"
                style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
                  borderColor: 'var(--accent-cyan)',
                }}
                onClick={onAddDefaultPositions}
              >
                📋 Charger mon portefeuille prédéfini
              </button>
            )}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 12, maxWidth: 420 }}>
            Le portefeuille prédéfini charge vos actifs habituels (ETF ACWI, Nasdaq, PEA-PME, CTO) avec quantités à zéro.
            Vous n&apos;aurez plus qu&apos;à renseigner vos données réelles.
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, padding: '0 4px' }}>
            {(() => {
              const marketFilterTabs = [{ id: 'ALL', label: `🌐 Tout (${marketPositionsAll.length})` }];
              if (marketPositionsAll.some((p) => p.envelope === 'PEA')) {
                const count = marketPositionsAll.filter((p) => p.envelope === 'PEA').length;
                marketFilterTabs.push({ id: 'PEA', label: `🇫🇷 PEA (${count})` });
              }
              if (marketPositionsAll.some((p) => p.envelope === 'PEA-PME')) {
                const count = marketPositionsAll.filter((p) => p.envelope === 'PEA-PME').length;
                marketFilterTabs.push({ id: 'PEA-PME', label: `🌱 PEA-PME (${count})` });
              }
              if (marketPositionsAll.some((p) => p.envelope === 'CTO')) {
                const count = marketPositionsAll.filter((p) => p.envelope === 'CTO').length;
                marketFilterTabs.push({ id: 'CTO', label: `🌍 CTO (${count})` });
              }
              if (marketPositionsAll.some((p) => p.envelope === 'SPECULATIVE' || p.envelope === 'OPPORTUNISTIC')) {
                const count = marketPositionsAll.filter((p) => p.envelope === 'SPECULATIVE' || p.envelope === 'OPPORTUNISTIC').length;
                marketFilterTabs.push({ id: 'SPECULATIVE', label: `🚀 Spéculatif (${count})` });
              }

              return marketFilterTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`btn ${selectedEnvelopeFilter === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: 'var(--text-xs)', padding: '4px 10px', borderRadius: 20 }}
                  onClick={() => setSelectedEnvelopeFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ));
            })()}
          </div>
          <table className="portfolio-table">
            <thead>
              <tr>
                <th className={`sortable ${bourseSortKey === 'name' ? 'active' : ''}`} onClick={() => handleBourseSort('name')} title="Trier par Nom / Ticker">
                  <span data-tooltip="Nom complet de l'actif et ticker boursier">Actif</span>
                  <span className="sort-icon">{bourseSortKey === 'name' ? (bourseSortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                </th>
                <th className={`sortable ${bourseSortKey === 'envelope' ? 'active' : ''}`} onClick={() => handleBourseSort('envelope')} title="Trier par Enveloppe fiscale">
                  <span data-tooltip="Enveloppe fiscale (PEA, PEA-PME, CTO, Spéculatif...)">Enveloppe</span>
                  <span className="sort-icon">{bourseSortKey === 'envelope' ? (bourseSortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                </th>
                <th className={`sortable ${bourseSortKey === 'price' ? 'active' : ''}`} onClick={() => handleBourseSort('price')} title="Trier par Prix unitaire">
                  <span data-tooltip="Cours actuel du marché et PRU d'achat">Prix / Rendement</span>
                  <span className="sort-icon">{bourseSortKey === 'price' ? (bourseSortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                </th>
                <th className={`sortable ${bourseSortKey === 'value' ? 'active' : ''}`} onClick={() => handleBourseSort('value')} title="Trier par Valeur totale détenue">
                  <span data-tooltip="Valeur totale détenue et nombre de parts">Valeur / Solde</span>
                  <span className="sort-icon">{bourseSortKey === 'value' ? (bourseSortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                </th>
                <th className={`sortable ${bourseSortKey === 'perf' ? 'active' : ''}`} onClick={() => handleBourseSort('perf')} title="Trier par Performance et Plus-value">
                  <span data-tooltip="Plus ou Moins-value latente totale (% et montant €/$)">Gains &amp; Performance</span>
                  <span className="sort-icon">{bourseSortKey === 'perf' ? (bourseSortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                </th>
                <th className={`sortable ${bourseSortKey === 'dca' ? 'active' : ''}`} onClick={() => handleBourseSort('dca')} title="Trier par Versement DCA">
                  <span data-tooltip="Budget mensuel ou annuel d'accumulation DCA">DCA</span>
                  <span className="sort-icon">{bourseSortKey === 'dca' ? (bourseSortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                </th>
                <th className={`sortable ${bourseSortKey === 'weight' ? 'active' : ''}`} onClick={() => handleBourseSort('weight')} title="Trier par Poids d'allocation">
                  <span data-tooltip="Poids actuel comparé au Plafond d'Allocation Max de sécurité">Plafond &amp; Risque</span>
                  <span className="sort-icon">{bourseSortKey === 'weight' ? (bourseSortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                </th>
                <th style={{ width: 80, textAlign: 'center' }}>
                  <span data-tooltip="Actions rapides : Historique, Édition, Suppression">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPositions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-secondary)' }}>
                    🔍 Aucun actif boursier ne correspond au filtre sélectionné.
                  </td>
                </tr>
              ) : (
                sortedPositions.map((pos) => (
                  <BourseTableRow
                    key={pos.id}
                    pos={pos}
                    fxRates={fxRates}
                    totalMarketValEUR={totalMarketValEUR}
                    dcaGlobalStartDate={dcaGlobalStartDate}
                    onEditPosition={onEditPosition}
                    onDeletePosition={onDeletePosition}
                    onOpenTransactions={onOpenTransactions}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

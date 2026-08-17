'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';
import { useBoursoLive } from '@/hooks/useBoursoLive';
import { useSavingsTableState } from '@/hooks/useSavingsTableState';
import { SavingsTableToolbar } from './portfolio/SavingsTableToolbar';
import { SavingsTableRow } from './portfolio/SavingsTableRow';

interface SavingsPortfolioTableProps {
  positions: Position[];
  onEditPosition: (position: Position) => void;
  onDeletePosition?: (id: string) => void;
  onAddSavingsPosition: () => void;
  onRefreshSavings?: () => void;
  refreshing?: boolean;
}

export default function SavingsPortfolioTable({
  positions,
  onEditPosition,
  onDeletePosition,
  onAddSavingsPosition,
  onRefreshSavings,
  refreshing,
}: SavingsPortfolioTableProps) {
  const boursoLive = useBoursoLive();
  const {
    selectedSavingsEnvelope,
    setSelectedSavingsEnvelope,
    sortKey,
    sortDir,
    handleSort,
    savingsPositions,
    savingsFilterTabs,
    sortedCalculations,
    totalValue,
    totalAnnualInterest,
    totalMonthlyDCA,
  } = useSavingsTableState(positions);

  if (savingsPositions.length === 0) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', marginBottom: 24, border: '1px dashed var(--border-accent)' }}>
        <h3 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8, fontWeight: 700 }}>🛡️ Épargne, Livrets, PEE &amp; Patrimoine</h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 18 }}>
          Ajoutez vos Livrets A, LDDS, PEE (Natixis), Assurance-Vie ou SCPI pour suivre votre patrimoine hors-bourse et calculer vos intérêts réels.
        </p>
        {boursoLive.livretAEUR > 0 && (
          <div style={{ margin: '0 auto 16px auto', maxWidth: 460, padding: 12, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <span style={{ fontSize: 13, color: 'var(--accent-emerald)', fontWeight: 700 }}>
              🏦 Livret A BoursoBank Synchronisé : {boursoLive.livretAEUR.toLocaleString('fr-FR')} € ({boursoLive.livretARate}% net)
            </span>
          </div>
        )}
        <button className="btn btn-primary" onClick={onAddSavingsPosition} style={{ fontSize: 14 }}>
          ➕ Ajouter un compte épargne / livret
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 28, padding: 18 }}>
      {/* Header & KPI Summary */}
      <SavingsTableToolbar
        savingsPositionsCount={savingsPositions.length}
        onRefreshSavings={onRefreshSavings}
        refreshing={refreshing}
        onAddSavingsPosition={onAddSavingsPosition}
        totalValue={totalValue}
        totalAnnualInterest={totalAnnualInterest}
        totalMonthlyDCA={totalMonthlyDCA}
        savingsFilterTabs={savingsFilterTabs}
        selectedSavingsEnvelope={selectedSavingsEnvelope}
        setSelectedSavingsEnvelope={setSelectedSavingsEnvelope}
      />

      {/* Table with Touch Responsive Scrolling */}
      <div className="table-responsive" style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', borderRadius: 'var(--radius-md)' }}>
        <table className="portfolio-table">
          <thead>
            <tr>
              <th className={`sortable ${sortKey === 'name' ? 'active' : ''}`} onClick={() => handleSort('name')} title="Trier par Nom">
                <span data-tooltip="Nom complet du compte ou livret, devise et établissement">Actif</span>
                <span className="sort-icon">{sortKey === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
              </th>
              <th className={`sortable ${sortKey === 'envelope' ? 'active' : ''}`} onClick={() => handleSort('envelope')} title="Trier par Enveloppe">
                <span data-tooltip="Enveloppe fiscale (Livret A, PEE, Assurance-Vie...)">Enveloppe</span>
                <span className="sort-icon">{sortKey === 'envelope' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
              </th>
              <th className={`sortable ${sortKey === 'rate' ? 'active' : ''}`} onClick={() => handleSort('rate')} title="Trier par Taux d'intérêt">
                <span data-tooltip="Taux d'intérêt net annuel (Livret A 3%, LDDS 3%...)">Taux Net</span>
                <span className="sort-icon">{sortKey === 'rate' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
              </th>
              <th className={`sortable ${sortKey === 'value' ? 'active' : ''}`} onClick={() => handleSort('value')} title="Trier par Solde">
                <span data-tooltip="Solde actuel total valorisé">Solde</span>
                <span className="sort-icon">{sortKey === 'value' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
              </th>
              <th className={`sortable ${sortKey === 'perf' ? 'active' : ''}`} onClick={() => handleSort('perf')} title="Trier par Intérêts générés">
                <span data-tooltip="Intérêts acquis calculés par quinzaine légale (Art. R221-3 CMF)">Intérêts Quinzaines</span>
                <span className="sort-icon">{sortKey === 'perf' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
              </th>
              <th className={`sortable ${sortKey === 'dca' ? 'active' : ''}`} onClick={() => handleSort('dca')} title="Trier par Versement DCA">
                <span data-tooltip="Épargne mensuelle programmée">DCA</span>
                <span className="sort-icon">{sortKey === 'dca' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
              </th>
              <th className={`sortable ${sortKey === 'cap' ? 'active' : ''}`} onClick={() => handleSort('cap')} title="Trier par Remplissage Plafond">
                <span data-tooltip="Plafond légal réglementé et jauge de remplissage">Plafond Légal</span>
                <span className="sort-icon">{sortKey === 'cap' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
              </th>
              <th style={{ width: 64, textAlign: 'center' }}>
                <span data-tooltip="Actions rapides : Éditer, Supprimer">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCalculations.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-secondary)' }}>
                  🔍 Aucun compte épargne ne correspond au filtre sélectionné.
                </td>
              </tr>
            ) : (
              sortedCalculations.map(({ position, interest }) => (
                <SavingsTableRow
                  key={position.id}
                  position={position}
                  interest={interest}
                  onEditPosition={onEditPosition}
                  onDeletePosition={onDeletePosition}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

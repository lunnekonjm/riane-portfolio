'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';
import { exportPortfolioToCSV } from '@/utils/export';

interface BourseTableToolbarProps {
  refreshingPrices: boolean;
  onRefreshPrices: () => Promise<void>;
  undoLastAction: () => Promise<boolean>;
  redoLastAction: () => Promise<boolean>;
  canUndo: boolean;
  canRedo: boolean;
  saving: boolean;
  transactionsCount: number;
  positions: Position[];
  fxRates: Record<string, number>;
  onOpenTransactions: (ticker?: string) => void;
  onOpenRebalance: () => void;
  onEditPosition: (pos: Position | 'new') => void;
  totalMarketValEUR: number;
  totalMarketPLEUR: number;
  totalMarketPLPct: number;
  totalMarketMonthlyDCA: number;
}

export function BourseTableToolbar({
  refreshingPrices,
  onRefreshPrices,
  undoLastAction,
  redoLastAction,
  canUndo,
  canRedo,
  saving,
  transactionsCount,
  positions,
  fxRates,
  onOpenTransactions,
  onOpenRebalance,
  onEditPosition,
  totalMarketValEUR,
  totalMarketPLEUR,
  totalMarketPLPct,
  totalMarketMonthlyDCA,
}: BourseTableToolbarProps) {
  return (
    <>
      <div className="card-header" style={{ flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>📈</span>
          <div>
            <span className="card-title">Portefeuille Bourse &amp; Marchés</span>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              Actions, ETF Core/Satellite, PEA, PEA-PME &amp; CTO
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-ghost"
            style={{ padding: '6px 10px', fontSize: 12 }}
            onClick={onRefreshPrices}
            disabled={refreshingPrices}
            data-tooltip="Actualiser les cours en direct via Yahoo Finance &amp; Finnhub"
            id="refresh-prices-btn"
          >
            {refreshingPrices ? <span className="loading-spinner" /> : '⚡ Actualiser'}
          </button>

          {/* Undo / Redo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-tertiary)', padding: '2px 4px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={undoLastAction}
              disabled={!canUndo || saving}
              title="Annuler la dernière modification (Ctrl+Z)"
              style={{ padding: '4px 8px', fontSize: 13, opacity: canUndo ? 1 : 0.4 }}
            >
              ↩️
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={redoLastAction}
              disabled={!canRedo || saving}
              title="Rétablir la modification (Ctrl+Y)"
              style={{ padding: '4px 8px', fontSize: 13, opacity: canRedo ? 1 : 0.4 }}
            >
              ↪️
            </button>
          </div>

          <button
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: 12 }}
            onClick={() => onOpenTransactions()}
            data-tooltip="Journal des transactions et historique d'achats"
            id="transactions-history-btn"
          >
            📜 Historique ({transactionsCount})
          </button>
          <button
            className="btn btn-secondary"
            style={{
              padding: '6px 10px',
              fontSize: 12,
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
              borderColor: 'var(--accent-cyan)',
              color: 'var(--accent-cyan)',
              fontWeight: 700,
            }}
            onClick={onOpenRebalance}
            data-tooltip="Rééquilibrer intelligemment par flux DCA / Épargne"
            id="rebalance-flow-btn"
          >
            🎯 Flux DCA
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: 12 }}
            onClick={() => exportPortfolioToCSV(positions, fxRates)}
            disabled={positions.length === 0}
            data-tooltip="Exporter le portefeuille complet au format CSV"
            id="export-csv-btn"
          >
            📥 CSV
          </button>
          <button
            className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700 }}
            onClick={() => onEditPosition('new')}
            data-tooltip="Ajouter une nouvelle ligne d'actif au portefeuille"
            id="add-position-btn"
          >
            ➕ Ajouter
          </button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 18 }}>
        <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px' }}>
            Valeur Bourse Totale
          </span>
          <strong className="mono" style={{ fontSize: 20, color: 'var(--accent-cyan)', fontWeight: 800, marginTop: 4, display: 'block' }}>
            {totalMarketValEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </strong>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px' }}>
            Plus-Value Latente Totale
          </span>
          <strong className="mono" style={{ fontSize: 20, color: totalMarketPLEUR >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 800, marginTop: 4, display: 'block' }}>
            {totalMarketPLEUR >= 0 ? '+' : ''}{totalMarketPLEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} ({totalMarketPLEUR >= 0 ? '+' : ''}{totalMarketPLPct.toFixed(1)}%)
          </strong>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px' }}>
            Investissement Mensuel (DCA)
          </span>
          <strong className="mono" style={{ fontSize: 20, color: 'var(--accent-amber)', fontWeight: 800, marginTop: 4, display: 'block' }}>
            +{totalMarketMonthlyDCA.toLocaleString('fr-FR')} € /mois
          </strong>
        </div>
      </div>
    </>
  );
}

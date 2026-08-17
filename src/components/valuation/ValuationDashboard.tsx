'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';
import { VALUATION_STOCK_KEYS } from '@/data/valuationData';
import { useValuationDashboardState } from '@/hooks/useValuationDashboardState';
import { ValuationOverviewMatrix } from './ValuationOverviewMatrix';
import { ValuationHistoryPanel } from './ValuationHistoryPanel';
import { ValuationConsensusCard } from './ValuationConsensusCard';
import { ValuationAIDiagnostic } from './ValuationAIDiagnostic';
import { ValuationSimulator } from './ValuationSimulator';
import { ValuationPickerModal } from './ValuationPickerModal';
import { ValuationStockDetailCard } from './ValuationStockDetailCard';

interface ValuationDashboardProps {
  positions?: Position[];
}

export const ValuationDashboard: React.FC<ValuationDashboardProps> = ({ positions = [] }) => {
  const {
    activeKey,
    setActiveKey,
    activeView,
    setActiveView,
    isPickerOpen,
    setIsPickerOpen,
    searchQuery,
    setSearchQuery,
    filterHeldOnly,
    setFilterHeldOnly,
    stock,
    val,
    currentIndex,
    handlePrev,
    handleNext,
    isStockHeld,
    matchingPosition,
    totalHeldInValuation,
    filteredSections,
  } = useValuationDashboardState(positions);

  const dotClass =
    stock.story === 'good' ? 'val-dot-good' : stock.story === 'bad' ? 'val-dot-bad' : 'val-dot-warn';

  return (
    <div className="val-container">
      {/* ── App Header ── */}
      <header className="val-header">
        <div>
          <div className="val-header-subtitle">
            <span className="val-pulse-dot" />
            <span>Cours de Bourse vs Fondamentaux Réels · Données Institutionnelles 2026</span>
          </div>
          <h1 className="val-title">
            <span>Prix</span> <span className="val-title-neq">≠</span> <span>Valeur</span>
          </h1>
          <p className="val-header-desc">
            À long terme, le cours d&apos;une action (<span style={{ color: '#f59e0b', fontWeight: 600 }}>en orange</span>) tend à suivre la trajectoire de ses résultats réels (<span style={{ color: '#06b6d4', fontWeight: 600 }}>BPA ou Chiffre d&apos;Affaires en bleu</span>). Vingt valeurs analysées avec mémoire temporelle, consensus et IA.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="val-nav-tabs">
          <button
            type="button"
            className={`val-nav-tab ${activeView === 'detail' ? 'val-nav-tab-active' : ''}`}
            onClick={() => setActiveView('detail')}
          >
            📊 Vue Détaillée
          </button>
          <button
            type="button"
            className={`val-nav-tab ${activeView === 'matrix' ? 'val-nav-tab-active' : ''}`}
            onClick={() => setActiveView('matrix')}
          >
            📐 Matrice 20 Valeurs
          </button>
        </div>
      </header>

      {/* ── Stock Selector Bar (Visible in Detail View) ── */}
      {activeView === 'detail' && (
        <div className="val-stock-bar">
          <div className="val-stock-bar-left">
            <button
              type="button"
              className="val-btn"
              onClick={handlePrev}
              title="Valeur précédente (Flèche Gauche)"
            >
              ← Précédent
            </button>

            {/* Quick Picker Trigger */}
            <button
              type="button"
              className="val-selector-trigger"
              onClick={() => setIsPickerOpen(true)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`val-dot ${dotClass}`} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, color: '#ffffff', fontSize: 14 }}>
                    {stock.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
                    {stock.tick} · {stock.categoryLabel}
                  </div>
                </div>
              </div>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>▼ Changer (20)</span>
            </button>

            <button
              type="button"
              className="val-btn"
              onClick={handleNext}
              title="Valeur suivante (Flèche Droite)"
            >
              Suivant →
            </button>
          </div>

          <div className="val-stock-bar-right">
            {matchingPosition && (
              <span
                style={{
                  fontSize: 11,
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--accent-emerald)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontWeight: 700,
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                💼 Détenu : {matchingPosition.quantity} parts ({((matchingPosition.quantity || 0) * (matchingPosition.currentPrice || matchingPosition.avgPrice || 0)).toLocaleString('fr-FR')} €)
              </span>
            )}
            <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
              {currentIndex + 1} / {VALUATION_STOCK_KEYS.length}
            </span>
          </div>
        </div>
      )}

      {/* ── Stock Picker Modal ── */}
      <ValuationPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        activeKey={activeKey}
        onSelectKey={(k) => setActiveKey(k)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterHeldOnly={filterHeldOnly}
        setFilterHeldOnly={setFilterHeldOnly}
        totalHeldInValuation={totalHeldInValuation}
        filteredSections={filteredSections}
        isStockHeld={isStockHeld}
      />

      {/* ── Main View Switcher ── */}
      {activeView === 'matrix' ? (
        <ValuationOverviewMatrix
          selectedKey={activeKey}
          onSelectStock={(k) => {
            setActiveKey(k);
            setActiveView('detail');
          }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* ── Main Stock Detail Card ── */}
          <ValuationStockDetailCard
            stock={stock}
            val={val}
            matchingPosition={matchingPosition}
          />

          {/* ── 2 Columns: Consensus Analystes + Diagnostic IA ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            <ValuationConsensusCard stock={stock} val={val} />
            <ValuationAIDiagnostic stock={stock} val={val} />
          </div>

          {/* ── Valuation Simulator ── */}
          <ValuationSimulator stock={stock} val={val} />

          {/* ── Historical Series Table ── */}
          <ValuationHistoryPanel stock={stock} val={val} />
        </div>
      )}
    </div>
  );
};

'use client';

import React from 'react';

interface SavingsTableToolbarProps {
  savingsPositionsCount: number;
  onRefreshSavings?: () => void;
  refreshing?: boolean;
  onAddSavingsPosition: () => void;
  totalValue: number;
  totalAnnualInterest: number;
  totalMonthlyDCA: number;
  savingsFilterTabs: { id: string; label: string }[];
  selectedSavingsEnvelope: string;
  setSelectedSavingsEnvelope: (envelope: string) => void;
}

export function SavingsTableToolbar({
  savingsPositionsCount,
  onRefreshSavings,
  refreshing,
  onAddSavingsPosition,
  totalValue,
  totalAnnualInterest,
  totalMonthlyDCA,
  savingsFilterTabs,
  selectedSavingsEnvelope,
  setSelectedSavingsEnvelope,
}: SavingsTableToolbarProps) {
  return (
    <>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 24 }}>🛡️</span>
            <h3 style={{ fontSize: 18, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
              Épargne &amp; Patrimoine Hors-Bourse ({savingsPositionsCount})
            </h3>
            <span className="badge badge-emerald" style={{ fontSize: 12, padding: '4px 10px', fontWeight: 600 }}>Règle des Quinzaines &amp; Plus-Value Latente</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
            Suivi des livrets réglementés (Art. R221-3 CMF), fonds d&apos;épargne salariale et assurance-vie.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {onRefreshSavings && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onRefreshSavings}
              disabled={refreshing}
              style={{ fontSize: 13, padding: '8px 14px' }}
              title="Recalculer les intérêts quinzaines et actualiser les livrets"
              id="refresh-savings-btn"
            >
              {refreshing ? <span className="loading-spinner" /> : '🛡️'} Actualiser Épargne
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={onAddSavingsPosition} style={{ fontSize: 13, padding: '8px 14px' }}>
            ➕ Ajouter un compte épargne
          </button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 18 }}>
        <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px' }}>
            Épargne Totale Cumulée
          </span>
          <strong className="mono" style={{ fontSize: 20, color: 'var(--accent-cyan)', fontWeight: 800, marginTop: 4, display: 'block' }}>
            {totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </strong>
        </div>

        <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px' }}>
            Intérêts Annuels Projetés
          </span>
          <strong className="mono" style={{ fontSize: 20, color: 'var(--accent-emerald)', fontWeight: 800, marginTop: 4, display: 'block' }}>
            +{totalAnnualInterest.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} /an
          </strong>
        </div>

        <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px' }}>
            Épargne Mensuelle Programmée
          </span>
          <strong className="mono" style={{ fontSize: 20, color: 'var(--accent-amber)', fontWeight: 800, marginTop: 4, display: 'block' }}>
            +{totalMonthlyDCA.toLocaleString('fr-FR')} € /mois
          </strong>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, padding: '0 4px' }}>
        {savingsFilterTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`btn ${selectedSavingsEnvelope === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 'var(--text-xs)', padding: '4px 10px', borderRadius: 20 }}
            onClick={() => setSelectedSavingsEnvelope(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </>
  );
}

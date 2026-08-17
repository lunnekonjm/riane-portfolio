'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';

interface DashboardTotalValueKpiCardProps {
  adjustInflation: boolean;
  displayTotalValue: number;
  displayBourseVal: number;
  displayCryptoVal: number;
  displaySavingsVal: number;
  positions: Position[];
  filledPositions: Position[];
  showTotalValueDropdown: boolean;
  setShowTotalValueDropdown: (v: boolean) => void;
}

export function DashboardTotalValueKpiCard({
  adjustInflation,
  displayTotalValue,
  displayBourseVal,
  displayCryptoVal,
  displaySavingsVal,
  positions,
  filledPositions,
  showTotalValueDropdown,
  setShowTotalValueDropdown,
}: DashboardTotalValueKpiCardProps) {
  return (
    <div className="card" data-tooltip="Valeur marchande globale de votre patrimoine convertie en €">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="card-title text-sm font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {adjustInflation ? 'Valeur Réelle (Ajustée)' : 'Valeur Totale'}
        </span>
        <span className="badge-real">
          <span className="dot"></span> RÉEL
        </span>
      </div>
      <div className="card-value font-extrabold text-3xl" style={{ color: displayTotalValue > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
        {displayTotalValue > 0
          ? displayTotalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
          : '—'}
      </div>
      {displayTotalValue > 0 && (
        <div style={{ marginTop: 8, position: 'relative' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm text-xs font-semibold"
            style={{
              padding: '5px 10px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--accent-blue)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowTotalValueDropdown(!showTotalValueDropdown);
            }}
          >
            <span>📊 Répartition des Enveloppes</span>
            <span className="text-xs">{showTotalValueDropdown ? '▲' : '▼'}</span>
          </button>
          {showTotalValueDropdown && (
            <div className="popover-card">
              <div className="popover-header">
                <span>Répartition de la Valeur Totale</span>
              </div>
              <div className="popover-row">
                <span className="text-secondary">📈 Actions &amp; ETF</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>{displayBourseVal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</strong>
              </div>
              <div className="popover-row">
                <span className="text-secondary">🪙 Cryptomonnaies</span>
                <strong style={{ color: 'var(--accent-amber)' }}>{displayCryptoVal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</strong>
              </div>
              <div className="popover-row">
                <span className="text-secondary">🛡️ Épargne</span>
                <strong style={{ color: 'var(--accent-emerald)' }}>{displaySavingsVal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</strong>
              </div>
            </div>
          )}
        </div>
      )}
      {displayTotalValue === 0 && <span className="text-sm text-muted">À renseigner</span>}

      {positions.length - filledPositions.length > 0 && (
        <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px dashed var(--accent-amber)', borderRadius: 8, padding: '10px 14px', marginTop: 12, lineHeight: 1.4 }} className="text-xs text-secondary">
          <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>
            {positions.length - filledPositions.length} position{positions.length - filledPositions.length > 1 ? 's' : ''}
          </span>{' '}
          sans prix ni PRU renseigné est provisoirement valorisée à titre indicatif.<br />
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 500, behavior: 'smooth' }); }} style={{ color: 'var(--accent-cyan)', textDecoration: 'underline', marginTop: 4, display: 'inline-block', fontWeight: 600 }}>
            Compléter maintenant →
          </a>
        </div>
      )}
      <span className="text-sm font-bold" style={{ color: 'var(--accent-cyan)', display: 'block', marginTop: 12 }}>
        ✓ {filledPositions.length}/{positions.length} positions renseignées
      </span>
    </div>
  );
}

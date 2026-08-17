'use client';

import React from 'react';

interface DashboardTotalCostKpiCardProps {
  adjustInflation: boolean;
  displayTotalCost: number;
  displayBourseCostVal: number;
  displayCryptoCostVal: number;
  displaySavingsCostVal: number;
  showTotalCostDropdown: boolean;
  setShowTotalCostDropdown: (v: boolean) => void;
  openGlossary: (term: string) => void;
}

export function DashboardTotalCostKpiCard({
  adjustInflation,
  displayTotalCost,
  displayBourseCostVal,
  displayCryptoCostVal,
  displaySavingsCostVal,
  showTotalCostDropdown,
  setShowTotalCostDropdown,
  openGlossary,
}: DashboardTotalCostKpiCardProps) {
  return (
    <div className="card" data-tooltip="Total des capitaux réellement investis (somme des PRU)">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="card-title text-sm font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {adjustInflation ? 'Coût Total Réel' : 'Coût Total (PRU)'}
        </span>
        <span className="badge-real">
          <span className="dot"></span> RÉEL
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-sm text-sm font-semibold"
          style={{ padding: '2px 8px', color: 'var(--accent-cyan)' }}
          onClick={() => openGlossary('PRU')}
          data-tooltip="Définition et calcul du PRU"
        >
          💡 PRU
        </button>
      </div>
      <div className="card-value font-extrabold text-3xl">
        {displayTotalCost > 0
          ? displayTotalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
          : '—'}
      </div>
      {displayTotalCost > 0 && (
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
              setShowTotalCostDropdown(!showTotalCostDropdown);
            }}
          >
            <span>📊 Détail des Apports</span>
            <span className="text-xs">{showTotalCostDropdown ? '▲' : '▼'}</span>
          </button>
          {showTotalCostDropdown && (
            <div className="popover-card">
              <div className="popover-header">
                <span>Apports Investis (PRU)</span>
              </div>
              <div className="popover-row">
                <span className="text-secondary">📈 Actions &amp; ETF (PRU)</span>
                <strong className="text-primary">{displayBourseCostVal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</strong>
              </div>
              <div className="popover-row">
                <span className="text-secondary">🪙 Cryptos (PRU)</span>
                <strong className="text-primary">{displayCryptoCostVal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</strong>
              </div>
              <div className="popover-row">
                <span className="text-secondary">🛡️ Épargne</span>
                <strong className="text-primary">{displaySavingsCostVal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</strong>
              </div>
            </div>
          )}
        </div>
      )}
      {displayTotalCost === 0 && <span className="text-sm text-muted">Entrez vos PRU réels</span>}
    </div>
  );
}

'use client';

import React from 'react';

interface DashboardGainLossKpiCardProps {
  adjustInflation: boolean;
  cumulativeInflationFactor: number;
  displayTotalCost: number;
  displayGainLoss: number;
  displayGainLossPercent: number;
  displayBourseGain: number;
  displayCryptoGain: number;
  displaySavingsGain: number;
  showGainLossDropdown: boolean;
  setShowGainLossDropdown: (v: boolean) => void;
  setShowNetDetailsModal: (v: boolean) => void;
  peaSeniority: 'under5' | 'over5';
  netLiquidationDetails: any;
}

export function DashboardGainLossKpiCard({
  adjustInflation,
  cumulativeInflationFactor,
  displayTotalCost,
  displayGainLoss,
  displayGainLossPercent,
  displayBourseGain,
  displayCryptoGain,
  displaySavingsGain,
  showGainLossDropdown,
  setShowGainLossDropdown,
  setShowNetDetailsModal,
  peaSeniority,
  netLiquidationDetails,
}: DashboardGainLossKpiCardProps) {
  return (
    <div className="card" data-tooltip="Plus ou moins-value latente et valeur nette de liquidation après impôts">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="card-title text-sm font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {adjustInflation ? 'Plus/Moins-Value Réelle' : 'Plus / Moins-Value'}
        </span>
        <span className="badge-real">
          <span className="dot"></span> RÉEL
        </span>
      </div>
      {displayTotalCost > 0 ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <div className={`card-value font-extrabold text-3xl ${displayGainLoss >= 0 ? 'stat-gain' : 'stat-loss'}`}>
              {displayGainLoss >= 0 ? '+' : ''}{displayGainLoss.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </div>
            <span className={`stat-change text-sm font-bold ${displayGainLoss >= 0 ? 'positive' : 'negative'}`}>
              {displayGainLossPercent >= 0 ? '↑' : '↓'} {Math.abs(displayGainLossPercent).toFixed(2)}%
            </span>
          </div>

          <div style={{ marginTop: 14 }}>
            <span className="text-sm text-secondary font-semibold" style={{ display: 'block', marginBottom: 6 }}>Gain Net Après Fiscalité</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm text-xs font-semibold"
                onClick={() => setShowNetDetailsModal(true)}
                style={{
                  padding: '6px 10px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: 'var(--text-secondary)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)' }}></span>
                PEA {peaSeniority === 'over5' ? '> 5 ans' : '< 5 ans'} · charges {peaSeniority === 'over5' ? '18,6 %' : '31,4 %'} ⓘ
              </button>
              <span className={`text-xl font-extrabold ${(netLiquidationDetails.totalNetGain || 0) >= 0 ? 'stat-gain' : 'stat-loss'}`}>
                {(netLiquidationDetails.totalNetGain || 0) >= 0 ? '+' : ''}
                {((netLiquidationDetails.totalNetGain || 0) / cumulativeInflationFactor).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
          </div>

          <div style={{ marginTop: 10, position: 'relative' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm text-xs font-semibold"
              style={{
                padding: '5px 10px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-emerald)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setShowGainLossDropdown(!showGainLossDropdown);
              }}
            >
              <span>📊 Ventilation des Gains</span>
              <span className="text-xs">{showGainLossDropdown ? '▲' : '▼'}</span>
            </button>
            {showGainLossDropdown && (
              <div className="popover-card">
                <div className="popover-header">
                  <span>Plus-Values &amp; Intérêts Latents</span>
                </div>
                <div className="popover-row">
                  <span className="text-secondary">📈 Plus-values Actions &amp; ETF</span>
                  <strong style={{ color: displayBourseGain >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    {displayBourseGain >= 0 ? '+' : ''}{displayBourseGain.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                  </strong>
                </div>
                <div className="popover-row">
                  <span className="text-secondary">🪙 Plus-values Crypto</span>
                  <strong style={{ color: displayCryptoGain >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    {displayCryptoGain >= 0 ? '+' : ''}{displayCryptoGain.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                  </strong>
                </div>
                <div className="popover-row">
                  <span className="text-secondary">🛡️ Intérêts d&apos;Épargne</span>
                  <strong style={{ color: displaySavingsGain >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    {displaySavingsGain >= 0 ? '+' : ''}{displaySavingsGain.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                  </strong>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="card-value text-muted">—</div>
          <span className="text-sm text-muted">Calculé depuis vos PRU</span>
        </>
      )}
    </div>
  );
}

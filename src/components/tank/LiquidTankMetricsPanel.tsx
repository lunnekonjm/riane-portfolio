'use client';

import React from 'react';

interface LiquidTankMetricsPanelProps {
  runwayMonths: number;
  selectedTargetMonths: number;
  currentTarget: number;
  totalAvailableEmergencySavings: number;
  fillPercent: number;
  onOpenCrisisModal?: () => void;
}

export function LiquidTankMetricsPanel({
  runwayMonths,
  selectedTargetMonths,
  currentTarget,
  totalAvailableEmergencySavings,
  fillPercent,
  onOpenCrisisModal,
}: LiquidTankMetricsPanelProps) {
  return (
    <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Autonomie (Runway)</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
            {runwayMonths} <span style={{ fontSize: 13, fontWeight: 600 }}>mois</span>
          </span>
        </div>

        <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Cible {selectedTargetMonths} mois</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {Math.round(currentTarget).toLocaleString('fr-FR')} <span style={{ fontSize: 13, fontWeight: 600 }}>€</span>
          </span>
        </div>
      </div>

      {/* Jauge horizontale de progression */}
      <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Progression vers la cible {selectedTargetMonths} mois :</span>
          <span style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>
            {Math.round(totalAvailableEmergencySavings).toLocaleString('fr-FR')} / {Math.round(currentTarget).toLocaleString('fr-FR')} €
          </span>
        </div>
        <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${fillPercent}%`,
              background: 'linear-gradient(90deg, #f59e0b, #10b981)',
              borderRadius: 4,
              transition: 'width 0.6s ease',
            }}
          />
        </div>
      </div>

      {onOpenCrisisModal && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={onOpenCrisisModal}
          style={{
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.8) 0%, rgba(245, 158, 11, 0.8) 100%)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            fontWeight: 700,
            fontSize: 13,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(244, 63, 94, 0.3)',
          }}
        >
          <span>🚨 Ouvrir le Simulateur de Crise &amp; Financement CLIC</span>
        </button>
      )}
    </div>
  );
}

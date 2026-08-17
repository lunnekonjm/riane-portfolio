'use client';

import React from 'react';

interface AuraWizardHeaderProps {
  periodDays: number;
  setPeriodDays: (days: number) => void;
  onClose: () => void;
}

export function AuraWizardHeader({
  periodDays,
  setPeriodDays,
  onClose,
}: AuraWizardHeaderProps) {
  return (
    <div
      style={{
        padding: '18px 22px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(15, 23, 42, 0.8)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
          }}
        >
          🪄
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
              Radar &amp; Validation des Flux Bancaires
            </h3>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 6,
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: 'var(--accent-emerald)',
                fontSize: 10.5,
                fontWeight: 800,
              }}
            >
              BoursoBank DSP2
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
            Contrôlez, cochez/décochez chaque transaction unitaire et ajustez les montants réels avant application à votre budget.
          </p>
        </div>
      </div>

      {/* Period Filter & Close */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <select
          value={periodDays}
          onChange={(e) => setPeriodDays(parseInt(e.target.value, 10))}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            background: 'rgba(10, 14, 23, 0.9)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            color: '#cbd5e1',
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <option value={30}>Dernier mois (30 jours)</option>
          <option value={90}>Moyenne 3 mois (90 jours)</option>
          <option value={0}>Toutes les transactions</option>
        </select>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#cbd5e1',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

'use client';

import React from 'react';

interface AuraWizardSummaryBarProps {
  netSalary: number;
  totalSelectedEuro: number;
  totalSelectedPercent: number;
  estimatedResteAVivre: number;
  fmtEur: (val: number) => string;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function AuraWizardSummaryBar({
  netSalary,
  totalSelectedEuro,
  totalSelectedPercent,
  estimatedResteAVivre,
  fmtEur,
  onSelectAll,
  onDeselectAll,
}: AuraWizardSummaryBarProps) {
  return (
    <div
      style={{
        padding: '12px 22px',
        background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Salaire Net de Référence</span>
          <strong style={{ fontSize: 14, color: '#ffffff' }}>{fmtEur(netSalary)}</strong>
        </div>

        <div style={{ height: 28, width: 1, background: 'rgba(255, 255, 255, 0.12)' }} />

        <div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Total Flux Sélectionnés</span>
          <strong style={{ fontSize: 14, color: 'var(--accent-cyan)' }}>
            {fmtEur(totalSelectedEuro)} ({totalSelectedPercent.toFixed(1)}%)
          </strong>
        </div>

        <div style={{ height: 28, width: 1, background: 'rgba(255, 255, 255, 0.12)' }} />

        <div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Reste à Vivre Prévisionnel</span>
          <strong
            style={{
              fontSize: 14,
              color: estimatedResteAVivre >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            }}
          >
            {fmtEur(estimatedResteAVivre)}
          </strong>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={onSelectAll}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Tout cocher
        </button>
        <button
          type="button"
          onClick={onDeselectAll}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Tout décocher
        </button>
      </div>
    </div>
  );
}

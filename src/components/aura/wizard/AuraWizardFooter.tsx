'use client';

import React from 'react';

interface AuraWizardFooterProps {
  selectedCount: number;
  totalSelectedEuro: number;
  totalSelectedPercent: number;
  fmtEur: (v: number) => string;
  onClose: () => void;
  onValidateAndApply: () => void;
}

export function AuraWizardFooter({
  selectedCount,
  totalSelectedEuro,
  totalSelectedPercent,
  fmtEur,
  onClose,
  onValidateAndApply,
}: AuraWizardFooterProps) {
  return (
    <div
      style={{
        padding: '14px 22px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(15, 23, 42, 0.95)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 12, color: '#94a3b8' }}>
        <span style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>{selectedCount}</span> poste(s) sélectionné(s) • Total :{' '}
        <strong style={{ color: '#ffffff' }}>{fmtEur(totalSelectedEuro)}</strong> ({totalSelectedPercent.toFixed(1)}%)
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#cbd5e1',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Annuler
        </button>

        <button
          type="button"
          onClick={onValidateAndApply}
          disabled={selectedCount === 0}
          style={{
            padding: '8px 20px',
            borderRadius: 10,
            background: selectedCount > 0 ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' : 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: selectedCount > 0 ? '#0a0e17' : '#64748b',
            fontSize: 12.5,
            fontWeight: 900,
            cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
            boxShadow: selectedCount > 0 ? '0 4px 16px rgba(6, 182, 212, 0.35)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>⚡ Appliquer au Budget ({selectedCount})</span>
        </button>
      </div>
    </div>
  );
}

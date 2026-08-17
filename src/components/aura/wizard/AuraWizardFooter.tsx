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
      className="aura-wizard-footer"
      style={{
        padding: '12px 18px max(14px, env(safe-area-inset-bottom, 14px)) 18px',
        borderTop: '1px solid rgba(6, 182, 212, 0.3)',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 14, 23, 1) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 50,
        boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.7)',
        flexShrink: 0,
      }}
    >
      {/* Top summary row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 6,
          fontSize: 12,
          color: '#94a3b8',
        }}
      >
        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: 6,
              background: 'rgba(6, 182, 212, 0.18)',
              color: 'var(--accent-cyan)',
              fontWeight: 800,
              marginRight: 6,
              border: '1px solid rgba(6, 182, 212, 0.35)',
            }}
          >
            {selectedCount} poste(s) sélectionné(s)
          </span>
        </div>
        <div>
          Total :{' '}
          <strong style={{ color: '#ffffff', fontSize: 13 }}>{fmtEur(totalSelectedEuro)}</strong>{' '}
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>({totalSelectedPercent.toFixed(1)}%)</span>
        </div>
      </div>

      {/* Action buttons row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#cbd5e1',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            minHeight: 44,
            flexShrink: 0,
          }}
        >
          Annuler
        </button>

        <button
          type="button"
          id="aura-wizard-validate-btn"
          onClick={onValidateAndApply}
          disabled={selectedCount === 0}
          style={{
            flex: 1,
            padding: '12px 20px',
            borderRadius: 12,
            background:
              selectedCount > 0
                ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
                : 'rgba(255, 255, 255, 0.08)',
            border: selectedCount > 0 ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
            color: selectedCount > 0 ? '#021024' : '#64748b',
            fontSize: 14,
            fontWeight: 900,
            cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
            boxShadow:
              selectedCount > 0
                ? '0 4px 20px rgba(6, 182, 212, 0.5), 0 0 12px rgba(59, 130, 246, 0.3)'
                : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            minHeight: 44,
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: 16 }}>⚡</span>
          <span>Valider &amp; Appliquer ({selectedCount})</span>
        </button>
      </div>
    </div>
  );
}

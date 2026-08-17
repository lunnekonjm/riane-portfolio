'use client';

import React from 'react';

interface ArbitrageModalProps {
  accountBalance: number;
  arbitragePeaAmount: number;
  setArbitragePeaAmount: (val: number) => void;
  onApplyArbitrage: (amount: number) => void;
  onClose: () => void;
}

export function ArbitrageModal({
  accountBalance,
  arbitragePeaAmount,
  setArbitragePeaAmount,
  onApplyArbitrage,
  onClose,
}: ArbitrageModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 500,
          padding: 24,
          borderRadius: 20,
          background: '#0f172a',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#ffffff' }}>Arbitrage Anti-Découvert Proactif</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '6px 12px', borderRadius: 8, background: '#1e293b', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: 12,
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            fontSize: 12,
          }}
        >
          <strong style={{ color: 'var(--accent-rose)' }}>Déficit constaté : {accountBalance.toFixed(2)} €</strong>
          <p style={{ margin: '4px 0 0 0', color: '#cbd5e1', lineHeight: 1.4 }}>
            Vous pouvez moduler temporairement votre allocation PEA pour absorber ce découvert sans impacter vos charges incompressibles.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Allocation PEA Simulée
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="range"
              min="0"
              max="1500"
              step="50"
              value={arbitragePeaAmount}
              onChange={(e) => setArbitragePeaAmount(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent-cyan)' }}
            />
            <strong style={{ fontSize: 14, fontWeight: 900, color: 'var(--accent-cyan)', minWidth: 70, textAlign: 'right' }}>
              {arbitragePeaAmount.toFixed(0)} €
            </strong>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 14px', borderRadius: 10, background: '#1e293b', border: 'none', color: '#cbd5e1', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onApplyArbitrage(arbitragePeaAmount)}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              background: 'var(--accent-cyan)',
              border: 'none',
              color: '#0a0e17',
              fontSize: 12,
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            Appliquer l&apos;arbitrage
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';

interface EditBalanceModalProps {
  accountBalance: number;
  onSave: (balance: number) => void;
  onClose: () => void;
}

export function EditBalanceModal({ accountBalance, onSave, onClose }: EditBalanceModalProps) {
  const [val, setVal] = useState<number>(accountBalance);

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
          maxWidth: 380,
          padding: 24,
          borderRadius: 20,
          background: '#0f172a',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#ffffff' }}>Solde Réel Compte Courant</h3>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
          Indiquez le solde réel de votre compte bancaire pour calibrer le tampon de sécurité :
        </p>
        <input
          type="number"
          step="0.01"
          value={val}
          onChange={(e) => setVal(parseFloat(e.target.value) || 0)}
          id="input-account-balance"
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(10, 14, 23, 0.95)',
            border: '1px solid rgba(6, 182, 212, 0.5)',
            color: 'var(--accent-emerald)',
            fontSize: 18,
            fontWeight: 800,
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 14px', borderRadius: 10, background: '#1e293b', border: 'none', color: '#cbd5e1', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onSave(val)}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              background: 'var(--accent-emerald)',
              border: 'none',
              color: '#042f2e',
              fontSize: 12,
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

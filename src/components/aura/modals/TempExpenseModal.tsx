'use client';

import React, { useState } from 'react';
import type { TemporaryExpenseItem } from '@/engines/bankingAnalyzerEngine';

interface TempExpenseModalProps {
  isEdit: boolean;
  editingTempExpense: TemporaryExpenseItem | null;
  defaultStartPeriod: string;
  onSave: (data: { label: string; monthlyAmount: number; durationMonths: number; startPeriod: string }) => void;
  onClose: () => void;
}

export function TempExpenseModal({
  isEdit,
  editingTempExpense,
  defaultStartPeriod,
  onSave,
  onClose,
}: TempExpenseModalProps) {
  const [label, setLabel] = useState(editingTempExpense?.label || 'Dentiste Couronne');
  const [monthlyAmount, setMonthlyAmount] = useState(editingTempExpense?.monthlyAmount || 164.5);
  const [durationMonths, setDurationMonths] = useState(editingTempExpense?.durationMonths || 12);
  const [startPeriod, setStartPeriod] = useState(editingTempExpense?.startPeriod || defaultStartPeriod);

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
          maxWidth: 440,
          padding: 24,
          borderRadius: 20,
          background: '#0f172a',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#ffffff' }}>
          {isEdit ? 'Modifier l\'Échéancier' : 'Déclarer un Échéancier Temporaire'}
        </h3>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
          Dépense étalée à durée déterminée (ex: soins dentaires, prêt personnel, achat N fois) :
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>Intitulé</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              id="input-temp-label"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(10, 14, 23, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontWeight: 700,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>Montant Mensuel (€)</label>
              <input
                type="number"
                step="0.01"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(parseFloat(e.target.value) || 0)}
                id="input-temp-amount"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'rgba(10, 14, 23, 0.95)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  color: 'var(--accent-rose)',
                  fontWeight: 800,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>Durée (Mois)</label>
              <input
                type="number"
                value={durationMonths}
                onChange={(e) => setDurationMonths(parseInt(e.target.value, 10) || 1)}
                id="input-temp-duration"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'rgba(10, 14, 23, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontWeight: 700,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>Mois Début (AAAA-MM)</label>
            <input
              type="text"
              value={startPeriod}
              onChange={(e) => setStartPeriod(e.target.value)}
              id="input-temp-start"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(10, 14, 23, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontWeight: 700,
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 14px', borderRadius: 10, background: '#1e293b', border: 'none', color: '#cbd5e1', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onSave({ label, monthlyAmount, durationMonths, startPeriod })}
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
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

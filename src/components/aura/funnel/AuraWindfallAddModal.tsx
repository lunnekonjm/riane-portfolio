'use client';

import React, { useState } from 'react';
import type { WindfallEvent } from '../AuraSavingsFunnelView';

interface AuraWindfallAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: WindfallEvent) => void;
}

export function AuraWindfallAddModal({ isOpen, onClose, onAdd }: AuraWindfallAddModalProps) {
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState<number>(500);
  const [type, setType] = useState<'bonus' | 'tontine' | 'refund' | 'other'>('bonus');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!label.trim() || amount <= 0) return;
    const item: WindfallEvent = {
      id: `w-${Date.now()}`,
      label: label.trim(),
      amount,
      date: new Date().toISOString().slice(0, 10),
      type,
    };
    onAdd(item);
    setLabel('');
    setAmount(500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 460,
          padding: 24,
          borderRadius: 16,
          border: '1px solid var(--accent-emerald)',
          background: 'var(--bg-primary)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
            Ajouter un Revenu Exceptionnel
          </h3>
          <button type="button" className="btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Libellé (ex: Prime, Virement Tontine)
            </label>
            <input
              type="text"
              className="input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex: Prime de performance"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Montant Net (€)
            </label>
            <input
              type="number"
              className="input"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Type
            </label>
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              style={{ width: '100%' }}
            >
              <option value="bonus">Prime / Bonus d'entreprise</option>
              <option value="tontine">Gain / Retour Tontine</option>
              <option value="refund">Remboursement / Avoir</option>
              <option value="other">Autre rentrée</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontWeight: 700 }}
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

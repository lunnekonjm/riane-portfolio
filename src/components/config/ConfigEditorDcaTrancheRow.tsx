'use client';

import React from 'react';
import type { DCATranche } from '@/types/portfolio';
import CustomDatePicker from '@/components/CustomDatePicker';
import { getTodayDateString } from '@/utils/dcaHistoryHelper';

interface ConfigEditorDcaTrancheRowProps {
  tranche: DCATranche;
  handleUpdateTranche: (id: string, updates: Partial<DCATranche>) => void;
  handleDeleteTranche: (id: string) => void;
  canDelete: boolean;
}

export function ConfigEditorDcaTrancheRow({
  tranche,
  handleUpdateTranche,
  handleDeleteTranche,
  canDelete,
}: ConfigEditorDcaTrancheRowProps) {
  const isTrancheActive = !tranche.endDate || tranche.endDate >= getTodayDateString();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(110px, 1.2fr) minmax(110px, 1.2fr) minmax(90px, 1fr) minmax(110px, 1.5fr) 32px',
        gap: 8,
        alignItems: 'center',
        padding: '8px 10px',
        background: isTrancheActive ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-tertiary)',
        border: `1px solid ${isTrancheActive ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
        borderRadius: 8,
      }}
    >
      <div>
        <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: 2 }}>Début</label>
        <CustomDatePicker
          value={tranche.startDate}
          onChange={(val) => handleUpdateTranche(tranche.id, { startDate: val })}
        />
      </div>

      <div>
        <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: 2 }}>Fin</label>
        <CustomDatePicker
          value={tranche.endDate || ''}
          onChange={(val) => handleUpdateTranche(tranche.id, { endDate: val || undefined })}
        />
      </div>

      <div>
        <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: 2 }}>Montant</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <input
            type="number"
            step="50"
            min="0"
            className="input mono font-bold"
            style={{ padding: '6px 8px', fontSize: 12, color: isTrancheActive ? 'var(--accent-emerald)' : 'inherit' }}
            value={tranche.amount}
            onChange={(e) => handleUpdateTranche(tranche.id, { amount: parseFloat(e.target.value) || 0 })}
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>€</span>
        </div>
      </div>

      <div>
        <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: 2 }}>Motif / Label</label>
        <input
          type="text"
          className="input"
          style={{ padding: '6px 8px', fontSize: 12 }}
          value={tranche.label || ''}
          placeholder="ex: Promotion, Bonus..."
          onChange={(e) => handleUpdateTranche(tranche.id, { label: e.target.value })}
        />
      </div>

      <button
        type="button"
        className="btn btn-ghost btn-sm"
        style={{ color: 'var(--accent-rose)', padding: 4, height: 28, width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        title="Supprimer ce palier"
        onClick={() => handleDeleteTranche(tranche.id)}
        disabled={!canDelete}
      >
        ✕
      </button>
    </div>
  );
}

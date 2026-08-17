'use client';

import React from 'react';
import type { DCATranche } from '@/types/portfolio';
import CustomDatePicker from '@/components/CustomDatePicker';

interface DcaMultiTierRowProps {
  tranche: DCATranche;
  idx: number;
  totalTranches: number;
  currencySymbol: string;
  onUpdateTranche: (id: string, updates: Partial<DCATranche>) => void;
  onDeleteTranche: (id: string) => void;
}

export function DcaMultiTierRow({
  tranche,
  idx,
  totalTranches,
  currencySymbol,
  onUpdateTranche,
  onDeleteTranche,
}: DcaMultiTierRowProps) {
  const todayIso = new Date().toISOString().split('T')[0];
  const isFuture = tranche.startDate > todayIso;
  const isPast = Boolean(tranche.endDate && tranche.endDate < todayIso);
  const isCurrent = !isFuture && !isPast;
  const isLast = idx === totalTranches - 1;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(120px, 1fr) minmax(120px, 1fr) minmax(90px, 0.9fr) minmax(110px, 1.1fr) 32px',
        gap: 8,
        alignItems: 'center',
        padding: '8px 10px',
        background: isCurrent ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-secondary)',
        border: `1px solid ${isCurrent ? 'rgba(16, 185, 129, 0.4)' : isFuture ? 'rgba(6, 182, 212, 0.3)' : 'var(--border-subtle)'}`,
        borderRadius: 8,
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
          <label style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
            Début #{idx + 1}
          </label>
          {isCurrent && (
            <span style={{ fontSize: 8, padding: '1px 3px', borderRadius: 3, background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)', fontWeight: 700 }}>
              En cours
            </span>
          )}
          {isFuture && (
            <span style={{ fontSize: 8, padding: '1px 3px', borderRadius: 3, background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
              Prévu
            </span>
          )}
        </div>
        <CustomDatePicker
          value={tranche.startDate}
          onChange={(newDate) => {
            onUpdateTranche(tranche.id, { startDate: newDate });
          }}
        />
      </div>

      <div>
        <label style={{ fontSize: 9, color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>
          Fin {isLast ? '(En cours)' : `#${idx + 1}`}
        </label>
        {isLast ? (
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '6px 8px', display: 'block', background: 'var(--bg-tertiary)', borderRadius: 6, border: '1px dashed var(--border-subtle)' }}>
            Indéfinie →
          </span>
        ) : (
          <CustomDatePicker
            value={tranche.endDate || ''}
            onChange={(newEndDate) => {
              onUpdateTranche(tranche.id, { endDate: newEndDate });
            }}
          />
        )}
      </div>

      <div>
        <label style={{ fontSize: 9, color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>
          Montant ({currencySymbol})
        </label>
        <input
          className="input mono"
          type="number"
          step="10"
          min="0"
          style={{ fontSize: 12, padding: '6px 8px' }}
          value={tranche.amount}
          onChange={(e) => {
            const val = parseFloat(e.target.value) || 0;
            onUpdateTranche(tranche.id, { amount: val });
          }}
        />
      </div>

      <div>
        <label style={{ fontSize: 9, color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>
          Fréquence
        </label>
        <select
          className="input"
          style={{ fontSize: 11, padding: '6px 6px' }}
          value={tranche.frequency || 'monthly'}
          onChange={(e) => {
            const val = e.target.value as any;
            onUpdateTranche(tranche.id, { frequency: val });
          }}
        >
          <option value="monthly">Mensuel</option>
          <option value="quarterly">Trimestriel</option>
          <option value="semestrial">Semestriel</option>
          <option value="annual">Annuel</option>
        </select>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--accent-rose)', padding: '4px', minWidth: 24, fontSize: 14 }}
          onClick={() => onDeleteTranche(tranche.id)}
          title="Supprimer ce palier"
        >
          ×
        </button>
      </div>
    </div>
  );
}

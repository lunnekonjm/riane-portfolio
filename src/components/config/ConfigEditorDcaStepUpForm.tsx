'use client';

import React from 'react';
import CustomDatePicker from '@/components/CustomDatePicker';

interface ConfigEditorDcaStepUpFormProps {
  showAddTrancheForm: boolean;
  setShowAddTrancheForm: (val: boolean) => void;
  newTrancheDate: string;
  setNewTrancheDate: (val: string) => void;
  newTrancheAmount: number;
  setNewTrancheAmount: (val: number) => void;
  newTrancheReason: string;
  setNewTrancheReason: (val: string) => void;
  handleAddStepUp: (e: React.FormEvent) => void;
}

export function ConfigEditorDcaStepUpForm({
  showAddTrancheForm,
  setShowAddTrancheForm,
  newTrancheDate,
  setNewTrancheDate,
  newTrancheAmount,
  setNewTrancheAmount,
  newTrancheReason,
  setNewTrancheReason,
  handleAddStepUp,
}: ConfigEditorDcaStepUpFormProps) {
  if (!showAddTrancheForm) {
    return (
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        style={{ width: '100%', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        onClick={() => setShowAddTrancheForm(true)}
      >
        <span>➕</span>
        <span>Ajouter une augmentation de DCA (Step-up)</span>
      </button>
    );
  }

  return (
    <div
      style={{
        padding: 12,
        background: 'var(--bg-tertiary)',
        borderRadius: 8,
        border: '1px dashed var(--accent-cyan)',
        marginBottom: 12,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--accent-cyan)' }}>
        🚀 Programmer un nouveau palier d&apos;épargne
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: 8, marginBottom: 8 }}>
        <div>
          <label className="form-label" style={{ fontSize: 11, marginBottom: 2 }}>Date d&apos;effet</label>
          <CustomDatePicker
            value={newTrancheDate}
            onChange={(val) => setNewTrancheDate(val)}
          />
        </div>
        <div>
          <label className="form-label" style={{ fontSize: 11 }}>Nouveau DCA (€/m)</label>
          <input
            type="number"
            step="50"
            min="0"
            className="input mono font-bold"
            style={{ fontSize: 12 }}
            value={newTrancheAmount}
            onChange={(e) => setNewTrancheAmount(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="form-label" style={{ fontSize: 11 }}>Motif / Commentaire</label>
          <input
            type="text"
            className="input"
            style={{ fontSize: 12 }}
            value={newTrancheReason}
            onChange={(e) => setNewTrancheReason(e.target.value)}
          />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddTrancheForm(false)}>
          Annuler
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={handleAddStepUp}>
          ✓ Valider le palier
        </button>
      </div>
    </div>
  );
}

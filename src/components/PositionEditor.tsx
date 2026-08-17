'use client';

import React, { useState, useEffect } from 'react';
import type { Position } from '@/types/portfolio';
import SavingsPositionForm from '@/components/position-editor/SavingsPositionForm';
import EnvelopeAssetTypeBar from '@/components/position-editor/EnvelopeAssetTypeBar';
import { PositionStandardForm } from '@/components/position-editor/PositionStandardForm';
import { PositionDeleteModal } from '@/components/position-editor/PositionDeleteModal';
import { usePositionEditorForm } from '@/hooks/usePositionEditorForm';
import { CURRENCY_OPTIONS } from '@/types/positionEditorOptions';

interface PositionEditorProps {
  position?: Position | null;
  initialEnvelope?: Position['envelope'];
  existingPositions?: Position[];
  onSave: (position: Position) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export default function PositionEditor({
  position,
  initialEnvelope,
  existingPositions,
  onSave,
  onClose,
  onDelete,
}: PositionEditorProps) {
  const [isDeletePositionModalOpen, setIsDeletePositionModalOpen] = useState(false);

  const formState = usePositionEditorForm({
    position: position || undefined,
    initialEnvelope,
    existingPositions,
    onSave,
    onClose,
  });

  const {
    form,
    setForm,
    isNew,
    setAllowDuplicateLine,
    duplicatePosition,
    handleSwitchToExisting,
    dcaStartDate,
    setDcaStartDate,
    initialDepositDate,
    setInitialDepositDate,
    depositsHistory,
    setDepositsHistory,
    dcaHistory,
    setDcaHistory,
    isMultiTierDCA,
    setIsMultiTierDCA,
    availableEnvelopeOptions,
    availableAssetTypeOptions,
    isSavingsEnvelope,
    liveSavingsInterest,
    handleEnvelopeChange,
    handleChange,
    handleSubmit,
  } = formState;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: '10px', overflowX: 'hidden' }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 700, margin: '0 auto', overflowX: 'hidden', boxSizing: 'border-box' }}>
        <div className="modal-header" style={{ flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}>{isNew ? '➕ Ajouter une Position' : `✏️ Modifier ${form.name}`}</h2>
          <button className="modal-close-btn" onClick={onClose} type="button" aria-label="Fermer">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Row 0: Envelope + Asset Type + Currency Selector */}
          <EnvelopeAssetTypeBar
            envelope={form.envelope}
            availableEnvelopeOptions={availableEnvelopeOptions}
            onEnvelopeChange={handleEnvelopeChange}
            assetType={form.assetType}
            availableAssetTypeOptions={availableAssetTypeOptions}
            onAssetTypeChange={(at) => handleChange('assetType', at)}
            currency={form.currency}
            currencyOptions={CURRENCY_OPTIONS}
            onCurrencyChange={(curr) => handleChange('currency', curr)}
          />

          {isSavingsEnvelope ? (
            <SavingsPositionForm
              form={form}
              setForm={setForm}
              handleChange={handleChange}
              duplicatePosition={duplicatePosition}
              handleSwitchToExisting={handleSwitchToExisting}
              setAllowDuplicateLine={setAllowDuplicateLine}
              initialDepositDate={initialDepositDate}
              setInitialDepositDate={setInitialDepositDate}
              depositsHistory={depositsHistory}
              setDepositsHistory={setDepositsHistory}
              dcaHistory={dcaHistory}
              setDcaHistory={setDcaHistory}
              dcaStartDate={dcaStartDate}
              setDcaStartDate={setDcaStartDate}
              isMultiTierDCA={isMultiTierDCA}
              setIsMultiTierDCA={setIsMultiTierDCA}
              liveSavingsInterest={liveSavingsInterest}
            />
          ) : (
            <PositionStandardForm {...formState} />
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 20 }}>
            <div>
              {!isNew && onDelete && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ color: 'var(--accent-rose)' }}
                  onClick={() => setIsDeletePositionModalOpen(true)}
                  id="btn-delete-position"
                >
                  🗑️ Supprimer
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
              <button type="submit" className="btn btn-primary" id="btn-save-position">
                {isNew ? '➕ Ajouter' : '💾 Enregistrer'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ⚠️ Modal confirmation: Supprimer la position */}
      {!isNew && onDelete && (
        <PositionDeleteModal
          isOpen={isDeletePositionModalOpen}
          name={form.name}
          ticker={form.ticker}
          onConfirm={() => {
            setIsDeletePositionModalOpen(false);
            onDelete(form.id);
          }}
          onCancel={() => setIsDeletePositionModalOpen(false)}
        />
      )}
    </div>
  );
}

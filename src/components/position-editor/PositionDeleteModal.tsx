'use client';

import React from 'react';
import ConfirmationModal from '@/components/ConfirmationModal';

interface PositionDeleteModalProps {
  isOpen: boolean;
  name: string;
  ticker: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PositionDeleteModal({
  isOpen,
  name,
  ticker,
  onConfirm,
  onCancel,
}: PositionDeleteModalProps) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      title={`Supprimer la position « ${name} »`}
      variant="danger"
      icon="⚠️"
      confirmText="Supprimer définitivement"
      cancelText="Conserver"
      message={
        <div>
          <p style={{ margin: '0 0 8px 0' }}>
            Êtes-vous certain de vouloir supprimer <strong>{name} ({ticker})</strong> de votre portefeuille ?
          </p>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
            Cette opération enregistrera une vente / liquidation dans votre historique d&apos;arbitrages.
          </p>
        </div>
      }
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

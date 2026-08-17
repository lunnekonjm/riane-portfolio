'use client';

import React from 'react';

interface CryptoLotSyncTabProps {
  syncAddressInput: string;
  setSyncAddressInput: (val: string) => void;
  isSyncing: boolean;
  syncMessage: { type: 'success' | 'error'; text: string } | null;
  handleSyncOnChain: () => void;
  onClose: () => void;
}

export function CryptoLotSyncTab({
  syncAddressInput,
  setSyncAddressInput,
  isSyncing,
  syncMessage,
  handleSyncOnChain,
  onClose,
}: CryptoLotSyncTabProps) {
  return (
    <div>
      <div
        style={{
          padding: '12px 14px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 8,
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 16 }}>🛡️</span>
          <strong style={{ fontSize: 13, color: 'var(--accent-emerald)' }}>
            Connexion 100% Sécurisée &amp; Lecture Seule (Watch-Only)
          </strong>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
          Renseignez simplement l&apos;adresse publique de votre Trust Wallet (ex : <code>0x...</code> ou adresse Solana/Bitcoin). L&apos;application interroge la blockchain en direct sans jamais demander de clé privée ni de seed phrase.
        </p>
      </div>

      <div className="form-group" style={{ marginBottom: 14 }}>
        <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>
          Adresse Publique Trust Wallet *
        </label>
        <input
          className="input mono"
          type="text"
          placeholder="0x71C... ou bc1... ou Sol..."
          value={syncAddressInput}
          onChange={(e) => setSyncAddressInput(e.target.value)}
        />
      </div>

      {syncMessage && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            marginBottom: 14,
            fontSize: 12.5,
            fontWeight: 600,
            background: syncMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: syncMessage.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            border: `1px solid ${syncMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          }}
        >
          {syncMessage.text}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Fermer
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderColor: '#10b981',
            color: '#fff',
            fontWeight: 800,
          }}
          onClick={handleSyncOnChain}
          disabled={isSyncing || !syncAddressInput.trim()}
        >
          {isSyncing ? <span className="loading-spinner" /> : '🔄 Synchroniser le Solde On-Chain'}
        </button>
      </div>
    </div>
  );
}

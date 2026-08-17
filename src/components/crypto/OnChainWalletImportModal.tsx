'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';
import { useOnChainWalletImportState } from '@/hooks/useOnChainWalletImportState';
import { OnChainScanResultsList } from './OnChainScanResultsList';

interface OnChainWalletImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportAssets: (assetsToImport: Position[]) => void;
  existingPositions: Position[];
}

export default function OnChainWalletImportModal({
  isOpen,
  onClose,
  onImportAssets,
  existingPositions,
}: OnChainWalletImportModalProps) {
  const {
    address,
    setAddress,
    walletLabel,
    setWalletLabel,
    customLabel,
    setCustomLabel,
    scanning,
    error,
    scanResults,
    hasScanned,
    showZeroValued,
    setShowZeroValued,
    scanWarning,
    handleScan,
    toggleSelectAsset,
    toggleSelectAll,
    selectedCount,
    totalSelectedValueEUR,
    handleConfirmImport,
  } = useOnChainWalletImportState({
    onImportAssets,
    onClose,
    existingPositions,
  });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 24,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-accent)',
          borderRadius: 14,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🔗</span>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Importer une Adresse Blockchain (Watch-Only)
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Récupération sécurisée en lecture seule de vos soldes on-chain (EVM, Bitcoin, Solana).
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ fontSize: 16, padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleScan} style={{ marginBottom: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Portefeuille / Application source
              </label>
              <select
                className="input"
                value={walletLabel}
                onChange={(e) => setWalletLabel(e.target.value)}
                style={{ width: '100%', fontSize: 13 }}
              >
                <option value="Trust Wallet">🛡️ Trust Wallet</option>
                <option value="Revolut X">⚡ Revolut X</option>
                <option value="Ledger">🔒 Ledger Cold Storage</option>
                <option value="MetaMask">🦊 MetaMask</option>
                <option value="Phantom">👻 Phantom Wallet (Solana)</option>
                <option value="custom">Autre / Personnalisé</option>
              </select>
            </div>

            {walletLabel === 'custom' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Nom personnalisé du wallet
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: Trezor Model T, Safe..."
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  style={{ width: '100%', fontSize: 13 }}
                />
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Adresse publique blockchain (Watch-Only)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="input mono"
                placeholder="Ex: 0x71C... ou bc1q... ou 7Yg..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ flex: 1, fontSize: 13 }}
                disabled={scanning}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={scanning || !address.trim()}
                style={{ fontSize: 13, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {scanning ? '⏳ Scan on-chain...' : '🔍 Scanner'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: 12 }}>
              ⚠️ {error}
            </div>
          )}

          {scanWarning && (
            <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', fontSize: 12, lineHeight: 1.4 }}>
              💡 <strong>Smart Contract détecté</strong> : {scanWarning}
            </div>
          )}
        </form>

        {/* Results Area */}
        <OnChainScanResultsList
          scanning={scanning}
          hasScanned={hasScanned}
          scanResults={scanResults}
          toggleSelectAsset={toggleSelectAsset}
          toggleSelectAll={toggleSelectAll}
          showZeroValued={showZeroValued}
          setShowZeroValued={setShowZeroValued}
        />

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
          <div>
            {hasScanned && scanResults.length > 0 && (
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Sélection : <strong style={{ color: 'var(--accent-cyan)' }}>{selectedCount} actif{selectedCount > 1 ? 's' : ''}</strong> (Total : <strong className="mono" style={{ color: 'var(--accent-emerald)' }}>{totalSelectedValueEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>)
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ fontSize: 13 }}>
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={selectedCount === 0}
              onClick={handleConfirmImport}
              style={{ fontSize: 13, padding: '8px 18px' }}
            >
              📥 Importer ({selectedCount}) dans le Portefeuille Crypto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

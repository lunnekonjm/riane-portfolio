'use client';

import React from 'react';

interface IntegrationsHubHeaderProps {
  loading: boolean;
  onSyncAll: () => void;
  onClose: () => void;
  lastSyncTime: string | null;
}

export function IntegrationsHubHeader({
  loading,
  onSyncAll,
  onClose,
  lastSyncTime,
}: IntegrationsHubHeaderProps) {
  return (
    <>
      {/* Header */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-tertiary)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🔗</span>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Hub de Synchronisation Multi-Comptes Directe
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Connexion sécurisée via protocoles Open Banking DSP2 &amp; API SnapTrade
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onSyncAll}
            disabled={loading}
            className="btn btn-secondary btn-sm"
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            <span className={loading ? 'spin' : ''}>🔄</span>
            <span>{loading ? 'Synchro en cours...' : 'Actualiser'}</span>
          </button>
          <button
            onClick={onClose}
            className="btn-ghost"
            type="button"
            style={{ padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div
        style={{
          padding: '10px 24px',
          background: 'rgba(6, 182, 212, 0.08)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-emerald)', display: 'inline-block' }} />
          <span>Connecteurs actifs : <strong>Interactive Brokers</strong> (SnapTrade) &amp; <strong>BoursoBank</strong> (TrueLayer DSP2)</span>
        </div>
        {lastSyncTime && (
          <span style={{ color: 'var(--text-muted)' }}>Dernière synchro réussie à {lastSyncTime}</span>
        )}
      </div>
    </>
  );
}

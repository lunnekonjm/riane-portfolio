'use client';

import React from 'react';

interface BoursoHeaderBarProps {
  isConnected: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenIntegrations: () => void;
}

export function BoursoHeaderBar({
  isConnected,
  isLoading,
  onRefresh,
  onOpenIntegrations,
}: BoursoHeaderBarProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(6, 182, 212, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            border: '1px solid rgba(6, 182, 212, 0.3)',
          }}
        >
          🏦
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: 0.2 }}>
              BoursoBank &amp; Liquidités Live
            </h3>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: 12,
                background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: isConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                border: `1px solid ${isConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: isConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                }}
              />
              {isConnected ? 'DSP2 Connecté (Temps Réel)' : 'À Synchroniser'}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Flux Open Banking certifié • Intégré directement dans vos calculs de trésorerie et de DCA
          </p>
        </div>
      </div>

      {/* Quick action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          disabled={isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            padding: '6px 12px',
            borderRadius: 8,
            cursor: isLoading ? 'wait' : 'pointer',
          }}
          title="Rafraîchir les soldes auprès de BoursoBank"
        >
          <span style={{ display: 'inline-block', transform: isLoading ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s ease' }}>
            🔄
          </span>
          <span>{isLoading ? 'Actualisation...' : 'Actualiser'}</span>
        </button>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onOpenIntegrations}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            padding: '6px 14px',
            borderRadius: 8,
            background: 'var(--accent-cyan)',
            color: '#001a30',
          }}
        >
          <span>⚙️ Gérer les Comptes</span>
        </button>
      </div>
    </div>
  );
}

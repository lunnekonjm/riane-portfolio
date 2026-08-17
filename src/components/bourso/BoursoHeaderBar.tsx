'use client';

import React from 'react';
import type { BoursoConnectionStatus } from '@/hooks/useBoursoLive';

interface BoursoHeaderBarProps {
  isConnected: boolean;
  isLive?: boolean;
  connectionStatus?: BoursoConnectionStatus;
  syncError?: string | null;
  requiresReauth?: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  onConnectBourso?: () => void;
  onOpenIntegrations: () => void;
}

export function BoursoHeaderBar({
  isConnected,
  isLive = false,
  connectionStatus = 'disconnected',
  syncError,
  requiresReauth = false,
  isLoading,
  onRefresh,
  onConnectBourso,
  onOpenIntegrations,
}: BoursoHeaderBarProps) {
  // Determine badge styling and label truthfully
  let badgeText = '⚪ Non Connecté';
  let badgeBg = 'rgba(148, 163, 184, 0.12)';
  let badgeColor = 'var(--text-muted)';
  let badgeBorder = 'rgba(148, 163, 184, 0.3)';
  let dotColor = 'var(--text-muted)';

  if (isLive) {
    badgeText = '🟢 BoursoBank DSP2 (En direct)';
    badgeBg = 'rgba(16, 185, 129, 0.15)';
    badgeColor = 'var(--accent-emerald)';
    badgeBorder = 'var(--accent-emerald)';
    dotColor = 'var(--accent-emerald)';
  } else if (connectionStatus === 'expired' || requiresReauth) {
    badgeText = '🟡 Session Expirée (Reconnexion requise)';
    badgeBg = 'rgba(245, 158, 11, 0.15)';
    badgeColor = 'var(--accent-amber)';
    badgeBorder = 'var(--accent-amber)';
    dotColor = 'var(--accent-amber)';
  } else if (connectionStatus === 'error') {
    badgeText = '🔴 Erreur de Synchro';
    badgeBg = 'rgba(239, 68, 68, 0.15)';
    badgeColor = 'var(--accent-rose)';
    badgeBorder = 'var(--accent-rose)';
    dotColor = 'var(--accent-rose)';
  } else if (isConnected) {
    badgeText = '🔵 Données en Cache Local';
    badgeBg = 'rgba(6, 182, 212, 0.15)';
    badgeColor = 'var(--accent-cyan)';
    badgeBorder = 'var(--accent-cyan)';
    dotColor = 'var(--accent-cyan)';
  }

  // Subtitle
  let subtitle = 'Flux Open Banking certifié • Intégré directement dans vos calculs de trésorerie et de DCA';
  if (connectionStatus === 'expired' || requiresReauth) {
    subtitle = '⚠️ Votre session bancaire BoursoBank a expiré. Les montants affichés sont issus du dernier cache local.';
  } else if (connectionStatus === 'disconnected') {
    subtitle = 'Mode local • Connectez votre compte BoursoBank pour synchroniser vos soldes bancaires en direct.';
  } else if (connectionStatus === 'error') {
    subtitle = '⚠️ Impossible d\'actualiser auprès de BoursoBank. Affichage des dernières données enregistrées.';
  } else if (isLive) {
    subtitle = 'Flux Open Banking certifié • Soldes bancaires vérifiés et synchronisés en direct';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                  background: badgeBg,
                  color: badgeColor,
                  border: `1px solid ${badgeBorder}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: dotColor,
                  }}
                />
                {badgeText}
              </span>
            </div>
            <p style={{ fontSize: 12, color: (connectionStatus === 'expired' || requiresReauth) ? 'var(--accent-amber)' : 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {(connectionStatus === 'expired' || requiresReauth) && onConnectBourso && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onConnectBourso}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: 8,
                background: 'var(--accent-amber)',
                color: '#000',
                border: 'none',
                cursor: 'pointer',
              }}
              title="Renouveler l'autorisation DSP2 BoursoBank"
            >
              <span>🔑 Reconnecter BoursoBank</span>
            </button>
          )}

          {connectionStatus === 'disconnected' && onConnectBourso && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onConnectBourso}
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
                border: 'none',
                cursor: 'pointer',
              }}
              title="Connecter votre compte BoursoBank via DSP2"
            >
              <span>🔗 Connecter BoursoBank</span>
            </button>
          )}

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
              background: (connectionStatus === 'expired' || requiresReauth) ? 'rgba(255,255,255,0.08)' : 'var(--accent-cyan)',
              color: (connectionStatus === 'expired' || requiresReauth) ? 'var(--text-primary)' : '#001a30',
            }}
          >
            <span>⚙️ Gérer les Comptes</span>
          </button>
        </div>
      </div>

      {/* Explicit Error Banner if sync failed */}
      {syncError && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: (connectionStatus === 'expired' || requiresReauth) ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${(connectionStatus === 'expired' || requiresReauth) ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 12, color: (connectionStatus === 'expired' || requiresReauth) ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>
            ⚠️ {syncError}
          </span>
          {(connectionStatus === 'expired' || requiresReauth || connectionStatus === 'disconnected') && onConnectBourso && (
            <button
              type="button"
              onClick={onConnectBourso}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 6,
                background: (connectionStatus === 'expired' || requiresReauth) ? 'var(--accent-amber)' : 'var(--accent-cyan)',
                color: '#000',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Reconnexion DSP2 →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

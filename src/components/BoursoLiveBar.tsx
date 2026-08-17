'use client';

import React from 'react';
import { useBoursoLive } from '@/hooks/useBoursoLive';
import { BoursoHeaderBar } from './bourso/BoursoHeaderBar';
import { BoursoAccountCards } from './bourso/BoursoAccountCards';

interface BoursoLiveBarProps {
  onOpenIntegrations: () => void;
  onOpenRebalanceWithTampon?: (amount: number) => void;
}

export default function BoursoLiveBar({
  onOpenIntegrations,
  onOpenRebalanceWithTampon,
}: BoursoLiveBarProps) {
  const {
    isConnected,
    isLive,
    connectionStatus,
    syncError,
    requiresReauth,
    isLoading,
    checkingEUR,
    tamponEUR,
    tontineEUR,
    livretAEUR,
    livretARate,
    livretAYearlyInterest,
    lastSync,
    refresh,
    connectBourso,
  } = useBoursoLive();

  const formatEUR = (val: number) =>
    val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

  return (
    <div
      className="card"
      style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        borderLeft: '4px solid var(--accent-cyan)',
        padding: '16px 20px',
        marginBottom: 16,
        borderRadius: 14,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        animation: 'fadeInUp 0.3s ease',
      }}
    >
      <BoursoHeaderBar
        isConnected={isConnected}
        isLive={isLive}
        connectionStatus={connectionStatus}
        syncError={syncError}
        requiresReauth={requiresReauth}
        isLoading={isLoading}
        onRefresh={refresh}
        onConnectBourso={connectBourso}
        onOpenIntegrations={onOpenIntegrations}
      />

      {/* Grid of Bank Accounts & Liquidities */}
      <BoursoAccountCards
        checkingEUR={checkingEUR}
        tamponEUR={tamponEUR}
        tontineEUR={tontineEUR}
        livretAEUR={livretAEUR}
        livretARate={livretARate}
        livretAYearlyInterest={livretAYearlyInterest}
        isLive={isLive}
        connectionStatus={connectionStatus}
        onOpenRebalanceWithTampon={onOpenRebalanceWithTampon}
        formatEUR={formatEUR}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {isLive ? '🟢 Synchronisé avec BoursoBank' : (connectionStatus === 'expired' || requiresReauth) ? '⚠️ Session expirée • Données en cache local' : '⚪ Mode local'}
        </span>
        {lastSync ? (
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Dernière synchro réussie : <strong style={{ color: 'var(--text-secondary)' }}>{lastSync}</strong>
          </span>
        ) : (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Non synchronisé
          </span>
        )}
      </div>
    </div>
  );
}

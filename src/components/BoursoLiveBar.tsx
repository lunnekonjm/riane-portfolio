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
    isLoading,
    checkingEUR,
    tamponEUR,
    tontineEUR,
    livretAEUR,
    livretARate,
    livretAYearlyInterest,
    lastSync,
    refresh,
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
        isLoading={isLoading}
        onRefresh={refresh}
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
        onOpenRebalanceWithTampon={onOpenRebalanceWithTampon}
        formatEUR={formatEUR}
      />

      {lastSync && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Dernière synchro : {lastSync}
          </span>
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import type { SnapTradeSyncResult } from '@/lib/snaptrade/types';

interface IntegrationsIbkrTabProps {
  snaptradeData: SnapTradeSyncResult | null;
  formatEUR: (val: number) => string;
}

export function IntegrationsIbkrTab({
  snaptradeData,
  formatEUR,
}: IntegrationsIbkrTabProps) {
  const ibkrAuth = snaptradeData?.authorizations?.[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          padding: '20px',
          borderRadius: 14,
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🏛️</span>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Interactive Brokers (IBKR)
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Connecté via SnapTrade Personal API Key (lecture seule 100% sécurisée).
            </p>
          </div>
        </div>

        {ibkrAuth && (
          <span
            style={{
              fontSize: 12,
              padding: '4px 12px',
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-emerald)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontWeight: 600,
            }}
          >
            ✓ Autorisation Active : {ibkrAuth.brokerageName}
          </span>
        )}
      </div>

      {/* Status Explanation Card */}
      <div
        style={{
          padding: '18px 22px',
          borderRadius: 14,
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>ℹ️</span> Fonctionnement de la Synchronisation Flex Query IBKR
        </div>
        <div>
          Votre compte SnapTrade est bien configuré avec votre autorisation Interactive Brokers. Sur IBKR, la transmission des données de comptes, liquidités et positions s&apos;effectue par des rapports automatiques Flex Query. Dès que le premier rapport périodique est validé par les serveurs IBKR, vos positions réelles apparaîtront directement ici.
        </div>
      </div>

      {/* Accounts Display if any */}
      {snaptradeData?.accounts && snaptradeData.accounts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {snaptradeData.accounts.map((acc) => (
            <div
              key={acc.id}
              style={{
                padding: '16px 20px',
                borderRadius: 12,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{acc.name}</strong>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    N° {acc.numberMasked} • Type: {acc.type} • Devise: {acc.currency}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    {formatEUR(acc.totalValueEUR)}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total compte</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

'use client';

import React from 'react';

interface AuraRealBankBalanceCardProps {
  accountBalance: number;
  bufferMultiplier: number;
  seuilSecurite: number;
  onOpenEditBufferMult: () => void;
  onOpenArbitrage: () => void;
  onOpenEditBalance: () => void;
  onSyncBank?: () => Promise<any> | any;
  onShowToast?: (msg: string, type: 'success' | 'error') => void;
}

export function AuraRealBankBalanceCard({
  accountBalance,
  bufferMultiplier,
  seuilSecurite,
  onOpenEditBufferMult,
  onOpenArbitrage,
  onOpenEditBalance,
  onSyncBank,
  onShowToast,
}: AuraRealBankBalanceCardProps) {
  return (
    <div
      className="card"
      style={{
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: accountBalance < 0 ? '1px solid rgba(244, 63, 94, 0.5)' : '1px solid rgba(16, 185, 129, 0.4)',
        padding: 20,
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Découvert Warning Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
              background: accountBalance < 0 ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: accountBalance < 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
              border: accountBalance < 0 ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
            }}
          >
            <span>{accountBalance < 0 ? '⚠️' : '🛡️'}</span>
            {accountBalance < 0 ? 'Découvert bancaire actuel' : 'Trésorerie sécurisée'}
          </span>

          <span
            style={{
              padding: '3px 8px',
              borderRadius: 6,
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-emerald)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            NEGEM RICHARD • Live
          </span>
        </div>

        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
            SOLDE BANCAIRE RÉEL
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span
              style={{
                fontSize: 30,
                fontWeight: 900,
                color: accountBalance < 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                letterSpacing: '-0.5px',
              }}
            >
              {accountBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </span>

            <button
              type="button"
              onClick={onOpenEditBufferMult}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: 'var(--accent-cyan)',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ⚙️ Seuil cible : {bufferMultiplier.toFixed(1)}x ({seuilSecurite.toFixed(0)} €)
            </button>
          </div>
        </div>

        {/* Deficit Callout & Arbitrage Button */}
        {accountBalance < 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 10,
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              fontSize: 11,
            }}
          >
            <span style={{ color: '#cbd5e1', lineHeight: 1.4 }}>
              ⚡ Découvert de {Math.abs(accountBalance).toFixed(2)} € : Vous pouvez moduler l&apos;épargne PEA pour résorber ce découvert.
            </span>
            <button
              type="button"
              onClick={onOpenArbitrage}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                background: 'var(--accent-cyan)',
                border: 'none',
                color: '#0a0e17',
                fontWeight: 900,
                fontSize: 11.5,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Arbitrer
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons: Corriger & Synchro Directe */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <button
          type="button"
          onClick={onOpenEditBalance}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: 10,
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#e2e8f0',
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          ✏️ Corriger
        </button>

        <button
          type="button"
          onClick={async () => {
            if (onSyncBank) {
              onShowToast?.('Synchronisation bancaire en cours...', 'success');
              await onSyncBank();
              onShowToast?.('Solde et transactions synchronisés !', 'success');
            } else {
              onShowToast?.('Synchronisation bancaire locale effectuée.', 'success');
            }
          }}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: 10,
            background: 'rgba(6, 182, 212, 0.18)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: 'var(--accent-cyan)',
            fontSize: 11.5,
            fontWeight: 800,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          🔄 Synchro Directe
        </button>
      </div>
    </div>
  );
}

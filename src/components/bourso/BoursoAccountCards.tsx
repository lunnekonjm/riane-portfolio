'use client';

import React from 'react';

interface BoursoAccountCardsProps {
  checkingEUR: number;
  tamponEUR: number;
  tontineEUR: number;
  livretAEUR: number;
  livretARate: number;
  livretAYearlyInterest: number;
  onOpenRebalanceWithTampon?: (amount: number) => void;
  formatEUR: (val: number) => string;
}

export function BoursoAccountCards({
  checkingEUR,
  tamponEUR,
  tontineEUR,
  livretAEUR,
  livretARate,
  livretAYearlyInterest,
  onOpenRebalanceWithTampon,
  formatEUR,
}: BoursoAccountCardsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
      {/* 1. Compte Courant */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 12,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
            💳 Compte Courant
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Dépenses</span>
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: checkingEUR < 0 ? 'var(--accent-amber)' : 'var(--text-primary)',
            marginTop: 2,
          }}
        >
          {formatEUR(checkingEUR)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Solde opérationnel quotidien
        </div>
      </div>

      {/* 2. Compte Tampon (Surplus & Dispatch) */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 12,
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>
            ⚡ Compte Tampon (Surplus)
          </span>
          <span style={{ fontSize: 10, color: 'var(--accent-emerald)', fontWeight: 700 }}>Primes &amp; Sas</span>
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-emerald)',
            marginTop: 2,
          }}
        >
          {formatEUR(tamponEUR)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2, gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Disponible arbitrages</span>
          {tamponEUR > 0 && onOpenRebalanceWithTampon && (
            <button
              type="button"
              onClick={() => onOpenRebalanceWithTampon(tamponEUR)}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(16, 185, 129, 0.18)',
                color: 'var(--accent-emerald)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
              title="Ventiler le surplus du compte tampon vers vos enveloppes d'investissement"
            >
              Arbitrer le surplus →
            </button>
          )}
        </div>
      </div>

      {/* 3. Compte Tontine (Affiché uniquement à titre indicatif si non nul) */}
      {tontineEUR > 0 && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 12,
            background: 'rgba(129, 140, 248, 0.06)',
            border: '1px solid rgba(129, 140, 248, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase' }}>
              🤝 Tontine (Indicatif)
            </span>
            <span style={{ fontSize: 10, color: '#818cf8', fontWeight: 600 }}>Échéance Sept.</span>
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: '#818cf8',
              marginTop: 2,
            }}
          >
            {formatEUR(tontineEUR)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Hors liquidités actives • Viré sur Tampon
          </div>
        </div>
      )}

      {/* 4. Livret A */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 12,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>
            🛡️ Livret A ({livretARate}%)
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Sécurité</span>
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: livretAEUR > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
            marginTop: 2,
          }}
        >
          {livretAEUR > 0 ? formatEUR(livretAEUR) : 'Non renseigné'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--accent-emerald)', fontWeight: 600 }}>
          {livretAEUR > 0 ? `+ ${livretAYearlyInterest.toFixed(2)} € / an nets` : 'Cliquez sur Gérer'}
        </div>
      </div>
    </div>
  );
}

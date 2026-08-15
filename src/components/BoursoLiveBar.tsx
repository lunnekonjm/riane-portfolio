'use client';

import React from 'react';
import { useBoursoLive } from '@/hooks/useBoursoLive';

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
    totalLiquiditiesEUR,
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
            onClick={refresh}
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

      {/* Grid of Bank Accounts & Liquidities */}
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

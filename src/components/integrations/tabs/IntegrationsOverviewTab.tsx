'use client';

import React from 'react';
import type { TrueLayerSyncResult } from '@/lib/truelayer/types';

interface IntegrationsOverviewTabProps {
  consolidatedTotalEUR: number;
  boursoCheckingEUR: number;
  boursoSavingsEUR: number;
  ibkrCashEUR: number;
  ibkrInvestedEUR: number;
  boursoInvestedEUR: number;
  ibkrTotalEUR: number;
  boursoTotalEUR: number;
  isIbkrConnected: boolean;
  truelayerData: TrueLayerSyncResult | null;
  boursoTamponEUR: number;
  formatEUR: (val: number) => string;
  onSelectTab: (tab: 'overview' | 'ibkr' | 'boursobank' | 'traderepublic') => void;
}

export function IntegrationsOverviewTab({
  consolidatedTotalEUR,
  boursoCheckingEUR,
  boursoSavingsEUR,
  ibkrCashEUR,
  ibkrInvestedEUR,
  boursoInvestedEUR,
  ibkrTotalEUR,
  boursoTotalEUR,
  isIbkrConnected,
  truelayerData,
  boursoTamponEUR,
  formatEUR,
  onSelectTab,
}: IntegrationsOverviewTabProps) {
  return (
    <>
      {/* Grand Banner Total Consolidé */}
      <div
        style={{
          padding: '24px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <span style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: 0.5 }}>
            ✨ Patrimoine Total Consolidé en Direct
          </span>
          <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
            {formatEUR(consolidatedTotalEUR)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            Agrégation temps réel multi-établissements (Courtages IBKR &amp; Comptes Bancaires BoursoBank).
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 12,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              minWidth: 140,
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Liquidités Bancaires</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
              {formatEUR(boursoCheckingEUR + boursoSavingsEUR + ibkrCashEUR)}
            </span>
          </div>
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 12,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              minWidth: 140,
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Investissements &amp; Titres</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
              {formatEUR(ibkrInvestedEUR + boursoInvestedEUR)}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {/* 1. IBKR */}
        <div
          onClick={() => onSelectTab('ibkr')}
          style={{
            padding: '18px',
            borderRadius: 14,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-cyan)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🏛️</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Interactive Brokers</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>SnapTrade Personal</div>
              </div>
            </div>
            {isIbkrConnected ? (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                ✓ Connecté
              </span>
            ) : (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', fontWeight: 600 }}>
                En attente
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Valeur totale :</span>
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{formatEUR(ibkrTotalEUR)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Cash disponible :</span>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{formatEUR(ibkrCashEUR)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Positions titres :</span>
              <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{formatEUR(ibkrInvestedEUR)}</span>
            </div>
          </div>
        </div>

        {/* 2. BoursoBank */}
        <div
          onClick={() => onSelectTab('boursobank')}
          style={{
            padding: '18px',
            borderRadius: 14,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-cyan)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🏦</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>BoursoBank</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>TrueLayer DSP2</div>
              </div>
            </div>
            {truelayerData?.connected ? (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                ✓ Connecté
              </span>
            ) : (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'rgba(79, 70, 229, 0.15)', color: '#818cf8', fontWeight: 600 }}>
                OAuth Prêt
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total retenu :</span>
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{formatEUR(boursoTotalEUR)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Compte Courant :</span>
              <span style={{ color: boursoCheckingEUR < 0 ? 'var(--accent-amber)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {formatEUR(boursoCheckingEUR)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tampon &amp; Dispatch :</span>
              <span style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>{formatEUR(boursoTamponEUR)}</span>
            </div>
          </div>
        </div>

        {/* 3. Trade Republic */}
        <div
          onClick={() => onSelectTab('traderepublic')}
          style={{
            padding: '18px',
            borderRadius: 14,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-cyan)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>📱</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Trade Republic</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>DCA Automatique</div>
              </div>
            </div>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              Calcul Algorithmique
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Stratégie :</span>
              <strong style={{ color: 'var(--text-primary)' }}>DCA Nasdaq-100</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Moteur d&apos;accumulation :</span>
              <span style={{ color: 'var(--accent-cyan)' }}>Paliers historisés</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Flux de marché :</span>
              <span style={{ color: 'var(--text-secondary)' }}>Live Yahoo Finance</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

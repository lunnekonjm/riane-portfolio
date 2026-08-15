'use client';

import React, { useState, useEffect } from 'react';
import { SnapTradeSyncResult } from '@/lib/snaptrade/types';
import { TrueLayerSyncResult } from '@/lib/truelayer/types';

interface IntegrationsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  fxRateEURUSD?: number;
}

export const IntegrationsHubModal: React.FC<IntegrationsHubModalProps> = ({
  isOpen,
  onClose,
  fxRateEURUSD = 1.08,
}) => {
  const [loading, setLoading] = useState(false);
  const [snaptradeData, setSnaptradeData] = useState<SnapTradeSyncResult | null>(null);
  const [truelayerData, setTruelayerData] = useState<TrueLayerSyncResult | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'ibkr' | 'boursobank' | 'traderepublic'>('overview');

  const syncAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/integrations/sync-all?fxRate=${fxRateEURUSD}`);
      if (res.ok) {
        const data = await res.json();
        setSnaptradeData(data.snaptrade);
        setTruelayerData(data.truelayer);
        setLastSyncTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Erreur lors de la synchronisation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      syncAll();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculations
  const ibkrTotalEUR = snaptradeData?.totalPortfolioEUR || 0;
  const ibkrCashEUR = snaptradeData?.totalCashEUR || 0;
  const ibkrInvestedEUR = snaptradeData?.totalInvestedEUR || 0;

  const boursoTotalEUR = truelayerData?.totalBoursoBankEUR || 0;
  const boursoCheckingEUR = truelayerData?.totalCheckingEUR || 0;
  const boursoSavingsEUR = truelayerData?.totalSavingsEUR || 0;
  const boursoInvestedEUR = truelayerData?.totalInvestedEUR || 0;

  const consolidatedTotalEUR = ibkrTotalEUR + boursoTotalEUR;

  const ibkrAuth = snaptradeData?.authorizations?.[0];
  const isIbkrConnected = !!(snaptradeData?.authorizations && snaptradeData.authorizations.length > 0);

  const formatEUR = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

  const formatUSD = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 920,
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-medium)',
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        }}
      >
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
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              }}
            >
              🔗
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Hub Multi-Comptes &amp; Synchronisation API Directe
                </h2>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--accent-emerald)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  🛡️ DSP2 / Read-Only Direct
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Interactive Brokers (SnapTrade Personal), BoursoBank (TrueLayer Open Banking) &amp; Trade Republic (DCA)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {lastSyncTime && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Dernière synchro : <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{lastSyncTime}</strong>
              </span>
            )}
            <button
              onClick={syncAll}
              disabled={loading}
              className="btn btn-primary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 10,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              <span style={{ display: 'inline-block', transform: loading ? 'rotate(360deg)' : 'none', transition: 'transform 1s linear' }}>
                🔄
              </span>
              <span>{loading ? 'Actualisation...' : 'Synchroniser'}</span>
            </button>
            <button className="modal-close-btn" onClick={onClose} title="Fermer">✕</button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0 20px',
            gap: 8,
            overflowX: 'auto',
            background: 'var(--bg-primary)',
          }}
        >
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: activeTab === 'overview' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              borderBottom: activeTab === 'overview' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            ✨ Vue Consolidée
          </button>
          <button
            onClick={() => setActiveTab('ibkr')}
            style={{
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: activeTab === 'ibkr' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              borderBottom: activeTab === 'ibkr' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            🏛️ Interactive Brokers (SnapTrade)
            {isIbkrConnected && (
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--accent-emerald)',
                  boxShadow: '0 0 6px var(--accent-emerald)',
                }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('boursobank')}
            style={{
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: activeTab === 'boursobank' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              borderBottom: activeTab === 'boursobank' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            🏦 BoursoBank (TrueLayer)
            <span
              style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 6,
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--accent-amber)',
              }}
            >
              DSP2
            </span>
          </button>
          <button
            onClick={() => setActiveTab('traderepublic')}
            style={{
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: activeTab === 'traderepublic' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              borderBottom: activeTab === 'traderepublic' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            📱 Trade Republic (DCA Auto)
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
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
                  onClick={() => setActiveTab('ibkr')}
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
                  onClick={() => setActiveTab('boursobank')}
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
                      <span style={{ color: 'var(--text-muted)' }}>Total bancaire :</span>
                      <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{formatEUR(boursoTotalEUR)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Compte Courant :</span>
                      <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{formatEUR(boursoCheckingEUR)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Livret A &amp; Épargne :</span>
                      <span style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>{formatEUR(boursoSavingsEUR)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>PEA-PME Titres :</span>
                      <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{formatEUR(boursoInvestedEUR)}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Trade Republic */}
                <div
                  onClick={() => setActiveTab('traderepublic')}
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
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Moteur DCA Automatique</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                      ✓ Auto-Sync
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Stratégie :</span>
                      <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>DCA Nasdaq 100</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Fréquence :</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Automatique</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Flux de marché :</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Live Yahoo Finance</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: INTERACTIVE BROKERS */}
          {activeTab === 'ibkr' && (
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
                  Votre compte SnapTrade est bien configuré avec votre autorisation Interactive Brokers. Sur IBKR, la transmission des données de comptes, liquidités et positions s'effectue par des rapports automatiques Flex Query. Dès que le premier rapport périodique est validé par les serveurs IBKR, vos positions réelles apparaîtront directement ici.
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
          )}

          {/* TAB 3: BOURSOBANK */}
          {activeTab === 'boursobank' && (
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
                  <span style={{ fontSize: 28 }}>🏦</span>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      BoursoBank (Banque &amp; Épargne DSP2)
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                      Synchronisation automatique de votre <strong>Livret A</strong>, <strong>Compte Courant</strong> et <strong>PEA-PME</strong>.
                    </p>
                  </div>
                </div>

                <a
                  href="/api/integrations/truelayer/auth-url"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  <span>Connecter BoursoBank DSP2</span>
                  <span>↗</span>
                </a>
              </div>

              {/* Accounts list or Connect Explainer */}
              {truelayerData?.accounts && truelayerData.accounts.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                  {truelayerData.accounts.map((acc) => (
                    <div
                      key={acc.id}
                      style={{
                        padding: '16px',
                        borderRadius: 12,
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--accent-amber)', fontWeight: 700 }}>
                        {acc.accountType}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                        {acc.displayName}
                      </div>
                      {acc.ibanMasked && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                          IBAN {acc.ibanMasked}
                        </div>
                      )}
                      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Solde direct</span>
                        <strong style={{ fontSize: 16, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                          {formatEUR(acc.availableBalance)}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: '24px',
                    borderRadius: 14,
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 32 }}>🛡️</span>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Connexion Sécurisée Open Banking DSP2
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 540, margin: 0, lineHeight: 1.5 }}>
                      Pour afficher en temps réel vos soldes BoursoBank (Compte Courant, Livret A et PEA-PME) sans aucune saisie manuelle, cliquez sur le bouton <strong>Connecter BoursoBank DSP2</strong> ci-dessus.
                    </p>
                  </div>

                  {/* Configuration Help Box */}
                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: 10,
                      background: 'rgba(79, 70, 229, 0.08)',
                      border: '1px solid rgba(79, 70, 229, 0.25)',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>⚙️</span> Configuration Console TrueLayer (Redirect URI) :
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Dans votre console TrueLayer (<strong>Applications &gt; Riane Portfolio &gt; App Settings &gt; Redirect URIs</strong>), assurez-vous d&apos;avoir ajouté cette URL de redirection :
                    </div>
                    <div
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--accent-cyan)',
                        wordBreak: 'break-all',
                        userSelect: 'all',
                      }}
                    >
                      https://riane-portfolio-one.vercel.app/api/integrations/truelayer/callback
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TRADE REPUBLIC */}
          {activeTab === 'traderepublic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  padding: '20px',
                  borderRadius: 14,
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 28 }}>📱</span>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Trade Republic (Moteur DCA Automatique)
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    Suivi précis des versements récurrents indiciels et valorisation en temps réel.
                  </p>
                </div>
              </div>

              <div
                style={{
                  padding: '20px',
                  borderRadius: 14,
                  background: 'rgba(79, 70, 229, 0.08)',
                  border: '1px solid rgba(79, 70, 229, 0.25)',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 700, color: '#818cf8', marginBottom: 8 }}>
                  💡 Comment fonctionne le suivi Trade Republic dans RIANE :
                </div>
                <p style={{ margin: '0 0 8px 0' }}>
                  Comme Trade Republic ne dispose pas d'API publique pour les particuliers, RIANE calcule exactement votre portefeuille grâce à :
                </p>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>L'historique de vos paliers de versements programmés (DCA Step-Ups).</li>
                  <li>La valorisation en direct du <strong>Nasdaq 100 / QQQ</strong> via les flux de marché.</li>
                  <li>Le calcul automatique des parts accumulées et du PRU moyen pondéré.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-tertiary)',
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            fontSize: 12,
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-emerald)', display: 'inline-block' }} />
            <span>Sécurité certifiée : Chiffrement SSL/TLS, aucune clé privée stockée dans le navigateur.</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '6px 14px', borderRadius: 8 }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

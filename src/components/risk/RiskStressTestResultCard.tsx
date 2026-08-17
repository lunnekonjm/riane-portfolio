'use client';

import React from 'react';
import type { PortfolioConfig } from '@/types/portfolio';
import type { StressTestResult } from '@/types/simulation';
import InfoTooltip from '@/components/InfoTooltip';
import AssetBadge from '@/components/AssetBadge';

interface RiskStressTestResultCardProps {
  selectedStressResult: StressTestResult;
  config?: PortfolioConfig | null;
  hideProxyAssets: boolean;
  setHideProxyAssets: (hide: boolean) => void;
  setActiveProxyModalAsset: (asset: any) => void;
}

export function RiskStressTestResultCard({
  selectedStressResult,
  config,
  hideProxyAssets,
  setHideProxyAssets,
  setActiveProxyModalAsset,
}: RiskStressTestResultCardProps) {
  const displayAssets = hideProxyAssets
    ? selectedStressResult.contributionByAsset.filter((a) => !a.isProxySimulated)
    : selectedStressResult.contributionByAsset;

  const proxyCount = selectedStressResult.contributionByAsset.filter((a) => a.isProxySimulated).length;

  return (
    <div className="card" style={{ animation: 'fadeInUp 0.3s ease' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <span className="card-title">Résultat : {selectedStressResult.scenario.name}</span>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {selectedStressResult.scenario.description}
          </div>
        </div>
        <span
          className={`badge ${Math.abs(selectedStressResult.portfolioLossPercent) > 20 ? 'badge-rose' : 'badge-amber'}`}
          style={{ fontSize: 14, padding: '4px 12px' }}
        >
          {selectedStressResult.portfolioLossPercent.toFixed(1)}%
        </span>
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Perte Estimée sur le Portefeuille</span>
            <InfoTooltip
              title="Perte Estimée"
              text="Montant nominal cumulé de la dépréciation sur l'ensemble de vos positions cotées (PEA, CTO) pour ce scénario."
              color="rose"
              align="right"
            />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-rose)', fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
            {selectedStressResult.portfolioLoss.toLocaleString('fr-FR')} €
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Sur l&apos;ensemble des positions cotées</div>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Absorption DCA Estimée</span>
            <InfoTooltip
              title="Absorption DCA"
              text="Nombre de mois de versements réguliers nécessaires pour réinjecter 100% de la baisse subie."
              color="emerald"
              align="right"
            />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', margin: '4px 0', color: 'var(--accent-emerald)' }}>
            {config?.monthlyBudget ? (Math.abs(selectedStressResult.portfolioLoss) / config.monthlyBudget).toFixed(1) : '1.5'} mois de DCA
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Pour réinjecter l&apos;équivalent de la baisse</div>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Diagnostic de Viabilité</span>
            <InfoTooltip
              title="Diagnostic"
              text="Évaluation de la solidité de la structure d'allocation face aux tensions macroéconomiques de cette crise."
              color="cyan"
              align="right"
            />
          </div>
          <div style={{ fontSize: 13, color: 'var(--accent-cyan)', fontWeight: 600, marginTop: 6 }}>
            {selectedStressResult.objectiveImpact}
          </div>
        </div>
      </div>

      {selectedStressResult.contributionByAsset.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', margin: 0 }}>
                Impact Détaillé par Actif ({displayAssets.length} titres)
              </h4>
              {proxyCount > 0 && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>
                  💡 {proxyCount} actif(s) créés après ce krach sont modélisés par leur indice sectoriel proxy.
                </div>
              )}
            </div>

            {proxyCount > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}
                onClick={() => setHideProxyAssets(!hideProxyAssets)}
              >
                {hideProxyAssets ? '👁️ Afficher tous les actifs (avec Proxies)' : '🔒 Masquer les actifs créés après la crise'}
              </button>
            )}
          </div>

          {displayAssets.map((asset, i) => (
            <div key={i} className="theme-bar-row" style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ minWidth: 220, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AssetBadge ticker={asset.ticker} name={asset.name} showTicker={false} />
                  {asset.envelope && (
                    <span className="badge badge-primary" style={{ fontSize: 10, padding: '1px 6px' }}>{asset.envelope}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 600 }}>{asset.ticker}</span>
                  {asset.isHeld ? (
                    <span className="badge badge-emerald" style={{ fontSize: 10, padding: '1px 6px' }}>
                      Détenu ({(asset.positionValue || 0).toLocaleString('fr-FR')} €)
                    </span>
                  ) : (
                    <span className="badge badge-amber" style={{ fontSize: 10, padding: '1px 6px' }}>
                      Ligne cible non amorcée
                    </span>
                  )}
                  {asset.isProxySimulated && (
                    <button
                      type="button"
                      className="badge badge-amber"
                      style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', cursor: 'pointer', border: '1px solid rgba(245, 158, 11, 0.5)', fontWeight: 700 }}
                      onClick={() => setActiveProxyModalAsset(asset)}
                      title="Cliquer pour voir l'explication de la simulation par proxy"
                    >
                      🔒 Proxy ({asset.inceptionYear}) 💡
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Baisse unitaire du cours */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Baisse du cours</div>
                  <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, color: (asset.priceShockPercent || 0) < 0 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                    {asset.priceShockPercent !== undefined ? `${asset.priceShockPercent.toFixed(1)}%` : '-'}
                  </div>
                </div>

                {/* Perte nominale sur la position */}
                <div style={{ textAlign: 'right', minWidth: 100 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Perte sur la ligne</div>
                  <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 700, color: asset.contribution < 0 ? 'var(--accent-rose)' : 'var(--text-secondary)' }}>
                    {asset.isHeld ? `${asset.contribution.toLocaleString('fr-FR')} €` : '0 €'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🛡️ RECOMMANDATIONS STRATÉGIQUES ANTI-CRISE */}
      {selectedStressResult.governanceActions.length > 0 && (
        <div style={{ marginTop: 24, padding: 20, background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(6, 182, 212, 0.08))', border: '1px solid var(--accent-amber)', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>🛡️</span>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-amber)', margin: 0 }}>
                  Guide de Conduite Stratégique Anti-Crise (DCA 15-20 ans)
                </h4>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Principes directeurs d&apos;allocation et de gestion des flux lors d&apos;une correction majeure
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {selectedStressResult.governanceActions.map((action, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  padding: 14,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 18, marginTop: 2 }}>{idx === 0 ? '🎯' : idx === 1 ? '🛡️' : '🚀'}</span>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

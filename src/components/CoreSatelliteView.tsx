'use client';

import React, { useState } from 'react';
import type { Position } from '@/types/portfolio';
import AssetLogo from './AssetLogo';

interface CoreSatelliteViewProps {
  positions: Position[];
  fxRates: Record<string, number>;
  onOpenInfoModal: () => void;
  onOpenRebalance?: () => void;
}

interface PillarData {
  id: 'core' | 'peapme' | 'satellite';
  title: string;
  subtitle: string;
  badge: string;
  color: string;
  targetPct: number;
  minTargetPct: number;
  maxTargetPct: number;
  envelopeKey: string;
  positions: Array<{
    position: Position;
    valueEUR: number;
    weightPct: number;
  }>;
  totalValueEUR: number;
  actualPct: number;
  status: 'UNDERWEIGHT' | 'BALANCED' | 'OVERWEIGHT';
  statusText: string;
  recommendationText: string;
}

const MARKET_ENVELOPES = ['PEA', 'PEA-PME', 'CTO', 'SPECULATIVE', 'OPPORTUNISTIC'];

export default function CoreSatelliteView({
  positions,
  fxRates,
  onOpenInfoModal,
  onOpenRebalance,
}: CoreSatelliteViewProps) {
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  // 1. Filtrer strictement les positions Boursières (exclut PEE & Livrets)
  const filledMarketPositions = positions.filter((p) => {
    const isMarket = MARKET_ENVELOPES.includes((p.envelope || '').toUpperCase());
    const hasValue = (p.quantity || 0) > 0 && (p.avgPrice || 0) > 0;
    return isMarket && hasValue;
  });

  const totalMarketValueEUR = filledMarketPositions.reduce((sum, p) => {
    const pr = p.currentPrice || p.avgPrice || 0;
    const rate = (fxRates as any)[p.currency] || 1.0;
    return sum + p.quantity * pr * rate;
  }, 0);

  // 2. Classifier les positions dans les 3 Piliers CDC V4
  const corePositions: Position[] = [];
  const peaPmePositions: Position[] = [];
  const satellitePositions: Position[] = [];

  filledMarketPositions.forEach((p) => {
    const t = p.ticker.toUpperCase();
    const env = (p.envelope || '').toUpperCase();

    const isCore =
      p.assetType === 'ETF' ||
      t.includes('PUST') ||
      t.includes('CW8') ||
      t.includes('GPEA') ||
      t.includes('WPEA') ||
      t.includes('ACWI');

    const isPeaPme =
      env === 'PEA-PME' ||
      t.includes('0P0001DKPM') ||
      t.includes('ALRIB') ||
      t.includes('MEMS') ||
      t.includes('XFAB');

    if (isCore) {
      corePositions.push(p);
    } else if (isPeaPme) {
      peaPmePositions.push(p);
    } else {
      satellitePositions.push(p);
    }
  });

  const formatPillar = (
    id: 'core' | 'peapme' | 'satellite',
    title: string,
    subtitle: string,
    badge: string,
    color: string,
    targetPct: number,
    minTargetPct: number,
    maxTargetPct: number,
    envelopeKey: string,
    pillarPositions: Position[]
  ): PillarData => {
    const mapped = pillarPositions.map((p) => {
      const pr = p.currentPrice || p.avgPrice || 0;
      const rate = (fxRates as any)[p.currency] || 1.0;
      const val = p.quantity * pr * rate;
      const weight = totalMarketValueEUR > 0 ? (val / totalMarketValueEUR) * 100 : 0;
      return { position: p, valueEUR: val, weightPct: weight };
    });

    const totalVal = mapped.reduce((sum, item) => sum + item.valueEUR, 0);
    const actualPct = totalMarketValueEUR > 0 ? (totalVal / totalMarketValueEUR) * 100 : 0;

    let status: 'UNDERWEIGHT' | 'BALANCED' | 'OVERWEIGHT' = 'BALANCED';
    let statusText = '🟢 Allocation Équilibrée';
    let recommendationText = 'Poids conforme à votre cible stratégique.';

    if (actualPct < minTargetPct) {
      status = 'UNDERWEIGHT';
      statusText = '🔵 Sous-pondéré (Priorité DCA)';
      recommendationText = `Orientez vos prochains versements DCA vers ce pilier pour atteindre la cible de ${targetPct}%.`;
    } else if (actualPct > maxTargetPct) {
      status = 'OVERWEIGHT';
      statusText = '🟠 Sur-pondéré (Lissage passif)';
      recommendationText = `Pilier bien capitalisé. Laissez le DCA mensuel renforcer les autres piliers.`;
    }

    return {
      id,
      title,
      subtitle,
      badge,
      color,
      targetPct,
      minTargetPct,
      maxTargetPct,
      envelopeKey,
      positions: mapped,
      totalValueEUR: totalVal,
      actualPct,
      status,
      statusText,
      recommendationText,
    };
  };

  const pillars: PillarData[] = [
    formatPillar(
      'core',
      '🏛️ Pilier Cœur (Indiciaire Résilient)',
      'ETF grandes capitalisations mondiales & Nasdaq pour la croissance structurelle.',
      'Cible 40 % - 50 %',
      'var(--accent-cyan)',
      40,
      35,
      50,
      'PEA',
      corePositions
    ),
    formatPillar(
      'peapme',
      '🚀 Pilier Pépites Europe (Alpha & PEA-PME)',
      'Small & Mid Caps européennes à fort potentiel avec exonération fiscale totale.',
      'Cible 30 % - 40 %',
      'var(--accent-emerald)',
      40,
      30,
      45,
      'PEA-PME',
      peaPmePositions
    ),
    formatPillar(
      'satellite',
      '⚡ Pilier Satellites US & Conviction (CTO)',
      'Pure-plays technologiques de rupture (Robotique, IA, Énergie) pour booster la performance.',
      'Cible 15 % - 20 %',
      'var(--accent-purple)',
      20,
      15,
      25,
      'CTO',
      satellitePositions
    ),
  ];

  return (
    <div className="card" style={{ marginTop: 24, border: '1px solid var(--border-subtle)' }}>
      {/* Header */}
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="card-title" style={{ fontSize: 18, fontWeight: 800 }}>
              🏛️ Allocation Stratégique : Core vs Satellite (CDC V4)
            </span>
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 10,
                background: 'rgba(6, 182, 212, 0.15)',
                color: 'var(--accent-cyan)',
                fontWeight: 700,
              }}
            >
              Portefeuille Boursier
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Structure institutionnelle répartissant le capital entre fonds indiciels résilients et titres de conviction.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-cyan)', fontWeight: 600 }}
            onClick={onOpenInfoModal}
            title="Comprendre l'architecture Core / Satellite"
          >
            💡 Principes & Cibles Stratégiques
          </button>
          {onOpenRebalance && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}
              onClick={onOpenRebalance}
            >
              🎯 Rééquilibrer par DCA
            </button>
          )}
        </div>
      </div>

      {/* Grid of the 3 Strategic Pillars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
        {pillars.map((pillar) => {
          const isExpanded = expandedPillar === pillar.id;
          const cappedPct = Math.min(100, Math.max(0, pillar.actualPct));

          return (
            <div
              key={pillar.id}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 18px',
                border: `1px solid ${isExpanded ? pillar.color : 'rgba(255, 255, 255, 0.08)'}`,
                transition: 'all 0.2s ease',
              }}
            >
              {/* Pillar Title & Metrics */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {pillar.title}
                    </h4>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: pillar.color,
                        fontWeight: 700,
                        border: `1px solid ${pillar.color}`,
                      }}
                    >
                      {pillar.badge}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Enveloppe : <strong>{pillar.envelopeKey}</strong>
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {pillar.subtitle}
                  </p>
                </div>

                {/* Values & Percentage */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: pillar.color }}>
                      {pillar.actualPct.toFixed(1)}%
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      ({Math.round(pillar.totalValueEUR).toLocaleString('fr-FR')} €)
                    </span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: pillar.status === 'UNDERWEIGHT' ? 'var(--accent-cyan)' : pillar.status === 'OVERWEIGHT' ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                    {pillar.statusText}
                  </span>
                </div>
              </div>

              {/* Progress Bar with Target Marker */}
              <div style={{ marginTop: 12, position: 'relative' }}>
                <div
                  style={{
                    height: 10,
                    borderRadius: 6,
                    background: 'rgba(255, 255, 255, 0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${cappedPct}%`,
                      background: `linear-gradient(90deg, ${pillar.color} 0%, rgba(255, 255, 255, 0.9) 100%)`,
                      borderRadius: 6,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                {/* Target Pin */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${pillar.targetPct}%`,
                    top: -3,
                    bottom: -3,
                    width: 2,
                    background: 'white',
                    boxShadow: '0 0 6px white',
                    zIndex: 2,
                  }}
                  title={`Cible : ${pillar.targetPct}%`}
                />
              </div>

              {/* Quick Summary & Expand Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  💡 {pillar.recommendationText}
                </span>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 11, padding: '2px 8px', color: 'var(--accent-cyan)' }}
                  onClick={() => setExpandedPillar(isExpanded ? null : pillar.id)}
                >
                  {isExpanded ? '▲ Masquer les positions' : `▼ Voir ${pillar.positions.length} position(s)`}
                </button>
              </div>

              {/* Collapsible List of Underlying Holdings */}
              {isExpanded && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 10,
                  }}
                >
                  {pillar.positions.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                      Aucun actif alloué pour le moment dans ce pilier.
                    </div>
                  ) : (
                    pillar.positions.map(({ position: p, valueEUR, weightPct }) => (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: 8,
                          padding: '8px 12px',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <AssetLogo ticker={p.ticker} name={p.name} size={24} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                              {p.ticker}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
                              {p.name}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {Math.round(valueEUR).toLocaleString('fr-FR')} €
                          </div>
                          <div style={{ fontSize: 11, color: pillar.color, fontWeight: 600 }}>
                            {weightPct.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

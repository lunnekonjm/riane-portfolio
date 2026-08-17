'use client';

import React from 'react';
import type { PillarData } from '@/hooks/useCoreSatelliteClassification';
import AssetLogo from '../AssetLogo';
import PlatformBadge from '../PlatformBadge';

interface CoreSatellitePillarCardProps {
  pillar: PillarData;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function CoreSatellitePillarCard({
  pillar,
  isExpanded,
  onToggleExpand,
}: CoreSatellitePillarCardProps) {
  const cappedPct = Math.min(100, Math.max(0, pillar.actualPct));

  return (
    <div
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
          onClick={onToggleExpand}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {p.ticker}
                      </div>
                      {p.institutionName && <PlatformBadge name={p.institutionName} style={{ fontSize: 9, padding: '1px 5px' }} />}
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
}

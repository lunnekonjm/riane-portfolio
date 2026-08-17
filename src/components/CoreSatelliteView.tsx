'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';
import { useCoreSatelliteClassification } from '@/hooks/useCoreSatelliteClassification';
import { CoreSatellitePillarCard } from './allocation/CoreSatellitePillarCard';

interface CoreSatelliteViewProps {
  positions: Position[];
  fxRates: Record<string, number>;
  onOpenInfoModal: () => void;
  onOpenRebalance?: () => void;
}

export default function CoreSatelliteView({
  positions,
  fxRates,
  onOpenInfoModal,
  onOpenRebalance,
}: CoreSatelliteViewProps) {
  const {
    pillars,
    scope,
    setScope,
    expandedPillar,
    setExpandedPillar,
  } = useCoreSatelliteClassification(positions, fxRates);

  return (
    <div className="card" style={{ marginTop: 24, border: '1px solid var(--border-subtle)' }}>
      {/* Header */}
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="card-title" style={{ fontSize: 18, fontWeight: 800 }}>
              🏛️ Allocation Stratégique : Core vs Satellite (CDC V4)
            </span>
            <div style={{ display: 'inline-flex', padding: 2, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setScope('BOURSE')}
                style={{
                  padding: '3px 9px',
                  fontSize: 11,
                  fontWeight: scope === 'BOURSE' ? 700 : 500,
                  borderRadius: 6,
                  background: scope === 'BOURSE' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                  color: scope === 'BOURSE' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  border: scope === 'BOURSE' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                📈 Bourse Seule
              </button>
              <button
                type="button"
                onClick={() => setScope('GLOBAL')}
                style={{
                  padding: '3px 9px',
                  fontSize: 11,
                  fontWeight: scope === 'GLOBAL' ? 700 : 500,
                  borderRadius: 6,
                  background: scope === 'GLOBAL' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  color: scope === 'GLOBAL' ? 'var(--accent-amber)' : 'var(--text-secondary)',
                  border: scope === 'GLOBAL' ? '1px solid var(--accent-amber)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                🌐 Global (+ Crypto)
              </button>
            </div>
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
        {pillars.map((pillar) => (
          <CoreSatellitePillarCard
            key={pillar.id}
            pillar={pillar}
            isExpanded={expandedPillar === pillar.id}
            onToggleExpand={() => setExpandedPillar(expandedPillar === pillar.id ? null : pillar.id)}
          />
        ))}
      </div>
    </div>
  );
}

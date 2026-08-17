'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';

interface BourseTableWeightCapCellProps {
  pos: Position;
  currentWeightPct: number;
}

export function BourseTableWeightCapCell({ pos, currentWeightPct }: BourseTableWeightCapCellProps) {
  const isCore =
    pos.ticker.includes('GPEA') ||
    pos.ticker.includes('CW8') ||
    pos.ticker.includes('WPEA') ||
    pos.name.toLowerCase().includes('acwi');
  const isSmallCap = pos.envelope === 'PEA-PME' || pos.ticker.includes('MEMS') || pos.ticker.includes('ALRIB');
  const defaultCap = isCore ? 60.0 : isSmallCap ? 15.0 : 10.0;
  const maxCapPct = pos.targetWeight ? pos.targetWeight * 100 : defaultCap;
  const capUsagePct = maxCapPct > 0 ? (currentWeightPct / maxCapPct) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 105, maxWidth: 115 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
        <strong style={{ color: currentWeightPct > maxCapPct ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
          {currentWeightPct.toFixed(1)}%
        </strong>
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
          / {maxCapPct.toFixed(0)}% max
        </span>
      </div>

      <div style={{ height: 4, width: '100%', background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(capUsagePct, 100)}%`,
            background:
              currentWeightPct > maxCapPct
                ? 'var(--accent-rose)'
                : currentWeightPct >= maxCapPct * 0.85
                ? 'var(--accent-amber)'
                : 'var(--accent-emerald)',
            borderRadius: 2,
          }}
        />
      </div>

      <div>
        {currentWeightPct > maxCapPct ? (
          <span
            className="badge badge-rose"
            style={{ fontSize: 10, padding: '1px 5px', fontWeight: 700 }}
            title={`Alerte sur-concentration : +${(currentWeightPct - maxCapPct).toFixed(1)}% au-dessus du plafond recommandé (${maxCapPct.toFixed(1)}% max)`}
          >
            ⚠️ +{(currentWeightPct - maxCapPct).toFixed(0)}% (Cap)
          </span>
        ) : currentWeightPct >= maxCapPct * 0.85 ? (
          <span
            className="badge badge-amber"
            style={{ fontSize: 10, padding: '1px 5px', fontWeight: 700 }}
            title={`Proche du plafond max : ${capUsagePct.toFixed(0)}% du cap d'allocation consommé`}
          >
            ⚡ {capUsagePct.toFixed(0)}%
          </span>
        ) : (
          <span
            className="badge badge-emerald"
            style={{ fontSize: 10, padding: '1px 5px', fontWeight: 700 }}
            title="Poids d'allocation sécurisé sous le plafond recommandé"
          >
            ✓ Sécurisé
          </span>
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import type { FlowRebalanceInstruction } from '@/engines/flowRebalancer';
import AssetLogo from '../AssetLogo';

interface RebalanceInstructionRowProps {
  instruction: FlowRebalanceInstruction;
}

export function RebalanceInstructionRow({ instruction: inst }: RebalanceInstructionRowProps) {
  return (
    <div
      key={inst.positionId}
      style={{
        padding: 12,
        background: 'var(--bg-tertiary)',
        borderRadius: 10,
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <AssetLogo ticker={inst.ticker} name={inst.name} size={28} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
            {inst.name} ({inst.ticker})
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Enveloppe : <strong style={{ color: 'var(--accent-cyan)' }}>{inst.envelope}</strong> • Poids : {inst.currentWeight}% → Cible : {inst.targetWeight}%
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        {inst.recommendedShares > 0 ? (
          <>
            <span className="badge badge-emerald" style={{ fontSize: 13, padding: '4px 10px', fontWeight: 700 }}>
              🟢 Acheter +{inst.recommendedShares} part{inst.recommendedShares > 1 ? 's' : ''} ({inst.recommendedCost.toLocaleString('fr-FR')} €)
            </span>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>
              Nouveau poids projeté : {inst.newWeightAfter}%
            </div>
          </>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Conserver (conforme)</span>
        )}
      </div>
    </div>
  );
}

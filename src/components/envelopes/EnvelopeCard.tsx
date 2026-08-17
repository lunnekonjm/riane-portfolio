'use client';

import React from 'react';
import type { EnvelopeSummaryItem } from '@/engines/taxEnvelopeEngine';

interface EnvelopeCardProps {
  summary: EnvelopeSummaryItem;
  peaCost: number;
  maxPeaPmeAllowed: number;
  psRate: number;
}

export function EnvelopeCard({
  summary: s,
  peaCost,
  maxPeaPmeAllowed,
  psRate,
}: EnvelopeCardProps) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div>
          <span className={`envelope-tag ${s.envKey.toLowerCase()}`} style={{ fontSize: 13, padding: '4px 10px' }}>
            {s.envKey}
          </span>
          <div style={{ fontWeight: 700, fontSize: 16, marginTop: 6 }}>{s.meta.label}</div>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, background: 'var(--bg-tertiary)', padding: 12, borderRadius: 10 }}>
        <div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'block' }}>Versé (PRU)</span>
          <strong className="mono" style={{ fontSize: 14 }}>
            {s.totalCost > 0 ? s.totalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '—'}
          </strong>
        </div>
        <div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'block' }}>Valeur Actuelle</span>
          <strong className="mono" style={{ fontSize: 14, color: 'var(--accent-cyan)' }}>
            {s.totalValue > 0 ? s.totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '—'}
          </strong>
        </div>
        <div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'block' }}>Plus-Value Brute</span>
          <strong className={`mono ${s.gainLoss >= 0 ? 'stat-gain' : 'stat-loss'}`} style={{ fontSize: 14 }}>
            {s.totalCost > 0 ? `${s.gainLoss >= 0 ? '+' : ''}${s.gainLoss.toFixed(0)}€ (${s.gainLossPercent >= 0 ? '+' : ''}${s.gainLossPercent.toFixed(1)}%)` : '—'}
          </strong>
        </div>
      </div>

      {/* Plafond de versement / Fill Rate */}
      {s.envKey === 'PEA' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Taux de remplissage PEA (Max 150 000 €)</span>
            <span style={{ fontWeight: 600, color: (s.fillRate || 0) > 100 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
              {s.totalCost.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / 150 000 € ({(s.fillRate || 0).toFixed(1)}%)
            </span>
          </div>
          <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, s.fillRate || 0)}%`,
                background: (s.fillRate || 0) > 100 ? 'var(--accent-rose)' : 'linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald))',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      )}

      {s.envKey === 'PEA-PME' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Plafond dynamique PEA-PME (Cumul max 225k€)</span>
            <span style={{ fontWeight: 600, color: (s.fillRate || 0) > 100 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
              {s.totalCost.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / {maxPeaPmeAllowed.toLocaleString('fr-FR')} € ({(s.fillRate || 0).toFixed(1)}%)
            </span>
          </div>
          <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, s.fillRate || 0)}%`,
                background: (s.fillRate || 0) > 100 ? 'var(--accent-rose)' : 'linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald))',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'block', marginTop: 4 }}>
            ℹ️ Calculé dynamiquement : 225 000 € - {peaCost.toLocaleString('fr-FR')} € (PEA) = {maxPeaPmeAllowed.toLocaleString('fr-FR')} € max autorisés sur PEA-PME.
          </span>
        </div>
      )}

      {!s.depositLimit && s.envKey !== 'PEA-PME' && s.envKey !== 'PEA' && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          ℹ️ Sans plafond légal de versement
        </div>
      )}

      {/* Tax Info summary */}
      <div style={{ fontSize: 12, padding: 8, background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
        <strong>Fiscalité :</strong> {s.meta.taxRules.over5Years.label} (PS: {(psRate * 100).toFixed(1)}%)
      </div>
    </div>
  );
}

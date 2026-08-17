'use client';

import React from 'react';

interface EnvelopeCombinedCeilingGaugeProps {
  peaCost: number;
  peaPmeCost: number;
  maxPeaPmeAllowed: number;
}

export function EnvelopeCombinedCeilingGauge({
  peaCost,
  peaPmeCost,
  maxPeaPmeAllowed,
}: EnvelopeCombinedCeilingGaugeProps) {
  const combinedCost = peaCost + peaPmeCost;
  const remainingCapacity = Math.max(0, 225000 - combinedCost);
  const isCombinedExceeded = combinedCost > 225000;

  return (
    <div className="card" style={{ borderLeft: '4px solid var(--accent-emerald)', background: 'var(--bg-secondary)', padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🔋</span>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Jauge d&apos;Éligibilité &amp; Saturation Fiscale (Cumul PEA + PEA-PME)
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Code Monétaire et Financier (Loi PACTE) — Plafond Global Cumulé : <strong>225 000 €</strong>
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>Capacité Fiscale Restante Exonérée d&apos;IR</span>
          <strong className="mono" style={{ fontSize: 15, color: 'var(--accent-emerald)' }}>
            {remainingCapacity.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € disponibles
          </strong>
        </div>
      </div>

      {/* Multi-Segment Battery Shell */}
      <div
        style={{
          height: 28,
          background: 'var(--bg-tertiary)',
          borderRadius: 14,
          border: '2px solid var(--border-accent)',
          padding: 3,
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
        }}
      >
        {/* Segment 1: PEA */}
        <div
          style={{
            width: `${Math.min(100, (peaCost / 225000) * 100)}%`,
            background: 'linear-gradient(90deg, #06b6d4, #0b7285)',
            borderRadius: '10px 0 0 10px',
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {peaCost > 15000 ? `PEA: ${peaCost.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €` : ''}
        </div>

        {/* Segment 2: PEA-PME */}
        <div
          style={{
            width: `${Math.min(100, (peaPmeCost / 225000) * 100)}%`,
            background: 'linear-gradient(90deg, #8b5cf6, #6d28d9)',
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {peaPmeCost > 15000 ? `PEA-PME: ${peaPmeCost.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €` : ''}
        </div>

        {/* Dynamic Marker 150k limit */}
        <div
          style={{
            position: 'absolute',
            left: `${(150000 / 225000) * 100}%`,
            top: 0,
            bottom: 0,
            width: 2,
            background: 'rgba(255,255,255,0.7)',
            zIndex: 10,
          }}
          title="Plafond Léger PEA Classique (150 000 €)"
        />
      </div>

      {/* Legend & Breakdown */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 12, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#06b6d4' }} />
            <span>
              PEA Classique : <strong>{peaCost.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / 150 000 €</strong> ({(peaCost / 1500).toFixed(1)}%)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#8b5cf6' }} />
            <span>
              PEA-PME : <strong>{peaPmeCost.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / {maxPeaPmeAllowed.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € max</strong> ({(maxPeaPmeAllowed > 0 ? (peaPmeCost / maxPeaPmeAllowed) * 100 : 100).toFixed(1)}%)
            </span>
          </div>
        </div>

        <div style={{ fontWeight: 700, color: isCombinedExceeded ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
          Remplissage Global : {((combinedCost) / 2250).toFixed(1)}% du Plafond Légal (225 000 €)
        </div>
      </div>
    </div>
  );
}

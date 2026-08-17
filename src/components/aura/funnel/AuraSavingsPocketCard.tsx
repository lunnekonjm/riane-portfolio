'use client';

import React from 'react';
import type { SavingsPocket } from '../AuraSavingsFunnelView';

interface AuraSavingsPocketCardProps {
  pocket: SavingsPocket;
}

export function AuraSavingsPocketCard({ pocket }: AuraSavingsPocketCardProps) {
  const ratio = Math.min(100, Math.round((pocket.current / (pocket.target || 1)) * 100));

  return (
    <div
      className="card"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{pocket.icon}</span>
          <span>{pocket.name}</span>
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, color: pocket.color, fontFamily: 'var(--font-mono)' }}>
          {ratio}%
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
        {pocket.description}
      </p>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Montant accumulé :</span>
          <strong style={{ color: pocket.color, fontFamily: 'var(--font-mono)' }}>
            {pocket.current.toLocaleString('fr-FR')} € / {pocket.target.toLocaleString('fr-FR')} €
          </strong>
        </div>
        <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <div
            style={{
              width: `${ratio}%`,
              height: '100%',
              background: pocket.color,
              borderRadius: 3,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
}

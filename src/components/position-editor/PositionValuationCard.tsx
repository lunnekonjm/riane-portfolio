'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';

interface PositionValuationCardProps {
  envelope: Position['envelope'];
  currency: string;
  quantity: number;
  avgPrice: number;
  currentPrice?: number;
  totalFeesEUR?: number;
  totalValue: number;
}

export function PositionValuationCard({
  envelope,
  currency,
  quantity,
  avgPrice,
  currentPrice,
  totalFeesEUR,
  totalValue,
}: PositionValuationCardProps) {
  if (quantity <= 0 && totalValue <= 0) return null;

  const displayPrice = currentPrice || avgPrice || 0;
  const totalCost = (quantity || 0) * (avgPrice || 0) + (totalFeesEUR || 0);

  return (
    <div
      style={{
        padding: '12px 16px',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      <div>
        <span style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block' }}>
          Valorisation calculée :{' '}
          {quantity < 1 ? quantity.toFixed(8).replace(/\.?0+$/, '') : quantity.toLocaleString('fr-FR')}{' '}
          {envelope === 'CRYPTO' ? 'token(s)' : 'part(s)'} ×{' '}
          {displayPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
          {currency === 'USD' ? '$' : '€'}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Coût total investi : {totalCost.toLocaleString('fr-FR', { style: 'currency', currency })}
        </span>
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Valeur actuelle</span>
        <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-cyan)' }}>
          {totalValue.toLocaleString('fr-FR', { style: 'currency', currency })}
        </span>
      </div>
    </div>
  );
}

'use client';

import React from 'react';

interface BenchmarkSummaryBarProps {
  totalInvested: number;
  totalCurrent: number;
  allLoaded: boolean;
  pnl: number;
  pnlPct: number;
  formatMoney: (amount: number) => string;
}

export function BenchmarkSummaryBar({
  totalInvested,
  totalCurrent,
  allLoaded,
  pnl,
  pnlPct,
  formatMoney,
}: BenchmarkSummaryBarProps) {
  return (
    <div
      style={{
        padding: '12px 16px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 10,
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(0,0,0,0.25)',
      }}
    >
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Investi</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
          {formatMoney(totalInvested)} €
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Valeur</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: allLoaded ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          {allLoaded ? formatMoney(totalCurrent) + ' €' : '...'}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>P/L</div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: allLoaded ? (pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)') : 'var(--text-secondary)',
          }}
        >
          {allLoaded ? `${pnl >= 0 ? '+' : ''}${formatMoney(pnl)} € (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)` : '...'}
        </div>
      </div>
    </div>
  );
}

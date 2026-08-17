'use client';

import React from 'react';

export interface BenchmarkPosition {
  name: string;
  ticker: string;
  quantity: number;
  avgPrice: number;
  purchaseDate: string;
  currentPrice: number | null;
  loading: boolean;
}

interface BenchmarkPositionRowProps {
  position: BenchmarkPosition;
  isEditing: boolean;
  onUpdateQuantity: (ticker: string, quantity: number) => void;
  onUpdateAvgPrice: (ticker: string, avgPrice: number) => void;
  formatMoney: (amount: number) => string;
}

export function BenchmarkPositionRow({
  position: p,
  isEditing,
  onUpdateQuantity,
  onUpdateAvgPrice,
  formatMoney,
}: BenchmarkPositionRowProps) {
  const invested = p.quantity * p.avgPrice;
  const current = p.quantity * (p.currentPrice ?? p.avgPrice);
  const linePnl = current - invested;
  const linePnlPct = invested > 0 ? (linePnl / invested) * 100 : 0;
  const hasPrice = p.currentPrice !== null;

  return (
    <div
      style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {p.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8, marginTop: 3, alignItems: 'center' }}>
          <span className="mono" style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{p.ticker}</span>
          {isEditing ? (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>Qté:</span>
              <input
                type="number"
                value={p.quantity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  onUpdateQuantity(p.ticker, val);
                }}
                style={{ width: 50, fontSize: 'var(--text-xs)', padding: '2px 4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-medium)', borderRadius: 4, color: 'var(--text-primary)' }}
              />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>PRU:</span>
              <input
                type="number"
                step="0.001"
                value={p.avgPrice}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  onUpdateAvgPrice(p.ticker, val);
                }}
                style={{ width: 60, fontSize: 'var(--text-xs)', padding: '2px 4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-medium)', borderRadius: 4, color: 'var(--text-primary)' }}
              />
            </div>
          ) : (
            <>
              <span>×{p.quantity}</span>
              <span>PRU {p.avgPrice.toFixed(3)} €</span>
            </>
          )}
        </div>
      </div>

      {/* Price & PnL */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: hasPrice ? 'var(--text-primary)' : 'var(--text-secondary)' }} className="mono">
          {hasPrice ? `${(p.currentPrice! * p.quantity).toFixed(2)} €` : 'Chargement...'}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: hasPrice
              ? linePnl >= 0
                ? 'var(--accent-green)'
                : 'var(--accent-rose)'
              : 'var(--text-secondary)',
          }}
        >
          {hasPrice
            ? `${linePnl >= 0 ? '+' : ''}${formatMoney(linePnl)} € (${linePnlPct >= 0 ? '+' : ''}${linePnlPct.toFixed(1)}%)`
            : ''}
        </div>
      </div>
    </div>
  );
}

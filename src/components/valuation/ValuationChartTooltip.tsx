'use client';

import React from 'react';
import type { StockValuationRecord } from '@/data/valuationData';

interface ValuationChartTooltipProps {
  hoverIndex: number | null;
  series: Array<{
    year: string | number;
    fundamental: number;
    price: number;
    multiple: number | null;
  }>;
  stock: StockValuationRecord;
}

export function ValuationChartTooltip({ hoverIndex, series, stock }: ValuationChartTooltipProps) {
  if (hoverIndex === null || !series[hoverIndex]) return null;

  const item = series[hoverIndex];

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        left: `${Math.min(75, Math.max(20, (hoverIndex / (series.length - 1 || 1)) * 100))}%`,
        transform: 'translateX(-50%)',
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 12,
        padding: '10px 14px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(10px)',
        pointerEvents: 'none',
        zIndex: 10,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        minWidth: 180,
      }}
    >
      <div style={{ fontWeight: 800, color: '#ffffff', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 6, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
        <span>Exercice {item.year}</span>
        {item.multiple !== null && (
          <span style={{ color: '#94a3b8', fontSize: 11 }}>
            {item.multiple?.toFixed(1)}×
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#06b6d4' }}>
          <span>{stock.metric === 'eps' ? 'BPA Réel :' : 'CA Réel :'}</span>
          <span style={{ fontWeight: 700 }}>
            {item.fundamental.toFixed(2)} {stock.metric === 'eps' ? stock.currency : stock.revenueUnit || 'M$'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b' }}>
          <span>Cours :</span>
          <span style={{ fontWeight: 700 }}>
            {item.price.toFixed(2)} {stock.currency}
          </span>
        </div>
      </div>
    </div>
  );
}

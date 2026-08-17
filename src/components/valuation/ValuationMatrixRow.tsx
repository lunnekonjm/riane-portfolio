'use client';

import React from 'react';
import type { StockValuationRecord } from '@/data/valuationData';
import type { ValuationEngineResult } from '@/engines/valuationEngine';

interface ValuationMatrixRowProps {
  stock: StockValuationRecord;
  val: ValuationEngineResult;
  isSelected: boolean;
  onSelectStock: (key: string) => void;
}

export function ValuationMatrixRow({
  stock,
  val,
  isSelected,
  onSelectStock,
}: ValuationMatrixRowProps) {
  const badgeClass =
    val.signalClass === 'good'
      ? 'val-badge-good'
      : val.signalClass === 'bad'
      ? 'val-badge-bad'
      : 'val-badge-warn';

  return (
    <tr
      onClick={() => onSelectStock(stock.key)}
      className={isSelected ? 'selected-row' : ''}
    >
      {/* Name & Ticker */}
      <td>
        <div style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{stock.name}</span>
          <span className="val-badge val-badge-neutral" style={{ fontSize: 10, padding: '1px 5px' }}>
            {stock.shortTick}
          </span>
        </div>
        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{stock.categoryLabel}</div>
      </td>

      {/* Model Type */}
      <td>
        <span
          className="val-badge"
          style={{
            fontSize: 10,
            padding: '2px 6px',
            background: stock.metric === 'eps' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            color: stock.metric === 'eps' ? '#06b6d4' : '#f59e0b',
            borderColor: stock.metric === 'eps' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(245, 158, 11, 0.3)',
          }}
        >
          {stock.metric === 'eps' ? 'BPA & P/E' : 'CA & P/S'}
        </span>
      </td>

      {/* Current Price */}
      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: '#ffffff' }}>
        {stock.currency === '$' ? '$' : ''}
        {val.currentPrice.toFixed(2)}
        {stock.currency === '€' ? ' €' : ''}
      </td>

      {/* Internal Signal */}
      <td>
        <span className={`val-badge ${badgeClass}`}>
          {val.signal}
        </span>
      </td>

      {/* Gap vs Average */}
      <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        <span
          style={{
            fontWeight: 700,
            color: val.gapPct < -10 ? '#10b981' : val.gapPct > 15 ? '#f43f5e' : '#f59e0b',
          }}
        >
          {val.gapPct >= 0 ? '+' : ''}
          {val.gapPct.toFixed(0)}%
        </span>
        <span style={{ fontSize: 10, color: '#64748b', display: 'block' }}>
          {val.zScore ? `(${val.zScore >= 0 ? '+' : ''}${val.zScore.toFixed(1)}σ)` : ''}
        </span>
      </td>

      {/* Multiple */}
      <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        <div style={{ color: '#ffffff', fontWeight: 600 }}>
          {val.currentRatio.toFixed(1)}×{' '}
          <span style={{ color: '#64748b', fontSize: 10 }}>({val.ratioName})</span>
        </div>
        <div style={{ fontSize: 10, color: '#64748b' }}>Moy: {val.avgRatio.toFixed(1)}×</div>
      </td>

      {/* Growth CAGR */}
      <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        {val.growthCagrPct !== null ? (
          <span style={{ color: '#10b981', fontWeight: 600 }}>
            +{val.growthCagrPct.toFixed(1)}%/an
          </span>
        ) : (
          <span style={{ color: '#64748b' }}>—</span>
        )}
      </td>

      {/* Analyst Consensus & Upside */}
      <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>
            {stock.currency === '$' ? '$' : ''}
            {val.analystMean.toFixed(0)}
            {stock.currency === '€' ? ' €' : ''}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: val.analystUpsidePct >= 15 ? '#10b981' : val.analystUpsidePct < 0 ? '#f43f5e' : '#f59e0b',
            }}
          >
            ({val.analystUpsidePct >= 0 ? '+' : ''}
            {val.analystUpsidePct.toFixed(0)}%)
          </span>
        </div>
        <div style={{ fontSize: 10, color: '#64748b' }}>
          {stock.consensus.rating} ({stock.consensus.analystCount} avis)
        </div>
      </td>

      {/* Action */}
      <td style={{ textAlign: 'right' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectStock(stock.key);
          }}
          className="val-btn val-btn-cyan"
          style={{ padding: '3px 8px', fontSize: 10 }}
        >
          Fiche ➔
        </button>
      </td>
    </tr>
  );
}

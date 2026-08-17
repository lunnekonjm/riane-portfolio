'use client';

import React, { useState } from 'react';
import type { StockValuationRecord } from '@/data/valuationData';
import type { ValuationEngineResult } from '@/engines/valuationEngine';
import { ValuationChartSvg } from './ValuationChartSvg';
import { ValuationChartTooltip } from './ValuationChartTooltip';

interface ValuationChartProps {
  stock: StockValuationRecord;
  val: ValuationEngineResult;
}

export const ValuationChart: React.FC<ValuationChartProps> = ({ stock, val }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const series = stock.years
    .map((year, i) => {
      const isEps = stock.metric === 'eps';
      const fund = isEps ? stock.eps?.[i] : stock.revenue?.[i];
      const p = stock.price[i];
      const mult = typeof p === 'number' && typeof fund === 'number' && fund > 0 ? p / fund : null;
      return {
        year,
        fundamental: typeof fund === 'number' ? fund : 0,
        price: typeof p === 'number' ? p : 0,
        multiple: mult,
      };
    })
    .filter((s) => s.price > 0 || s.fundamental > 0);

  if (series.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: 12 }}>
        Aucune donnée historique disponible.
      </div>
    );
  }

  // Dimensions SVG
  const width = 800;
  const height = 340;
  const padding = { top: 30, right: 65, bottom: 40, left: 65 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calcul des min/max pour les échelles
  const fundamentalValues = series.map((s) => s.fundamental);
  const priceValues = series.map((s) => s.price);

  const minFund = Math.min(0, ...fundamentalValues);
  const maxFund = Math.max(...fundamentalValues) * 1.15 || 1;

  const minPrice = 0;
  const maxPrice = Math.max(...priceValues, val.upperZone || 0) * 1.15 || 1;

  // Fonctions de projection de coordonnées
  const getX = (index: number) => {
    if (series.length === 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (series.length - 1)) * chartWidth;
  };

  const getYFund = (v: number) => {
    return padding.top + chartHeight - ((v - minFund) / (maxFund - minFund)) * chartHeight;
  };

  const getYPrice = (v: number) => {
    return padding.top + chartHeight - ((v - minPrice) / (maxPrice - minPrice)) * chartHeight;
  };

  // Construction des chemins SVG
  const fundPoints = series.map((s, i) => `${getX(i)},${getYFund(s.fundamental)}`).join(' ');
  const pricePoints = series.map((s, i) => `${getX(i)},${getYPrice(s.price)}`).join(' ');

  const priceArea =
    `${getX(0)},${getYPrice(0)} ` +
    series.map((s, i) => `${getX(i)},${getYPrice(s.price)}`).join(' ') +
    ` ${getX(series.length - 1)},${getYPrice(0)}`;

  // Bandes de valorisation (±1σ)
  const yUpper = val.upperZone > 0 ? getYPrice(val.upperZone) : null;
  const yLower = val.lowerZone > 0 ? getYPrice(val.lowerZone) : null;
  const yFair = val.fairValue > 0 ? getYPrice(val.fairValue) : null;

  return (
    <div
      style={{
        background: 'rgba(10, 14, 23, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 14,
        padding: '16px',
        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
      }}
    >
      {/* Légende supérieure */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          paddingBottom: 10,
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: 12,
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#06b6d4' }} />
            <span style={{ color: '#06b6d4', fontWeight: 700 }}>{val.growthMetricLabel}</span>
            <span style={{ color: '#64748b' }}>(Axe Gauche)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ color: '#f59e0b', fontWeight: 700 }}>Cours ({stock.currency})</span>
            <span style={{ color: '#64748b' }}>(Axe Droit)</span>
          </div>
        </div>

        {val.lowerZone > 0 && val.upperZone > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#94a3b8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, background: 'rgba(16, 185, 129, 0.4)', border: '1px solid #10b981', borderRadius: 2 }} />
              Favorable (&lt;{val.lowerZone.toFixed(0)}{stock.currency})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, background: 'rgba(244, 63, 94, 0.4)', border: '1px solid #f43f5e', borderRadius: 2 }} />
              Vigilance (&gt;{val.upperZone.toFixed(0)}{stock.currency})
            </span>
          </div>
        )}
      </div>

      {/* SVG Canvas Responsive */}
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden', marginTop: 10 }}>
        <ValuationChartSvg
          width={width}
          height={height}
          padding={padding}
          chartHeight={chartHeight}
          minFund={minFund}
          maxFund={maxFund}
          minPrice={minPrice}
          maxPrice={maxPrice}
          yLower={yLower}
          yFair={yFair}
          yUpper={yUpper}
          priceArea={priceArea}
          fundPoints={fundPoints}
          pricePoints={pricePoints}
          series={series}
          hoverIndex={hoverIndex}
          setHoverIndex={setHoverIndex}
          getX={getX}
          getYFund={getYFund}
          getYPrice={getYPrice}
          stock={stock}
        />

        {/* Tooltip interactif au hover */}
        <ValuationChartTooltip
          hoverIndex={hoverIndex}
          series={series}
          stock={stock}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#64748b', fontFamily: 'JetBrains Mono, monospace', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <span>Sources : Rapports Annuels, SEC EDGAR &amp; Euronext</span>
        <span>Survolez les points pour afficher le détail annuel</span>
      </div>
    </div>
  );
};

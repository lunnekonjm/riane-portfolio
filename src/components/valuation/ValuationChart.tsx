'use client';

import React, { useState } from 'react';
import { StockValuationRecord } from '@/data/valuationData';
import { ValuationEngineResult } from '@/engines/valuationEngine';

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
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none' }}
        >
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="fundGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grille horizontale */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = padding.top + chartHeight * (1 - pct);
            const valF = minFund + (maxFund - minFund) * pct;
            const valP = minPrice + (maxPrice - minPrice) * pct;
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                {/* Labels Axe Gauche */}
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#06b6d4"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {valF >= 100 ? valF.toFixed(0) : valF >= 10 ? valF.toFixed(1) : valF.toFixed(2)}
                </text>
                {/* Labels Axe Droit */}
                <text
                  x={width - padding.right + 10}
                  y={y + 4}
                  textAnchor="start"
                  fill="#f59e0b"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {valP >= 100 ? valP.toFixed(0) : valP.toFixed(1)} {stock.currency}
                </text>
              </g>
            );
          })}

          {/* Bandes horizontales de valorisation */}
          {yLower !== null && yLower >= padding.top && (
            <line
              x1={padding.left}
              y1={yLower}
              x2={width - padding.right}
              y2={yLower}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeWidth="1.5"
              opacity="0.8"
            />
          )}

          {yFair !== null && yFair >= padding.top && (
            <line
              x1={padding.left}
              y1={yFair}
              x2={width - padding.right}
              y2={yFair}
              stroke="#e2e8f0"
              strokeDasharray="2 2"
              strokeWidth="1"
              opacity="0.4"
            />
          )}

          {yUpper !== null && yUpper >= padding.top && (
            <line
              x1={padding.left}
              y1={yUpper}
              x2={width - padding.right}
              y2={yUpper}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              strokeWidth="1.5"
              opacity="0.8"
            />
          )}

          {/* Remplissage sous la courbe du cours */}
          <polygon points={priceArea} fill="url(#priceGradient)" />

          {/* Courbe Fondamentale (Bleue Cyan) */}
          <polyline
            fill="none"
            stroke="#06b6d4"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={fundPoints}
          />

          {/* Courbe du Cours (Orange) */}
          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pricePoints}
          />

          {/* Points et étiquettes d'années */}
          {series.map((s, i) => {
            const x = getX(i);
            const yF = getYFund(s.fundamental);
            const yP = getYPrice(s.price);
            const isHovered = hoverIndex === i;

            return (
              <g key={s.year} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
                {/* Ligne verticale de hover */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={height - padding.bottom}
                    stroke="#06b6d4"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.7"
                  />
                )}

                {/* Point Fondamental */}
                <circle
                  cx={x}
                  cy={yF}
                  r={isHovered ? 6 : 4}
                  fill="#0a0e17"
                  stroke="#06b6d4"
                  strokeWidth={isHovered ? 3 : 2}
                  style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                />

                {/* Point Prix */}
                <circle
                  cx={x}
                  cy={yP}
                  r={isHovered ? 6 : 4}
                  fill="#0a0e17"
                  stroke="#f59e0b"
                  strokeWidth={isHovered ? 3 : 2}
                  style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                />

                {/* Année Axe X */}
                <text
                  x={x}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  fill={isHovered ? '#ffffff' : '#94a3b8'}
                  fontSize={isHovered ? '11' : '10'}
                  fontWeight={isHovered ? '700' : 'normal'}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {s.year}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip interactif au hover */}
        {hoverIndex !== null && series[hoverIndex] && (
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
              <span>Exercice {series[hoverIndex].year}</span>
              {series[hoverIndex].multiple !== null && (
                <span style={{ color: '#94a3b8', fontSize: 11 }}>
                  {series[hoverIndex].multiple?.toFixed(1)}×
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#06b6d4' }}>
                <span>{stock.metric === 'eps' ? 'BPA Réel :' : 'CA Réel :'}</span>
                <span style={{ fontWeight: 700 }}>
                  {series[hoverIndex].fundamental.toFixed(2)} {stock.metric === 'eps' ? stock.currency : stock.revenueUnit || 'M$'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b' }}>
                <span>Cours :</span>
                <span style={{ fontWeight: 700 }}>
                  {series[hoverIndex].price.toFixed(2)} {stock.currency}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#64748b', fontFamily: 'JetBrains Mono, monospace', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <span>Sources : Rapports Annuels, SEC EDGAR &amp; Euronext</span>
        <span>Survolez les points pour afficher le détail annuel</span>
      </div>
    </div>
  );
};

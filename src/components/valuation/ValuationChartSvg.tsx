'use client';

import React from 'react';
import type { StockValuationRecord } from '@/data/valuationData';

interface ValuationChartSvgProps {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
  chartHeight: number;
  minFund: number;
  maxFund: number;
  minPrice: number;
  maxPrice: number;
  yLower: number | null;
  yFair: number | null;
  yUpper: number | null;
  priceArea: string;
  fundPoints: string;
  pricePoints: string;
  series: Array<{
    year: string | number;
    fundamental: number;
    price: number;
    multiple: number | null;
  }>;
  hoverIndex: number | null;
  setHoverIndex: (i: number | null) => void;
  getX: (i: number) => number;
  getYFund: (v: number) => number;
  getYPrice: (v: number) => number;
  stock: StockValuationRecord;
}

export function ValuationChartSvg({
  width,
  height,
  padding,
  chartHeight,
  minFund,
  maxFund,
  minPrice,
  maxPrice,
  yLower,
  yFair,
  yUpper,
  priceArea,
  fundPoints,
  pricePoints,
  series,
  hoverIndex,
  setHoverIndex,
  getX,
  getYFund,
  getYPrice,
  stock,
}: ValuationChartSvgProps) {
  return (
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
  );
}

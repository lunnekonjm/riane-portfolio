'use client';

import React, { useState, useMemo } from 'react';
import { SalaryRecord } from '../types/revenue';

interface SalaryTrendChartProps {
  records: SalaryRecord[];
}

export const SalaryTrendChart: React.FC<SalaryTrendChartProps> = ({ records }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Trier chronologiquement croissant pour le tracé de gauche à droite
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => (a.period || '').localeCompare(b.period || ''));
  }, [records]);

  if (sortedRecords.length === 0) {
    return (
      <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: 12 }}>
        Aucun bulletin de paie disponible pour tracer l'historique d'évolution salariale.
      </div>
    );
  }

  const chartWidth = 720;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  // Calcul du max et min net/brut
  const maxAmount = Math.max(
    ...sortedRecords.map((r) => Math.max(r.grossSalary || r.netSalary || 0, r.netSalary || 0)),
    3500
  );
  const minAmount = 0;

  const pointsCount = sortedRecords.length;
  const stepX = pointsCount > 1 ? (chartWidth - paddingX * 2) / (pointsCount - 1) : 0;

  const getY = (val: number) => {
    const ratio = (val - minAmount) / (maxAmount - minAmount || 1);
    return chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
  };

  const getX = (idx: number) => {
    if (pointsCount === 1) return chartWidth / 2;
    return paddingX + idx * stepX;
  };

  // Build SVG Path strings
  const netPath = sortedRecords
    .map((r, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(r.netSalary || 0)}`)
    .join(' ');

  const grossPath = sortedRecords
    .map((r, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(r.grossSalary || r.netSalary * 1.3 || 0)}`)
    .join(' ');

  const investPath = sortedRecords
    .map((r, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(r.regularInvestableAmount || 0)}`)
    .join(' ');

  return (
    <div
      className="card"
      style={{
        padding: 20,
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(10, 14, 25, 0.98) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 14,
      }}
    >
      {/* Chart Header & Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <div>
          <h4 style={{ fontSize: 15, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
            📈 Évolution Salariale &amp; Capacité d'Épargne Réelle (Aura Pro)
          </h4>
          <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
            Trajectoire historique de votre salaire Net à payer, Brut et montant investi en PEA.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11, fontWeight: 700 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-cyan)' }}>
            <span style={{ width: 10, height: 3, background: 'var(--accent-cyan)', borderRadius: 2 }} />
            Net à Payer
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#818cf8' }}>
            <span style={{ width: 10, height: 3, background: '#818cf8', borderRadius: 2 }} />
            Salaire Brut
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-emerald)' }}>
            <span style={{ width: 10, height: 3, background: 'var(--accent-emerald)', borderRadius: 2 }} />
            Investi PEA / Épargne
          </span>
        </div>
      </div>

      {/* SVG Container */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{ width: '100%', minWidth: 500, height: 'auto', display: 'block' }}
        >
          {/* Lignes repères horizontales */}
          {[0, 1000, 2000, 3000, 4000].map((level) => {
            if (level > maxAmount) return null;
            const y = getY(level);
            return (
              <g key={level}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 4}
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="var(--font-mono)"
                >
                  {level} €
                </text>
              </g>
            );
          })}

          {/* Courbe Brut */}
          <path d={grossPath} fill="none" stroke="#818cf8" strokeWidth="2" strokeDasharray="3 3" opacity="0.7" />

          {/* Courbe Investi PEA */}
          <path d={investPath} fill="none" stroke="var(--accent-emerald)" strokeWidth="2.5" />

          {/* Courbe Net (Glow + Line) */}
          <path d={netPath} fill="none" stroke="var(--accent-cyan)" strokeWidth="3" />

          {/* Points interactifs */}
          {sortedRecords.map((r, i) => {
            const x = getX(i);
            const yNet = getY(r.netSalary || 0);
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={r.id || i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Ligne verticale guide on hover */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={chartHeight - paddingY}
                    stroke="rgba(6, 182, 212, 0.4)"
                    strokeWidth="1.5"
                  />
                )}

                {/* Point Net */}
                <circle
                  cx={x}
                  cy={yNet}
                  r={isHovered ? 6 : 4}
                  fill="var(--accent-cyan)"
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2 : 1}
                />

                {/* Label X (Période) */}
                <text
                  x={x}
                  y={chartHeight - 8}
                  fill={isHovered ? 'var(--text-primary)' : 'var(--text-muted)'}
                  fontSize="10"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >
                  {r.period || ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tooltip Détails du mois survolé */}
      {hoveredIndex !== null && sortedRecords[hoveredIndex] && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 14px',
            background: 'var(--bg-secondary)',
            borderRadius: 8,
            border: '1px solid var(--accent-cyan)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
              📅 {sortedRecords[hoveredIndex].periodLabel || sortedRecords[hoveredIndex].period}
            </strong>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            <span>
              Net : <strong style={{ color: 'var(--accent-cyan)' }}>+{sortedRecords[hoveredIndex].netSalary.toLocaleString('fr-FR')} €</strong>
            </span>
            {sortedRecords[hoveredIndex].grossSalary && (
              <span>
                Brut : <strong style={{ color: '#818cf8' }}>{sortedRecords[hoveredIndex].grossSalary?.toLocaleString('fr-FR')} €</strong>
              </span>
            )}
            <span>
              Investi : <strong style={{ color: 'var(--accent-emerald)' }}>{sortedRecords[hoveredIndex].regularInvestableAmount?.toLocaleString('fr-FR')} €</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

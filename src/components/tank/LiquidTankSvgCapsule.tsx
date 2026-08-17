'use client';

import React from 'react';

interface LiquidTankSvgCapsuleProps {
  fillPercent: number;
  totalAvailableEmergencySavings: number;
}

export function LiquidTankSvgCapsule({
  fillPercent,
  totalAvailableEmergencySavings,
}: LiquidTankSvgCapsuleProps) {
  const capsuleHeight = 180;
  const capsuleWidth = 100;
  const liquidY = capsuleHeight - (capsuleHeight * Math.min(100, Math.max(0, fillPercent))) / 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          position: 'relative',
          width: capsuleWidth,
          height: capsuleHeight,
          borderRadius: capsuleWidth / 2,
          border: '3px solid rgba(255, 255, 255, 0.15)',
          background: 'radial-gradient(ellipse at top, rgba(30, 41, 59, 0.8), #090d16)',
          overflow: 'hidden',
          boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.8), 0 8px 24px rgba(0, 0, 0, 0.6)',
        }}
      >
        <svg
          width={capsuleWidth}
          height={capsuleHeight}
          style={{ position: 'absolute', inset: 0 }}
        >
          <defs>
            <linearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.75" />
            </linearGradient>
            <clipPath id="capsuleClip">
              <rect
                x="0"
                y="0"
                width={capsuleWidth}
                height={capsuleHeight}
                rx={capsuleWidth / 2}
                ry={capsuleWidth / 2}
              />
            </clipPath>
          </defs>

          <g clipPath="url(#capsuleClip)">
            {/* Surface Liquide Animée */}
            {fillPercent > 0 && (
              <path
                d={`
                  M 0 ${liquidY}
                  Q ${capsuleWidth * 0.25} ${liquidY - 4}, ${capsuleWidth * 0.5} ${liquidY}
                  T ${capsuleWidth} ${liquidY}
                  L ${capsuleWidth} ${capsuleHeight}
                  L 0 ${capsuleHeight}
                  Z
                `}
                fill="url(#liquidGrad)"
              />
            )}
            {/* Ligne brillante de crête */}
            {fillPercent > 0 && fillPercent < 100 && (
              <path
                d={`
                  M 0 ${liquidY}
                  Q ${capsuleWidth * 0.25} ${liquidY - 4}, ${capsuleWidth * 0.5} ${liquidY}
                  T ${capsuleWidth} ${liquidY}
                `}
                stroke="rgba(254, 240, 138, 0.8)"
                strokeWidth="2.5"
                fill="none"
              />
            )}
          </g>
        </svg>

        {/* Texte de pourcentage au centre */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            textShadow: '0 2px 8px rgba(0,0,0,0.9)',
          }}
        >
          <span style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
            {fillPercent}%
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fef08a', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Rempli
          </span>
        </div>
      </div>

      <div
        style={{
          padding: '4px 12px',
          borderRadius: 20,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--accent-amber)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {Math.round(totalAvailableEmergencySavings).toLocaleString('fr-FR')} € dispo
      </div>
    </div>
  );
}

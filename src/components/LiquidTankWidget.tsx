'use client';

import React, { useState } from 'react';
import { CrisisRunwayMetrics } from '../engines/crisisRunwayEngine';

interface LiquidTankWidgetProps {
  metrics: CrisisRunwayMetrics;
  onOpenCrisisModal?: () => void;
  onTargetChange?: (months: number) => void;
}

export const LiquidTankWidget: React.FC<LiquidTankWidgetProps> = ({
  metrics,
  onOpenCrisisModal,
  onTargetChange,
}) => {
  const [selectedTargetMonths, setSelectedTargetMonths] = useState<number>(6);

  const {
    totalAvailableEmergencySavings,
    vitalMonthlyExpenses,
    runwayMonths,
    targetBuffer3Months,
    targetBuffer6Months,
    targetBuffer12Months,
    safetyStatus,
  } = metrics;

  const currentTarget =
    selectedTargetMonths === 3
      ? targetBuffer3Months
      : selectedTargetMonths === 12
      ? targetBuffer12Months
      : targetBuffer6Months;

  const fillPercent =
    currentTarget > 0
      ? Math.min(100, Math.round((totalAvailableEmergencySavings / currentTarget) * 100))
      : 0;

  const getStatusBadge = () => {
    switch (safetyStatus) {
      case 'CRITICAL':
        return {
          bg: 'rgba(244, 63, 94, 0.15)',
          border: 'rgba(244, 63, 94, 0.4)',
          color: 'var(--accent-rose, #f43f5e)',
          label: '🚨 Critique (< 1 mois)',
        };
      case 'ALERT':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.4)',
          color: 'var(--accent-amber, #f59e0b)',
          label: '⚠️ Alerte (< 3 mois)',
        };
      case 'COMFORTABLE':
        return {
          bg: 'rgba(6, 182, 212, 0.15)',
          border: 'rgba(6, 182, 212, 0.4)',
          color: 'var(--accent-cyan, #06b6d4)',
          label: '🛡️ Confortable (3 à 6 mois)',
        };
      case 'FORTRESS':
      default:
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.4)',
          color: 'var(--accent-emerald, #10b981)',
          label: '🏰 Forteresse (≥ 6 mois)',
        };
    }
  };

  const status = getStatusBadge();

  // SVG Capsule calculations (Height: 200, Width: 110, Radius: 55)
  const capsuleHeight = 180;
  const capsuleWidth = 100;
  const liquidY = capsuleHeight - (capsuleHeight * Math.min(100, Math.max(0, fillPercent))) / 100;

  return (
    <div
      className="card"
      style={{
        background: 'linear-gradient(135deg, rgba(20, 24, 40, 0.95) 0%, rgba(10, 14, 25, 0.98) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: 16,
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
      }}
    >
      {/* En-tête du widget */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            🛡️
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Réservoir d'Urgence &amp; Liquid Tank (Aura Pro)
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              Jauge de sécurité en direct : vos liquidités face à vos charges incompressibles ({Math.round(vitalMonthlyExpenses)} €/mois).
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Sélecteur de cible 3 / 6 / 12 mois */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 8, padding: 2, border: '1px solid var(--border-subtle)' }}>
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setSelectedTargetMonths(m);
                  if (onTargetChange) onTargetChange(m);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: selectedTargetMonths === m ? 800 : 500,
                  background: selectedTargetMonths === m ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  color: selectedTargetMonths === m ? 'var(--accent-amber)' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {m} mois
              </button>
            ))}
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 20,
              background: status.bg,
              color: status.color,
              border: `1px solid ${status.border}`,
            }}
          >
            {status.label}
          </span>
        </div>
      </div>

      {/* Corps Principal : Capsule Liquide + Métriques Clés */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24 }}>
        {/* 🧪 Capsule Visuelle SVG Liquid Tank */}
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

        {/* 📊 Métriques & Détails d'Autonomie */}
        <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Autonomie (Runway)</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                {runwayMonths} <span style={{ fontSize: 13, fontWeight: 600 }}>mois</span>
              </span>
            </div>

            <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Cible {selectedTargetMonths} mois</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {Math.round(currentTarget).toLocaleString('fr-FR')} <span style={{ fontSize: 13, fontWeight: 600 }}>€</span>
              </span>
            </div>
          </div>

          {/* Jauge horizontale de progression */}
          <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Progression vers la cible {selectedTargetMonths} mois :</span>
              <span style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>{Math.round(totalAvailableEmergencySavings).toLocaleString('fr-FR')} / {Math.round(currentTarget).toLocaleString('fr-FR')} €</span>
            </div>
            <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${fillPercent}%`,
                  background: 'linear-gradient(90deg, #f59e0b, #10b981)',
                  borderRadius: 4,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>

          {onOpenCrisisModal && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onOpenCrisisModal}
              style={{
                background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.8) 0%, rgba(245, 158, 11, 0.8) 100%)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                fontWeight: 700,
                fontSize: 13,
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(244, 63, 94, 0.3)',
              }}
            >
              <span>🚨 Ouvrir le Simulateur de Crise &amp; Financement CLIC</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

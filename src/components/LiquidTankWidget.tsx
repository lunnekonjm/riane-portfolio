'use client';

import React, { useState } from 'react';
import type { CrisisRunwayMetrics } from '../engines/crisisRunwayEngine';
import { LiquidTankSvgCapsule } from './tank/LiquidTankSvgCapsule';
import { LiquidTankMetricsPanel } from './tank/LiquidTankMetricsPanel';

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
        <LiquidTankSvgCapsule
          fillPercent={fillPercent}
          totalAvailableEmergencySavings={totalAvailableEmergencySavings}
        />

        <LiquidTankMetricsPanel
          runwayMonths={runwayMonths}
          selectedTargetMonths={selectedTargetMonths}
          currentTarget={currentTarget}
          totalAvailableEmergencySavings={totalAvailableEmergencySavings}
          fillPercent={fillPercent}
          onOpenCrisisModal={onOpenCrisisModal}
        />
      </div>
    </div>
  );
};

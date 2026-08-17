'use client';

import React from 'react';
import type { BankTargetAnalysisSummary } from '@/engines/bankingAnalyzerEngine';

interface AuraTargetFlowsHeaderProps {
  netSalary: number;
  selectedTargetPeriodDays: number;
  setSelectedTargetPeriodDays: (days: number) => void;
  targetSummary: BankTargetAnalysisSummary;
  onOpenWizard: () => void;
  onResetInitial: () => void;
  onOpenGlobalReset: () => void;
}

export function AuraTargetFlowsHeader({
  netSalary,
  selectedTargetPeriodDays,
  setSelectedTargetPeriodDays,
  targetSummary,
  onOpenWizard,
  onResetInitial,
  onOpenGlobalReset,
}: AuraTargetFlowsHeaderProps) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: 'var(--accent-cyan)',
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            📊
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.2px' }}>
                Flux Réels Bancaires vs Cibles de Répartition
              </h3>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: 'rgba(6, 182, 212, 0.2)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  color: 'var(--accent-cyan)',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                }}
              >
                7 CIBLES CLÉS
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              Rapprochement automatique de vos flux réels sur BoursoBank (PEA, Livret A, Loyer, Abonnements, Tontine, Wave, Revolut) pour que vos règles reflètent la réalité constatée.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Chips & Master Action Buttons Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        {/* Period Filter Chips */}
        <div
          style={{
            display: 'flex',
            padding: 3,
            borderRadius: 10,
            background: 'rgba(10, 14, 23, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            gap: 2,
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedTargetPeriodDays(30)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              background: selectedTargetPeriodDays === 30 ? 'var(--accent-cyan)' : 'transparent',
              color: selectedTargetPeriodDays === 30 ? '#0a0e17' : '#94a3b8',
              fontWeight: selectedTargetPeriodDays === 30 ? 800 : 600,
              fontSize: 11.5,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Dernier mois complet
          </button>
          <button
            type="button"
            onClick={() => setSelectedTargetPeriodDays(31)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              background: selectedTargetPeriodDays === 31 ? 'var(--accent-cyan)' : 'transparent',
              color: selectedTargetPeriodDays === 31 ? '#0a0e17' : '#94a3b8',
              fontWeight: selectedTargetPeriodDays === 31 ? 800 : 600,
              fontSize: 11.5,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Mois en cours
          </button>
          <button
            type="button"
            onClick={() => setSelectedTargetPeriodDays(90)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              background: selectedTargetPeriodDays === 90 ? 'var(--accent-cyan)' : 'transparent',
              color: selectedTargetPeriodDays === 90 ? '#0a0e17' : '#94a3b8',
              fontWeight: selectedTargetPeriodDays === 90 ? 800 : 600,
              fontSize: 11.5,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            3 mois (Moyenne)
          </button>
          <button
            type="button"
            onClick={() => setSelectedTargetPeriodDays(0)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              background: selectedTargetPeriodDays === 0 ? 'var(--accent-cyan)' : 'transparent',
              color: selectedTargetPeriodDays === 0 ? '#0a0e17' : '#94a3b8',
              fontWeight: selectedTargetPeriodDays === 0 ? 800 : 600,
              fontSize: 11.5,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Tout
          </button>
        </div>

        {/* Master Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <a
            href="/api/integrations/truelayer/auth-url?view=revenue&open_wizard=true"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 10,
              background: 'rgba(99, 102, 241, 0.18)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#818cf8',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Se connecter ou se reconnecter à BoursoBank via DSP2"
          >
            <span>🏦</span> Connecter BoursoBank
          </a>

          <button
            type="button"
            onClick={onOpenWizard}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              border: 'none',
              color: '#082f49',
              fontSize: 12,
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)',
              transition: 'all 0.2s',
            }}
          >
            <span>🪄</span> Analyser &amp; Valider les Flux (Radar)
          </button>

          <button
            type="button"
            onClick={onResetInitial}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 10,
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Restaurer les ratios de référence recommandés (50% charges / 30% quotidien / 20% épargne)"
          >
            <span>🔄</span> Ratios Référence (50/30/20)
          </button>

          <button
            type="button"
            onClick={onOpenGlobalReset}
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              fontSize: 12,
              cursor: 'pointer',
            }}
            title="Options & Réinitialisation"
          >
            ⋮
          </button>
        </div>
      </div>

      {/* Info Banner Summary */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          padding: '10px 14px',
          borderRadius: 10,
          background: 'rgba(10, 14, 23, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0' }}>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>ℹ️</span>
          <span>
            Total flux réels identifiés ({targetSummary.periodLabel}) :{' '}
            <strong style={{ color: '#ffffff', fontWeight: 800 }}>{targetSummary.totalOutflows.toFixed(2)} € / mois</strong>
          </span>
        </div>
        <div style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>
          {netSalary > 0 ? ((targetSummary.totalOutflows / netSalary) * 100).toFixed(1) : '0.0'}% du salaire net ({netSalary.toFixed(2)} €)
        </div>
      </div>
    </>
  );
}

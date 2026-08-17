'use client';

import React from 'react';
import type { LifeAccidentSimulationResult } from '@/engines/crisisRunwayEngine';

interface CrisisAccidentTabProps {
  emergencyExpense: number;
  setEmergencyExpense: (val: number) => void;
  cashPayment: number;
  setCashPayment: (val: number) => void;
  creditDurationMonths: number;
  setCreditDurationMonths: (val: number) => void;
  accidentSim: LifeAccidentSimulationResult;
}

export function CrisisAccidentTab({
  emergencyExpense,
  setEmergencyExpense,
  cashPayment,
  setCashPayment,
  creditDurationMonths,
  setCreditDurationMonths,
  accidentSim,
}: CrisisAccidentTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
          1. Paramètres de l&apos;urgence financière
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Dépense totale d&apos;urgence</label>
            <input
              type="number"
              className="input"
              value={emergencyExpense}
              onChange={(e) => setEmergencyExpense(Math.max(0, Number(e.target.value)))}
              style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Paiement comptant initial</label>
            <input
              type="number"
              className="input"
              value={cashPayment}
              onChange={(e) => setCashPayment(Math.max(0, Number(e.target.value)))}
              style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Durée crédit reste à charge</label>
            <input
              type="number"
              className="input"
              value={creditDurationMonths}
              onChange={(e) => setCreditDurationMonths(Math.max(1, Number(e.target.value)))}
              style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
            />
          </div>
        </div>
      </div>

      {/* Résultat du stress test */}
      <div
        style={{
          background: accidentSim.isReserveExhausted ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 185, 129, 0.08)',
          border: `1px solid ${accidentSim.isReserveExhausted ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
          borderRadius: 12,
          padding: 18,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
            2. Bilan de Résilience Post-Choc
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 12,
              background: accidentSim.isReserveExhausted ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: accidentSim.isReserveExhausted ? 'var(--accent-rose)' : 'var(--accent-emerald)',
            }}
          >
            {accidentSim.isReserveExhausted ? '⚠️ Réserve en Rupture' : '🛡️ Filet Préservé'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Épargne Restante</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {Math.round(accidentSim.postAccidentAvailableSavings).toLocaleString('fr-FR')} €
            </span>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Autonomie Restante</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
              {accidentSim.postAccidentRunwayMonths} mois
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Plan d&apos;action d&apos;urgence recommandé :</span>
          {accidentSim.actionPlan.map((step, idx) => (
            <div key={idx} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>👉</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

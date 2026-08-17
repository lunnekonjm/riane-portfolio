'use client';

import React from 'react';
import type { LifeAccidentSimulationResult } from '@/engines/crisisRunwayEngine';

interface AuraCrisisAccidentCardProps {
  emergencyExpense: number;
  setEmergencyExpense: (val: number) => void;
  cashPayment: number;
  setCashPayment: (val: number) => void;
  creditMonths: number;
  setCreditMonths: (val: number) => void;
  accidentSim: LifeAccidentSimulationResult;
}

export function AuraCrisisAccidentCard({
  emergencyExpense,
  setEmergencyExpense,
  cashPayment,
  setCashPayment,
  creditMonths,
  setCreditMonths,
  accidentSim,
}: AuraCrisisAccidentCardProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="card" style={{ padding: 20 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 14 }}>
          1. Paramètres de l&apos;imprévu financier
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Dépense totale d&apos;urgence (€)
            </label>
            <input
              type="number"
              className="input"
              value={emergencyExpense}
              onChange={(e) => setEmergencyExpense(Math.max(0, Number(e.target.value)))}
              style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Paiement comptant initial (€)
            </label>
            <input
              type="number"
              className="input"
              value={cashPayment}
              onChange={(e) => setCashPayment(Math.max(0, Number(e.target.value)))}
              style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Durée de l&apos;étalement (mois)
            </label>
            <input
              type="number"
              className="input"
              value={creditMonths}
              onChange={(e) => setCreditMonths(Math.max(1, Number(e.target.value)))}
              style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
            />
          </div>
        </div>
      </div>

      {/* Bilan du stress test */}
      <div
        className="card"
        style={{
          padding: 22,
          border: `1px solid ${accidentSim.isReserveExhausted ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
          background: accidentSim.isReserveExhausted ? 'rgba(244, 63, 94, 0.05)' : 'rgba(16, 185, 129, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h4 style={{ fontSize: 15, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
            2. Bilan de Résilience Post-Choc
          </h4>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 14,
              background: accidentSim.isReserveExhausted ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: accidentSim.isReserveExhausted ? 'var(--accent-rose)' : 'var(--accent-emerald)',
            }}
          >
            {accidentSim.isReserveExhausted ? '⚠️ Réserve en Rupture' : '🛡️ Matelas Préservé'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Épargne Restante</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {Math.round(accidentSim.postAccidentAvailableSavings).toLocaleString('fr-FR')} €
            </span>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Autonomie (Runway) Restante</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
              {accidentSim.postAccidentRunwayMonths} mois
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Plan d&apos;action d&apos;urgence recommandé :</span>
          {accidentSim.actionPlan.map((step, idx) => (
            <div key={idx} style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>👉</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

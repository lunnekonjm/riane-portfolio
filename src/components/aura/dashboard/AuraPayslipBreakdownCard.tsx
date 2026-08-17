'use client';

import React from 'react';

interface AuraPayslipBreakdownCardProps {
  grossSalary: number;
  socialContributions: number;
  mealTickets: number;
  teleworkAllowance: number;
  netSalary: number;
}

export function AuraPayslipBreakdownCard({
  grossSalary,
  socialContributions,
  mealTickets,
  teleworkAllowance,
  netSalary,
}: AuraPayslipBreakdownCardProps) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <h4 style={{ fontSize: 15, margin: '0 0 14px 0', fontWeight: 800, color: 'var(--text-primary)' }}>
        💼 Décomposition Salariale Réelle
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Salaire Brut</span>
          <strong style={{ fontSize: 17, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {grossSalary.toLocaleString('fr-FR')} €
          </strong>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Cotisations Sociales</span>
          <strong style={{ fontSize: 17, color: 'var(--accent-rose)', fontFamily: 'var(--font-mono)' }}>
            {socialContributions.toLocaleString('fr-FR')} €
          </strong>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Titres Restaurant</span>
          <strong style={{ fontSize: 17, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
            {mealTickets.toLocaleString('fr-FR')} €
          </strong>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Indemnité Télétravail</span>
          <strong style={{ fontSize: 17, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
            +{teleworkAllowance.toLocaleString('fr-FR')} €
          </strong>
        </div>

        <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: 12, borderRadius: 10, border: '1px solid var(--accent-cyan)' }}>
          <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 700, display: 'block' }}>Net à Payer</span>
          <strong style={{ fontSize: 18, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
            +{netSalary.toLocaleString('fr-FR')} €
          </strong>
        </div>
      </div>
    </div>
  );
}

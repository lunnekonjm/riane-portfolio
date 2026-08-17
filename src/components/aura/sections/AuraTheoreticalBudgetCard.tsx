'use client';

import React from 'react';

interface AuraTheoreticalBudgetCardProps {
  selectedForecastOffset: number;
  selectedMonthLong: string;
  selectedDate: Date;
  resteAVivre: number;
  netSalary: number;
  totalFixed: number;
  totalSavings: number;
  totalDaily: number;
}

export function AuraTheoreticalBudgetCard({
  selectedForecastOffset,
  selectedMonthLong,
  selectedDate,
  resteAVivre,
  netSalary,
  totalFixed,
  totalSavings,
  totalDaily,
}: AuraTheoreticalBudgetCardProps) {
  return (
    <div
      className="card"
      style={{
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid var(--border-subtle)',
        padding: 20,
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
          {selectedForecastOffset === 0
            ? 'RESTE À VIVRE THÉORIQUE — MODÈLE MENSUEL'
            : `RESTE À VIVRE PRÉVISIONNEL — ${selectedMonthLong.toUpperCase()} ${selectedDate.getFullYear()}`}
        </span>
        <span
          style={{
            padding: '3px 8px',
            borderRadius: 6,
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: 'var(--accent-emerald)',
            fontSize: 10,
            fontWeight: 800,
          }}
        >
          Modèle 50/30/20
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 32, fontWeight: 900, color: resteAVivre < 0 ? 'var(--accent-rose)' : '#ffffff', letterSpacing: '-0.5px' }}>
          {resteAVivre.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
        </span>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            background: 'rgba(10, 14, 23, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#cbd5e1',
            fontSize: 11.5,
            fontWeight: 700,
          }}
        >
          {netSalary > 0 ? ((resteAVivre / netSalary) * 100).toFixed(1) : 0} % du net récurrent
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Marge mensuelle non allouée issue de votre salaire net ({netSalary.toFixed(2)} €), après déduction des charges fixes ({totalFixed.toFixed(2)} €), de l&apos;épargne ({totalSavings.toFixed(2)} €) et du quotidien ({totalDaily.toFixed(2)} €).
      </p>

      {/* Segmented Multi-Color Progress Bar */}
      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: 'rgba(10, 14, 23, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        {netSalary > 0 && (
          <>
            <div
              style={{
                width: `${Math.min(100, Math.max(0, (totalFixed / netSalary) * 100))}%`,
                background: '#f43f5e',
                transition: 'width 0.3s',
              }}
              title={`Charges Fixes: ${totalFixed.toFixed(2)} €`}
            />
            <div
              style={{
                width: `${Math.min(100, Math.max(0, (totalSavings / netSalary) * 100))}%`,
                background: '#3b82f6',
                transition: 'width 0.3s',
              }}
              title={`Épargne & PEA: ${totalSavings.toFixed(2)} €`}
            />
            <div
              style={{
                width: `${Math.min(100, Math.max(0, (totalDaily / netSalary) * 100))}%`,
                background: '#f59e0b',
                transition: 'width 0.3s',
              }}
              title={`Quotidien: ${totalDaily.toFixed(2)} €`}
            />
            <div
              style={{
                width: `${Math.min(100, Math.max(0, (Math.max(0, resteAVivre) / netSalary) * 100))}%`,
                background: '#10b981',
                transition: 'width 0.3s',
              }}
              title={`Reste à vivre: ${Math.max(0, resteAVivre).toFixed(2)} €`}
            />
          </>
        )}
      </div>

      {/* Progress Bar Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e' }} />
          Charges: {totalFixed.toFixed(0)}€
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
          Épargne: {totalSavings.toFixed(0)}€
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
          Quotidien: {totalDaily.toFixed(0)}€
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--accent-emerald)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
          Reste: {Math.max(0, resteAVivre).toFixed(0)}€
        </span>
      </div>
    </div>
  );
}

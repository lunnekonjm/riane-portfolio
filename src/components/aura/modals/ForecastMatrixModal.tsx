'use client';

import React from 'react';
import { isExpenseActiveForPeriod, type TemporaryExpenseItem } from '@/engines/bankingAnalyzerEngine';

interface ForecastMatrixModalProps {
  netSalary: number;
  baseFixed: number;
  totalSavings: number;
  totalDaily: number;
  temporaryExpenses: TemporaryExpenseItem[];
  onClose: () => void;
}

const monthsShortFr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

const getDateForOffset = (offset: number) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d;
};

const getPeriodForOffset = (offset: number) => {
  const d = getDateForOffset(offset);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${m}`;
};

export function ForecastMatrixModal({
  netSalary,
  baseFixed,
  totalSavings,
  totalDaily,
  temporaryExpenses,
  onClose,
}: ForecastMatrixModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 860,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 24,
          borderRadius: 20,
          background: '#0f172a',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>📊</span>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#ffffff' }}>Matrice Prévisionnelle 6 Mois</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '6px 12px', borderRadius: 8, background: '#1e293b', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Poste Budgétaire</th>
                {[0, 1, 2, 3, 4, 5].map((off) => {
                  const d = getDateForOffset(off);
                  return (
                    <th key={off} style={{ padding: '10px 12px', textAlign: 'right' }}>
                      {monthsShortFr[d.getMonth()]} {d.getFullYear()}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 800, color: '#ffffff' }}>Salaire Net Récurrent</td>
                {[0, 1, 2, 3, 4, 5].map((off) => (
                  <td key={off} style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                    {netSalary.toFixed(2)} €
                  </td>
                ))}
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '10px 12px', color: 'var(--accent-rose)' }}>Charges Fixes Socle</td>
                {[0, 1, 2, 3, 4, 5].map((off) => (
                  <td key={off} style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--accent-rose)' }}>
                    -{baseFixed.toFixed(2)} €
                  </td>
                ))}
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '10px 12px', color: 'var(--accent-rose)' }}>Échéances Temporaires</td>
                {[0, 1, 2, 3, 4, 5].map((off) => {
                  const p = getPeriodForOffset(off);
                  const amt = temporaryExpenses
                    .filter((e) => isExpenseActiveForPeriod(e, p))
                    .reduce((sum, e) => sum + e.monthlyAmount, 0);
                  return (
                    <td key={off} style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--accent-rose)' }}>
                      {amt > 0 ? `-${amt.toFixed(2)} €` : '0.00 €'}
                    </td>
                  );
                })}
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '10px 12px', color: '#93c5fd' }}>Épargne & Cible PEA</td>
                {[0, 1, 2, 3, 4, 5].map((off) => (
                  <td key={off} style={{ padding: '10px 12px', textAlign: 'right', color: '#93c5fd' }}>
                    -{totalSavings.toFixed(2)} €
                  </td>
                ))}
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '10px 12px', color: 'var(--accent-amber)' }}>Quotidien & Revolut</td>
                {[0, 1, 2, 3, 4, 5].map((off) => (
                  <td key={off} style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--accent-amber)' }}>
                    -{totalDaily.toFixed(2)} €
                  </td>
                ))}
              </tr>
              <tr style={{ background: 'rgba(10, 14, 23, 0.8)', borderTop: '2px solid rgba(255, 255, 255, 0.15)' }}>
                <td style={{ padding: '12px', fontWeight: 900, color: '#ffffff' }}>Reste à Vivre Prévisionnel</td>
                {[0, 1, 2, 3, 4, 5].map((off) => {
                  const p = getPeriodForOffset(off);
                  const tempAmt = temporaryExpenses
                    .filter((e) => isExpenseActiveForPeriod(e, p))
                    .reduce((sum, e) => sum + e.monthlyAmount, 0);
                  const res = netSalary - baseFixed - tempAmt - totalSavings - totalDaily;
                  return (
                    <td
                      key={off}
                      style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: 900,
                        color: res < 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                      }}
                    >
                      {res.toFixed(2)} €
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

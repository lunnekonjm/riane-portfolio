'use client';

import React from 'react';
import { isExpenseActiveForPeriod, computeEndPeriod, type TemporaryExpenseItem } from '@/engines/bankingAnalyzerEngine';

interface AuraTemporaryExpensesSectionProps {
  temporaryExpenses: TemporaryExpenseItem[];
  selectedPeriod: string;
  onAddTempExpense: () => void;
  onEditTempExpense: (exp: TemporaryExpenseItem) => void;
  onDeleteTempExpense: (id: string, label: string) => void;
}

export function AuraTemporaryExpensesSection({
  temporaryExpenses,
  selectedPeriod,
  onAddTempExpense,
  onEditTempExpense,
  onDeleteTempExpense,
}: AuraTemporaryExpensesSectionProps) {
  return (
    <div
      className="card"
      style={{
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid var(--border-subtle)',
        padding: 18,
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--accent-cyan)', fontSize: 18 }}>📅</span>
          <strong style={{ fontSize: 13.5, color: '#ffffff' }}>Dépenses Échéancées & Temporaires</strong>
        </div>

        <button
          type="button"
          onClick={onAddTempExpense}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 10,
            background: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            color: '#93c5fd',
            fontSize: 11.5,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          <span>+</span> Déclarer un Échéancier
        </button>
      </div>

      {temporaryExpenses.length === 0 ? (
        <div style={{ padding: 14, textAlign: 'center', borderRadius: 10, background: 'rgba(10, 14, 23, 0.5)', color: '#64748b', fontSize: 12 }}>
          Aucune dépense temporaire déclarée.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {temporaryExpenses.map((exp) => {
            const isActiveOnSelected = isExpenseActiveForPeriod(exp, selectedPeriod);
            const endP = computeEndPeriod(exp.startPeriod, exp.durationMonths);

            return (
              <div
                key={exp.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: isActiveOnSelected ? 'rgba(10, 14, 23, 0.85)' : 'rgba(10, 14, 23, 0.4)',
                  border: isActiveOnSelected ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 13, color: '#ffffff' }}>{exp.label}</strong>
                    <span
                      style={{
                        padding: '2px 7px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 800,
                        background: isActiveOnSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                        color: isActiveOnSelected ? 'var(--accent-emerald)' : '#94a3b8',
                        border: isActiveOnSelected ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {isActiveOnSelected ? `Actif sur ${selectedPeriod}` : `Inactif sur ${selectedPeriod}`}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Début {exp.startPeriod} • Durée : {exp.durationMonths} mois (Fin {endP})
                  </div>
                </div>

                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-rose)' }}>
                  -{exp.monthlyAmount.toFixed(2)} €/mois
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => onEditTempExpense(exp)}
                    style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14 }}
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteTempExpense(exp.id, exp.label)}
                    style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14 }}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

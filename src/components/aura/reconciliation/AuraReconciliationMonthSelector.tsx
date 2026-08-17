'use client';

import React from 'react';
import type { SalaryRecord, BankTransactionMatch } from '@/types/revenue';
import { getPeriodLabel } from '@/hooks/useAuraBankReconciliationState';
import { CATEGORY_MAP } from './AuraReconciliationReviewModal';

interface AuraReconciliationMonthSelectorProps {
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  availableMonths: string[];
  cleanRecords: SalaryRecord[];
  actualSalary: number;
  actualPEA: number;
  deltaVsTarget: number;
  targetMonthlyBudget: number;
  activeMatches: BankTransactionMatch[];
  handleOpenReviewModal: () => void;
  handleSaveReviewModal: () => Promise<void>;
}

export function AuraReconciliationMonthSelector({
  selectedMonth,
  setSelectedMonth,
  availableMonths,
  cleanRecords,
  actualSalary,
  actualPEA,
  deltaVsTarget,
  targetMonthlyBudget,
  activeMatches,
  handleOpenReviewModal,
  handleSaveReviewModal,
}: AuraReconciliationMonthSelectorProps) {
  return (
    <div
      className="card"
      style={{
        padding: 22,
        border: '1px solid rgba(99, 102, 241, 0.3)',
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.25) 0%, rgba(15, 23, 42, 0.9) 100%)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h4 style={{ fontSize: 16, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
            Analyse Mensuelle : {getPeriodLabel(selectedMonth)}
          </h4>
          <p style={{ margin: '3px 0 0 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
            Confrontation directe des montants constatés en banque avec votre budget cible.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleOpenReviewModal}
          >
            ✏️ Revoir les flux
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontWeight: 700 }}
            onClick={handleSaveReviewModal}
          >
            ✅ Valider ce mois
          </button>
        </div>
      </div>

      {/* Sélecteur de mois horizontal */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 18 }}>
        {availableMonths.map((m) => {
          const isSelected = m === selectedMonth;
          const rec = cleanRecords.find((r) => r.period === m);
          const isReconciled = rec?.bankReality?.reconciled;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMonth(m)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: isSelected ? 800 : 600,
                cursor: 'pointer',
                border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-secondary)',
                color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}
            >
              <span>📅 {getPeriodLabel(m)}</span>
              {isReconciled && <span style={{ fontSize: 10, color: 'var(--accent-emerald)', fontWeight: 700 }}>✅ Validé</span>}
            </button>
          );
        })}
      </div>

      {/* 3 Cartes Clés du Mois Écoulé */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div style={{ padding: 16, borderRadius: 10, background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
            💼 Salaire Net Encaissé
          </span>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 6, color: 'var(--accent-cyan)' }}>
            +{actualSalary.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </div>
        </div>

        <div style={{ padding: 16, borderRadius: 10, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>
            📈 Envoyé vers le PEA
          </span>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 6, color: 'var(--accent-emerald)' }}>
            -{actualPEA.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </div>
        </div>

        <div style={{ padding: 16, borderRadius: 10, background: 'rgba(129, 140, 248, 0.08)', border: '1px solid rgba(129, 140, 248, 0.25)' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase' }}>
            🎯 Écart vs Cible ({targetMonthlyBudget} €)
          </span>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 6, color: deltaVsTarget >= 0 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
            {deltaVsTarget >= 0 ? `+${deltaVsTarget.toLocaleString('fr-FR')} €` : `${deltaVsTarget.toLocaleString('fr-FR')} €`}
          </div>
        </div>
      </div>

      {/* Tableau des Flux Retenus pour ce mois */}
      {activeMatches.filter((m) => m.included).length > 0 && (
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
          <table className="table" style={{ width: '100%', margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: 100 }}>Date</th>
                <th>Libellé Transaction</th>
                <th style={{ width: 130, textAlign: 'right' }}>Montant</th>
                <th style={{ width: 230 }}>Catégorie</th>
              </tr>
            </thead>
            <tbody>
              {activeMatches.filter((tx) => tx.included).map((tx) => {
                const cat = CATEGORY_MAP.get(tx.category) || CATEGORY_MAP.get('OTHER_TRANSFER')!;
                const isCredit = tx.category === 'SALARY_INCOME';
                return (
                  <tr key={tx.id}>
                    <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{tx.date}</td>
                    <td style={{ fontSize: 12 }}><strong>{tx.rawDescription}</strong></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, textAlign: 'right', color: isCredit ? 'var(--accent-cyan)' : 'var(--accent-emerald)' }}>
                      {isCredit ? '+' : '-'}{tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 600, color: cat.color }}>{cat.icon} {cat.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

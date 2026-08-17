'use client';

import React from 'react';
import type { BankTransactionMatch, BankReconciliationCategory } from '@/types/revenue';
import { getPeriodLabel } from '@/hooks/useAuraBankReconciliationState';

export const BANK_CATEGORY_OPTIONS: Array<{ value: BankReconciliationCategory; label: string; icon: string; color: string }> = [
  { value: 'SALARY_INCOME', label: 'Salaire Reçu (Employeur)', icon: '💼', color: 'var(--accent-cyan)' },
  { value: 'INVEST_PEA', label: 'Versement PEA (Investissement)', icon: '📈', color: 'var(--accent-emerald)' },
  { value: 'INVEST_TAMPON', label: 'Compte Tampon (Sas Réserve)', icon: '⚡', color: '#f59e0b' },
  { value: 'INVEST_TONTINE', label: 'Cotisation Tontine (Épargne)', icon: '🤝', color: '#818cf8' },
  { value: 'INVEST_LIVRET_A', label: 'Livret A (Épargne)', icon: '🛡️', color: '#06b6d4' },
  { value: 'INVEST_CTO', label: 'Compte Titres (CTO)', icon: '🌐', color: '#6366f1' },
  { value: 'RENT_HOUSING', label: 'Loyer & Logement', icon: '🏠', color: 'var(--text-secondary)' },
  { value: 'SUBSCRIPTIONS', label: 'Abonnements & Factures', icon: '📱', color: 'var(--text-secondary)' },
  { value: 'SUPPORT_WAVE', label: 'Soutien familial (Wave)', icon: '🌍', color: 'var(--text-secondary)' },
  { value: 'REVOLUT_TRANSFER', label: 'Revolut', icon: '💳', color: 'var(--text-secondary)' },
  { value: 'DAILY_EXPENSE', label: 'Dépense courante', icon: '🛒', color: 'var(--text-secondary)' },
  { value: 'OTHER_TRANSFER', label: 'Autre virement', icon: '🔄', color: 'var(--text-secondary)' },
  { value: 'IGNORED', label: 'Ignorer (Hors budget)', icon: '❌', color: 'var(--text-muted)' },
];

export const CATEGORY_MAP = new Map(BANK_CATEGORY_OPTIONS.map((c) => [c.value, c]));

interface AuraReconciliationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  reviewMatches: BankTransactionMatch[];
  handleUpdateReviewMatch: (id: string, updates: Partial<BankTransactionMatch>) => void;
  modalSummary: { salary: number; pea: number; tampon: number; total: number };
  handleUndoMatches: () => void;
  handleRedoMatches: () => void;
  matchesHistory: any[];
  matchesRedo: any[];
  handleSaveReviewModal: () => Promise<void>;
}

export function AuraReconciliationReviewModal({
  isOpen,
  onClose,
  selectedMonth,
  reviewMatches,
  handleUpdateReviewMatch,
  modalSummary,
  handleUndoMatches,
  handleRedoMatches,
  matchesHistory,
  matchesRedo,
  handleSaveReviewModal,
}: AuraReconciliationReviewModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 820,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 24,
          borderRadius: 14,
          border: '1px solid var(--accent-cyan)',
          background: 'var(--bg-primary)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
            🔍 Revue des transactions bancaires &mdash; {getPeriodLabel(selectedMonth)}
          </h3>
          <button type="button" className="btn-ghost" onClick={onClose}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 18, border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
          <table className="table" style={{ width: '100%', margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: 45, textAlign: 'center' }}>Actif</th>
                <th style={{ width: 95 }}>Date</th>
                <th>Libellé Exact de la Banque</th>
                <th style={{ width: 110, textAlign: 'right' }}>Montant</th>
                <th style={{ width: 220 }}>Catégorie Assignée</th>
              </tr>
            </thead>
            <tbody>
              {reviewMatches.map((m) => (
                <tr key={m.id} style={{ opacity: m.included ? 1 : 0.45 }}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={m.included}
                      onChange={(e) => handleUpdateReviewMatch(m.id, { included: e.target.checked })}
                      style={{ cursor: 'pointer', width: 16, height: 16 }}
                    />
                  </td>
                  <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{m.date}</td>
                  <td style={{ fontSize: 12 }}><strong>{m.rawDescription}</strong></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, textAlign: 'right', color: m.category === 'SALARY_INCOME' ? 'var(--accent-cyan)' : 'var(--accent-emerald)' }}>
                    {m.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                  </td>
                  <td>
                    <select
                      className="input"
                      style={{ fontSize: 12, padding: '4px 8px', height: 32 }}
                      value={m.category}
                      onChange={(e) => handleUpdateReviewMatch(m.id, { category: e.target.value as BankReconciliationCategory })}
                    >
                      {BANK_CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
          <div style={{ display: 'flex', gap: 20 }}>
            <span>💼 Salaire : <strong style={{ color: 'var(--accent-cyan)' }}>+{modalSummary.salary.toLocaleString('fr-FR')} €</strong></span>
            <span>📈 PEA : <strong style={{ color: 'var(--accent-emerald)' }}>-{modalSummary.pea.toLocaleString('fr-FR')} €</strong></span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleUndoMatches} disabled={matchesHistory.length === 0}>↩️ Annuler</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleRedoMatches} disabled={matchesRedo.length === 0}>↪️ Rétablir</button>
            <button type="button" className="btn btn-primary" onClick={handleSaveReviewModal} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontWeight: 700 }}>
              💾 Valider ce mois
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

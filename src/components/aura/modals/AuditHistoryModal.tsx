'use client';

import React from 'react';
import type { BudgetAuditLogEntry } from '../AuraRulesView';

interface AuditHistoryModalProps {
  auditLogs: BudgetAuditLogEntry[];
  onRollback: (entry: BudgetAuditLogEntry) => void;
  onClose: () => void;
}

export function AuditHistoryModal({ auditLogs, onRollback, onClose }: AuditHistoryModalProps) {
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
          maxWidth: 620,
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: 24,
          borderRadius: 20,
          background: '#0f172a',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>📜</span>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#ffffff' }}>Journal d&apos;Audit Budgétaire</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '6px 12px', borderRadius: 8, background: '#1e293b', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {auditLogs.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#64748b' }}>
              Aucun historique de modification pour le moment.
            </div>
          ) : (
            auditLogs.map((entry) => (
              <div
                key={entry.id}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: 'rgba(10, 14, 23, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#ffffff' }}>{entry.categoryName}</strong>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                    {new Date(entry.timestamp).toLocaleString('fr-FR')}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                  <span>{entry.actionLabel} ({entry.pillar})</span>
                  {entry.effectiveDeltaEuro !== 0 && (
                    <strong style={{ color: entry.effectiveDeltaEuro >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                      {entry.effectiveDeltaEuro >= 0 ? '+' : ''}{entry.effectiveDeltaEuro.toFixed(2)} €
                    </strong>
                  )}
                </div>

                {entry.note && <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>{entry.note}</div>}

                {entry.previousAmount !== undefined && entry.previousAmount !== null && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => onRollback(entry)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: 'rgba(6, 182, 212, 0.15)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        color: 'var(--accent-cyan)',
                        fontSize: 10.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ↩ Rétablir valeur précédente
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

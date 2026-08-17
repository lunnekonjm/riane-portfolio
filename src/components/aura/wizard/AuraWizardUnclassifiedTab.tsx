'use client';

import React from 'react';
import type { TargetFlowItem } from '@/engines/bankingAnalyzerEngine';
import { CANDIDATE_CATEGORY_OPTIONS } from './AuraWizardExpandedTxs';

interface AuraWizardUnclassifiedTabProps {
  unclassifiedTxs: TargetFlowItem[];
  onAssignToCandidate: (tx: TargetFlowItem, candidateId: string) => void;
  fmtEur: (val: number) => string;
}

export function AuraWizardUnclassifiedTab({
  unclassifiedTxs,
  onAssignToCandidate,
  fmtEur,
}: AuraWizardUnclassifiedTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          padding: 12,
          borderRadius: 12,
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          fontSize: 12,
          color: '#cbd5e1',
        }}
      >
        <strong style={{ color: 'var(--accent-amber)' }}>Flux non classés automatiquement :</strong>
        <div>
          Ces transactions du relevé BoursoBank n&apos;ont pas été associées aux postes standards. Vous pouvez les rattacher à un poste existant en un clic.
        </div>
      </div>

      {unclassifiedTxs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
          🎉 Aucune transaction non classée restante.
        </div>
      ) : (
        unclassifiedTxs.map((tx) => {
          const rawDesc = tx.rawTitle || tx.title;
          return (
            <div
              key={tx.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: 12,
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 240 }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>{tx.date}</span>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <strong style={{ fontSize: 13, color: '#ffffff' }}>{tx.title}</strong>
                  {rawDesc !== tx.title && (
                    <span style={{ fontSize: 10, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }} title={rawDesc}>
                      {rawDesc}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--accent-rose)', marginLeft: 'auto' }}>
                  {fmtEur(Math.abs(tx.amount))}
                </span>
              </div>

              {/* Quick Assign Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onAssignToCandidate(tx, e.target.value);
                    }
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: 'rgba(10, 14, 23, 0.95)',
                    border: '1px solid rgba(6, 182, 212, 0.4)',
                    color: 'var(--accent-cyan)',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <option value="" disabled>
                    ➕ Rattacher au poste...
                  </option>
                  {CANDIDATE_CATEGORY_OPTIONS.filter((opt) => opt.id !== 'unclassified').map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

'use client';

import React from 'react';
import type { TargetFlowItem } from '@/engines/bankingAnalyzerEngine';

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
        unclassifiedTxs.map((tx) => (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>{tx.date}</span>
              <strong style={{ fontSize: 13, color: '#ffffff' }}>{tx.title}</strong>
              <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--accent-rose)' }}>
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
                <option value="flow-loyer">🏠 Loyer &amp; Logement</option>
                <option value="flow-abonnement">📱 Abonnements &amp; Services</option>
                <option value="flow-pea">📈 Cible PEA</option>
                <option value="flow-livret_a">🛡️ Livret A</option>
                <option value="flow-tontine">👥 Tontine</option>
                <option value="flow-soutien">❤️ Soutien Familial</option>
                <option value="flow-revolut">💳 Revolut (Quotidien)</option>
              </select>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

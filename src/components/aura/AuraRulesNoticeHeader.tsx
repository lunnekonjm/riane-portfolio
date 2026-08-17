'use client';

import React from 'react';

interface AuraRulesNoticeHeaderProps {
  netSalary: number;
  auditLogsCount: number;
  onOpenAudit: () => void;
}

export function AuraRulesNoticeHeader({
  netSalary,
  auditLogsCount,
  onOpenAudit,
}: AuraRulesNoticeHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        padding: '14px 18px',
        borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.16) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.4)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            padding: 8,
            borderRadius: 10,
            background: 'rgba(139, 92, 246, 0.2)',
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          💡
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#f8fafc' }}>
            Règles dynamiques (% &amp; Nominal €) basées sur votre revenu net de{' '}
            <strong style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>
              {netSalary.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </strong>
          </div>
          <div style={{ fontSize: 11.5, color: '#cbd5e1', marginTop: 2 }}>
            Chaque règle recalcule immédiatement vos équivalences en euros et votre reste à vivre.
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenAudit}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderRadius: 10,
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#e2e8f0',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <span>📜 Audit</span>
        {auditLogsCount > 0 && (
          <span
            style={{
              padding: '2px 7px',
              borderRadius: 999,
              background: 'rgba(6, 182, 212, 0.2)',
              color: 'var(--accent-cyan)',
              fontSize: 10.5,
              fontWeight: 800,
            }}
          >
            {auditLogsCount}
          </span>
        )}
      </button>
    </div>
  );
}

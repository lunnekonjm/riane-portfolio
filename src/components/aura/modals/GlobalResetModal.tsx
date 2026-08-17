'use client';

import React from 'react';

interface GlobalResetModalProps {
  onRestoreDefaults: () => void;
  onClearAllRules: () => void;
  onClearAuditLogs: () => void;
  onClose: () => void;
}

export function GlobalResetModal({
  onRestoreDefaults,
  onClearAllRules,
  onClearAuditLogs,
  onClose,
}: GlobalResetModalProps) {
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
          maxWidth: 380,
          padding: 24,
          borderRadius: 20,
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#ffffff' }}>Options & Réinitialisation</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            onClick={onRestoreDefaults}
            style={{
              padding: 12,
              borderRadius: 10,
              background: 'rgba(10, 14, 23, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--accent-cyan)',
              fontWeight: 700,
              fontSize: 12,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            🔄 Restaurer les règles initiales
          </button>
          <button
            type="button"
            onClick={onClearAllRules}
            style={{
              padding: 12,
              borderRadius: 10,
              background: 'rgba(10, 14, 23, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--accent-rose)',
              fontWeight: 700,
              fontSize: 12,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            🗑️ Tout effacer (Partir de zéro)
          </button>
          <button
            type="button"
            onClick={onClearAuditLogs}
            style={{
              padding: 12,
              borderRadius: 10,
              background: 'rgba(10, 14, 23, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--text-muted)',
              fontWeight: 700,
              fontSize: 12,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            📜 Vider le journal d&apos;audit
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 14px', borderRadius: 10, background: '#1e293b', border: 'none', color: '#cbd5e1', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

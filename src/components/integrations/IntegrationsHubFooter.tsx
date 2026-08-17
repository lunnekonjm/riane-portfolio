'use client';

import React from 'react';

interface IntegrationsHubFooterProps {
  onClose: () => void;
}

export function IntegrationsHubFooter({ onClose }: IntegrationsHubFooterProps) {
  return (
    <div
      style={{
        padding: '14px 24px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-tertiary)',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        fontSize: 12,
        color: 'var(--text-muted)',
        flexWrap: 'wrap',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-emerald)', display: 'inline-block' }} />
        <span>Sécurité certifiée : Chiffrement SSL/TLS, aucune clé privée stockée dans le navigateur.</span>
      </div>
      <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '6px 14px', borderRadius: 8 }} type="button">
        Fermer
      </button>
    </div>
  );
}

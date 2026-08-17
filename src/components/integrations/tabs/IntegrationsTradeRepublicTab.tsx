'use client';

import React from 'react';

export function IntegrationsTradeRepublicTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          padding: '20px',
          borderRadius: 14,
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 28 }}>📱</span>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Trade Republic (Moteur DCA Automatique)
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Suivi précis des versements récurrents indiciels et valorisation en temps réel.
          </p>
        </div>
      </div>

      <div
        style={{
          padding: '20px',
          borderRadius: 14,
          background: 'rgba(79, 70, 229, 0.08)',
          border: '1px solid rgba(79, 70, 229, 0.25)',
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}
      >
        <div style={{ fontWeight: 700, color: '#818cf8', marginBottom: 8 }}>
          💡 Comment fonctionne le suivi Trade Republic dans RIANE :
        </div>
        <p style={{ margin: '0 0 8px 0' }}>
          Comme Trade Republic ne dispose pas d&apos;API publique pour les particuliers, RIANE calcule exactement votre portefeuille grâce à :
        </p>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>L&apos;historique de vos paliers de versements programmés (DCA Step-Ups).</li>
          <li>La valorisation en direct du <strong>Nasdaq 100 / QQQ</strong> via les flux de marché.</li>
          <li>Le calcul automatique des parts accumulées et du PRU moyen pondéré.</li>
        </ul>
      </div>
    </div>
  );
}

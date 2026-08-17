'use client';

import React from 'react';

interface ProxyAssetModalProps {
  asset: {
    name: string;
    ticker: string;
    inceptionYear?: number;
    proxyNote?: string;
  } | null;
  onClose: () => void;
}

export function ProxyAssetModal({ asset, onClose }: ProxyAssetModalProps) {
  if (!asset) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 620, border: '1px solid var(--accent-amber)', boxShadow: '0 8px 32px rgba(245, 158, 11, 0.25)' }}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🔒</span>
            <div>
              <h2 style={{ fontSize: 17, margin: 0, color: 'var(--accent-amber)' }}>Simulation par Proxy &amp; Reconstitution Historique</h2>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                {asset.name} ({asset.ticker})
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button" aria-label="Fermer">✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)', marginTop: 14 }}>
          <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ color: 'var(--accent-cyan)', margin: '0 0 6px 0', fontSize: 14 }}>💡 Pourquoi cet actif est-il simulé par Proxy ?</h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              <strong>{asset.name}</strong> a été introduit en bourse en <strong>{asset.inceptionYear || 'récemment'}</strong>, soit <i>après</i> la survenue de ce krach historique.
            </p>
          </div>

          <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ color: 'var(--accent-amber)', margin: '0 0 6px 0', fontSize: 14 }}>📐 Méthodologie du Moteur de Risque RIANE</h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Pour estimer le comportement de vos capitaux actuels pendant cette crise sans laisser de trou dans les données, le moteur RIANE applique au cours de cet actif les variations réelles de son <strong>indice sectoriel de référence (Proxy Benchmark)</strong>.
            </p>
            <div style={{ marginTop: 10, padding: 10, background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-muted)' }}>
              {asset.proxyNote || 'Modélisation basée sur la sensibilité sectorielle et le risque de change.'}
            </div>
          </div>

          <button className="btn btn-primary" onClick={onClose} style={{ alignSelf: 'flex-end', marginTop: 6 }} type="button">
            Fermer l&apos;explication
          </button>
        </div>
      </div>
    </div>
  );
}

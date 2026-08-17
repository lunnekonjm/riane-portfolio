'use client';

import React from 'react';

interface ThemeStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeStrategyModal({ isOpen, onClose }: ThemeStrategyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
        <div className="modal-header">
          <h2>🏛️ Stratégie Core / Satellite &amp; Gouvernance CDC V4</h2>
          <button className="modal-close-btn" onClick={onClose} type="button" aria-label="Fermer">✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)' }}>
          <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ color: 'var(--accent-cyan)', margin: '0 0 6px 0', fontSize: 15 }}>🎯 Les 3 Piliers de l&apos;Architecture Institutionnelle</h4>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
              L&apos;approche <strong>Core / Satellite</strong> sépare la recherche de rendement moyen de marché (Bêta) et la recherche de sur-performance (Alpha) tout en optimisant la fiscalité française :
            </p>
            <ul style={{ paddingLeft: 18, marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
              <li style={{ marginBottom: 6 }}>
                <strong style={{ color: 'var(--accent-cyan)' }}>1. Pilier Cœur (40% - 50%) — PEA :</strong> ETF indiciels larges (Nasdaq-100 PUST, MSCI World). Frais minimes, diversification globale et réinvestissement automatique des dividendes.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong style={{ color: 'var(--accent-emerald)' }}>2. Pilier Pépites Europe (30% - 40%) — PEA-PME :</strong> Fonds Value et Small Caps européennes sous-évaluées (Indépendance AM, Riber, Memscap). Exonération fiscale totale d&apos;IR après 5 ans.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong style={{ color: 'var(--accent-purple)' }}>3. Pilier Satellites US (15% - 20%) — CTO :</strong> Pure-plays de conviction technologique (Symbotic, Coherent, Constellation Energy). Asymétrie haussière sur les mégatendances.
              </li>
            </ul>
          </div>

          <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ color: 'var(--accent-amber)', margin: '0 0 6px 0', fontSize: 15 }}>🔄 Rééquilibrage Serein par Flux DCA (Sans Vente)</h4>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
              Sur un horizon de 15 à 20 ans, les rééquilibrages ne se font <strong>jamais par la vente d&apos;actifs</strong> (ce qui déclencherait des frottements fiscaux ou des frais de courtage inutiles).
            </p>
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 12px', borderRadius: 6 }}>
              👉 <strong>Règle d&apos;or :</strong> Orientez simplement vos versements DCA mensuels vers le pilier actuellement sous-pondéré pour faire converger le portefeuille vers ses cibles.
            </div>
          </div>

          <div style={{ padding: 12, background: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-cyan)' }}>
            <span style={{ fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 600 }}>
              ⚡ Isolation du Portefeuille : Ces ratios sont calculés exclusivement sur vos actifs boursiers cotés. Vos livrets d&apos;épargne et votre PEE restent dans leur réserve dédiée sans fausser ces métriques.
            </span>
          </div>

          <button className="btn btn-primary" onClick={onClose} style={{ marginTop: 10, alignSelf: 'flex-end' }} type="button">
            J&apos;ai compris
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';

interface DuplicateGuardAlertProps {
  duplicatePosition: Position;
  reinforcementCalc?: {
    oldQty: number;
    oldPru: number;
    addedQty: number;
    buyPrice: number;
    newTotalQty: number;
    newWeightedPRU: number;
  } | null;
  onSwitchToExisting: (p: Position) => void;
  onApplyReinforcement: () => void;
  onAllowDuplicateLine: (b: boolean) => void;
}

export default function DuplicateGuardAlert({
  duplicatePosition,
  reinforcementCalc,
  onSwitchToExisting,
  onApplyReinforcement,
  onAllowDuplicateLine,
}: DuplicateGuardAlertProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.08) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.4)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        marginBottom: 16,
        boxShadow: '0 4px 16px rgba(245, 158, 11, 0.1)',
      }}
      id="duplicate-guard-alert"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>🛡️</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
            <strong style={{ fontSize: 13, color: 'var(--accent-amber)', fontWeight: 800 }}>
              GARDE-FOU ANTI-DOUBLON : Code déjà enregistré dans votre portefeuille !
            </strong>
            <span className="badge" style={{ fontSize: 11, background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-amber)', fontWeight: 700 }}>
              {duplicatePosition.envelope}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.45 }}>
            L&apos;actif <strong>{duplicatePosition.name}</strong> (<code style={{ color: 'var(--accent-cyan)' }}>{duplicatePosition.ticker}</code>) est déjà enregistré avec <strong>{duplicatePosition.quantity} part{duplicatePosition.quantity > 1 ? 's' : ''}</strong> à un PRU de <strong>{duplicatePosition.avgPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {duplicatePosition.currency}</strong>.
          </p>

          {reinforcementCalc && reinforcementCalc.addedQty > 0 && (
            <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', marginBottom: 12, fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                📊 Simulation de Renfort automatique (PRU Pondéré) :
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Actuel : {reinforcementCalc.oldQty} parts @ {reinforcementCalc.oldPru.toFixed(2)} €</span>
                <span>+ Achat : {reinforcementCalc.addedQty} parts @ {reinforcementCalc.buyPrice.toFixed(2)} €</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontWeight: 700, color: 'var(--accent-emerald)' }}>
                <span>Nouveau Solde : {reinforcementCalc.newTotalQty.toFixed(4)} parts</span>
                <span>Nouveau PRU Pondéré : {reinforcementCalc.newWeightedPRU.toFixed(2)} €</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onSwitchToExisting(duplicatePosition)}
              style={{ fontSize: 12, padding: '6px 12px', background: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)' }}
            >
              🔁 Modifier la ligne existante
            </button>
            {reinforcementCalc && reinforcementCalc.addedQty > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onApplyReinforcement}
                style={{ fontSize: 12, padding: '6px 12px', borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald)' }}
              >
                ➕ Fusionner &amp; Appliquer le renfort
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onAllowDuplicateLine(true)}
              style={{ fontSize: 11, padding: '6px 10px', color: 'var(--text-muted)' }}
              title="Conserver une ligne séparée (ex: même actif sur un autre compte/banque)"
            >
              🔀 Conserver 2 lignes distinctes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

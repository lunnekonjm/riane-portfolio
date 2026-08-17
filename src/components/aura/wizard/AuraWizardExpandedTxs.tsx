'use client';

import React from 'react';
import type { TargetFlowItem } from '@/engines/bankingAnalyzerEngine';

export interface CandidateCategoryOption {
  id: string;
  label: string;
  icon: string;
}

export const CANDIDATE_CATEGORY_OPTIONS: CandidateCategoryOption[] = [
  { id: 'flow-loyer', label: 'Loyer & Logement', icon: '🏠' },
  { id: 'flow-abonnement', label: 'Abonnements & Services', icon: '📱' },
  { id: 'flow-tontine', label: 'Tontine (Épargne commune)', icon: '👥' },
  { id: 'flow-soutien', label: 'Soutien familial (Wave)', icon: '❤️' },
  { id: 'flow-pea', label: 'Cible PEA (Investissement)', icon: '📈' },
  { id: 'flow-livret_a', label: 'Livret A (Épargne liquide)', icon: '🛡️' },
  { id: 'flow-revolut', label: 'Revolut (Reste à vivre)', icon: '💳' },
  { id: 'unclassified', label: 'Flux non classé / Autre', icon: '❓' },
];

interface AuraWizardExpandedTxsProps {
  candId: string;
  txList: TargetFlowItem[];
  excludedTxIds: Set<string>;
  onToggleTxInclusion: (candId: string, txId: string) => void;
  onRemoveTx: (candId: string, tx: TargetFlowItem) => void;
  onMoveTx?: (tx: TargetFlowItem, fromCandId: string, toCandId: string) => void;
  fmtEur: (val: number) => string;
}

export function AuraWizardExpandedTxs({
  candId,
  txList,
  excludedTxIds,
  onToggleTxInclusion,
  onRemoveTx,
  onMoveTx,
  fmtEur,
}: AuraWizardExpandedTxsProps) {
  return (
    <div
      style={{
        marginTop: 4,
        padding: '12px',
        borderRadius: 12,
        background: 'rgba(5, 8, 15, 0.95)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: 11, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Transactions associées ({txList.length}) :
        </strong>
        <span style={{ fontSize: 10.5, color: '#94a3b8' }}>
          Cochez pour inclure / Décochez pour exclure • Réaffectez en 1 clic
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {txList.map((tx) => {
          const isTxExcluded = excludedTxIds.has(tx.id);
          const rawDesc = tx.rawTitle || tx.title;
          return (
            <div
              key={tx.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: 8,
                background: isTxExcluded ? 'rgba(244, 63, 94, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                border: isTxExcluded ? '1px dashed rgba(244, 63, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: 11.5,
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              {/* Left: Checkbox + Date + Clean Title + Raw tooltip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 220 }}>
                <input
                  type="checkbox"
                  checked={!isTxExcluded}
                  onChange={() => onToggleTxInclusion(candId, tx.id)}
                  style={{ accentColor: 'var(--accent-cyan)', cursor: 'pointer', width: 15, height: 15 }}
                  title="Inclure ou exclure cette transaction de la somme du poste"
                />
                <span style={{ color: '#64748b', fontSize: 10.5, flexShrink: 0 }}>{tx.date}</span>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span
                    style={{
                      color: isTxExcluded ? '#64748b' : '#ffffff',
                      textDecoration: isTxExcluded ? 'line-through' : 'none',
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={rawDesc}
                  >
                    {tx.title}
                  </span>
                  {rawDesc !== tx.title && (
                    <span
                      style={{
                        color: '#64748b',
                        fontSize: 9.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 320,
                      }}
                      title={rawDesc}
                    >
                      {rawDesc}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Amount + Reclassification Move Selector + Remove */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <strong
                  style={{
                    color: isTxExcluded ? '#64748b' : '#ffffff',
                    textDecoration: isTxExcluded ? 'line-through' : 'none',
                    fontSize: 12,
                  }}
                >
                  {fmtEur(Math.abs(tx.amount))}
                </strong>

                {/* 1-Click Reclassification Dropdown */}
                {onMoveTx && (
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        onMoveTx(tx, candId, e.target.value);
                      }
                    }}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: 'rgba(10, 14, 23, 0.9)',
                      border: '1px solid rgba(6, 182, 212, 0.35)',
                      color: '#38bdf8',
                      fontSize: 10.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                    title="Déplacer cette transaction vers un autre poste budgétaire"
                  >
                    <option value="" disabled>
                      ⇄ Déplacer vers...
                    </option>
                    {CANDIDATE_CATEGORY_OPTIONS.filter((opt) => opt.id !== candId).map((opt) => (
                      <option key={opt.id} value={opt.id} style={{ background: '#0f172a', color: '#ffffff' }}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => onRemoveTx(candId, tx)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-rose)',
                    fontSize: 13,
                    cursor: 'pointer',
                    padding: 2,
                  }}
                  title="Retirer ce flux de ce poste (le renvoyer vers les flux non classés)"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

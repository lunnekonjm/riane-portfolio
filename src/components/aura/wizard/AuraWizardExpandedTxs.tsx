'use client';

import React from 'react';
import type { TargetFlowItem } from '@/engines/bankingAnalyzerEngine';

interface AuraWizardExpandedTxsProps {
  candId: string;
  txList: TargetFlowItem[];
  excludedTxIds: Set<string>;
  newTx: { title: string; amount: string; date: string };
  onToggleTxInclusion: (candId: string, txId: string) => void;
  onRemoveTx: (candId: string, tx: TargetFlowItem) => void;
  onNewTxInputChange: (candId: string, field: 'title' | 'amount' | 'date', val: string) => void;
  onAddTx: (candId: string) => void;
  fmtEur: (val: number) => string;
}

export function AuraWizardExpandedTxs({
  candId,
  txList,
  excludedTxIds,
  newTx,
  onToggleTxInclusion,
  onRemoveTx,
  onNewTxInputChange,
  onAddTx,
  fmtEur,
}: AuraWizardExpandedTxsProps) {
  return (
    <div
      style={{
        marginTop: 4,
        padding: '12px',
        borderRadius: 10,
        background: 'rgba(5, 8, 15, 0.95)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: 11, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Transactions bancaires associées (Cochez pour inclure / Décochez pour exclure) :
        </strong>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {txList.map((tx) => {
          const isTxExcluded = excludedTxIds.has(tx.id);
          return (
            <div
              key={tx.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 10px',
                borderRadius: 6,
                background: isTxExcluded ? 'rgba(244, 63, 94, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                border: isTxExcluded ? '1px dashed rgba(244, 63, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: 11,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                <input
                  type="checkbox"
                  checked={!isTxExcluded}
                  onChange={() => onToggleTxInclusion(candId, tx.id)}
                  style={{ accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                  title="Inclure ou exclure cette transaction de la somme du poste"
                />
                <span style={{ color: '#64748b', fontSize: 10.5, flexShrink: 0 }}>{tx.date}</span>
                <span
                  style={{
                    color: isTxExcluded ? '#64748b' : '#cbd5e1',
                    textDecoration: isTxExcluded ? 'line-through' : 'none',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tx.title}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong
                  style={{
                    color: isTxExcluded ? '#64748b' : '#ffffff',
                    textDecoration: isTxExcluded ? 'line-through' : 'none',
                  }}
                >
                  {fmtEur(Math.abs(tx.amount))}
                </strong>

                <button
                  type="button"
                  onClick={() => onRemoveTx(candId, tx)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-rose)',
                    fontSize: 12,
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

      {/* Inline Form to Add a Missing Transaction to this Candidate */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 4,
          paddingTop: 8,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          placeholder="Libellé de la dépense..."
          value={newTx.title}
          onChange={(e) => onNewTxInputChange(candId, 'title', e.target.value)}
          style={{
            flex: 1,
            minWidth: 150,
            padding: '5px 8px',
            borderRadius: 6,
            background: 'rgba(10, 14, 23, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            fontSize: 11,
          }}
        />

        <input
          type="number"
          placeholder="Montant €"
          step="0.01"
          value={newTx.amount}
          onChange={(e) => onNewTxInputChange(candId, 'amount', e.target.value)}
          style={{
            width: 80,
            padding: '5px 8px',
            borderRadius: 6,
            background: 'rgba(10, 14, 23, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            fontSize: 11,
            textAlign: 'right',
          }}
        />

        <button
          type="button"
          onClick={() => onAddTx(candId)}
          disabled={!newTx.title.trim() || !newTx.amount}
          style={{
            padding: '5px 10px',
            borderRadius: 6,
            background: newTx.title.trim() && newTx.amount ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.08)',
            color: newTx.title.trim() && newTx.amount ? '#0a0e17' : '#64748b',
            border: 'none',
            fontSize: 11,
            fontWeight: 800,
            cursor: newTx.title.trim() && newTx.amount ? 'pointer' : 'default',
          }}
        >
          ⊕ Ajouter
        </button>
      </div>
    </div>
  );
}

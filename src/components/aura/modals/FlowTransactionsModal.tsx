'use client';

import React from 'react';
import { cleanFrenchMerchantName } from '@/engines/bankingAnalyzerEngine';

export interface TargetFlowCategory {
  key: string;
  label: string;
  transactions: Array<{
    id: string;
    title: string;
    date: string;
    amount: number;
  }>;
  totalAmount: number;
  monthlyAverage: number;
}

interface FlowTransactionsModalProps {
  selectedFlowModalCat: TargetFlowCategory | null;
  onClose: () => void;
}

export function FlowTransactionsModal({ selectedFlowModalCat, onClose }: FlowTransactionsModalProps) {
  if (!selectedFlowModalCat) return null;

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
          maxWidth: 620,
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: 24,
          borderRadius: 20,
          background: '#0f172a',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>{selectedFlowModalCat.key === 'pea' ? '📈' : '💳'}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#ffffff' }}>{selectedFlowModalCat.label}</h3>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                {selectedFlowModalCat.transactions.length} transactions • Total : {selectedFlowModalCat.totalAmount.toFixed(2)} € ({selectedFlowModalCat.monthlyAverage.toFixed(2)} €/mois)
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '6px 12px', borderRadius: 8, background: '#1e293b', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {selectedFlowModalCat.transactions.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: '#64748b' }}>
              Aucune transaction détectée sur la période.
            </div>
          ) : (
            selectedFlowModalCat.transactions.map((tx) => (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(10, 14, 23, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: 12,
                }}
              >
                <div>
                  <strong style={{ color: '#ffffff' }}>{cleanFrenchMerchantName(tx.title)}</strong>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                    {tx.date} • {tx.title}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-rose)' }}>
                  -{Math.abs(tx.amount).toFixed(2)} €
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

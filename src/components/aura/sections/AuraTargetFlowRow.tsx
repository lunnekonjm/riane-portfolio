'use client';

import React from 'react';
import type { TargetFlowCategory } from '@/engines/bankingAnalyzerEngine';
import type { RuleCategoryItem } from '../AuraRulesView';

export interface TargetFlowRowData {
  key: string;
  title: string;
  subtitle: string;
  flow: TargetFlowCategory;
  currentRule?: RuleCategoryItem;
  color: string;
  icon: string;
  isPercent: boolean;
}

interface AuraTargetFlowRowProps {
  row: TargetFlowRowData;
  netSalary: number;
  getEffectiveAmount: (item?: RuleCategoryItem | null) => number;
  onOpenFlowTransactions: (cat: TargetFlowCategory) => void;
  onAdjustSingleFlow: (flow: TargetFlowCategory) => void;
}

export function AuraTargetFlowRow({
  row,
  netSalary,
  getEffectiveAmount,
  onOpenFlowTransactions,
  onAdjustSingleFlow,
}: AuraTargetFlowRowProps) {
  const currentEffectiveEuro = row.currentRule ? getEffectiveAmount(row.currentRule) : 0;
  const realEuroMonthly = row.flow.monthlyAverage;
  const deltaEuro = realEuroMonthly - currentEffectiveEuro;
  const isAligned = Math.abs(deltaEuro) < 1.0;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 12,
        background: 'rgba(10, 14, 23, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        transition: 'border 0.2s',
      }}
    >
      {/* Icon & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180, flex: '1 1 180px' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `${row.color}22`,
            color: row.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {row.icon}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{row.title}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.subtitle}</div>
        </div>
      </div>

      {/* Metrics container on mobile: wraps gracefully */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Column Règle Actuelle */}
        <div style={{ textAlign: 'right', minWidth: 90 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.4px' }}>
            Règle
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginTop: 2 }}>
            {row.currentRule ? (
              row.currentRule.isPercentage ? (
                `${row.currentRule.amount.toFixed(1)}% (${currentEffectiveEuro.toFixed(0)} €)`
              ) : (
                `${row.currentRule.amount.toFixed(2)} €`
              )
            ) : (
              <span style={{ color: '#64748b', fontStyle: 'italic' }}>Non configuré</span>
            )}
          </div>
        </div>

        {/* Column Réel Bancaire */}
        <div style={{ textAlign: 'right', minWidth: 90 }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-cyan)', letterSpacing: '0.4px' }}>
            Réel
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
            {realEuroMonthly > 0 ? (
              row.isPercent && netSalary > 0 ? (
                `${((realEuroMonthly / netSalary) * 100).toFixed(1)}% (${realEuroMonthly.toFixed(0)} €)`
              ) : (
                `${realEuroMonthly.toFixed(2)} €`
              )
            ) : (
              <span style={{ color: '#64748b' }}>0.00 €</span>
            )}
          </div>
        </div>

        {/* Delta Badge */}
        <div style={{ minWidth: 100, textAlign: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 8px',
              borderRadius: 8,
              fontSize: 10.5,
              fontWeight: 800,
              background: isAligned ? 'rgba(16, 185, 129, 0.18)' : deltaEuro > 0 ? 'rgba(245, 158, 11, 0.18)' : 'rgba(59, 130, 246, 0.18)',
              color: isAligned ? 'var(--accent-emerald)' : deltaEuro > 0 ? 'var(--accent-amber)' : '#60a5fa',
              border: isAligned ? '1px solid rgba(16, 185, 129, 0.35)' : deltaEuro > 0 ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(59, 130, 246, 0.35)',
            }}
            title={isAligned ? 'Écart inférieur à 1 €' : deltaEuro > 0 ? 'Le montant réel constaté est supérieur à votre règle' : 'Le montant réel constaté est inférieur à votre règle'}
          >
            {isAligned ? '✓ Aligné' : `${deltaEuro > 0 ? '+' : ''}${deltaEuro.toFixed(0)} €`}
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => onOpenFlowTransactions(row.flow)}
            style={{
              padding: '5px 9px',
              borderRadius: 8,
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--text-secondary)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Inspecter le détail des transactions bancaires unitaires"
          >
            🔍 {row.flow.transactions.length} txs
          </button>
          <button
            type="button"
            onClick={() => onAdjustSingleFlow(row.flow)}
            style={{
              padding: '5px 9px',
              borderRadius: 8,
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              color: 'var(--accent-cyan)',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
            }}
            title="Ajuster la règle pour l'aligner sur le réel bancaire"
          >
            ⚡ Aligner
          </button>
        </div>
      </div>
    </div>
  );
}

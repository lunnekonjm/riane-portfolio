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
        gap: 12,
        padding: '12px 16px',
        borderRadius: 12,
        background: 'rgba(10, 14, 23, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        transition: 'border 0.2s',
      }}
    >
      {/* Icon & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200, flex: 1 }}>
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

      {/* Column Règle Actuelle */}
      <div style={{ textAlign: 'right', minWidth: 110 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.4px' }}>
          Règle Actuelle
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
      <div style={{ textAlign: 'right', minWidth: 110 }}>
        <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-cyan)', letterSpacing: '0.4px' }}>
          Réel Bancaire
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
      <div style={{ minWidth: 120, textAlign: 'center' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 800,
            background: isAligned ? 'rgba(16, 185, 129, 0.18)' : deltaEuro > 0 ? 'rgba(245, 158, 11, 0.18)' : 'rgba(59, 130, 246, 0.18)',
            color: isAligned ? 'var(--accent-emerald)' : deltaEuro > 0 ? 'var(--accent-amber)' : '#60a5fa',
            border: isAligned ? '1px solid rgba(16, 185, 129, 0.35)' : deltaEuro > 0 ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(59, 130, 246, 0.35)',
          }}
          title={isAligned ? 'Écart inférieur à 1 €' : deltaEuro > 0 ? 'Le montant réel constaté est supérieur à votre règle' : 'Le montant réel constaté est inférieur à votre règle'}
        >
          {isAligned ? '✓ Aligné (< 1 €)' : `${deltaEuro > 0 ? '+' : ''}${deltaEuro.toFixed(1)} € (${deltaEuro > 0 ? 'Réel > Règle' : 'Réel < Règle'})`}
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
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {row.flow.transactions.length} tx
        </button>

        <button
          type="button"
          onClick={() => onAdjustSingleFlow(row.flow)}
          style={{
            padding: '5px 12px',
            borderRadius: 8,
            background: 'rgba(6, 182, 212, 0.18)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: 'var(--accent-cyan)',
            fontSize: 11,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Ajuster
        </button>
      </div>
    </div>
  );
}

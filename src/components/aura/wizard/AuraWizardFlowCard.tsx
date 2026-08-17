'use client';

import React from 'react';
import type { DetectedFlowCandidate, TargetFlowItem } from '@/engines/bankingAnalyzerEngine';
import { AuraWizardExpandedTxs } from './AuraWizardExpandedTxs';

interface AuraWizardFlowCardProps {
  cand: DetectedFlowCandidate;
  isSelected: boolean;
  isExpanded: boolean;
  isPct: boolean;
  txList: TargetFlowItem[];
  excludedTxIds: Set<string>;
  currentVal: number;
  effectiveEuro: number;
  comparison: { ruleName: string; ruleEuro: number; isPercentage: boolean; ruleAmount: number } | null;
  deltaEuro: number;
  isAligned: boolean;
  netSalary: number;
  periodLabel: string;
  onToggleSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onTogglePercentage: (id: string) => void;
  onChangeAmount: (id: string, val: number) => void;
  onToggleTxInclusion: (candId: string, txId: string) => void;
  onRemoveTx: (candId: string, tx: TargetFlowItem) => void;
  onMoveTx?: (tx: TargetFlowItem, fromCandId: string, toCandId: string) => void;
  fmtEur: (val: number) => string;
}

export function AuraWizardFlowCard({
  cand,
  isSelected,
  isExpanded,
  isPct,
  txList,
  excludedTxIds,
  currentVal,
  effectiveEuro,
  comparison,
  deltaEuro,
  isAligned,
  netSalary,
  periodLabel,
  onToggleSelect,
  onToggleExpand,
  onTogglePercentage,
  onChangeAmount,
  onToggleTxInclusion,
  onRemoveTx,
  onMoveTx,
  fmtEur,
}: AuraWizardFlowCardProps) {
  const activeTxs = txList.filter((t) => !excludedTxIds.has(t.id));

  return (
    <div
      style={{
        borderRadius: 14,
        background: isSelected ? 'rgba(15, 23, 42, 0.95)' : 'rgba(10, 14, 23, 0.5)',
        border: isSelected
          ? `1px solid ${cand.color}55`
          : '1px solid rgba(255, 255, 255, 0.06)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'all 0.2s',
        boxShadow: isSelected ? `0 4px 16px ${cand.color}11` : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        {/* Left: Checkbox + Icon + Title + Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(cand.id)}
            style={{
              width: 18,
              height: 18,
              accentColor: 'var(--accent-cyan)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />

          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `${cand.color}22`,
              color: cand.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {cand.icon}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: '#ffffff' }}>
                {cand.title}
              </span>
              {cand.isVirementEpargne && (
                <span
                  style={{
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#60a5fa',
                    fontSize: 9.5,
                    fontWeight: 800,
                  }}
                >
                  VIREMENT MENSUEL DÉBITÉ
                </span>
              )}
              <span
                style={{
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#94a3b8',
                  fontSize: 9.5,
                  fontWeight: 700,
                }}
              >
                {cand.pillar === 'FIXED'
                  ? 'Charge Fixe'
                  : cand.pillar === 'SAVINGS'
                  ? 'Épargne'
                  : cand.pillar === 'DAILY'
                  ? 'Quotidien'
                  : 'Temporaire'}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: '#cbd5e1', marginTop: 2 }}>
              {cand.subtitle}
            </div>
          </div>
        </div>

        {/* Right: Editable Amount Inputs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="number"
              step={isPct ? '0.1' : '1'}
              value={currentVal}
              onChange={(e) => onChangeAmount(cand.id, parseFloat(e.target.value) || 0)}
              style={{
                width: 84,
                padding: '6px 8px',
                borderRadius: 8,
                background: 'rgba(10, 14, 23, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 800,
                textAlign: 'right',
              }}
            />
            {/* Unit Toggle (€ / %) */}
            <div
              style={{
                display: 'inline-flex',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.06)',
                padding: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <button
                type="button"
                onClick={() => isPct && onTogglePercentage(cand.id)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: !isPct ? 'var(--accent-cyan)' : 'transparent',
                  color: !isPct ? '#0a0e17' : '#94a3b8',
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
                title="Définir en Euros (€ fixes)"
              >
                €
              </button>
              <button
                type="button"
                onClick={() => !isPct && onTogglePercentage(cand.id)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: isPct ? 'var(--accent-cyan)' : 'transparent',
                  color: isPct ? '#0a0e17' : '#94a3b8',
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
                title="Définir en Pourcentage (% du salaire net)"
              >
                %
              </button>
            </div>
          </div>

          {/* Effective Euro Display */}
          <div style={{ textAlign: 'right', minWidth: 100 }}>
            <div style={{ fontSize: 13.5, fontWeight: 900, color: cand.color }}>
              {fmtEur(effectiveEuro)}/m
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>
              {isPct
                ? `(${currentVal}% du net)`
                : `(${netSalary > 0 ? (Math.round((effectiveEuro / netSalary) * 100 * 10) / 10) : 0}% du net)`}
            </div>
          </div>
        </div>
      </div>

      {/* Explanation & Calculation Formula */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: '#94a3b8',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: 8,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <span>{cand.explanation} </span>
          <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>
            ({cand.calculationFormula})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {comparison && (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 6,
                background: isAligned ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: `1px solid ${isAligned ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                color: isAligned ? '#6ee7b7' : '#fcd34d',
                fontSize: 10.5,
                fontWeight: 700,
              }}
            >
              {isAligned
                ? `✓ Aligné (${fmtEur(comparison.ruleEuro)})`
                : `Écart : ${deltaEuro > 0 ? '+' : ''}${fmtEur(deltaEuro)} (Règle : ${fmtEur(comparison.ruleEuro)})`}
            </span>
          )}

          {txList.length > 0 && (
            <button
              type="button"
              onClick={() => onToggleExpand(cand.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-cyan)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '2px 4px',
              }}
            >
              {isExpanded
                ? 'Masquer transactions ▲'
                : `Voir transactions (${activeTxs.length}) ▼`}
            </button>
          )}
        </div>
      </div>

      {/* Expanded transactions list */}
      {isExpanded && txList.length > 0 && (
        <AuraWizardExpandedTxs
          candId={cand.id}
          txList={txList}
          excludedTxIds={excludedTxIds}
          onToggleTxInclusion={onToggleTxInclusion}
          onRemoveTx={onRemoveTx}
          onMoveTx={onMoveTx}
          fmtEur={fmtEur}
        />
      )}
    </div>
  );
}

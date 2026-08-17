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
  newTx: { title: string; amount: string; date: string };
  onToggleSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onTogglePercentage: (id: string) => void;
  onChangeAmount: (id: string, val: number) => void;
  onToggleTxInclusion: (candId: string, txId: string) => void;
  onRemoveTx: (candId: string, tx: TargetFlowItem) => void;
  onNewTxInputChange: (candId: string, field: 'title' | 'amount' | 'date', val: string) => void;
  onAddTx: (candId: string) => void;
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
  newTx,
  onToggleSelect,
  onToggleExpand,
  onTogglePercentage,
  onChangeAmount,
  onToggleTxInclusion,
  onRemoveTx,
  onNewTxInputChange,
  onAddTx,
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
              disabled={!isSelected}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                onChangeAmount(cand.id, val);
              }}
              style={{
                width: 85,
                padding: '6px 8px',
                borderRadius: 8,
                background: 'rgba(10, 14, 23, 0.95)',
                border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: isSelected ? '#ffffff' : '#64748b',
                fontSize: 13,
                fontWeight: 800,
                textAlign: 'right',
              }}
            />

            {/* Percentage vs Euro Toggle */}
            {cand.pillar !== 'FIXED' && cand.pillar !== 'TEMPORARY' ? (
              <button
                type="button"
                disabled={!isSelected}
                onClick={() => onTogglePercentage(cand.id)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'var(--accent-cyan)',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: isSelected ? 'pointer' : 'default',
                }}
                title="Basculer entre % du salaire et montant fixe en €"
              >
                {isPct ? '%' : '€'}
              </button>
            ) : (
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', paddingLeft: 4 }}>
                €
              </span>
            )}
          </div>

          {/* Accurate Euro and % breakdown */}
          <div style={{ textAlign: 'right', minWidth: 100 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: isSelected ? '#ffffff' : '#64748b' }}>
              {fmtEur(effectiveEuro)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {isPct
                ? `${currentVal.toFixed(1)}% du net`
                : `${((effectiveEuro / netSalary) * 100).toFixed(1)}% du net`}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Row & Toggle Transaction Details */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          borderRadius: 8,
          background: 'rgba(10, 14, 23, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          fontSize: 11,
          color: '#94a3b8',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <span>📐</span>
          <span>
            {activeTxs.length} transaction(s) active(s) = {fmtEur(activeTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0))} ({periodLabel})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {comparison && (
            <span
              style={{
                padding: '2px 6px',
                borderRadius: 6,
                background: isAligned ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: isAligned ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                fontWeight: 700,
                fontSize: 10.5,
              }}
            >
              {isAligned ? '✓ Aligné avec règle' : `Écart : ${deltaEuro > 0 ? '+' : ''}${fmtEur(deltaEuro)}`}
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
                textDecoration: 'underline',
              }}
            >
              {isExpanded ? 'Masquer tx' : `Détail tx (${txList.length}) ▾`}
            </button>
          )}
        </div>
      </div>

      {/* 🔍 EXPANDED SUB-TRANSACTIONS LIST */}
      {isExpanded && (
        <AuraWizardExpandedTxs
          candId={cand.id}
          txList={txList}
          excludedTxIds={excludedTxIds}
          newTx={newTx}
          onToggleTxInclusion={onToggleTxInclusion}
          onRemoveTx={onRemoveTx}
          onNewTxInputChange={onNewTxInputChange}
          onAddTx={onAddTx}
          fmtEur={fmtEur}
        />
      )}
    </div>
  );
}

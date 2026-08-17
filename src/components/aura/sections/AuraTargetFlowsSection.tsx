'use client';

import React from 'react';
import type { BankTargetAnalysisSummary, TargetFlowCategory } from '@/engines/bankingAnalyzerEngine';
import type { RuleCategoryItem } from '../AuraRulesView';
import { AuraTargetFlowsHeader } from './AuraTargetFlowsHeader';
import { AuraTargetFlowRow, type TargetFlowRowData } from './AuraTargetFlowRow';

export type { TargetFlowRowData } from './AuraTargetFlowRow';

interface AuraTargetFlowsSectionProps {
  netSalary: number;
  selectedTargetPeriodDays: number;
  setSelectedTargetPeriodDays: (days: number) => void;
  targetSummary: BankTargetAnalysisSummary;
  targetRows: TargetFlowRowData[];
  getEffectiveAmount: (item?: RuleCategoryItem | null) => number;
  onOpenFlowTransactions: (cat: TargetFlowCategory) => void;
  onAdjustSingleFlow: (flow: TargetFlowCategory) => void;
  onOpenWizard: () => void;
  onResetInitial: () => void;
  onOpenGlobalReset: () => void;
}

export function AuraTargetFlowsSection({
  netSalary,
  selectedTargetPeriodDays,
  setSelectedTargetPeriodDays,
  targetSummary,
  targetRows,
  getEffectiveAmount,
  onOpenFlowTransactions,
  onAdjustSingleFlow,
  onOpenWizard,
  onResetInitial,
  onOpenGlobalReset,
}: AuraTargetFlowsSectionProps) {
  return (
    <div
      className="card"
      style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(11, 19, 43, 0.95) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.35)',
        padding: 20,
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      <AuraTargetFlowsHeader
        netSalary={netSalary}
        selectedTargetPeriodDays={selectedTargetPeriodDays}
        setSelectedTargetPeriodDays={setSelectedTargetPeriodDays}
        targetSummary={targetSummary}
        onOpenWizard={onOpenWizard}
        onResetInitial={onResetInitial}
        onOpenGlobalReset={onOpenGlobalReset}
      />

      {/* 7 Target Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {targetRows.map((row) => (
          <AuraTargetFlowRow
            key={row.key}
            row={row}
            netSalary={netSalary}
            getEffectiveAmount={getEffectiveAmount}
            onOpenFlowTransactions={onOpenFlowTransactions}
            onAdjustSingleFlow={onAdjustSingleFlow}
          />
        ))}
      </div>
    </div>
  );
}

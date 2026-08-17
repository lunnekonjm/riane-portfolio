'use client';

import React from 'react';
import type {
  TargetFlowItem,
  TemporaryExpenseItem,
  DetectedFlowCandidate,
} from '@/engines/bankingAnalyzerEngine';
import type { RuleCategoryItem } from './AuraRulesView';
import { AuraWizardHeader } from './wizard/AuraWizardHeader';
import { AuraWizardPillarsNav } from './wizard/AuraWizardPillarsNav';
import { AuraWizardSummaryBar } from './wizard/AuraWizardSummaryBar';
import { AuraWizardFlowCard } from './wizard/AuraWizardFlowCard';
import { AuraWizardUnclassifiedTab } from './wizard/AuraWizardUnclassifiedTab';
import { AuraWizardFooter } from './wizard/AuraWizardFooter';
import { useAuraBankFlowWizardState } from '@/hooks/useAuraBankFlowWizardState';

interface AuraBankFlowWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  netSalary: number;
  bankTransactions: TargetFlowItem[];
  currentSavings: RuleCategoryItem[];
  currentFixed: RuleCategoryItem[];
  currentDaily: RuleCategoryItem[];
  currentTempExpenses: TemporaryExpenseItem[];
  onApplySelection: (
    approvedCandidates: Array<{
      candidate: DetectedFlowCandidate;
      amount: number;
      isPercentage: boolean;
    }>,
    approvedTempExpenses: TemporaryExpenseItem[]
  ) => void;
}

export const AuraBankFlowWizardModal: React.FC<AuraBankFlowWizardModalProps> = ({
  isOpen,
  onClose,
  netSalary: rawNetSalary,
  bankTransactions,
  currentSavings,
  currentFixed,
  currentDaily,
  currentTempExpenses,
  onApplySelection,
}) => {
  const {
    netSalary,
    periodDays,
    setPeriodDays,
    activeTab,
    setActiveTab,
    targetSummary,
    detectedTempObligations,
    initialCandidates,
    candidateTxsMap,
    excludedTxIds,
    unclassifiedTxs,
    selectedIds,
    customAmounts,
    setCustomAmounts,
    isPercentageMap,
    setIsPercentageMap,
    expandedTxIds,
    newTxInputs,
    setNewTxInputs,
    toggleSelect,
    handleSelectAll,
    handleDeselectAll,
    toggleExpandTx,
    toggleTxInclusion,
    removeTxFromCandidate,
    handleAddTxToCandidate,
    assignUnclassifiedToCandidate,
    getEffectiveEuroForCandidate,
    getExistingRuleComparison,
    selectedCandidatesList,
    totalSelectedEuro,
    totalSelectedPercent,
    estimatedResteAVivre,
    displayedCandidates,
  } = useAuraBankFlowWizardState({
    isOpen,
    rawNetSalary,
    bankTransactions,
    currentSavings,
    currentFixed,
    currentDaily,
    currentTempExpenses,
  });

  if (!isOpen) return null;

  const divisor = periodDays > 0 ? periodDays / 30.4375 : 1;
  const fmtEur = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

  const handleValidateAndApply = () => {
    const approvedList: Array<{ candidate: DetectedFlowCandidate; amount: number; isPercentage: boolean }> = [];
    const approvedTemps: TemporaryExpenseItem[] = [];

    for (const c of selectedCandidatesList) {
      const isPct = isPercentageMap[c.id] ?? c.isPercentage;
      const amt = customAmounts[c.id] !== undefined
        ? customAmounts[c.id]
        : (isPct ? c.defaultPercentage : c.detectedMonthlyAmount);

      if (c.pillar === 'TEMPORARY') {
        const foundTemp = detectedTempObligations.find((t) => c.id.includes(t.id));
        if (foundTemp) {
          approvedTemps.push({
            ...foundTemp,
            monthlyAmount: amt,
          });
        }
      } else {
        const refinedTxs = (candidateTxsMap[c.id] || c.transactions).filter((t) => !excludedTxIds.has(t.id));
        approvedList.push({
          candidate: {
            ...c,
            transactions: refinedTxs,
          },
          amount: amt,
          isPercentage: isPct,
        });
      }
    }

    onApplySelection(approvedList, approvedTemps);
    onClose();
  };

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
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(16px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 880,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 22,
          background: 'linear-gradient(135deg, #0b132b 0%, #0f172a 100%)',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7), 0 0 32px rgba(6, 182, 212, 0.2)',
          overflow: 'hidden',
        }}
      >
        {/* 🌟 MODAL HEADER */}
        <AuraWizardHeader
          periodDays={periodDays}
          setPeriodDays={setPeriodDays}
          onClose={onClose}
        />

        {/* 📊 LIVE SUMMARY BANNER */}
        <AuraWizardSummaryBar
          netSalary={netSalary}
          totalSelectedEuro={totalSelectedEuro}
          totalSelectedPercent={totalSelectedPercent}
          estimatedResteAVivre={estimatedResteAVivre}
          fmtEur={fmtEur}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
        />

        {/* 🏷️ PILLAR TABS */}
        <AuraWizardPillarsNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          initialCandidatesCount={initialCandidates.length}
          detectedTempObligationsCount={detectedTempObligations.length}
          unclassifiedTxsCount={unclassifiedTxs.length}
        />

        {/* 📜 SCROLLABLE CANDIDATES LIST */}
        <div
          style={{
            padding: '16px 22px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* TAB 1 TO 5: CANDIDATES */}
          {activeTab !== 'UNCLASSIFIED' && displayedCandidates.map((cand) => {
            const isSelected = selectedIds.has(cand.id);
            const isExpanded = expandedTxIds.has(cand.id);
            const isPct = isPercentageMap[cand.id] ?? cand.isPercentage;

            const txList = candidateTxsMap[cand.id] || cand.transactions;
            const activeTxs = txList.filter((t) => !excludedTxIds.has(t.id));
            const calculatedSum = activeTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0) / divisor;

            const currentVal = customAmounts[cand.id] !== undefined
              ? customAmounts[cand.id]
              : (isPct ? (netSalary > 0 ? Math.round((calculatedSum / netSalary) * 100 * 10) / 10 : cand.defaultPercentage) : Math.round(calculatedSum * 100) / 100);

            const effectiveEuro = getEffectiveEuroForCandidate(cand);
            const comparison = getExistingRuleComparison(cand);
            const deltaEuro = comparison ? effectiveEuro - comparison.ruleEuro : 0;
            const isAligned = comparison ? Math.abs(deltaEuro) < 1.0 : false;

            const newTx = newTxInputs[cand.id] || { title: '', amount: '', date: '' };

            return (
              <AuraWizardFlowCard
                key={cand.id}
                cand={cand}
                isSelected={isSelected}
                isExpanded={isExpanded}
                isPct={isPct}
                txList={txList}
                excludedTxIds={excludedTxIds}
                currentVal={currentVal}
                effectiveEuro={effectiveEuro}
                comparison={comparison}
                deltaEuro={deltaEuro}
                isAligned={isAligned}
                netSalary={netSalary}
                periodLabel={targetSummary.periodLabel}
                newTx={newTx}
                onToggleSelect={toggleSelect}
                onToggleExpand={toggleExpandTx}
                onTogglePercentage={(id) => {
                  const nextPct = !isPct;
                  setIsPercentageMap((prev) => ({ ...prev, [id]: nextPct }));
                  if (nextPct) {
                    const newPct = netSalary > 0 ? Math.round((currentVal / netSalary) * 100 * 10) / 10 : cand.defaultPercentage;
                    setCustomAmounts((prev) => ({ ...prev, [id]: newPct }));
                  } else {
                    const newEuro = (netSalary * currentVal) / 100;
                    setCustomAmounts((prev) => ({ ...prev, [id]: Math.round(newEuro * 100) / 100 }));
                  }
                }}
                onChangeAmount={(id, val) => setCustomAmounts((prev) => ({ ...prev, [id]: val }))}
                onToggleTxInclusion={toggleTxInclusion}
                onRemoveTx={removeTxFromCandidate}
                onNewTxInputChange={(id, field, val) =>
                  setNewTxInputs((prev) => ({
                    ...prev,
                    [id]: { ...(prev[id] || { title: '', amount: '', date: '' }), [field]: val },
                  }))
                }
                onAddTx={handleAddTxToCandidate}
                fmtEur={fmtEur}
              />
            );
          })}

          {/* TAB 6: UNCLASSIFIED BANK TRANSACTIONS */}
          {activeTab === 'UNCLASSIFIED' && (
            <AuraWizardUnclassifiedTab
              unclassifiedTxs={unclassifiedTxs}
              onAssignToCandidate={assignUnclassifiedToCandidate}
              fmtEur={fmtEur}
            />
          )}
        </div>

        {/* 🚀 MODAL FOOTER */}
        <AuraWizardFooter
          selectedCount={selectedCandidatesList.length}
          totalSelectedEuro={totalSelectedEuro}
          totalSelectedPercent={totalSelectedPercent}
          fmtEur={fmtEur}
          onClose={onClose}
          onValidateAndApply={handleValidateAndApply}
        />
      </div>
    </div>
  );
};

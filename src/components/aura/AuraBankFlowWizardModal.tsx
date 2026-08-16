'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  analyzeTargetFlows,
  detectTemporaryObligations,
  buildInteractiveFlowCandidates,
  type TargetFlowItem,
  type TargetFlowCategory,
  type TemporaryExpenseItem,
  type DetectedFlowCandidate,
  type BankTargetAnalysisSummary,
} from '@/engines/bankingAnalyzerEngine';
import type { RuleCategoryItem } from './AuraRulesView';

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
  // Always ensure a strictly valid net salary for percentages & calculations
  const netSalary = (rawNetSalary && rawNetSalary > 100) ? rawNetSalary : 2713.74;

  const [periodDays, setPeriodDays] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<'ALL' | 'FIXED' | 'SAVINGS' | 'DAILY' | 'TEMPORARY' | 'UNCLASSIFIED'>('ALL');

  // Compute summary and initial candidates
  const targetSummary: BankTargetAnalysisSummary = useMemo(() => {
    return analyzeTargetFlows(bankTransactions, netSalary, periodDays);
  }, [bankTransactions, netSalary, periodDays]);

  const detectedTempObligations: TemporaryExpenseItem[] = useMemo(() => {
    return detectTemporaryObligations(bankTransactions, currentTempExpenses);
  }, [bankTransactions, currentTempExpenses]);

  const initialCandidates: DetectedFlowCandidate[] = useMemo(() => {
    return buildInteractiveFlowCandidates(targetSummary, detectedTempObligations, netSalary);
  }, [targetSummary, detectedTempObligations, netSalary]);

  // Granular candidate transactions state (allows adding, deleting, excluding transactions per candidate)
  const [candidateTxsMap, setCandidateTxsMap] = useState<Record<string, TargetFlowItem[]>>({});
  const [excludedTxIds, setExcludedTxIds] = useState<Set<string>>(new Set());
  const [unclassifiedTxs, setUnclassifiedTxs] = useState<TargetFlowItem[]>([]);

  // Selected candidate IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Custom amounts state & percentage toggle
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [isPercentageMap, setIsPercentageMap] = useState<Record<string, boolean>>({});
  const [expandedTxIds, setExpandedTxIds] = useState<Set<string>>(new Set());

  // Inline "Add transaction" inputs per candidate
  const [newTxInputs, setNewTxInputs] = useState<Record<string, { title: string; amount: string; date: string }>>({});

  // Reset state when candidates or modal opens
  useEffect(() => {
    if (isOpen) {
      const defaultSelected = new Set(initialCandidates.filter((c) => c.defaultSelected).map((c) => c.id));
      setSelectedIds(defaultSelected);

      const txMap: Record<string, TargetFlowItem[]> = {};
      const initialAmounts: Record<string, number> = {};
      const initialPercentMap: Record<string, boolean> = {};

      for (const c of initialCandidates) {
        txMap[c.id] = [...c.transactions];
        initialAmounts[c.id] = c.isPercentage ? c.defaultPercentage : c.detectedMonthlyAmount;
        initialPercentMap[c.id] = c.isPercentage;
      }

      setCandidateTxsMap(txMap);
      setExcludedTxIds(new Set());
      setUnclassifiedTxs([...targetSummary.unclassified.transactions]);
      setCustomAmounts(initialAmounts);
      setIsPercentageMap(initialPercentMap);
      setExpandedTxIds(new Set(['flow-abonnement', 'flow-loyer']));
    }
  }, [isOpen, initialCandidates, targetSummary]);

  if (!isOpen) return null;

  const divisor = periodDays <= 31 ? 1.0 : periodDays / 30.0;
  const fmtEur = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

  // Toggle selection of candidate
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpandTx = (id: string) => {
    setExpandedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(initialCandidates.map((c) => c.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Toggle inclusion of an individual transaction in a candidate
  const toggleTxInclusion = (candidateId: string, txId: string) => {
    setExcludedTxIds((prev) => {
      const next = new Set(prev);
      const wasExcluded = next.has(txId);
      if (wasExcluded) next.delete(txId);
      else next.add(txId);

      // Recalculate amount for candidate
      const txs = candidateTxsMap[candidateId] || [];
      const activeTxs = txs.filter((t) => (wasExcluded ? true : t.id !== txId));
      const total = activeTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const monthly = total / divisor;

      const isPct = isPercentageMap[candidateId] ?? false;
      if (isPct) {
        const pct = netSalary > 0 ? Math.round((monthly / netSalary) * 100 * 10) / 10 : 0;
        setCustomAmounts((cA) => ({ ...cA, [candidateId]: pct }));
      } else {
        setCustomAmounts((cA) => ({ ...cA, [candidateId]: Math.round(monthly * 100) / 100 }));
      }

      return next;
    });
  };

  // Delete transaction from candidate (moves to unclassified)
  const removeTxFromCandidate = (candidateId: string, tx: TargetFlowItem) => {
    setCandidateTxsMap((prev) => {
      const current = prev[candidateId] || [];
      const nextList = current.filter((t) => t.id !== tx.id);

      // Recalculate amount
      const activeTxs = nextList.filter((t) => !excludedTxIds.has(t.id));
      const total = activeTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const monthly = total / divisor;

      const isPct = isPercentageMap[candidateId] ?? false;
      if (isPct) {
        const pct = netSalary > 0 ? Math.round((monthly / netSalary) * 100 * 10) / 10 : 0;
        setCustomAmounts((cA) => ({ ...cA, [candidateId]: pct }));
      } else {
        setCustomAmounts((cA) => ({ ...cA, [candidateId]: Math.round(monthly * 100) / 100 }));
      }

      return { ...prev, [candidateId]: nextList };
    });

    // Add to unclassified
    setUnclassifiedTxs((prev) => [tx, ...prev]);
  };

  // Add transaction to candidate
  const handleAddTxToCandidate = (candidateId: string) => {
    const input = newTxInputs[candidateId];
    if (!input || !input.title.trim() || !parseFloat(input.amount)) return;

    const amt = Math.abs(parseFloat(input.amount));
    const newTx: TargetFlowItem = {
      id: `manual-tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: input.title.trim(),
      amount: amt,
      date: input.date || new Date().toISOString().slice(0, 10),
      category: 'Manuel',
    };

    setCandidateTxsMap((prev) => {
      const current = prev[candidateId] || [];
      const nextList = [...current, newTx];

      const activeTxs = nextList.filter((t) => !excludedTxIds.has(t.id));
      const total = activeTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const monthly = total / divisor;

      const isPct = isPercentageMap[candidateId] ?? false;
      if (isPct) {
        const pct = netSalary > 0 ? Math.round((monthly / netSalary) * 100 * 10) / 10 : 0;
        setCustomAmounts((cA) => ({ ...cA, [candidateId]: pct }));
      } else {
        setCustomAmounts((cA) => ({ ...cA, [candidateId]: Math.round(monthly * 100) / 100 }));
      }

      return { ...prev, [candidateId]: nextList };
    });

    // Reset input
    setNewTxInputs((prev) => ({ ...prev, [candidateId]: { title: '', amount: '', date: '' } }));
  };

  // Assign unclassified transaction to a candidate
  const assignUnclassifiedToCandidate = (tx: TargetFlowItem, targetCandidateId: string) => {
    setUnclassifiedTxs((prev) => prev.filter((t) => t.id !== tx.id));
    setCandidateTxsMap((prev) => {
      const current = prev[targetCandidateId] || [];
      const nextList = [...current, tx];

      const activeTxs = nextList.filter((t) => !excludedTxIds.has(t.id));
      const total = activeTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const monthly = total / divisor;

      const isPct = isPercentageMap[targetCandidateId] ?? false;
      if (isPct) {
        const pct = netSalary > 0 ? Math.round((monthly / netSalary) * 100 * 10) / 10 : 0;
        setCustomAmounts((cA) => ({ ...cA, [targetCandidateId]: pct }));
      } else {
        setCustomAmounts((cA) => ({ ...cA, [targetCandidateId]: Math.round(monthly * 100) / 100 }));
      }

      return { ...prev, [targetCandidateId]: nextList };
    });
  };

  // Calculate effective Euro for candidate
  const getEffectiveEuroForCandidate = (cand: DetectedFlowCandidate): number => {
    const isPct = isPercentageMap[cand.id] ?? cand.isPercentage;
    const txs = (candidateTxsMap[cand.id] || cand.transactions).filter((t) => !excludedTxIds.has(t.id));
    const detectedMonthly = txs.reduce((sum, t) => sum + Math.abs(t.amount), 0) / divisor;

    const amt = customAmounts[cand.id] !== undefined
      ? customAmounts[cand.id]
      : (isPct ? (netSalary > 0 ? Math.round((detectedMonthly / netSalary) * 100 * 10) / 10 : cand.defaultPercentage) : detectedMonthly);

    if (isPct) {
      return (netSalary * amt) / 100;
    }
    return amt;
  };

  // Comparison with existing rules
  const getExistingRuleComparison = (cand: DetectedFlowCandidate): { ruleName: string; ruleEuro: number; isPercentage: boolean; ruleAmount: number } | null => {
    const findInList = (list: RuleCategoryItem[]) =>
      list.find((r) => r.name.toUpperCase().includes(cand.categoryKey.toUpperCase()) || cand.title.toUpperCase().includes(r.name.toUpperCase()));

    let found: RuleCategoryItem | undefined;
    if (cand.pillar === 'SAVINGS') found = findInList(currentSavings);
    else if (cand.pillar === 'FIXED') found = findInList(currentFixed);
    else if (cand.pillar === 'DAILY') found = findInList(currentDaily);

    if (found) {
      const euro = found.isPercentage ? (netSalary * found.amount) / 100 : found.amount;
      return { ruleName: found.name, ruleEuro: euro, isPercentage: found.isPercentage, ruleAmount: found.amount };
    }
    return null;
  };

  // Total selected budget
  const selectedCandidatesList = initialCandidates.filter((c) => selectedIds.has(c.id));
  const totalSelectedEuro = selectedCandidatesList.reduce((sum, c) => sum + getEffectiveEuroForCandidate(c), 0);
  const totalSelectedPercent = netSalary > 0 ? (totalSelectedEuro / netSalary) * 100 : 0;
  const estimatedResteAVivre = netSalary - totalSelectedEuro;

  // Filter candidates by active tab
  const displayedCandidates = initialCandidates.filter((c) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UNCLASSIFIED') return false;
    return c.pillar === activeTab;
  });

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
        // Pass candidate with refined transactions
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
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 23, 42, 0.8)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
              }}
            >
              🪄
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
                  Radar & Validation des Flux Bancaires
                </h3>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: 'var(--accent-emerald)',
                    fontSize: 10.5,
                    fontWeight: 800,
                  }}
                >
                  BoursoBank DSP2
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                Contrôlez, cochez/décochez chaque transaction unitaire et ajustez les montants réels avant application à votre budget.
              </p>
            </div>
          </div>

          {/* Period Filter & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(parseInt(e.target.value, 10))}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                background: 'rgba(10, 14, 23, 0.9)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: '#cbd5e1',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <option value={30}>Dernier mois (30 jours)</option>
              <option value={90}>Moyenne 3 mois (90 jours)</option>
              <option value={0}>Toutes les transactions</option>
            </select>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#cbd5e1',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 📊 LIVE SUMMARY BANNER */}
        <div
          style={{
            padding: '12px 22px',
            background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Salaire Net de Référence</span>
              <strong style={{ fontSize: 14, color: '#ffffff' }}>{fmtEur(netSalary)}</strong>
            </div>

            <div style={{ height: 28, width: 1, background: 'rgba(255, 255, 255, 0.12)' }} />

            <div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Total Flux Sélectionnés</span>
              <strong style={{ fontSize: 14, color: 'var(--accent-cyan)' }}>
                {fmtEur(totalSelectedEuro)} ({totalSelectedPercent.toFixed(1)}%)
              </strong>
            </div>

            <div style={{ height: 28, width: 1, background: 'rgba(255, 255, 255, 0.12)' }} />

            <div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Reste à Vivre Prévisionnel</span>
              <strong
                style={{
                  fontSize: 14,
                  color: estimatedResteAVivre >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                }}
              >
                {fmtEur(estimatedResteAVivre)}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={handleSelectAll}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Tout cocher
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Tout décocher
            </button>
          </div>
        </div>

        {/* 🏷️ PILLAR TABS */}
        <div
          style={{
            display: 'flex',
            padding: '8px 22px 0 22px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            gap: 6,
            overflowX: 'auto',
          }}
        >
          {[
            { key: 'ALL', label: `Tous les flux (${initialCandidates.length})` },
            { key: 'FIXED', label: 'Charges Fixes & Logement' },
            { key: 'SAVINGS', label: 'Épargne Mensuelle (PEA / Livret A)' },
            { key: 'DAILY', label: 'Quotidien / Revolut' },
            { key: 'TEMPORARY', label: `Échéances Temporaires (${detectedTempObligations.length})` },
            { key: 'UNCLASSIFIED', label: `Flux non classés (${unclassifiedTxs.length})` },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: '7px 12px',
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                  background: isActive ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

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
              <div
                key={cand.id}
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
                      onChange={() => toggleSelect(cand.id)}
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
                          setCustomAmounts((prev) => ({ ...prev, [cand.id]: val }));
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
                          onClick={() => {
                            const nextPct = !isPct;
                            setIsPercentageMap((prev) => ({ ...prev, [cand.id]: nextPct }));
                            if (nextPct) {
                              const newPct = netSalary > 0 ? Math.round((currentVal / netSalary) * 100 * 10) / 10 : cand.defaultPercentage;
                              setCustomAmounts((prev) => ({ ...prev, [cand.id]: newPct }));
                            } else {
                              const newEuro = (netSalary * currentVal) / 100;
                              setCustomAmounts((prev) => ({ ...prev, [cand.id]: Math.round(newEuro * 100) / 100 }));
                            }
                          }}
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
                      {activeTxs.length} transaction(s) active(s) = {fmtEur(activeTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0))} ({targetSummary.periodLabel})
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
                        onClick={() => toggleExpandTx(cand.id)}
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

                {/* 🔍 EXPANDED SUB-TRANSACTIONS LIST WITH GRANULAR CHECKBOXES */}
                {isExpanded && (
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
                                onChange={() => toggleTxInclusion(cand.id, tx.id)}
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
                                onClick={() => removeTxFromCandidate(cand.id, tx)}
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
                        onChange={(e) =>
                          setNewTxInputs((prev) => ({
                            ...prev,
                            [cand.id]: { ...newTx, title: e.target.value },
                          }))
                        }
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
                        onChange={(e) =>
                          setNewTxInputs((prev) => ({
                            ...prev,
                            [cand.id]: { ...newTx, amount: e.target.value },
                          }))
                        }
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
                        onClick={() => handleAddTxToCandidate(cand.id)}
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
                )}
              </div>
            );
          })}

          {/* TAB 6: UNCLASSIFIED BANK TRANSACTIONS */}
          {activeTab === 'UNCLASSIFIED' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  fontSize: 12,
                  color: '#cbd5e1',
                }}
              >
                <strong style={{ color: 'var(--accent-amber)' }}>Flux non classés automatiquement :</strong>
                <div>
                  Ces transactions du relevé BoursoBank n&apos;ont pas été associées aux postes standards. Vous pouvez les rattacher à un poste existant en un clic.
                </div>
              </div>

              {unclassifiedTxs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
                  🎉 Aucune transaction non classée restante.
                </div>
              ) : (
                unclassifiedTxs.map((tx) => (
                  <div
                    key={tx.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: 12,
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      flexWrap: 'wrap',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{tx.date}</span>
                      <strong style={{ fontSize: 13, color: '#ffffff' }}>{tx.title}</strong>
                      <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--accent-rose)' }}>
                        {fmtEur(Math.abs(tx.amount))}
                      </span>
                    </div>

                    {/* Quick Assign Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            assignUnclassifiedToCandidate(tx, e.target.value);
                          }
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          background: 'rgba(10, 14, 23, 0.95)',
                          border: '1px solid rgba(6, 182, 212, 0.4)',
                          color: 'var(--accent-cyan)',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <option value="" disabled>
                          ➕ Rattacher au poste...
                        </option>
                        <option value="flow-loyer">🏠 Loyer & Logement</option>
                        <option value="flow-abonnement">📱 Abonnements & Services</option>
                        <option value="flow-pea">📈 Cible PEA</option>
                        <option value="flow-livret_a">🛡️ Livret A</option>
                        <option value="flow-tontine">👥 Tontine</option>
                        <option value="flow-soutien">❤️ Soutien Familial</option>
                        <option value="flow-revolut">💳 Revolut (Quotidien)</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 🌟 MODAL FOOTER */}
        <div
          style={{
            padding: '16px 22px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 11.5, color: '#94a3b8' }}>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>
              {selectedCandidatesList.length} poste(s) sélectionné(s)
            </span>{' '}
            sur {initialCandidates.length} détectés
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#cbd5e1',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleValidateAndApply}
              style={{
                padding: '9px 20px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                border: 'none',
                color: '#0a0e17',
                fontSize: 12.5,
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)',
              }}
            >
              🪄 Valider & Appliquer la Sélection aux Règles ({fmtEur(totalSelectedEuro)})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

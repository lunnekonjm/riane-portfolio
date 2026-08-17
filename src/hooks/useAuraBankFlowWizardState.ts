'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  analyzeTargetFlows,
  detectTemporaryObligations,
  buildInteractiveFlowCandidates,
  type TargetFlowItem,
  type TemporaryExpenseItem,
  type DetectedFlowCandidate,
  type BankTargetAnalysisSummary,
} from '@/engines/bankingAnalyzerEngine';
import type { RuleCategoryItem } from '@/components/aura/AuraRulesView';

export interface UseAuraBankFlowWizardStateParams {
  isOpen: boolean;
  rawNetSalary: number;
  bankTransactions: TargetFlowItem[];
  currentSavings: RuleCategoryItem[];
  currentFixed: RuleCategoryItem[];
  currentDaily: RuleCategoryItem[];
  currentTempExpenses: TemporaryExpenseItem[];
}

export function useAuraBankFlowWizardState({
  isOpen,
  rawNetSalary,
  bankTransactions,
  currentSavings,
  currentFixed,
  currentDaily,
  currentTempExpenses,
}: UseAuraBankFlowWizardStateParams) {
  const netSalary = (rawNetSalary && rawNetSalary > 100) ? rawNetSalary : 2713.74;

  const [periodDays, setPeriodDays] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<'ALL' | 'FIXED' | 'SAVINGS' | 'DAILY' | 'TEMPORARY' | 'UNCLASSIFIED'>('ALL');

  const targetSummary: BankTargetAnalysisSummary = useMemo(() => {
    return analyzeTargetFlows(bankTransactions, netSalary, periodDays);
  }, [bankTransactions, netSalary, periodDays]);

  const detectedTempObligations: TemporaryExpenseItem[] = useMemo(() => {
    return detectTemporaryObligations(bankTransactions, currentTempExpenses);
  }, [bankTransactions, currentTempExpenses]);

  const initialCandidates: DetectedFlowCandidate[] = useMemo(() => {
    return buildInteractiveFlowCandidates(targetSummary, detectedTempObligations, netSalary);
  }, [targetSummary, detectedTempObligations, netSalary]);

  const [candidateTxsMap, setCandidateTxsMap] = useState<Record<string, TargetFlowItem[]>>({});
  const [excludedTxIds, setExcludedTxIds] = useState<Set<string>>(new Set());
  const [unclassifiedTxs, setUnclassifiedTxs] = useState<TargetFlowItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [isPercentageMap, setIsPercentageMap] = useState<Record<string, boolean>>({});
  const [expandedTxIds, setExpandedTxIds] = useState<Set<string>>(new Set());
  const [newTxInputs, setNewTxInputs] = useState<Record<string, { title: string; amount: string; date: string }>>({});

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
    }
  }, [isOpen, initialCandidates, targetSummary]);

  const divisor = periodDays > 0 ? periodDays / 30.4375 : 1;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
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

  const toggleExpandTx = (id: string) => {
    setExpandedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTxInclusion = (candId: string, txId: string) => {
    setExcludedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(txId)) next.delete(txId);
      else next.add(txId);
      return next;
    });

    setTimeout(() => {
      const allTxs = candidateTxsMap[candId] || [];
      const updatedExcluded = new Set(excludedTxIds);
      if (updatedExcluded.has(txId)) updatedExcluded.delete(txId);
      else updatedExcluded.add(txId);

      const activeTxs = allTxs.filter((t) => !updatedExcluded.has(t.id));
      const newSumMonthly = activeTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0) / divisor;

      const isPct = isPercentageMap[candId];
      if (isPct) {
        const newPct = netSalary > 0 ? Math.round((newSumMonthly / netSalary) * 100 * 10) / 10 : 0;
        setCustomAmounts((prev) => ({ ...prev, [candId]: newPct }));
      } else {
        setCustomAmounts((prev) => ({ ...prev, [candId]: Math.round(newSumMonthly * 100) / 100 }));
      }
    }, 10);
  };

  const removeTxFromCandidate = (candId: string, tx: TargetFlowItem) => {
    setCandidateTxsMap((prev) => {
      const current = prev[candId] || [];
      return { ...prev, [candId]: current.filter((t) => t.id !== tx.id) };
    });
    setUnclassifiedTxs((prev) => [tx, ...prev]);

    setTimeout(() => {
      const remainingTxs = (candidateTxsMap[candId] || []).filter((t) => t.id !== tx.id && !excludedTxIds.has(t.id));
      const newSumMonthly = remainingTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0) / divisor;
      const isPct = isPercentageMap[candId];
      if (isPct) {
        const newPct = netSalary > 0 ? Math.round((newSumMonthly / netSalary) * 100 * 10) / 10 : 0;
        setCustomAmounts((prev) => ({ ...prev, [candId]: newPct }));
      } else {
        setCustomAmounts((prev) => ({ ...prev, [candId]: Math.round(newSumMonthly * 100) / 100 }));
      }
    }, 10);
  };

  const handleAddTxToCandidate = (candId: string) => {
    const input = newTxInputs[candId];
    if (!input || !input.title.trim() || !input.amount) return;

    const amt = parseFloat(input.amount.replace(',', '.')) || 0;
    if (amt <= 0) return;

    const newTx: TargetFlowItem = {
      id: `manual-wiz-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: input.date || new Date().toISOString().split('T')[0],
      title: input.title.trim(),
      amount: -Math.abs(amt),
      category: 'MISC',
    };

    setCandidateTxsMap((prev) => ({
      ...prev,
      [candId]: [newTx, ...(prev[candId] || [])],
    }));

    setNewTxInputs((prev) => ({
      ...prev,
      [candId]: { title: '', amount: '', date: '' },
    }));

    setTimeout(() => {
      const currentList = [newTx, ...(candidateTxsMap[candId] || [])];
      const activeTxs = currentList.filter((t) => !excludedTxIds.has(t.id));
      const newSumMonthly = activeTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0) / divisor;
      const isPct = isPercentageMap[candId];
      if (isPct) {
        const newPct = netSalary > 0 ? Math.round((newSumMonthly / netSalary) * 100 * 10) / 10 : 0;
        setCustomAmounts((prev) => ({ ...prev, [candId]: newPct }));
      } else {
        setCustomAmounts((prev) => ({ ...prev, [candId]: Math.round(newSumMonthly * 100) / 100 }));
      }
    }, 10);
  };

  const assignUnclassifiedToCandidate = (tx: TargetFlowItem, candId: string) => {
    setUnclassifiedTxs((prev) => prev.filter((t) => t.id !== tx.id));
    setCandidateTxsMap((prev) => ({
      ...prev,
      [candId]: [tx, ...(prev[candId] || [])],
    }));

    if (!selectedIds.has(candId)) {
      setSelectedIds((prev) => new Set([...prev, candId]));
    }

    setTimeout(() => {
      const currentList = [tx, ...(candidateTxsMap[candId] || [])];
      const activeTxs = currentList.filter((t) => !excludedTxIds.has(t.id));
      const newSumMonthly = activeTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0) / divisor;
      const isPct = isPercentageMap[candId];
      if (isPct) {
        const newPct = netSalary > 0 ? Math.round((newSumMonthly / netSalary) * 100 * 10) / 10 : 0;
        setCustomAmounts((prev) => ({ ...prev, [candId]: newPct }));
      } else {
        setCustomAmounts((prev) => ({ ...prev, [candId]: Math.round(newSumMonthly * 100) / 100 }));
      }
    }, 10);
  };

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

  const selectedCandidatesList = initialCandidates.filter((c) => selectedIds.has(c.id));
  const totalSelectedEuro = selectedCandidatesList.reduce((sum, c) => sum + getEffectiveEuroForCandidate(c), 0);
  const totalSelectedPercent = netSalary > 0 ? (totalSelectedEuro / netSalary) * 100 : 0;
  const estimatedResteAVivre = netSalary - totalSelectedEuro;

  const displayedCandidates = initialCandidates.filter((c) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UNCLASSIFIED') return false;
    return c.pillar === activeTab;
  });

  return {
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
  };
}

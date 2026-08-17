'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  analyzeTargetFlows,
  detectTemporaryObligations,
  buildInteractiveFlowCandidates,
  detectMultiMonthPatterns,
  type TargetFlowItem,
  type TemporaryExpenseItem,
  type DetectedFlowCandidate,
  type BankTargetAnalysisSummary,
  type SmartFlowInsight,
} from '@/engines/bankingAnalyzerEngine';
import {
  loadWizardMemory,
  resetWizardMemory,
  type AuraWizardLearningMemory,
} from '@/services/banking/auraWizardMemoryService';
import type { RuleCategoryItem } from '@/types/auraRules';

export function isNonPrincipalAccount(accDesc: string): boolean {
  const upper = (accDesc || '').toUpperCase();
  return (
    upper.includes('JOINT') ||
    upper.includes('TONTINE') ||
    upper.includes('COMMUN') ||
    upper.includes('MME') ||
    upper.includes('MADAME') ||
    upper.includes('M. OU') ||
    upper.includes('M OU') ||
    upper.includes('LIVRET') ||
    upper.includes('EPARGNE') ||
    upper.includes('PEA') ||
    upper.includes('CSL') ||
    upper.includes('LDDS') ||
    upper.includes('TIERS')
  );
}

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

  const [memory, setMemory] = useState<AuraWizardLearningMemory>(() => loadWizardMemory());
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [selectedAccount, setSelectedAccount] = useState<string>('PRINCIPAL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'FIXED' | 'SAVINGS' | 'DAILY' | 'TEMPORARY' | 'UNCLASSIFIED'>('ALL');
  const [dismissedInsightIds, setDismissedInsightIds] = useState<Set<string>>(new Set());
  const [extraTempObligations, setExtraTempObligations] = useState<TemporaryExpenseItem[]>([]);

  // Sync memory when modal opens or memory updates
  useEffect(() => {
    if (isOpen) {
      const loaded = loadWizardMemory();
      setMemory(loaded);
      if (loaded.dismissedInsightIds && loaded.dismissedInsightIds.length > 0) {
        setDismissedInsightIds(new Set(loaded.dismissedInsightIds));
      }
    }
  }, [isOpen]);

  // Discover all distinct accounts in transactions
  const availableAccounts = useMemo(() => {
    if (!Array.isArray(bankTransactions)) return [];
    const map = new Map<string, string>();
    for (const t of bankTransactions) {
      const accId = t.accountId || t.accountType || '';
      const accName = t.accountName || t.accountType || '';
      if (accId && !map.has(accId)) {
        map.set(accId, accName || accId);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [bankTransactions]);

  // Filter transactions by selected account (Strict Principal Account Filter)
  const filteredByAccountTransactions = useMemo(() => {
    if (!Array.isArray(bankTransactions)) return [];
    if (selectedAccount === 'ALL') return bankTransactions;

    if (selectedAccount === 'PRINCIPAL') {
      return bankTransactions.filter((tx) => {
        const acc = `${tx.accountId || ''} ${tx.accountType || ''} ${tx.accountName || ''}`.toUpperCase();
        if (!acc.trim()) return true; // Include if no account info is attached
        return !isNonPrincipalAccount(acc);
      });
    }

    return bankTransactions.filter((tx) =>
      tx.accountId === selectedAccount ||
      tx.accountType === selectedAccount ||
      tx.accountName === selectedAccount
    );
  }, [bankTransactions, selectedAccount]);

  const targetSummary: BankTargetAnalysisSummary = useMemo(() => {
    return analyzeTargetFlows(filteredByAccountTransactions, netSalary, periodDays, memory);
  }, [filteredByAccountTransactions, netSalary, periodDays, memory]);

  // Detected temporary obligations (including 90-day multi-month and user-injected)
  const detectedTempObligations: TemporaryExpenseItem[] = useMemo(() => {
    const base = detectTemporaryObligations(filteredByAccountTransactions, currentTempExpenses, memory);
    const combined = [...base];
    for (const extra of extraTempObligations) {
      if (!combined.some((t) => t.id === extra.id || t.label.toUpperCase() === extra.label.toUpperCase())) {
        combined.push(extra);
      }
    }
    return combined;
  }, [filteredByAccountTransactions, currentTempExpenses, extraTempObligations, memory]);

  // Multi-Month Smart Insights (90-day horizon)
  const smartInsights: SmartFlowInsight[] = useMemo(() => {
    const allInsights = detectMultiMonthPatterns(
      filteredByAccountTransactions,
      currentFixed,
      [...currentTempExpenses, ...extraTempObligations],
      memory
    );
    return allInsights.filter((ins) => !dismissedInsightIds.has(ins.id));
  }, [filteredByAccountTransactions, currentFixed, currentTempExpenses, extraTempObligations, dismissedInsightIds, memory]);

  const initialCandidates: DetectedFlowCandidate[] = useMemo(() => {
    return buildInteractiveFlowCandidates(targetSummary, detectedTempObligations, netSalary, memory);
  }, [targetSummary, detectedTempObligations, netSalary, memory]);

  const [candidateTxsMap, setCandidateTxsMap] = useState<Record<string, TargetFlowItem[]>>({});
  const [excludedTxIds, setExcludedTxIds] = useState<Set<string>>(new Set());
  const [unclassifiedTxs, setUnclassifiedTxs] = useState<TargetFlowItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [isPercentageMap, setIsPercentageMap] = useState<Record<string, boolean>>({});
  const [expandedTxIds, setExpandedTxIds] = useState<Set<string>>(new Set());

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

  // Convert amount seamlessly when toggling % <-> €
  const handleTogglePercentage = (id: string) => {
    const wasPct = isPercentageMap[id] ?? false;
    const willBePct = !wasPct;

    const currentVal = customAmounts[id] !== undefined
      ? customAmounts[id]
      : 0;

    let newVal = currentVal;
    if (wasPct && !willBePct) {
      // Was % -> now € (e.g. 24.6% of 2713.74 -> 667.58 €)
      newVal = Math.round(((netSalary * currentVal) / 100) * 100) / 100;
    } else if (!wasPct && willBePct) {
      // Was € -> now % (e.g. 666.69 € / 2713.74 -> 24.6%)
      newVal = netSalary > 0 ? Math.round(((currentVal / netSalary) * 100) * 10) / 10 : 0;
    }

    setIsPercentageMap((prev) => ({ ...prev, [id]: willBePct }));
    setCustomAmounts((prev) => ({ ...prev, [id]: newVal }));
  };

  const handleChangeAmount = (id: string, val: number) => {
    setCustomAmounts((prev) => ({ ...prev, [id]: val }));
  };

  const toggleTxInclusion = (candId: string, txId: string) => {
    setExcludedTxIds((prevExcluded) => {
      const nextExcluded = new Set(prevExcluded);
      if (nextExcluded.has(txId)) nextExcluded.delete(txId);
      else nextExcluded.add(txId);

      const allTxs = candidateTxsMap[candId] || [];
      const activeTxs = allTxs.filter((t) => !nextExcluded.has(t.id));
      const newSumMonthly = activeTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0) / divisor;

      const isPct = isPercentageMap[candId];
      if (isPct) {
        const pct = netSalary > 0 ? Math.round((newSumMonthly / netSalary) * 100 * 10) / 10 : 0;
        setCustomAmounts((prev) => ({ ...prev, [candId]: pct }));
      } else {
        setCustomAmounts((prev) => ({ ...prev, [candId]: Math.round(newSumMonthly * 100) / 100 }));
      }

      return nextExcluded;
    });
  };

  const removeTxFromCandidate = (candId: string, txOrId: TargetFlowItem | string) => {
    const txId = typeof txOrId === 'string' ? txOrId : txOrId.id;
    const list = candidateTxsMap[candId] || [];
    const removedTx = list.find((t) => t.id === txId) || (typeof txOrId === 'object' ? txOrId : undefined);
    if (!removedTx) return;

    setCandidateTxsMap((prev) => ({
      ...prev,
      [candId]: prev[candId].filter((t) => t.id !== txId),
    }));

    setUnclassifiedTxs((prev) => [removedTx, ...prev]);

    const remaining = list.filter((t) => t.id !== txId && !excludedTxIds.has(t.id));
    const newSum = remaining.reduce((sum, t) => sum + Math.abs(t.amount), 0) / divisor;
    const isPct = isPercentageMap[candId];
    if (isPct) {
      const pct = netSalary > 0 ? Math.round((newSum / netSalary) * 100 * 10) / 10 : 0;
      setCustomAmounts((prev) => ({ ...prev, [candId]: pct }));
    } else {
      setCustomAmounts((prev) => ({ ...prev, [candId]: Math.round(newSum * 100) / 100 }));
    }
  };

  const moveTxBetweenCandidates = (txOrId: TargetFlowItem | string, fromCandId: string, toCandId: string) => {
    const txId = typeof txOrId === 'string' ? txOrId : txOrId.id;
    const fromList = candidateTxsMap[fromCandId] || [];
    const txToMove = fromList.find((t) => t.id === txId) || (typeof txOrId === 'object' ? txOrId : undefined);
    if (!txToMove) return;

    setCandidateTxsMap((prev) => ({
      ...prev,
      [fromCandId]: prev[fromCandId].filter((t) => t.id !== txId),
      [toCandId]: [...(prev[toCandId] || []), txToMove],
    }));

    const nextFrom = fromList.filter((t) => t.id !== txId && !excludedTxIds.has(t.id));
    const nextTo = [...(candidateTxsMap[toCandId] || []).filter((t) => !excludedTxIds.has(t.id)), txToMove];

    const sumFrom = nextFrom.reduce((sum, t) => sum + Math.abs(t.amount), 0) / divisor;
    const sumTo = nextTo.reduce((sum, t) => sum + Math.abs(t.amount), 0) / divisor;

    setCustomAmounts((prev) => ({
      ...prev,
      [fromCandId]: isPercentageMap[fromCandId]
        ? (netSalary > 0 ? Math.round((sumFrom / netSalary) * 100 * 10) / 10 : 0)
        : Math.round(sumFrom * 100) / 100,
      [toCandId]: isPercentageMap[toCandId]
        ? (netSalary > 0 ? Math.round((sumTo / netSalary) * 100 * 10) / 10 : 0)
        : Math.round(sumTo * 100) / 100,
    }));
  };

  const assignUnclassifiedToCandidate = (txOrCandId: TargetFlowItem | string, candidateIdOrTxId: string) => {
    let tx: TargetFlowItem | undefined;
    let targetCandId: string;

    if (typeof txOrCandId === 'object') {
      tx = txOrCandId;
      targetCandId = candidateIdOrTxId;
    } else {
      targetCandId = txOrCandId;
      tx = unclassifiedTxs.find((t) => t.id === candidateIdOrTxId);
    }

    if (!tx) return;
    const txId = tx.id;

    setUnclassifiedTxs((prev) => prev.filter((t) => t.id !== txId));
    setCandidateTxsMap((prev) => ({
      ...prev,
      [targetCandId]: [...(prev[targetCandId] || []), tx!],
    }));

    const nextList = [...(candidateTxsMap[targetCandId] || []).filter((t) => !excludedTxIds.has(t.id)), tx!];
    const sum = nextList.reduce((s, t) => s + Math.abs(t.amount), 0) / divisor;

    setCustomAmounts((prev) => ({
      ...prev,
      [targetCandId]: isPercentageMap[targetCandId]
        ? (netSalary > 0 ? Math.round((sum / netSalary) * 100 * 10) / 10 : 0)
        : Math.round(sum * 100) / 100,
    }));
  };

  // 1-Click Action Handlers for Smart Insights
  const handleApplyEphemeralInsight = (
    insight: SmartFlowInsight,
    customDurationMonths?: number,
    customStartPeriod?: string
  ) => {
    const dur = customDurationMonths !== undefined ? customDurationMonths : (insight.suggestedDurationMonths || 12);
    const startP = customStartPeriod || insight.startPeriod || new Date().toISOString().slice(0, 7);
    const newTemp: TemporaryExpenseItem = {
      id: `temp-${insight.merchant.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36).slice(2, 6)}`,
      label: insight.merchant,
      monthlyAmount: insight.currentMonthlyAmount,
      startPeriod: startP,
      durationMonths: Math.max(1, dur),
      category: insight.category || 'Échéancier',
    };

    setExtraTempObligations((prev) => [...prev, newTemp]);
    const flowId = `flow-temp-${newTemp.id}`;
    setSelectedIds((prev) => new Set(prev).add(flowId));
    setCustomAmounts((prev) => ({ ...prev, [flowId]: insight.currentMonthlyAmount }));
    setIsPercentageMap((prev) => ({ ...prev, [flowId]: false }));
  };

  const handleApplyTariffChangeInsight = (insight: SmartFlowInsight) => {
    const upperMerchant = insight.merchant.toUpperCase();
    const targetCand = initialCandidates.find(
      (c) =>
        c.title.toUpperCase().includes(upperMerchant) ||
        (c.subtitle && c.subtitle.toUpperCase().includes(upperMerchant)) ||
        (upperMerchant.includes('TOTAL') && c.id === 'flow-loyer') ||
        (upperMerchant.includes('BOUYGUES') && c.id === 'flow-abonnement') ||
        (upperMerchant.includes('SENDWAVE') && c.id === 'flow-soutien')
    );

    if (targetCand) {
      const txs = candidateTxsMap[targetCand.id] || targetCand.transactions;
      const activeTxs = txs.filter((t) => !excludedTxIds.has(t.id));
      const sumMonthly = activeTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0) / divisor;
      const isPct = isPercentageMap[targetCand.id] ?? targetCand.isPercentage;

      setCustomAmounts((prev) => ({
        ...prev,
        [targetCand.id]: isPct
          ? (netSalary > 0 ? Math.round((sumMonthly / netSalary) * 100 * 10) / 10 : 0)
          : Math.round(sumMonthly * 100) / 100,
      }));
      setSelectedIds((prev) => new Set(prev).add(targetCand.id));
    }
  };

  const handleApplyFixedInsight = (insight: SmartFlowInsight) => {
    handleApplyTariffChangeInsight(insight);
  };

  const handleDismissInsight = (insightId: string) => {
    setDismissedInsightIds((prev) => new Set(prev).add(insightId));
  };

  // Reset entire AI memory to start fresh
  const handleResetMemory = useCallback(() => {
    const cleanMem = resetWizardMemory();
    setMemory(cleanMem);
    setDismissedInsightIds(new Set());
    setExcludedTxIds(new Set());
  }, []);

  const getEffectiveEuroForCandidate = (cand: DetectedFlowCandidate): number => {
    const isPct = isPercentageMap[cand.id] ?? cand.isPercentage;
    const val = customAmounts[cand.id] !== undefined
      ? customAmounts[cand.id]
      : (isPct ? cand.defaultPercentage : cand.detectedMonthlyAmount);

    if (isPct) {
      return (netSalary * val) / 100;
    }
    return val;
  };

  const getExistingRuleComparison = (cand: DetectedFlowCandidate) => {
    const allExisting = [...currentSavings, ...currentFixed, ...currentDaily];
    const candUpper = cand.title.toUpperCase();
    const candKey = cand.categoryKey.toUpperCase();

    const matched = allExisting.find(
      (r) =>
        (r?.name || '').toUpperCase().includes(candKey) ||
        candUpper.includes((r?.name || '').toUpperCase())
    );

    if (!matched) return null;

    const ruleEuro = matched.isPercentage
      ? (netSalary * (matched.amount || 0)) / 100
      : (matched.amount || 0);

    return {
      ruleName: matched.name,
      ruleEuro: Math.round(ruleEuro * 100) / 100,
      isPercentage: matched.isPercentage,
      ruleAmount: matched.amount || 0,
    };
  };

  const selectedCandidatesList = useMemo(() => {
    return initialCandidates.filter((c) => selectedIds.has(c.id));
  }, [initialCandidates, selectedIds]);

  const totalSelectedEuro = useMemo(() => {
    return selectedCandidatesList.reduce((sum, c) => sum + getEffectiveEuroForCandidate(c), 0);
  }, [selectedCandidatesList, customAmounts, isPercentageMap, netSalary]);

  const totalSelectedPercent = useMemo(() => {
    return netSalary > 0 ? Math.round((totalSelectedEuro / netSalary) * 100 * 10) / 10 : 0;
  }, [totalSelectedEuro, netSalary]);

  const estimatedResteAVivre = useMemo(() => {
    return Math.max(0, Math.round((netSalary - totalSelectedEuro) * 100) / 100);
  }, [netSalary, totalSelectedEuro]);

  const displayedCandidates = useMemo(() => {
    if (activeTab === 'ALL') return initialCandidates;
    return initialCandidates.filter((c) => c.pillar === activeTab);
  }, [initialCandidates, activeTab]);

  const learnedRulesCount = useMemo(() => {
    return (
      (memory.rejectedCandidateIds?.length || 0) +
      (memory.rejectedMerchantPatterns?.length || 0) +
      (memory.excludedTxSignatures?.length || 0) +
      (memory.dismissedInsightIds?.length || 0)
    );
  }, [memory]);

  return {
    netSalary,
    memory,
    learnedRulesCount,
    handleResetMemory,
    periodDays,
    setPeriodDays,
    selectedAccount,
    setSelectedAccount,
    availableAccounts,
    activeTab,
    setActiveTab,
    targetSummary,
    detectedTempObligations,
    smartInsights,
    dismissedInsightIds,
    initialCandidates,
    candidateTxsMap,
    excludedTxIds,
    unclassifiedTxs,
    selectedIds,
    customAmounts,
    setCustomAmounts,
    isPercentageMap,
    setIsPercentageMap,
    handleTogglePercentage,
    handleChangeAmount,
    expandedTxIds,
    toggleSelect,
    handleSelectAll,
    handleDeselectAll,
    toggleExpandTx,
    toggleTxInclusion,
    removeTxFromCandidate,
    moveTxBetweenCandidates,
    assignUnclassifiedToCandidate,
    handleApplyEphemeralInsight,
    handleApplyTariffChangeInsight,
    handleApplyFixedInsight,
    handleDismissInsight,
    getEffectiveEuroForCandidate,
    getExistingRuleComparison,
    selectedCandidatesList,
    totalSelectedEuro,
    totalSelectedPercent,
    estimatedResteAVivre,
    displayedCandidates,
  };
}

'use client';

import { useState, useMemo, useCallback } from 'react';
import type {
  SalaryRecord,
  BankReconciliationRecord,
  BankTransactionMatch,
} from '@/types/revenue';
import {
  buildReconciliationDraft,
  type RawBankTransaction,
} from '@/services/bankReconciliationEngine';
import { useBoursoLive } from '@/hooks/useBoursoLive';

export interface UseAuraBankReconciliationStateParams {
  records: SalaryRecord[];
  allBankTransactions: RawBankTransaction[];
  selectedMonth: string;
  onSaveRecord: (record: SalaryRecord) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  targetMonthlyBudget?: number;
}

export function getPeriodLabel(periodStr: string): string {
  const [year, month] = periodStr.split('-');
  if (!year || !month) return periodStr;
  const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function useAuraBankReconciliationState({
  records,
  allBankTransactions,
  selectedMonth,
  onSaveRecord,
  onDeleteRecord,
  onShowToast,
  targetMonthlyBudget = 400,
}: UseAuraBankReconciliationStateParams) {
  const boursoLive = useBoursoLive();

  // Modals state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewMatches, setReviewMatches] = useState<BankTransactionMatch[]>([]);
  const [matchesHistory, setMatchesHistory] = useState<BankTransactionMatch[][]>([]);
  const [matchesRedo, setMatchesRedo] = useState<BankTransactionMatch[][]>([]);
  const [isResetMonthModalOpen, setIsResetMonthModalOpen] = useState(false);
  const [isClearCacheModalOpen, setIsClearCacheModalOpen] = useState(false);

  const cleanRecords = useMemo(() => {
    return records.filter((r) => !r.id?.startsWith('sal-sample-'));
  }, [records]);

  const currentRecord = useMemo(() => {
    return cleanRecords.find((r) => r.period === selectedMonth) || null;
  }, [cleanRecords, selectedMonth]);

  const monthDraft = useMemo(() => {
    return buildReconciliationDraft(selectedMonth, currentRecord, allBankTransactions);
  }, [selectedMonth, currentRecord, allBankTransactions]);

  const activeMatches = useMemo(() => {
    if (currentRecord?.bankReality?.detectedTransactions && currentRecord.bankReality.detectedTransactions.length > 0) {
      return currentRecord.bankReality.detectedTransactions;
    }
    return monthDraft.detectedTransactions || [];
  }, [currentRecord, monthDraft]);

  const actualSalary = useMemo(() => {
    if (currentRecord?.bankReality?.actualNetSalaryReceived !== undefined) {
      return currentRecord.bankReality.actualNetSalaryReceived;
    }
    return monthDraft.actualNetSalaryReceived;
  }, [currentRecord, monthDraft]);

  const actualPEA = useMemo(() => {
    if (currentRecord?.bankReality?.actualInvestedPEA !== undefined) {
      return currentRecord.bankReality.actualInvestedPEA;
    }
    return monthDraft.actualInvestedPEA;
  }, [currentRecord, monthDraft]);

  const actualTampon = useMemo(() => {
    if (currentRecord?.bankReality?.actualInvestedTampon !== undefined) {
      return currentRecord.bankReality.actualInvestedTampon;
    }
    return monthDraft.actualInvestedTampon;
  }, [currentRecord, monthDraft]);

  const totalInvested = actualPEA + actualTampon;
  const deltaVsTarget = Math.round((totalInvested - targetMonthlyBudget) * 100) / 100;

  const handleOpenReviewModal = useCallback(() => {
    const draft = buildReconciliationDraft(selectedMonth, currentRecord, allBankTransactions);
    const existing = currentRecord?.bankReality?.detectedTransactions;
    if (existing && existing.length > 0) {
      setReviewMatches(JSON.parse(JSON.stringify(existing)));
    } else {
      setReviewMatches(JSON.parse(JSON.stringify(draft.detectedTransactions || [])));
    }
    setMatchesHistory([]);
    setMatchesRedo([]);
    setIsReviewModalOpen(true);
  }, [selectedMonth, currentRecord, allBankTransactions]);

  const handleUpdateReviewMatch = useCallback((id: string, updates: Partial<BankTransactionMatch>) => {
    setReviewMatches((prev) => {
      setMatchesHistory((h) => [JSON.parse(JSON.stringify(prev)), ...h].slice(0, 20));
      setMatchesRedo([]);
      return prev.map((m) => (m.id === id ? { ...m, ...updates } : m));
    });
  }, []);

  const handleUndoMatches = useCallback(() => {
    if (matchesHistory.length === 0) return;
    const previous = matchesHistory[0];
    const newHistory = matchesHistory.slice(1);
    setMatchesRedo((r) => [JSON.parse(JSON.stringify(reviewMatches)), ...r]);
    setMatchesHistory(newHistory);
    setReviewMatches(previous);
  }, [matchesHistory, reviewMatches]);

  const handleRedoMatches = useCallback(() => {
    if (matchesRedo.length === 0) return;
    const next = matchesRedo[0];
    const newRedo = matchesRedo.slice(1);
    setMatchesHistory((h) => [JSON.parse(JSON.stringify(reviewMatches)), ...h]);
    setMatchesRedo(newRedo);
    setReviewMatches(next);
  }, [matchesRedo, reviewMatches]);

  const handleConfirmResetMonth = useCallback(async () => {
    if (currentRecord?.id) {
      await onDeleteRecord(currentRecord.id);
    }
    setReviewMatches([]);
    setMatchesHistory([]);
    setMatchesRedo([]);
    setIsResetMonthModalOpen(false);
    onShowToast(`🔄 Flux de ${getPeriodLabel(selectedMonth)} réinitialisés depuis la banque !`, 'success');
  }, [currentRecord, onDeleteRecord, selectedMonth, onShowToast]);

  const handleSaveReviewModal = useCallback(async () => {
    let computedSalary = 0;
    let computedPEA = 0;
    let computedTampon = 0;
    let computedTontine = 0;
    let computedLivretA = 0;
    let computedCTO = 0;

    for (const m of reviewMatches) {
      if (!m.included) continue;
      const amt = Number(m.amount) || 0;
      switch (m.category) {
        case 'SALARY_INCOME': computedSalary += amt; break;
        case 'INVEST_PEA': computedPEA += amt; break;
        case 'INVEST_TAMPON': computedTampon += amt; break;
        case 'INVEST_TONTINE': computedTontine += amt; break;
        case 'INVEST_LIVRET_A': computedLivretA += amt; break;
        case 'INVEST_CTO': computedCTO += amt; break;
      }
    }

    const totalActualInvested = Math.round((computedPEA + computedTampon + computedTontine + computedLivretA + computedCTO) * 100) / 100;
    const actualSavingsRate = computedSalary > 0 ? Math.round(((totalActualInvested / computedSalary) * 100) * 10) / 10 : 0;
    const delta = Math.round((totalActualInvested - targetMonthlyBudget) * 100) / 100;
    const execRate = targetMonthlyBudget > 0 ? Math.round(((totalActualInvested / targetMonthlyBudget) * 100) * 10) / 10 : 100;

    let status: BankReconciliationRecord['status'] = 'ON_TRACK';
    if (targetMonthlyBudget > 0) {
      if (execRate >= 90 && execRate <= 110) status = 'ON_TRACK';
      else if (execRate < 90) status = 'UNDER_INVESTED';
      else status = 'OVER_INVESTED';
    }

    const finalReconciliation: BankReconciliationRecord = {
      reconciled: true,
      reconciledAt: Date.now(),
      period: selectedMonth,
      actualNetSalaryReceived: computedSalary,
      actualInvestedPEA: computedPEA,
      actualInvestedTampon: computedTampon,
      actualInvestedTontine: computedTontine,
      actualInvestedLivretA: computedLivretA,
      actualInvestedCTO: computedCTO,
      totalActualInvested,
      actualSavingsRate,
      deltaVsPlan: delta,
      executionRatePercent: execRate,
      status,
      detectedTransactions: reviewMatches,
    };

    const finalRecord: SalaryRecord = {
      id: currentRecord?.id || `sal-${Date.now()}`,
      period: selectedMonth,
      periodLabel: getPeriodLabel(selectedMonth),
      netSalary: computedSalary || (currentRecord?.netSalary ?? 0),
      regularInvestableAmount: totalActualInvested || (currentRecord?.regularInvestableAmount ?? targetMonthlyBudget),
      bonusReserveContribution: computedTampon,
      savingsRate: actualSavingsRate,
      source: 'manual',
      bankReality: finalReconciliation,
      createdAt: currentRecord?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await onSaveRecord(finalRecord);
    setIsReviewModalOpen(false);
    onShowToast(`✅ Rapprochement validé pour ${getPeriodLabel(selectedMonth)} !`, 'success');
  }, [reviewMatches, selectedMonth, currentRecord, targetMonthlyBudget, onSaveRecord, onShowToast]);

  const modalSummary = useMemo(() => {
    let salary = 0;
    let pea = 0;
    let tampon = 0;
    for (const m of reviewMatches) {
      if (!m.included) continue;
      const amt = Number(m.amount) || 0;
      if (m.category === 'SALARY_INCOME') salary += amt;
      else if (m.category === 'INVEST_PEA') pea += amt;
      else if (m.category === 'INVEST_TAMPON') tampon += amt;
    }
    return { salary, pea, tampon, total: pea + tampon };
  }, [reviewMatches]);

  return {
    boursoLive,
    isReviewModalOpen,
    setIsReviewModalOpen,
    reviewMatches,
    matchesHistory,
    matchesRedo,
    isResetMonthModalOpen,
    setIsResetMonthModalOpen,
    isClearCacheModalOpen,
    setIsClearCacheModalOpen,
    cleanRecords,
    currentRecord,
    activeMatches,
    actualSalary,
    actualPEA,
    actualTampon,
    deltaVsTarget,
    handleOpenReviewModal,
    handleUpdateReviewMatch,
    handleUndoMatches,
    handleRedoMatches,
    handleConfirmResetMonth,
    handleSaveReviewModal,
    modalSummary,
  };
}

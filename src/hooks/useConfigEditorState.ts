'use client';

import { useState, useMemo } from 'react';
import type { PortfolioConfig, InvestorProfile, DCATranche } from '@/types/portfolio';
import {
  calculateCumulativeDCA,
  addOrStepUpDCATranche,
  getActiveDCATranche,
  getTodayDateString,
  updateChainedTranches,
  deleteChainedTranche,
} from '@/utils/dcaHistoryHelper';

export interface UseConfigEditorStateParams {
  config: PortfolioConfig;
  investorProfile?: InvestorProfile | null;
  onSave: (config: PortfolioConfig) => void;
  onSyncProfile?: (profile: InvestorProfile) => void;
  onClose: () => void;
}

export function useConfigEditorState({
  config,
  investorProfile,
  onSave,
  onSyncProfile,
  onClose,
}: UseConfigEditorStateParams) {
  const [form, setForm] = useState<PortfolioConfig>({ ...config });
  const [isMultiTierDCA, setIsMultiTierDCA] = useState<boolean>(() => {
    return Boolean(config.dcaHistory && config.dcaHistory.length > 1);
  });
  const [dcaHistory, setDcaHistory] = useState<DCATranche[]>(() => {
    if (config.dcaHistory && config.dcaHistory.length > 0) {
      return [...config.dcaHistory];
    }
    return [
      {
        id: `dca-tranche-init`,
        startDate: config.dcaStartDate || '2024-01-01',
        amount: config.monthlyBudget || 1000,
        label: 'Palier initial',
      },
    ];
  });

  const [newTrancheAmount, setNewTrancheAmount] = useState<number>(() => (form.monthlyBudget || 1000) + 200);
  const [newTrancheDate, setNewTrancheDate] = useState<string>(() => getTodayDateString());
  const [newTrancheReason, setNewTrancheReason] = useState<string>('Augmentation de salaire');
  const [showAddTrancheForm, setShowAddTrancheForm] = useState<boolean>(false);

  const handleChange = (field: keyof PortfolioConfig, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof PortfolioConfig, value: string) => {
    const num = value === '' ? 0 : parseFloat(value);
    if (!isNaN(num)) handleChange(field, num);
  };

  const activeTranche = useMemo(() => getActiveDCATranche(dcaHistory), [dcaHistory]);

  const cumulativeStats = useMemo(() => {
    return calculateCumulativeDCA(
      isMultiTierDCA ? dcaHistory : undefined,
      form.monthlyBudget,
      form.dcaStartDate || '2024-01-01'
    );
  }, [isMultiTierDCA, dcaHistory, form.monthlyBudget, form.dcaStartDate]);

  const handleAddStepUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTrancheAmount <= 0) return;
    const updated = addOrStepUpDCATranche(dcaHistory, newTrancheAmount, newTrancheDate, newTrancheReason);
    setDcaHistory(updated);
    setShowAddTrancheForm(false);

    const active = getActiveDCATranche(updated);
    if (active) {
      setForm((prev) => ({ ...prev, monthlyBudget: active.amount, dcaHistory: updated }));
    }
  };

  const handleUpdateTranche = (id: string, updates: Partial<DCATranche>) => {
    setDcaHistory((prev) => {
      const next = updateChainedTranches(prev, id, updates);
      const active = getActiveDCATranche(next);
      if (active) {
        setForm((p) => ({ ...p, monthlyBudget: active.amount, dcaHistory: next }));
      }
      return next;
    });
  };

  const handleDeleteTranche = (id: string) => {
    setDcaHistory((prev) => {
      if (prev.length <= 1) return prev;
      const next = deleteChainedTranche(prev, id);
      const active = getActiveDCATranche(next);
      if (active) {
        setForm((p) => ({ ...p, monthlyBudget: active.amount, dcaHistory: next }));
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalMonthlyBudget = isMultiTierDCA && activeTranche ? activeTranche.amount : form.monthlyBudget;
    const finalConfig: PortfolioConfig = {
      ...form,
      monthlyBudget: finalMonthlyBudget,
      dcaHistory: isMultiTierDCA ? dcaHistory : undefined,
    };

    onSave(finalConfig);

    if (onSyncProfile && investorProfile && investorProfile.onboardingCompleted) {
      if (
        finalConfig.riskProfile !== investorProfile.riskProfile ||
        finalConfig.horizonYears !== investorProfile.horizonYears ||
        finalConfig.monthlyBudget !== investorProfile.monthlyBudget
      ) {
        onSyncProfile({
          ...investorProfile,
          riskProfile: finalConfig.riskProfile,
          horizonYears: finalConfig.horizonYears,
          monthlyBudget: finalConfig.monthlyBudget,
          updatedAt: Date.now(),
        });
      }
    }
  };

  return {
    form,
    isMultiTierDCA,
    setIsMultiTierDCA,
    dcaHistory,
    newTrancheAmount,
    setNewTrancheAmount,
    newTrancheDate,
    setNewTrancheDate,
    newTrancheReason,
    setNewTrancheReason,
    showAddTrancheForm,
    setShowAddTrancheForm,
    handleChange,
    handleNumberChange,
    cumulativeStats,
    handleAddStepUp,
    handleUpdateTranche,
    handleDeleteTranche,
    handleSubmit,
  };
}

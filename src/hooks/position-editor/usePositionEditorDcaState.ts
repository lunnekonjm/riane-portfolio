'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Position, SavingsDeposit, DCATranche } from '@/types/portfolio';
import { simulatePositionDCA, type DCASimulationResult } from '@/engines/dcaSimulation';
import { addContinuousTranche } from '@/utils/dcaHistoryHelper';
import { computeSavingsPositionInterest } from '@/engines/savingsInterestEngine';

interface UsePositionEditorDcaStateProps {
  position?: Position;
  form: Position;
  setForm: React.Dispatch<React.SetStateAction<Position>>;
  setQuantityInput: (val: string) => void;
  setAvgPriceInput: (val: string) => void;
  isSavingsEnvelope: boolean;
}

export function usePositionEditorDcaState({
  position,
  form,
  setForm,
  setQuantityInput,
  setAvgPriceInput,
  isSavingsEnvelope,
}: UsePositionEditorDcaStateProps) {
  const [dcaStartDate, setDcaStartDate] = useState<string>(() => {
    if (position?.dcaStartDate) return position.dcaStartDate;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('riane_dca_start_date');
      if (saved) return saved;
    }
    return new Date().toISOString().split('T')[0];
  });

  const [initialDepositDate, setInitialDepositDate] = useState<string>(() => {
    if (position?.initialDepositDate) return position.initialDepositDate;
    if (position?.dcaStartDate && (!position.monthlyDCA || position.monthlyDCA <= 0)) return position.dcaStartDate;
    return '2023-01-01';
  });

  const [depositsHistory, setDepositsHistory] = useState<SavingsDeposit[]>(() => {
    return position?.depositsHistory ? [...position.depositsHistory] : [];
  });

  const [dcaHistory, setDcaHistory] = useState<DCATranche[]>(() => {
    if (position?.dcaHistory && position.dcaHistory.length > 0) {
      return [...position.dcaHistory];
    }
    if (position?.monthlyDCA && position.monthlyDCA > 0) {
      return [
        {
          id: 'tranche-1',
          startDate: position.dcaStartDate || '2023-01-01',
          amount: position.monthlyDCA,
          frequency: position.dcaFrequency || 'monthly',
          depositDay: position.dcaDepositDay || 5,
          label: 'Palier 1',
        },
      ];
    }
    return [];
  });

  const [isMultiTierDCA, setIsMultiTierDCA] = useState<boolean>(() => {
    return Boolean(position?.dcaHistory && position.dcaHistory.length > 1);
  });

  const handleAddTranche = () => {
    setIsMultiTierDCA(true);
    setDcaHistory((prev) => addContinuousTranche(prev, form.monthlyDCA || 200));
  };

  const [simMode, setSimMode] = useState<'DCA_FIXED' | 'ONE_SHOT' | 'MULTI_TIER'>('DCA_FIXED');
  const [oneShotAmount, setOneShotAmount] = useState<number>(1000);
  const [oneShotDate, setOneShotDate] = useState<string>('2012-01-01');
  const [isCalculatingDCA, setIsCalculatingDCA] = useState<boolean>(false);
  const [dcaResult, setDcaResult] = useState<DCASimulationResult | null>(null);
  const [isFutureDca, setIsFutureDca] = useState<boolean>(false);
  const [showDCAHistory, setShowDCAHistory] = useState<boolean>(false);

  useEffect(() => {
    if (dcaStartDate) {
      const parts = dcaStartDate.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[2], 10);
        if (!isNaN(day) && day >= 1 && day <= 31) {
          setForm((prev) => ({ ...prev, dcaDepositDay: day }));
        }
      }
    }
  }, [dcaStartDate, setForm]);

  const handleRunDCASimulation = async () => {
    if (!form.ticker) return;
    setIsCalculatingDCA(true);
    try {
      const todayStr = new Date().toISOString().slice(0, 7);
      const isIntegerOnly = (form.envelope === 'PEA' || form.envelope === 'PEA-PME') && form.assetType !== 'CRYPTO';

      if (simMode === 'ONE_SHOT') {
        setIsFutureDca(false);
        const result = await simulatePositionDCA(
          form.ticker,
          0,
          oneShotDate || '2012-01-01',
          form.currentPrice || form.avgPrice || 100,
          isIntegerOnly,
          'monthly',
          1,
          1,
          undefined,
          undefined,
          'lump_sum',
          oneShotAmount || 1000
        );
        setDcaResult(result);
        return;
      }

      const monthlyAmount = form.monthlyDCA || (form.annualBudget ? form.annualBudget / 12 : 100);
      const startMonthStr = (dcaStartDate || todayStr).slice(0, 7);

      if (simMode === 'DCA_FIXED' && startMonthStr >= todayStr) {
        setIsFutureDca(true);
        setDcaResult(null);
        return;
      }

      setIsFutureDca(false);
      const depositDay = dcaStartDate ? parseInt(dcaStartDate.slice(8, 10)) : 5;
      const result = await simulatePositionDCA(
        form.ticker,
        monthlyAmount,
        dcaStartDate,
        form.currentPrice || form.avgPrice || 100,
        isIntegerOnly,
        form.dcaFrequency || 'monthly',
        form.dcaDepositMonth || 1,
        depositDay,
        simMode === 'MULTI_TIER' && dcaHistory.length > 0 ? dcaHistory : undefined,
        depositsHistory.length > 0 ? depositsHistory : undefined,
        'dca',
        0
      );
      setDcaResult(result);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setIsCalculatingDCA(false);
    }
  };

  const handleApplyDCAResult = () => {
    if (!dcaResult || dcaResult.totalShares <= 0) return;
    const finalQty = dcaResult.totalShares;
    const finalQtyStr = finalQty < 1 ? finalQty.toFixed(8).replace(/\.?0+$/, '') : String(finalQty);
    const finalAvgPriceStr = dcaResult.avgPrice > 0 ? dcaResult.avgPrice.toFixed(2) : '';
    setQuantityInput(finalQtyStr);
    setAvgPriceInput(finalAvgPriceStr);
    const updated: Position = {
      ...form,
      quantity: finalQty,
      avgPrice: dcaResult.avgPrice,
      dcaStartDate: simMode === 'ONE_SHOT' ? oneShotDate : dcaStartDate,
      dcaHistory: simMode === 'MULTI_TIER' && dcaHistory.length > 0 ? dcaHistory : undefined,
      depositsHistory: depositsHistory.length > 0 ? depositsHistory : undefined,
      updatedAt: Date.now(),
    };
    setForm(updated);
  };

  const liveSavingsInterest = useMemo(() => {
    if (!isSavingsEnvelope) return null;
    const hasDCA = Boolean((form.monthlyDCA && form.monthlyDCA > 0) || (form.annualBudget && form.annualBudget > 0) || (isMultiTierDCA && dcaHistory.length > 0));
    const tempPos: Position = {
      ...form,
      quantity: 1,
      avgPrice: form.avgPrice || 0,
      currentPrice: form.avgPrice || 0,
      monthlyDCA: form.monthlyDCA,
      dcaStartDate: hasDCA ? dcaStartDate : undefined,
      dcaHistory: isMultiTierDCA && dcaHistory.length > 0 ? dcaHistory : undefined,
      initialDepositDate: initialDepositDate,
      depositsHistory: depositsHistory,
    };
    return computeSavingsPositionInterest(tempPos);
  }, [isSavingsEnvelope, form, dcaStartDate, initialDepositDate, depositsHistory, isMultiTierDCA, dcaHistory]);

  return {
    dcaStartDate,
    setDcaStartDate,
    initialDepositDate,
    setInitialDepositDate,
    depositsHistory,
    setDepositsHistory,
    dcaHistory,
    setDcaHistory,
    isMultiTierDCA,
    setIsMultiTierDCA,
    handleAddTranche,
    simMode,
    setSimMode,
    oneShotAmount,
    setOneShotAmount,
    oneShotDate,
    setOneShotDate,
    isCalculatingDCA,
    dcaResult,
    isFutureDca,
    showDCAHistory,
    setShowDCAHistory,
    handleRunDCASimulation,
    handleApplyDCAResult,
    liveSavingsInterest,
  };
}

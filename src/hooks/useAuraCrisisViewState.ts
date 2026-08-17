'use client';

import { useState } from 'react';
import {
  computeCrisisRunwayMetrics,
  simulateLifeAccident,
  compareFinancingOptions,
} from '@/engines/crisisRunwayEngine';

export interface UseAuraCrisisViewStateParams {
  emergencySavings: number;
  vitalExpenses: number;
  netIncome: number;
  onApplyBudgetAdjustment?: (monthlyDelta: number, reason: string) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export function useAuraCrisisViewState({
  emergencySavings = 1600,
  vitalExpenses = 1150,
  netIncome = 2713.74,
  onApplyBudgetAdjustment,
  onShowToast,
}: UseAuraCrisisViewStateParams) {
  const [activeSubTab, setActiveSubTab] = useState<0 | 1>(0);

  // Tab 0 : Accident de la vie
  const [emergencyExpense, setEmergencyExpense] = useState<number>(3000);
  const [cashPayment, setCashPayment] = useState<number>(1000);
  const [creditMonths, setCreditMonths] = useState<number>(12);

  // Tab 1 : Financement CLIC
  const [clicTotalCost, setClicTotalCost] = useState<number>(2900);
  const [clicInitialCash, setClicInitialCash] = useState<number>(500);
  const [clicTaeg, setClicTaeg] = useState<number>(5.9);
  const [clicDurationMonths, setClicDurationMonths] = useState<number>(12);
  const [selectedFundingOption, setSelectedFundingOption] = useState<1 | 2>(1);

  const crisisMetrics = computeCrisisRunwayMetrics({
    emergencySavings,
    vitalExpenses,
    targetMonths: 6,
  });

  const accidentSim = simulateLifeAccident({
    currentEmergencySavings: emergencySavings,
    vitalMonthlyExpenses: vitalExpenses,
    emergencyExpense,
    cashPayment,
    creditMonths,
  });

  const financingSim = compareFinancingOptions({
    totalCost: clicTotalCost,
    cashUpfront: clicInitialCash,
    durationMonths: clicDurationMonths,
    taegPercent: clicTaeg,
    monthlyIncome: netIncome,
    currentSavings: emergencySavings,
  });

  const handleApplyMonthlyAdjustment = async () => {
    const monthlyPayment =
      selectedFundingOption === 1
        ? financingSim.noFeeOption.monthlyPayment
        : financingSim.personalCreditOption.monthlyPayment;

    if (onApplyBudgetAdjustment) {
      await onApplyBudgetAdjustment(monthlyPayment, `Financement CLIC (${clicDurationMonths} mois)`);
    } else {
      onShowToast(`⚡ Mensualité de ${monthlyPayment} €/m appliquée au plan de trésorerie !`, 'success');
    }
  };

  return {
    activeSubTab,
    setActiveSubTab,
    emergencyExpense,
    setEmergencyExpense,
    cashPayment,
    setCashPayment,
    creditMonths,
    setCreditMonths,
    clicTotalCost,
    setClicTotalCost,
    clicInitialCash,
    setClicInitialCash,
    clicTaeg,
    setClicTaeg,
    clicDurationMonths,
    setClicDurationMonths,
    selectedFundingOption,
    setSelectedFundingOption,
    crisisMetrics,
    accidentSim,
    financingSim,
    handleApplyMonthlyAdjustment,
  };
}

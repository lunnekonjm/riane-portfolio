'use client';

import { useState } from 'react';
import {
  simulateLifeAccident,
  compareFinancingOptions,
} from '@/engines/crisisRunwayEngine';

export interface UseCrisisModalStateParams {
  currentEmergencySavings: number;
  vitalMonthlyExpenses: number;
  monthlyNetIncome: number;
}

export function useCrisisModalState({
  currentEmergencySavings,
  vitalMonthlyExpenses,
  monthlyNetIncome,
}: UseCrisisModalStateParams) {
  const [activeTab, setActiveTab] = useState<'ACCIDENT' | 'CLIC'>('ACCIDENT');

  // Tab 0 : Accident de la vie
  const [emergencyExpense, setEmergencyExpense] = useState<number>(3000);
  const [cashPayment, setCashPayment] = useState<number>(1000);
  const [creditDurationMonths, setCreditDurationMonths] = useState<number>(12);

  // Tab 1 : Financement CLIC
  const [clicTotalCost, setClicTotalCost] = useState<number>(2900);
  const [clicInitialCash, setClicInitialCash] = useState<number>(500);
  const [clicDurationMonths, setClicDurationMonths] = useState<number>(12);
  const [clicTaeg, setClicTaeg] = useState<number>(5.9);
  const [selectedFundingOption, setSelectedFundingOption] = useState<0 | 1 | 2>(1);

  const accidentSim = simulateLifeAccident({
    currentEmergencySavings,
    vitalMonthlyExpenses,
    emergencyExpense,
    cashPayment,
    creditMonths: creditDurationMonths,
  });

  const financingSim = compareFinancingOptions({
    totalCost: clicTotalCost,
    cashUpfront: clicInitialCash,
    durationMonths: clicDurationMonths,
    taegPercent: clicTaeg,
    monthlyIncome: monthlyNetIncome,
    currentSavings: currentEmergencySavings,
  });

  return {
    activeTab,
    setActiveTab,
    emergencyExpense,
    setEmergencyExpense,
    cashPayment,
    setCashPayment,
    creditDurationMonths,
    setCreditDurationMonths,
    clicTotalCost,
    setClicTotalCost,
    clicInitialCash,
    setClicInitialCash,
    clicDurationMonths,
    setClicDurationMonths,
    clicTaeg,
    setClicTaeg,
    selectedFundingOption,
    setSelectedFundingOption,
    accidentSim,
    financingSim,
  };
}

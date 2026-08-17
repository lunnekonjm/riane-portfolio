'use client';

import { useMemo } from 'react';
import type { Position } from '@/types/portfolio';

export interface DashboardCalculationsInput {
  dcaGlobalStartDate: string;
  adjustInflation: boolean;
  inflationRate: number;
  totalValue: number;
  totalCost: number;
  bourseVal: number;
  bourseCostVal: number;
  cryptoVal: number;
  cryptoCostVal: number;
  savingsVal: number;
  savingsCostVal: number;
  savingsAnnualInt: number;
  positions: Position[];
}

export function useDashboardCalculations(input: DashboardCalculationsInput) {
  const {
    dcaGlobalStartDate,
    adjustInflation,
    inflationRate,
    totalValue,
    totalCost,
    bourseVal,
    bourseCostVal,
    cryptoVal,
    cryptoCostVal,
    savingsVal,
    savingsCostVal,
    savingsAnnualInt,
    positions,
  } = input;

  const startYear = parseInt(dcaGlobalStartDate.slice(0, 4)) || 2024;
  const currentYear = new Date().getFullYear();
  const yearsElapsed = Math.max(0, currentYear - startYear + new Date().getMonth() / 12);
  const cumulativeInflationFactor = adjustInflation ? Math.pow(1 + inflationRate, yearsElapsed) : 1.0;

  const displayTotalValue = totalValue / cumulativeInflationFactor;
  const displayTotalCost = totalCost / cumulativeInflationFactor;
  const displayGainLoss = displayTotalValue - displayTotalCost;
  const displayGainLossPercent = displayTotalCost > 0 ? (displayGainLoss / displayTotalCost) * 100 : 0;

  const activePositions = useMemo(() => positions.filter((p) => p.quantity > 0), [positions]);

  const boursePos = useMemo(
    () =>
      activePositions.filter(
        (p) =>
          !['LIVRET', 'ASSURANCE_VIE', 'PER', 'PEE', 'IMMOBILIER', 'CRYPTO'].includes(p.envelope) &&
          p.assetType !== 'CRYPTO'
      ),
    [activePositions]
  );

  const cryptoPos = useMemo(
    () => activePositions.filter((p) => p.envelope === 'CRYPTO' || p.assetType === 'CRYPTO'),
    [activePositions]
  );

  const savingsPos = useMemo(
    () =>
      activePositions.filter((p) =>
        ['LIVRET', 'ASSURANCE_VIE', 'PER', 'PEE', 'IMMOBILIER'].includes(p.envelope)
      ),
    [activePositions]
  );

  const displayBourseVal = bourseVal / cumulativeInflationFactor;
  const displayBourseCostVal = bourseCostVal / cumulativeInflationFactor;
  const displayBourseGain = displayBourseVal - displayBourseCostVal;
  const displayBourseGainPct = displayBourseCostVal > 0 ? (displayBourseGain / displayBourseCostVal) * 100 : 0;

  const displayCryptoVal = cryptoVal / cumulativeInflationFactor;
  const displayCryptoCostVal = cryptoCostVal / cumulativeInflationFactor;
  const displayCryptoGain = displayCryptoVal - displayCryptoCostVal;
  const displayCryptoGainPct = displayCryptoCostVal > 0 ? (displayCryptoGain / displayCryptoCostVal) * 100 : 0;

  const displaySavingsVal = savingsVal / cumulativeInflationFactor;
  const displaySavingsCostVal = savingsCostVal / cumulativeInflationFactor;
  const displaySavingsGain = displaySavingsVal - displaySavingsCostVal;
  const displaySavingsAnnualInt = savingsAnnualInt / cumulativeInflationFactor;

  return {
    yearsElapsed,
    cumulativeInflationFactor,
    displayTotalValue,
    displayTotalCost,
    displayGainLoss,
    displayGainLossPercent,
    boursePos,
    cryptoPos,
    savingsPos,
    displayBourseVal,
    displayBourseCostVal,
    displayBourseGain,
    displayBourseGainPct,
    displayCryptoVal,
    displayCryptoCostVal,
    displayCryptoGain,
    displayCryptoGainPct,
    displaySavingsVal,
    displaySavingsCostVal,
    displaySavingsGain,
    displaySavingsAnnualInt,
  };
}

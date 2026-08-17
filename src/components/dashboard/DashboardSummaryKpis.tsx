'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';
import { DashboardTotalValueKpiCard } from './kpis/DashboardTotalValueKpiCard';
import { DashboardTotalCostKpiCard } from './kpis/DashboardTotalCostKpiCard';
import { DashboardGainLossKpiCard } from './kpis/DashboardGainLossKpiCard';
import { DashboardDcaKpiCard } from './kpis/DashboardDcaKpiCard';

interface DashboardSummaryKpisProps {
  adjustInflation: boolean;
  cumulativeInflationFactor: number;
  displayTotalValue: number;
  displayTotalCost: number;
  displayGainLoss: number;
  displayGainLossPercent: number;
  displayBourseVal: number;
  displayCryptoVal: number;
  displaySavingsVal: number;
  displayBourseCostVal: number;
  displayCryptoCostVal: number;
  displaySavingsCostVal: number;
  displayBourseGain: number;
  displayCryptoGain: number;
  displaySavingsGain: number;
  positions: Position[];
  filledPositions: Position[];
  showTotalValueDropdown: boolean;
  setShowTotalValueDropdown: (v: boolean) => void;
  showTotalCostDropdown: boolean;
  setShowTotalCostDropdown: (v: boolean) => void;
  showGainLossDropdown: boolean;
  setShowGainLossDropdown: (v: boolean) => void;
  showDcaFrequencyDropdown: boolean;
  setShowDcaFrequencyDropdown: (v: boolean) => void;
  openGlossary: (term: string) => void;
  setShowNetDetailsModal: (v: boolean) => void;
  peaSeniority: 'under5' | 'over5';
  netLiquidationDetails: any;
  setShowConfigEditor: (v: boolean) => void;
  dcaBreakdown: any;
}

export function DashboardSummaryKpis({
  adjustInflation,
  cumulativeInflationFactor,
  displayTotalValue,
  displayTotalCost,
  displayGainLoss,
  displayGainLossPercent,
  displayBourseVal,
  displayCryptoVal,
  displaySavingsVal,
  displayBourseCostVal,
  displayCryptoCostVal,
  displaySavingsCostVal,
  displayBourseGain,
  displayCryptoGain,
  displaySavingsGain,
  positions,
  filledPositions,
  showTotalValueDropdown,
  setShowTotalValueDropdown,
  showTotalCostDropdown,
  setShowTotalCostDropdown,
  showGainLossDropdown,
  setShowGainLossDropdown,
  showDcaFrequencyDropdown,
  setShowDcaFrequencyDropdown,
  openGlossary,
  setShowNetDetailsModal,
  peaSeniority,
  netLiquidationDetails,
  setShowConfigEditor,
  dcaBreakdown,
}: DashboardSummaryKpisProps) {
  return (
    <div className="grid-4">
      {/* 1. VALEUR TOTALE */}
      <DashboardTotalValueKpiCard
        adjustInflation={adjustInflation}
        displayTotalValue={displayTotalValue}
        displayBourseVal={displayBourseVal}
        displayCryptoVal={displayCryptoVal}
        displaySavingsVal={displaySavingsVal}
        positions={positions}
        filledPositions={filledPositions}
        showTotalValueDropdown={showTotalValueDropdown}
        setShowTotalValueDropdown={setShowTotalValueDropdown}
      />

      {/* 2. COÛT TOTAL (PRU) */}
      <DashboardTotalCostKpiCard
        adjustInflation={adjustInflation}
        displayTotalCost={displayTotalCost}
        displayBourseCostVal={displayBourseCostVal}
        displayCryptoCostVal={displayCryptoCostVal}
        displaySavingsCostVal={displaySavingsCostVal}
        showTotalCostDropdown={showTotalCostDropdown}
        setShowTotalCostDropdown={setShowTotalCostDropdown}
        openGlossary={openGlossary}
      />

      {/* 3. PLUS / MOINS-VALUE */}
      <DashboardGainLossKpiCard
        adjustInflation={adjustInflation}
        cumulativeInflationFactor={cumulativeInflationFactor}
        displayTotalCost={displayTotalCost}
        displayGainLoss={displayGainLoss}
        displayGainLossPercent={displayGainLossPercent}
        displayBourseGain={displayBourseGain}
        displayCryptoGain={displayCryptoGain}
        displaySavingsGain={displaySavingsGain}
        showGainLossDropdown={showGainLossDropdown}
        setShowGainLossDropdown={setShowGainLossDropdown}
        setShowNetDetailsModal={setShowNetDetailsModal}
        peaSeniority={peaSeniority}
        netLiquidationDetails={netLiquidationDetails}
      />

      {/* 4. DCA & ÉPARGNE */}
      <DashboardDcaKpiCard
        cumulativeInflationFactor={cumulativeInflationFactor}
        dcaBreakdown={dcaBreakdown}
        showDcaFrequencyDropdown={showDcaFrequencyDropdown}
        setShowDcaFrequencyDropdown={setShowDcaFrequencyDropdown}
        openGlossary={openGlossary}
        setShowConfigEditor={setShowConfigEditor}
      />
    </div>
  );
}

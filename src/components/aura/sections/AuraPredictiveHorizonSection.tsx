'use client';

import React from 'react';
import type { TemporaryExpenseItem } from '@/engines/bankingAnalyzerEngine';
import { AuraHorizonMonthSelectorCard } from './AuraHorizonMonthSelectorCard';
import { AuraTheoreticalBudgetCard } from './AuraTheoreticalBudgetCard';
import { AuraRealBankBalanceCard } from './AuraRealBankBalanceCard';

interface AuraPredictiveHorizonSectionProps {
  netSalary: number;
  totalFixed: number;
  totalSavings: number;
  totalDaily: number;
  resteAVivre: number;
  accountBalance: number;
  bufferMultiplier: number;
  seuilSecurite: number;
  selectedForecastOffset: number;
  setSelectedForecastOffset: (offset: number) => void;
  temporaryExpenses: TemporaryExpenseItem[];
  getDateForOffset: (offset: number) => Date;
  getPeriodForOffset: (offset: number) => string;
  monthsShortFr: string[];
  selectedMonthLong: string;
  selectedDate: Date;
  onOpenForecastMatrix: () => void;
  onOpenEditBufferMult: () => void;
  onOpenArbitrage: () => void;
  onOpenEditBalance: () => void;
  onSyncBank?: () => Promise<any> | any;
  onShowToast?: (msg: string, type: 'success' | 'error') => void;
}

export function AuraPredictiveHorizonSection({
  netSalary,
  totalFixed,
  totalSavings,
  totalDaily,
  resteAVivre,
  accountBalance,
  bufferMultiplier,
  seuilSecurite,
  selectedForecastOffset,
  setSelectedForecastOffset,
  temporaryExpenses,
  getDateForOffset,
  getPeriodForOffset,
  monthsShortFr,
  selectedMonthLong,
  selectedDate,
  onOpenForecastMatrix,
  onOpenEditBufferMult,
  onOpenArbitrage,
  onOpenEditBalance,
  onSyncBank,
  onShowToast,
}: AuraPredictiveHorizonSectionProps) {
  return (
    <>
      {/* 📈 HORIZON PRÉVISIONNEL & SIMULATION */}
      <AuraHorizonMonthSelectorCard
        selectedForecastOffset={selectedForecastOffset}
        setSelectedForecastOffset={setSelectedForecastOffset}
        temporaryExpenses={temporaryExpenses}
        getDateForOffset={getDateForOffset}
        getPeriodForOffset={getPeriodForOffset}
        monthsShortFr={monthsShortFr}
        onOpenForecastMatrix={onOpenForecastMatrix}
      />

      {/* ⚖️ DUAL HERO CARDS (RESTE À VIVRE THÉORIQUE & SOLDE BANCAIRE RÉEL) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <AuraTheoreticalBudgetCard
          selectedForecastOffset={selectedForecastOffset}
          selectedMonthLong={selectedMonthLong}
          selectedDate={selectedDate}
          resteAVivre={resteAVivre}
          netSalary={netSalary}
          totalFixed={totalFixed}
          totalSavings={totalSavings}
          totalDaily={totalDaily}
        />

        <AuraRealBankBalanceCard
          accountBalance={accountBalance}
          bufferMultiplier={bufferMultiplier}
          seuilSecurite={seuilSecurite}
          onOpenEditBufferMult={onOpenEditBufferMult}
          onOpenArbitrage={onOpenArbitrage}
          onOpenEditBalance={onOpenEditBalance}
          onSyncBank={onSyncBank}
          onShowToast={onShowToast}
        />
      </div>
    </>
  );
}

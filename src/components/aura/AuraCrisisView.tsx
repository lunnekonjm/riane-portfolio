'use client';

import React from 'react';
import { LiquidTankWidget } from '@/components/LiquidTankWidget';
import { useAuraCrisisViewState } from '@/hooks/useAuraCrisisViewState';
import { AuraCrisisAccidentCard } from './crisis/AuraCrisisAccidentCard';
import { AuraCrisisClicCard } from './crisis/AuraCrisisClicCard';

interface AuraCrisisViewProps {
  emergencySavings: number;
  vitalExpenses: number;
  netIncome: number;
  onApplyBudgetAdjustment?: (monthlyDelta: number, reason: string) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AuraCrisisView: React.FC<AuraCrisisViewProps> = ({
  emergencySavings = 1600,
  vitalExpenses = 1150,
  netIncome = 2713.74,
  onApplyBudgetAdjustment,
  onShowToast,
}) => {
  const {
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
  } = useAuraCrisisViewState({
    emergencySavings,
    vitalExpenses,
    netIncome,
    onApplyBudgetAdjustment,
    onShowToast,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 🧪 CAPSULE LIQUID TANK RÉSERVOIR D'URGENCE */}
      <LiquidTankWidget
        metrics={crisisMetrics}
        onTargetChange={(m) => onShowToast(`Cible de sécurité ajustée à ${m} mois (${Math.round(m * vitalExpenses)} €)`, 'success')}
      />

      {/* 🧭 NAVIGATION ENTRE LES 2 SIMULATEURS D'AURA PRO */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(10, 14, 25, 0.98) 100%)',
          borderRadius: 14,
          padding: 6,
          display: 'flex',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab(0)}
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: 13,
            fontWeight: activeSubTab === 0 ? 800 : 600,
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            background: activeSubTab === 0 ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
            color: activeSubTab === 0 ? 'var(--accent-rose)' : 'var(--text-secondary)',
            borderBottom: activeSubTab === 0 ? '2px solid var(--accent-rose)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s',
          }}
        >
          <span>⚠️ 1. Accident de la vie / Choc Imprévu</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab(1)}
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: 13,
            fontWeight: activeSubTab === 1 ? 800 : 600,
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            background: activeSubTab === 1 ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeSubTab === 1 ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            borderBottom: activeSubTab === 1 ? '2px solid var(--accent-cyan)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s',
          }}
        >
          <span>💳 2. Financement CLIC &amp; Comparateur 0%</span>
        </button>
      </div>

      {/* --- ONGLET 0 : ACCIDENT DE LA VIE --- */}
      {activeSubTab === 0 && (
        <AuraCrisisAccidentCard
          emergencyExpense={emergencyExpense}
          setEmergencyExpense={setEmergencyExpense}
          cashPayment={cashPayment}
          setCashPayment={setCashPayment}
          creditMonths={creditMonths}
          setCreditMonths={setCreditMonths}
          accidentSim={accidentSim}
        />
      )}

      {/* --- ONGLET 1 : FINANCEMENT CLIC --- */}
      {activeSubTab === 1 && (
        <AuraCrisisClicCard
          clicTotalCost={clicTotalCost}
          setClicTotalCost={setClicTotalCost}
          clicInitialCash={clicInitialCash}
          setClicInitialCash={setClicInitialCash}
          clicTaeg={clicTaeg}
          setClicTaeg={setClicTaeg}
          clicDurationMonths={clicDurationMonths}
          setClicDurationMonths={setClicDurationMonths}
          selectedFundingOption={selectedFundingOption}
          setSelectedFundingOption={setSelectedFundingOption}
          financingSim={financingSim}
          onApplyMonthlyAdjustment={handleApplyMonthlyAdjustment}
        />
      )}
    </div>
  );
};

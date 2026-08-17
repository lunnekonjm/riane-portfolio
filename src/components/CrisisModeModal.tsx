'use client';

import React from 'react';
import { useCrisisModalState } from '@/hooks/useCrisisModalState';
import { CrisisAccidentTab } from './crisis/CrisisAccidentTab';
import { CrisisClicFinancingTab } from './crisis/CrisisClicFinancingTab';

interface CrisisModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmergencySavings: number;
  vitalMonthlyExpenses: number;
  monthlyNetIncome: number;
  onApplyAdjustment?: (monthlyReduction: number, note: string) => void;
}

export const CrisisModeModal: React.FC<CrisisModeModalProps> = ({
  isOpen,
  onClose,
  currentEmergencySavings,
  vitalMonthlyExpenses,
  monthlyNetIncome,
  onApplyAdjustment,
}) => {
  const {
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
  } = useCrisisModalState({
    currentEmergencySavings,
    vitalMonthlyExpenses,
    monthlyNetIncome,
  });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 760,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: 16,
          border: '1px solid rgba(244, 63, 94, 0.4)',
          background: 'var(--bg-primary, #0a0e17)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🚨</span>
            <div>
              <h3 style={{ fontSize: 17, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
                Simulateur de Crise &amp; Financement CLIC (Aura Pro)
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                Stress-testez vos liquidités face aux aléas de la vie ou optimisez un financement sans fragiliser votre DCA.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: 18, cursor: 'pointer', padding: 6 }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('ACCIDENT')}
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: activeTab === 'ACCIDENT' ? 800 : 600,
              color: activeTab === 'ACCIDENT' ? 'var(--accent-rose, #f43f5e)' : 'var(--text-secondary)',
              background: activeTab === 'ACCIDENT' ? 'rgba(244, 63, 94, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'ACCIDENT' ? '2px solid var(--accent-rose, #f43f5e)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <span>⚠️ Accident de la vie / Choc Imprévu</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CLIC')}
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: activeTab === 'CLIC' ? 800 : 600,
              color: activeTab === 'CLIC' ? 'var(--accent-cyan, #06b6d4)' : 'var(--text-secondary)',
              background: activeTab === 'CLIC' ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'CLIC' ? '2px solid var(--accent-cyan, #06b6d4)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <span>💳 Financement CLIC &amp; Crédit</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {activeTab === 'ACCIDENT' ? (
            <CrisisAccidentTab
              emergencyExpense={emergencyExpense}
              setEmergencyExpense={setEmergencyExpense}
              cashPayment={cashPayment}
              setCashPayment={setCashPayment}
              creditDurationMonths={creditDurationMonths}
              setCreditDurationMonths={setCreditDurationMonths}
              accidentSim={accidentSim}
            />
          ) : (
            <CrisisClicFinancingTab
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
              onApplyAdjustment={onApplyAdjustment}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { LiquidTankWidget } from '@/components/LiquidTankWidget';
import {
  computeCrisisRunwayMetrics,
  simulateLifeAccident,
  compareFinancingOptions,
} from '@/engines/crisisRunwayEngine';

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
  const [activeSubTab, setActiveSubTab] = useState<0 | 1>(0); // 0 = Accident de la vie, 1 = Financement CLIC

  // Tab 0 : Accident de la vie
  const [emergencyExpense, setEmergencyExpense] = useState<number>(3000);
  const [cashPayment, setCashPayment] = useState<number>(1000);
  const [creditMonths, setCreditMonths] = useState<number>(12);

  // Tab 1 : Financement CLIC
  const [clicTotalCost, setClicTotalCost] = useState<number>(2900);
  const [clicInitialCash, setClicInitialCash] = useState<number>(500);
  const [clicTaeg, setClicTaeg] = useState<number>(5.9);
  const [clicDurationMonths, setClicDurationMonths] = useState<number>(12);
  const [selectedFundingOption, setSelectedFundingOption] = useState<1 | 2>(1); // 1 = 0% sans frais, 2 = Prêt

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card" style={{ padding: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 14 }}>
              1. Paramètres de l'imprévu financier
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Dépense totale d'urgence (€)
                </label>
                <input
                  type="number"
                  className="input"
                  value={emergencyExpense}
                  onChange={(e) => setEmergencyExpense(Math.max(0, Number(e.target.value)))}
                  style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Paiement comptant initial (€)
                </label>
                <input
                  type="number"
                  className="input"
                  value={cashPayment}
                  onChange={(e) => setCashPayment(Math.max(0, Number(e.target.value)))}
                  style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Durée de l'étalement (mois)
                </label>
                <input
                  type="number"
                  className="input"
                  value={creditMonths}
                  onChange={(e) => setCreditMonths(Math.max(1, Number(e.target.value)))}
                  style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                />
              </div>
            </div>
          </div>

          {/* Bilan du stress test */}
          <div
            className="card"
            style={{
              padding: 22,
              border: `1px solid ${accidentSim.isReserveExhausted ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
              background: accidentSim.isReserveExhausted ? 'rgba(244, 63, 94, 0.05)' : 'rgba(16, 185, 129, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ fontSize: 15, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
                2. Bilan de Résilience Post-Choc
              </h4>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 14,
                  background: accidentSim.isReserveExhausted ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: accidentSim.isReserveExhausted ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                }}
              >
                {accidentSim.isReserveExhausted ? '⚠️ Réserve en Rupture' : '🛡️ Matelas Préservé'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Épargne Restante</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {Math.round(accidentSim.postAccidentAvailableSavings).toLocaleString('fr-FR')} €
                </span>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Autonomie (Runway) Restante</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                  {accidentSim.postAccidentRunwayMonths} mois
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Plan d'action d'urgence recommandé :</span>
              {accidentSim.actionPlan.map((step, idx) => (
                <div key={idx} style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>👉</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- ONGLET 1 : FINANCEMENT CLIC --- */}
      {activeSubTab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card" style={{ padding: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 14 }}>
              Dépense &amp; Projet à Financer
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Coût Total (€)</label>
                <input
                  type="number"
                  className="input"
                  value={clicTotalCost}
                  onChange={(e) => setClicTotalCost(Math.max(0, Number(e.target.value)))}
                  style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Apport Comptant Initial (€)</label>
                <input
                  type="number"
                  className="input"
                  value={clicInitialCash}
                  onChange={(e) => setClicInitialCash(Math.max(0, Number(e.target.value)))}
                  style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>TAEG Crédit Amortissable (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={clicTaeg}
                  onChange={(e) => setClicTaeg(Math.max(0, Number(e.target.value)))}
                  style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Durée de remboursement :</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>{clicDurationMonths} mois</strong>
              </div>
              <input
                type="range"
                min={3}
                max={36}
                step={1}
                value={clicDurationMonths}
                onChange={(e) => setClicDurationMonths(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
              />
            </div>
          </div>

          {/* Avis Expert Aura */}
          <div
            className="card"
            style={{
              padding: 16,
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 22 }}>💡</span>
            <div>
              <strong style={{ fontSize: 13, color: 'var(--accent-amber)', display: 'block', marginBottom: 2 }}>
                {financingSim.adviceTitle}
              </strong>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {financingSim.adviceMessage}
              </p>
            </div>
          </div>

          {/* Cartes d'arbitrage 0% vs Crédit */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <div
              onClick={() => setSelectedFundingOption(1)}
              style={{
                padding: 18,
                borderRadius: 12,
                background: selectedFundingOption === 1 ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-secondary)',
                border: selectedFundingOption === 1 ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>Fractionné 0% (Sans Frais)</strong>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)' }}>
                  0 € FRAIS
                </span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {financingSim.noFeeOption.monthlyPayment} € <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>/ mois</span>
              </div>
              <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 6, display: 'block' }}>
                Aucun intérêt sur {clicDurationMonths} mois &bull; Reste à charge : {clicTotalCost - clicInitialCash} €
              </span>
            </div>

            <div
              onClick={() => setSelectedFundingOption(2)}
              style={{
                padding: 18,
                borderRadius: 12,
                background: selectedFundingOption === 2 ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-secondary)',
                border: selectedFundingOption === 2 ? '2px solid #818cf8' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>Prêt Personnel (Crédit)</strong>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 8, background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                  TAEG {clicTaeg}%
                </span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {financingSim.personalCreditOption.monthlyPayment} € <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>/ mois</span>
              </div>
              <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 6, display: 'block' }}>
                Coût total des intérêts : +{financingSim.personalCreditOption.totalInterest} €
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleApplyMonthlyAdjustment}
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              fontWeight: 700,
              padding: '12px 18px',
              fontSize: 13.5,
            }}
          >
            ⚡ Appliquer cette mensualité (-
            {selectedFundingOption === 1
              ? financingSim.noFeeOption.monthlyPayment
              : financingSim.personalCreditOption.monthlyPayment}{' '}
            €/m) au plan de trésorerie
          </button>
        </div>
      )}
    </div>
  );
};

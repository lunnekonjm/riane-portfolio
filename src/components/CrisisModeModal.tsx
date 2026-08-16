'use client';

import React, { useState } from 'react';
import {
  simulateLifeAccident,
  compareFinancingOptions,
} from '../engines/crisisRunwayEngine';

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
  const [selectedFundingOption, setSelectedFundingOption] = useState<0 | 1 | 2>(1); // 1 = Fractionné 0%

  if (!isOpen) return null;

  // Calculs dynamiques
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
            /* Tab 0 : Accident de la vie */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
                  1. Paramètres de l'urgence financière
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Dépense totale d'urgence</label>
                    <input
                      type="number"
                      className="input"
                      value={emergencyExpense}
                      onChange={(e) => setEmergencyExpense(Math.max(0, Number(e.target.value)))}
                      style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Paiement comptant initial</label>
                    <input
                      type="number"
                      className="input"
                      value={cashPayment}
                      onChange={(e) => setCashPayment(Math.max(0, Number(e.target.value)))}
                      style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Durée crédit reste à charge</label>
                    <input
                      type="number"
                      className="input"
                      value={creditDurationMonths}
                      onChange={(e) => setCreditDurationMonths(Math.max(1, Number(e.target.value)))}
                      style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                    />
                  </div>
                </div>
              </div>

              {/* Résultat du stress test */}
              <div
                style={{
                  background: accidentSim.isReserveExhausted ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                  border: `1px solid ${accidentSim.isReserveExhausted ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  borderRadius: 12,
                  padding: 18,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                    2. Bilan de Résilience Post-Choc
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 12,
                      background: accidentSim.isReserveExhausted ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: accidentSim.isReserveExhausted ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                    }}
                  >
                    {accidentSim.isReserveExhausted ? '⚠️ Réserve en Rupture' : '🛡️ Filet Préservé'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Épargne Restante</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {Math.round(accidentSim.postAccidentAvailableSavings).toLocaleString('fr-FR')} €
                    </span>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Autonomie Restante</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                      {accidentSim.postAccidentRunwayMonths} mois
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Plan d'action d'urgence recommandé :</span>
                  {accidentSim.actionPlan.map((step, idx) => (
                    <div key={idx} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>👉</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Tab 1 : Financement CLIC */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
                  Dépense à financer
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Coût total</label>
                    <input
                      type="number"
                      className="input"
                      value={clicTotalCost}
                      onChange={(e) => setClicTotalCost(Math.max(0, Number(e.target.value)))}
                      style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Comptant initial</label>
                    <input
                      type="number"
                      className="input"
                      value={clicInitialCash}
                      onChange={(e) => setClicInitialCash(Math.max(0, Number(e.target.value)))}
                      style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>TAEG Crédit (%)</label>
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

              {/* Conseil intelligent */}
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 10,
                  padding: 14,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: 18 }}>💡</span>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-amber)', display: 'block', marginBottom: 2 }}>
                    {financingSim.adviceTitle}
                  </span>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {financingSim.adviceMessage}
                  </p>
                </div>
              </div>

              {/* Cartes d'arbitrage */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div
                  onClick={() => setSelectedFundingOption(1)}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: selectedFundingOption === 1 ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-secondary)',
                    border: selectedFundingOption === 1 ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>Fractionné 0%</strong>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)' }}>0% INTÉRÊTS</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    {financingSim.noFeeOption.monthlyPayment} € <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>/ mois</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                    0 € de surcoût sur {clicDurationMonths} mois
                  </span>
                </div>

                <div
                  onClick={() => setSelectedFundingOption(2)}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: selectedFundingOption === 2 ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-secondary)',
                    border: selectedFundingOption === 2 ? '2px solid #818cf8' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>Prêt Personnel</strong>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>TAEG {clicTaeg}%</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {financingSim.personalCreditOption.monthlyPayment} € <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>/ mois</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                    Intérêts totaux : +{financingSim.personalCreditOption.totalInterest} €
                  </span>
                </div>
              </div>

              {/* Bouton d'action */}
              {onApplyAdjustment && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const monthly =
                      selectedFundingOption === 1
                        ? financingSim.noFeeOption.monthlyPayment
                        : financingSim.personalCreditOption.monthlyPayment;
                    onApplyAdjustment(monthly, `Échéance financement (${clicDurationMonths} mois)`);
                    onClose();
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                    fontWeight: 700,
                    padding: 12,
                    fontSize: 13,
                  }}
                >
                  ⚡ Appliquer cette mensualité (-
                  {selectedFundingOption === 1
                    ? financingSim.noFeeOption.monthlyPayment
                    : financingSim.personalCreditOption.monthlyPayment}{' '}
                  €/m) au budget mensuel
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

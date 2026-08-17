'use client';

import React from 'react';
import type { FinancingComparisonResult } from '@/engines/crisisRunwayEngine';

interface AuraCrisisClicCardProps {
  clicTotalCost: number;
  setClicTotalCost: (val: number) => void;
  clicInitialCash: number;
  setClicInitialCash: (val: number) => void;
  clicTaeg: number;
  setClicTaeg: (val: number) => void;
  clicDurationMonths: number;
  setClicDurationMonths: (val: number) => void;
  selectedFundingOption: 1 | 2;
  setSelectedFundingOption: (val: 1 | 2) => void;
  financingSim: FinancingComparisonResult;
  onApplyMonthlyAdjustment: () => void;
}

export function AuraCrisisClicCard({
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
  financingSim,
  onApplyMonthlyAdjustment,
}: AuraCrisisClicCardProps) {
  return (
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
        onClick={onApplyMonthlyAdjustment}
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
  );
}

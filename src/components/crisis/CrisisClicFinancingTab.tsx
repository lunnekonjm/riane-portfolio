'use client';

import React from 'react';
import type { FinancingComparisonResult } from '@/engines/crisisRunwayEngine';

interface CrisisClicFinancingTabProps {
  clicTotalCost: number;
  setClicTotalCost: (val: number) => void;
  clicInitialCash: number;
  setClicInitialCash: (val: number) => void;
  clicTaeg: number;
  setClicTaeg: (val: number) => void;
  clicDurationMonths: number;
  setClicDurationMonths: (val: number) => void;
  selectedFundingOption: 0 | 1 | 2;
  setSelectedFundingOption: (val: 0 | 1 | 2) => void;
  financingSim: FinancingComparisonResult;
  onApplyAdjustment?: (monthlyReduction: number, note: string) => void;
  onClose: () => void;
}

export function CrisisClicFinancingTab({
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
  onApplyAdjustment,
  onClose,
}: CrisisClicFinancingTabProps) {
  return (
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
  );
}

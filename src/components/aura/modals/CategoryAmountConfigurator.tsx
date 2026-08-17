'use client';

import React from 'react';

interface CategoryAmountConfiguratorProps {
  amount: number;
  setAmount: (val: number) => void;
  isPercentage: boolean;
  setIsPercentage: (val: boolean) => void;
  netSalary: number;
}

export function CategoryAmountConfigurator({
  amount,
  setAmount,
  isPercentage,
  setIsPercentage,
  netSalary,
}: CategoryAmountConfiguratorProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 11.5 }}>
          TYPE DE VALEUR & MONTANT
        </label>
        <div style={{ display: 'flex', borderRadius: 8, background: 'rgba(10, 14, 23, 0.9)', padding: 2, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button
            type="button"
            onClick={() => setIsPercentage(false)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              background: !isPercentage ? 'var(--accent-cyan)' : 'transparent',
              color: !isPercentage ? '#0a0e17' : '#94a3b8',
              fontWeight: 800,
              fontSize: 11,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            € Fixe
          </button>
          <button
            type="button"
            onClick={() => setIsPercentage(true)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              background: isPercentage ? 'var(--accent-cyan)' : 'transparent',
              color: isPercentage ? '#0a0e17' : '#94a3b8',
              fontWeight: 800,
              fontSize: 11,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            % Ratio
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="number"
          step={isPercentage ? '0.1' : '1'}
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(10, 14, 23, 0.95)',
            border: '1px solid rgba(6, 182, 212, 0.5)',
            color: 'var(--accent-cyan)',
            fontSize: 18,
            fontWeight: 900,
            boxSizing: 'border-box',
          }}
        />
        <span style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', minWidth: 30 }}>
          {isPercentage ? '%' : '€'}
        </span>
      </div>

      {/* Live projection */}
      <div
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          fontSize: 11.5,
          color: 'var(--accent-cyan)',
          fontWeight: 700,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Impact mensuel effectif :</span>
        <strong>
          {isPercentage
            ? `${((netSalary * amount) / 100).toFixed(2)} € / mois`
            : `${amount.toFixed(2)} € / mois (${netSalary > 0 ? ((amount / netSalary) * 100).toFixed(1) : 0}% du salaire)`}
        </strong>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { isExpenseActiveForPeriod, type TemporaryExpenseItem } from '@/engines/bankingAnalyzerEngine';

interface AuraHorizonMonthSelectorCardProps {
  selectedForecastOffset: number;
  setSelectedForecastOffset: (offset: number) => void;
  temporaryExpenses: TemporaryExpenseItem[];
  getDateForOffset: (offset: number) => Date;
  getPeriodForOffset: (offset: number) => string;
  monthsShortFr: string[];
  onOpenForecastMatrix: () => void;
}

export function AuraHorizonMonthSelectorCard({
  selectedForecastOffset,
  setSelectedForecastOffset,
  temporaryExpenses,
  getDateForOffset,
  getPeriodForOffset,
  monthsShortFr,
  onOpenForecastMatrix,
}: AuraHorizonMonthSelectorCardProps) {
  return (
    <div
      className="card"
      style={{
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid var(--border-subtle)',
        padding: 18,
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--accent-cyan)', fontSize: 16 }}>📈</span>
          <strong style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#cbd5e1' }}>
            HORIZON PRÉVISIONNEL &amp; SIMULATION
          </strong>
        </div>
        <button
          type="button"
          onClick={onOpenForecastMatrix}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 8,
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            color: 'var(--accent-cyan)',
            fontSize: 11.5,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          <span>📊</span> Matrice 6 Mois
        </button>
      </div>

      {/* 6 Month Horizon Selector Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
        {[0, 1, 2, 3, 4, 5].map((offset) => {
          const d = getDateForOffset(offset);
          const p = getPeriodForOffset(offset);
          const mShort = monthsShortFr[d.getMonth()];
          const isSelected = selectedForecastOffset === offset;

          const extraTemp = temporaryExpenses
            .filter((e) => isExpenseActiveForPeriod(e, p))
            .reduce((sum, e) => sum + e.monthlyAmount, 0);

          return (
            <button
              key={offset}
              type="button"
              onClick={() => setSelectedForecastOffset(offset)}
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                textAlign: 'left',
                border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'rgba(10, 14, 23, 0.6)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: isSelected ? 'var(--accent-cyan)' : '#f8fafc' }}>
                  {offset === 0 ? `${mShort} (En cours)` : `${mShort} (M+${offset})`}
                </span>
                {offset === 0 && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-emerald)', display: 'inline-block' }} />
                )}
              </div>

              <div style={{ marginTop: 4 }}>
                {extraTemp > 0 ? (
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(244, 63, 94, 0.2)',
                      color: 'var(--accent-rose)',
                      fontSize: 9.5,
                      fontWeight: 800,
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                    }}
                  >
                    +{extraTemp.toFixed(0)} € échéances
                  </span>
                ) : (
                  <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>Socle standard</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

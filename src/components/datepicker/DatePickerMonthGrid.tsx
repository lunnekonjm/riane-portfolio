'use client';

import React from 'react';
import { MONTH_SHORT_FR } from './datePickerConstants';

interface DatePickerMonthGridProps {
  tempMonth: number;
  setTempMonth: (m: number) => void;
}

export function DatePickerMonthGrid({ tempMonth, setTempMonth }: DatePickerMonthGridProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        Mois
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {MONTH_SHORT_FR.map((mName, idx) => {
          const isSelected = idx === tempMonth;
          return (
            <button
              key={mName}
              type="button"
              onClick={() => setTempMonth(idx)}
              style={{
                padding: '8px 4px',
                borderRadius: 8,
                border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                background: isSelected
                  ? 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)'
                  : 'rgba(255, 255, 255, 0.04)',
                color: isSelected ? '#ffffff' : '#cbd5e1',
                fontSize: 12,
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 4px 12px rgba(6, 182, 212, 0.35)' : 'none',
              }}
            >
              {mName}
            </button>
          );
        })}
      </div>
    </div>
  );
}

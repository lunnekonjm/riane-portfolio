'use client';

import React from 'react';

interface DatePickerYearSelectorProps {
  tempYear: number;
  setTempYear: (yr: number) => void;
}

export function DatePickerYearSelector({ tempYear, setTempYear }: DatePickerYearSelectorProps) {
  const quickYears = [tempYear - 2, tempYear - 1, tempYear, tempYear + 1, tempYear + 2];

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setTempYear(tempYear - 1)}
          style={{ padding: '6px 12px', fontSize: 14 }}
          title="Année précédente"
        >
          ◀
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
            {tempYear}
          </span>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setTempYear(tempYear + 1)}
          style={{ padding: '6px 12px', fontSize: 14 }}
          title="Année suivante"
        >
          ▶
        </button>
      </div>

      {/* Quick Year Pills */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
        {quickYears.map((yr) => (
          <button
            key={yr}
            type="button"
            onClick={() => setTempYear(yr)}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              borderRadius: 6,
              border: yr === tempYear ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
              background: yr === tempYear ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: yr === tempYear ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              fontWeight: yr === tempYear ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            {yr}
          </button>
        ))}
      </div>
    </div>
  );
}

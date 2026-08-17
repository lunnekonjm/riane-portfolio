'use client';

import React from 'react';

interface DatePickerDaySelectorProps {
  tempDay: number;
  setTempDay: (d: number) => void;
}

export function DatePickerDaySelector({ tempDay, setTempDay }: DatePickerDaySelectorProps) {
  return (
    <div style={{ marginBottom: 16, background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
          Jour du mois :
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="number"
            min="1"
            max="31"
            value={tempDay}
            onChange={(e) => {
              const d = Math.max(1, Math.min(31, parseInt(e.target.value) || 1));
              setTempDay(d);
            }}
            style={{
              width: 52,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--accent-cyan)',
              borderRadius: 6,
              color: 'var(--accent-cyan)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: 13,
              textAlign: 'center',
              padding: '3px 4px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Day Shortcut Buttons */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {[1, 5, 10, 15, 20, 25, 28, 31].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setTempDay(d)}
            style={{
              padding: '2px 7px',
              fontSize: 10,
              borderRadius: 4,
              border: d === tempDay ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
              background: d === tempDay ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: d === tempDay ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              fontWeight: d === tempDay ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

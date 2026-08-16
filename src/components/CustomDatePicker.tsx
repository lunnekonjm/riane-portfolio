'use client';

import React, { useState, useEffect } from 'react';

interface CustomDatePickerProps {
  value: string; // Format: 'YYYY-MM-DD' or 'YYYY-MM'
  onChange: (newValue: string) => void;
  showDaySelector?: boolean;
  label?: string;
}

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const MONTH_SHORT_FR = [
  'Janv.', 'Fév.', 'Mars', 'Avr.', 'Mai', 'Juin',
  'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'
];

export default function CustomDatePicker({
  value,
  onChange,
  showDaySelector = true,
  label,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse current value 'YYYY-MM-DD' or 'YYYY-MM'
  const parts = (value || '2024-01-05').split('-');
  const currentYear = parseInt(parts[0] || '2024', 10);
  const currentMonth = Math.max(0, Math.min(11, parseInt(parts[1] || '01', 10) - 1)); // 0-indexed
  const initialDay = parts[2] ? Math.max(1, Math.min(31, parseInt(parts[2], 10))) : 5;

  const [tempYear, setTempYear] = useState<number>(currentYear);
  const [tempMonth, setTempMonth] = useState<number>(currentMonth);
  const [tempDay, setTempDay] = useState<number>(initialDay);

  // Sync state when opened or when external value changes
  useEffect(() => {
    if (isOpen) {
      setTempYear(currentYear);
      setTempMonth(currentMonth);
      setTempDay(initialDay);
    }
  }, [isOpen, currentYear, currentMonth, initialDay]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleConfirm = () => {
    const mm = String(tempMonth + 1).padStart(2, '0');
    const dd = String(tempDay).padStart(2, '0');
    const yyyy = String(tempYear);
    const finalDate = showDaySelector ? `${yyyy}-${mm}-${dd}` : `${yyyy}-${mm}`;
    onChange(finalDate);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const now = new Date();
    setTempYear(now.getFullYear());
    setTempMonth(now.getMonth());
    setTempDay(now.getDate());
  };

  const handleSelectFirstOfMonth = () => {
    setTempDay(1);
  };

  const formattedDisplayLabel = parts[2]
    ? `${initialDay} ${MONTH_SHORT_FR[currentMonth] || 'Janv.'} ${currentYear}`
    : `${MONTH_SHORT_FR[currentMonth] || 'Janv.'} ${currentYear}`;

  const quickYears = [tempYear - 2, tempYear - 1, tempYear, tempYear + 1, tempYear + 2];

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          gap: 6,
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          padding: '6px 10px',
          color: 'var(--accent-cyan)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        title="Cliquer pour ouvrir le sélecteur de date"
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0, whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>📅</span>
          <span style={{ whiteSpace: 'nowrap' }}>{formattedDisplayLabel}</span>
        </span>
        <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 2, flexShrink: 0 }}>
          ▼
        </span>
      </button>

      {/* Centered Modal Dialog Overlay */}
      {isOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn 0.15s ease-out',
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: 420,
              width: '100%',
              background: '#0f172a',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: 16,
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(6, 182, 212, 0.2)',
              padding: 0,
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'rgba(255, 255, 255, 0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>📅</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {label || 'Sélectionner une date'}
                  </h4>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    Naviguez facilement entre années et mois
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsOpen(false)}
                style={{ fontSize: 18, padding: '4px 8px', color: 'var(--text-secondary)' }}
              >
                &times;
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '18px 20px' }}>
              {/* Year Selector */}
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

              {/* Month Grid (4 cols x 3 rows) */}
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

              {/* Day of Month Selector Bar (if enabled) */}
              {showDaySelector && (
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
              )}

              {/* Quick Presets */}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between', marginBottom: 6 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleSelectToday}
                  style={{ fontSize: 11, padding: '4px 8px', color: 'var(--accent-cyan)', fontWeight: 600 }}
                >
                  ⚡ Aujourd&apos;hui
                </button>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleSelectFirstOfMonth}
                  style={{ fontSize: 11, padding: '4px 8px', color: 'var(--text-secondary)' }}
                >
                  🗓️ 1er du mois
                </button>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setTempMonth(0);
                    setTempDay(1);
                  }}
                  style={{ fontSize: 11, padding: '4px 8px', color: 'var(--text-secondary)' }}
                >
                  🎯 Début d&apos;année
                </button>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px',
                borderTop: '1px solid var(--border-subtle)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                {showDaySelector ? `${tempDay} ${MONTH_NAMES_FR[tempMonth]} ${tempYear}` : `${MONTH_NAMES_FR[tempMonth]} ${tempYear}`}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ background: 'linear-gradient(135deg, var(--accent-cyan), #0891b2)', fontWeight: 700 }}
                  onClick={handleConfirm}
                >
                  ✅ Valider la date
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

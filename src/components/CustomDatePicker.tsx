'use client';

import { useState, useRef, useEffect } from 'react';

interface CustomDatePickerProps {
  value: string; // Format: 'YYYY-MM-DD' or 'YYYY-MM'
  onChange: (newValue: string) => void;
  showDaySelector?: boolean;
}

const MONTH_NAMES_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

const MONTH_SHORT_FR = [
  'Janv.', 'Fév.', 'Mars', 'Avr.', 'Mai', 'Juin',
  'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'
];

export default function CustomDatePicker({ value, onChange, showDaySelector = true }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popupAlign, setPopupAlign] = useState<'left' | 'right'>('left');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value 'YYYY-MM-DD' or 'YYYY-MM'
  const parts = (value || '2024-01-05').split('-');
  const currentYear = parseInt(parts[0] || '2024', 10);
  const currentMonth = parseInt(parts[1] || '01', 10) - 1; // 0-indexed
  const initialDay = parts[2] ? parseInt(parts[2], 10) : 5;

  const [viewYear, setViewYear] = useState<number>(currentYear);
  const [selectedDay, setSelectedDay] = useState<number>(initialDay);

  // Sync viewYear & selectedDay when value changes externally
  useEffect(() => {
    setViewYear(currentYear);
    if (parts[2]) {
      setSelectedDay(parseInt(parts[2], 10));
    }
  }, [currentYear, parts[2]]);

  // Smart placement on open
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // If opening to the right (left: 0) would overflow window, align right: 0
      if (rect.left + 290 > window.innerWidth - 10) {
        setPopupAlign('right');
      } else {
        setPopupAlign('left');
      }
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectMonth = (monthIndex: number) => {
    const mm = String(monthIndex + 1).padStart(2, '0');
    const dd = String(selectedDay).padStart(2, '0');
    const yyyy = String(viewYear);
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const formattedLabel = parts[2] 
    ? `${selectedDay} ${MONTH_NAMES_FR[currentMonth] || 'janvier'} ${currentYear}`
    : `${MONTH_NAMES_FR[currentMonth] || 'janvier'} ${currentYear}`;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          gap: 8,
          background: isOpen ? 'var(--accent-cyan-glow)' : 'var(--bg-tertiary)',
          border: `1px solid ${isOpen ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
          borderRadius: 10,
          padding: '7px 12px',
          color: 'var(--accent-cyan)',
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 12px rgba(6, 182, 212, 0.3)' : 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>📅</span>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formattedLabel}</span>
        </span>
        <span style={{ fontSize: 'var(--text-xs)', opacity: 0.8, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', marginLeft: 4 }}>
          ▼
        </span>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: popupAlign === 'left' ? 0 : 'auto',
            right: popupAlign === 'right' ? 0 : 'auto',
            zIndex: 9999,
            width: 280,
            maxWidth: 'calc(100vw - 24px)',
            padding: 14,
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: 14,
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85), 0 0 20px rgba(6, 182, 212, 0.25)',
            backdropFilter: 'blur(24px)',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Header Year Navigator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setViewYear(viewYear - 1)}
              style={{ fontSize: 14, padding: '4px 8px', color: 'var(--text-secondary)' }}
              title="Année précédente"
            >
              ◀
            </button>

            <span style={{ fontWeight: 700, fontSize: 16, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
              {viewYear}
            </span>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setViewYear(viewYear + 1)}
              style={{ fontSize: 14, padding: '4px 8px', color: 'var(--text-secondary)' }}
              title="Année suivante"
            >
              ▶
            </button>
          </div>

          {/* Day of Month Selector Bar */}
          {showDaySelector && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '6px 10px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Jour de versement :</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={selectedDay}
                  onChange={(e) => {
                    const day = Math.min(31, Math.max(1, parseInt(e.target.value) || 1));
                    setSelectedDay(day);
                    const mm = String(currentMonth + 1).padStart(2, '0');
                    const dd = String(day).padStart(2, '0');
                    const yyyy = String(viewYear);
                    onChange(`${yyyy}-${mm}-${dd}`);
                  }}
                  style={{
                    width: 48,
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--accent-cyan)',
                    borderRadius: 6,
                    color: 'var(--accent-cyan)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: 13,
                    textAlign: 'center',
                    padding: '2px 4px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* Month Grid (3 cols x 4 rows) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
            {MONTH_SHORT_FR.map((mName, idx) => {
              const isSelected = viewYear === currentYear && idx === currentMonth;
              return (
                <button
                  key={mName}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 8,
                    border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                    background: isSelected
                      ? 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)'
                      : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? '#ffffff' : '#cbd5e1',
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center',
                    boxShadow: isSelected ? '0 4px 12px rgba(6, 182, 212, 0.4)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = '#cbd5e1';
                    }
                  }}
                >
                  {mName}
                </button>
              );
            })}
          </div>

          {/* Shortcuts */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 10, display: 'flex', gap: 6, justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const now = new Date();
                const yyyy = now.getFullYear();
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const dd = String(selectedDay).padStart(2, '0');
                onChange(`${yyyy}-${mm}-${dd}`);
                setIsOpen(false);
              }}
              style={{ fontSize: 'var(--text-xs)', padding: '4px 6px', color: 'var(--accent-cyan)', fontWeight: 600 }}
            >
              Aujourd&apos;hui
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                onChange(`2024-01-${String(selectedDay).padStart(2, '0')}`);
                setIsOpen(false);
              }}
              style={{ fontSize: 'var(--text-xs)', padding: '4px 6px', color: 'var(--text-secondary)' }}
            >
              Janv 2024
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                onChange(`2003-01-${String(selectedDay).padStart(2, '0')}`);
                setIsOpen(false);
              }}
              style={{ fontSize: 'var(--text-xs)', padding: '4px 6px', color: 'var(--text-secondary)' }}
            >
              2003 (Origine)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

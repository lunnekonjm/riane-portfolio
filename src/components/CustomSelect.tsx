'use client';

import React, { useState, useRef, useEffect } from 'react';

interface CustomSelectOption<T extends string> {
  value: T;
  label: string;
  icon?: string;
}

interface CustomSelectProps<T extends string> {
  value: T;
  options: CustomSelectOption<T>[];
  onChange: (val: T) => void;
  id?: string;
}

export default function CustomSelect<T extends string>({
  value,
  options,
  onChange,
  id,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }} id={id}>
      <button
        type="button"
        className="input"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 13,
          padding: '9px 12px',
          cursor: 'pointer',
          textAlign: 'left',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden', flex: 1 }}>
          {selectedOption?.icon && <span style={{ fontSize: 13, flexShrink: 0 }}>{selectedOption.icon}</span>}
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12 }}>
            {selectedOption?.label || value}
          </span>
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginLeft: 8 }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 350,
            marginTop: 4,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
            maxHeight: 240,
            overflowY: 'auto',
            padding: 4,
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: opt.value === value ? 'var(--bg-tertiary)' : 'transparent',
                color: opt.value === value ? 'var(--accent-cyan)' : 'var(--text-primary)',
                fontWeight: opt.value === value ? 700 : 400,
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (opt.value !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                if (opt.value !== value) e.currentTarget.style.background = 'transparent';
              }}
            >
              {opt.icon && <span>{opt.icon}</span>}
              <span>{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

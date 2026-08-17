'use client';

import React from 'react';

interface CategoryPillarSelectorProps {
  pillar: 'SAVINGS' | 'FIXED' | 'DAILY';
  setPillar: (p: 'SAVINGS' | 'FIXED' | 'DAILY') => void;
}

export function CategoryPillarSelector({ pillar, setPillar }: CategoryPillarSelectorProps) {
  const pillars = [
    { key: 'FIXED', label: 'Charges Fixes', sub: 'Incompressibles', color: '#f43f5e' },
    { key: 'SAVINGS', label: 'Épargne & Inv.', sub: 'PEA, Livret A', color: '#06b6d4' },
    { key: 'DAILY', label: 'Quotidien', sub: 'Revolut / Loisirs', color: '#f59e0b' },
  ];

  return (
    <div>
      <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, fontSize: 11.5, marginBottom: 6 }}>
        PILIER BUDGÉTAIRE
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {pillars.map((p) => {
          const isPillarActive = pillar === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setPillar(p.key as any)}
              style={{
                padding: '8px 10px',
                borderRadius: 10,
                background: isPillarActive ? `${p.color}22` : 'rgba(10, 14, 23, 0.8)',
                border: isPillarActive ? `1.5px solid ${p.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                color: isPillarActive ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 800 }}>{p.label}</div>
              <div style={{ fontSize: 9.5, opacity: 0.75 }}>{p.sub}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

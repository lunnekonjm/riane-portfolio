'use client';

import React from 'react';

export type FilterCategory = 'all' | 'good_signal' | 'megacap' | 'growth_ai' | 'smallcap_fr' | 'high_upside';

interface ValuationMatrixFilterBarProps {
  filter: FilterCategory;
  setFilter: (filter: FilterCategory) => void;
  search: string;
  setSearch: (search: string) => void;
}

export function ValuationMatrixFilterBar({
  filter,
  setFilter,
  search,
  setSearch,
}: ValuationMatrixFilterBarProps) {
  const tabs: Array<{ key: FilterCategory; label: string }> = [
    { key: 'all', label: 'Toutes (20)' },
    { key: 'good_signal', label: '🟢 Favorables' },
    { key: 'growth_ai', label: '💡 Croissance IA' },
    { key: 'megacap', label: '🇺🇸 Méga-Caps' },
    { key: 'smallcap_fr', label: '🇫🇷 Small-Caps FR' },
    { key: 'high_upside', label: '📈 Upside >+20%' },
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, margin: '16px 0' }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              border: filter === tab.key ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
              background: filter === tab.key ? '#10b981' : 'rgba(15, 23, 42, 0.6)',
              color: filter === tab.key ? '#022214' : '#94a3b8',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ minWidth: 220, position: 'relative' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher ticker / nom..."
          className="val-input"
          style={{ padding: '6px 10px', fontSize: 11 }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

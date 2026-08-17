'use client';

import React from 'react';

interface BenchmarkFabProps {
  showBenchmark: boolean;
  onOpen: () => void;
}

export function BenchmarkFab({ showBenchmark, onOpen }: BenchmarkFabProps) {
  if (showBenchmark) return null;

  return (
    <button
      onClick={onOpen}
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: '1px solid var(--border-medium)',
        background: 'var(--bg-secondary)',
        color: 'var(--text-secondary)',
        fontSize: 18,
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998,
        opacity: 0.6,
        transition: 'opacity 0.2s, transform 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.transform = 'scale(1)'; }}
      title="Ouvrir le portefeuille étalon Boursobank"
      id="benchmark-fab"
      type="button"
    >
      🧪
    </button>
  );
}

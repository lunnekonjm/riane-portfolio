'use client';

import React from 'react';
import type { AuraActiveTab } from '@/hooks/useRevenueBudgetState';

interface AuraTabsNavBarProps {
  activeTab: AuraActiveTab;
  onSelectTab: (tab: AuraActiveTab) => void;
}

export function AuraTabsNavBar({
  activeTab,
  onSelectTab,
}: AuraTabsNavBarProps) {
  const tabs = [
    {
      id: 'DASHBOARD' as const,
      label: '📊 Dashboard & Donut',
      color: 'var(--accent-cyan)',
      bg: 'rgba(6, 182, 212, 0.18)',
      borderColor: 'var(--accent-cyan)',
      minWidth: 140,
    },
    {
      id: 'RULES' as const,
      label: '⚖️ Règles & M+5',
      color: 'var(--accent-rose)',
      bg: 'rgba(244, 63, 94, 0.18)',
      borderColor: 'var(--accent-rose)',
      minWidth: 150,
    },
    {
      id: 'SALARY_AUDIT' as const,
      label: '💼 Fiches & Caviardage',
      color: '#818cf8',
      bg: 'rgba(129, 140, 248, 0.18)',
      borderColor: '#818cf8',
      minWidth: 150,
    },
    {
      id: 'SAVINGS_FUNNEL' as const,
      label: "🎯 Entonnoir d'Épargne",
      color: 'var(--accent-emerald)',
      bg: 'rgba(16, 185, 129, 0.18)',
      borderColor: 'var(--accent-emerald)',
      minWidth: 150,
    },
    {
      id: 'CRISIS' as const,
      label: '🛡️ Crise & CLIC',
      color: 'var(--accent-amber)',
      bg: 'rgba(245, 158, 11, 0.18)',
      borderColor: 'var(--accent-amber)',
      minWidth: 150,
    },
    {
      id: 'BANK_RECONCILIATION' as const,
      label: '🏦 Banque BoursoBank',
      color: '#818cf8',
      bg: 'rgba(99, 102, 241, 0.18)',
      borderColor: '#6366f1',
      minWidth: 150,
    },
  ];

  return (
    <div
      className="card"
      style={{
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.98) 0%, rgba(10, 14, 25, 0.98) 100%)',
        borderRadius: 16,
        padding: 8,
        border: '1px solid rgba(6, 182, 212, 0.3)',
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
      }}
    >
      {tabs.map((t) => {
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelectTab(t.id)}
            style={{
              flex: 1,
              minWidth: t.minWidth,
              padding: '10px 14px',
              fontSize: 12.5,
              fontWeight: isActive ? 800 : 600,
              borderRadius: 10,
              border: isActive ? `1px solid ${t.borderColor}` : '1px solid transparent',
              background: isActive ? t.bg : 'transparent',
              color: isActive ? t.color : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

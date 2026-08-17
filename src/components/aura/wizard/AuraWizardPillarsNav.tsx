'use client';

import React from 'react';

interface AuraWizardPillarsNavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  initialCandidatesCount: number;
  detectedTempObligationsCount: number;
  unclassifiedTxsCount: number;
}

export function AuraWizardPillarsNav({
  activeTab,
  setActiveTab,
  initialCandidatesCount,
  detectedTempObligationsCount,
  unclassifiedTxsCount,
}: AuraWizardPillarsNavProps) {
  const tabs = [
    { key: 'ALL', label: `Tous les flux (${initialCandidatesCount})` },
    { key: 'FIXED', label: 'Charges Fixes & Logement' },
    { key: 'SAVINGS', label: 'Épargne Mensuelle (PEA / Livret A)' },
    { key: 'DAILY', label: 'Quotidien / Revolut' },
    { key: 'TEMPORARY', label: `Échéances Temporaires (${detectedTempObligationsCount})` },
    { key: 'UNCLASSIFIED', label: `Flux non classés (${unclassifiedTxsCount})` },
  ];

  return (
    <div
      style={{
        display: 'flex',
        padding: '8px 22px 0 22px',
        background: 'rgba(15, 23, 42, 0.6)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        gap: 6,
        overflowX: 'auto',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '7px 12px',
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              border: 'none',
              borderBottom: isActive ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              background: isActive ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
              color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              fontWeight: isActive ? 800 : 600,
              fontSize: 11.5,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

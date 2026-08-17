'use client';

import React from 'react';

export type IntegrationTabType = 'overview' | 'ibkr' | 'boursobank' | 'traderepublic';

interface IntegrationsHubNavTabsProps {
  activeTab: IntegrationTabType;
  onSelectTab: (tab: IntegrationTabType) => void;
  isIbkrConnected: boolean;
}

export function IntegrationsHubNavTabs({
  activeTab,
  onSelectTab,
  isIbkrConnected,
}: IntegrationsHubNavTabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 24px',
        background: 'var(--bg-tertiary)',
        gap: 8,
        overflowX: 'auto',
      }}
    >
      <button
        onClick={() => onSelectTab('overview')}
        type="button"
        style={{
          padding: '12px 16px',
          fontSize: 13,
          fontWeight: 600,
          color: activeTab === 'overview' ? 'var(--accent-cyan)' : 'var(--text-muted)',
          borderBottom: activeTab === 'overview' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
          background: 'none',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.2s ease',
        }}
      >
        ✨ Vue Consolidée
      </button>
      <button
        onClick={() => onSelectTab('ibkr')}
        type="button"
        style={{
          padding: '12px 16px',
          fontSize: 13,
          fontWeight: 600,
          color: activeTab === 'ibkr' ? 'var(--accent-cyan)' : 'var(--text-muted)',
          borderBottom: activeTab === 'ibkr' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
          background: 'none',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.2s ease',
        }}
      >
        🏛️ Interactive Brokers (SnapTrade)
        {isIbkrConnected && (
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--accent-emerald)',
              boxShadow: '0 0 6px var(--accent-emerald)',
            }}
          />
        )}
      </button>
      <button
        onClick={() => onSelectTab('boursobank')}
        type="button"
        style={{
          padding: '12px 16px',
          fontSize: 13,
          fontWeight: 600,
          color: activeTab === 'boursobank' ? 'var(--accent-cyan)' : 'var(--text-muted)',
          borderBottom: activeTab === 'boursobank' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
          background: 'none',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.2s ease',
        }}
      >
        🏦 BoursoBank (TrueLayer)
        <span
          style={{
            fontSize: 10,
            padding: '1px 6px',
            borderRadius: 6,
            background: 'rgba(245, 158, 11, 0.15)',
            color: 'var(--accent-amber)',
          }}
        >
          DSP2
        </span>
      </button>
      <button
        onClick={() => onSelectTab('traderepublic')}
        type="button"
        style={{
          padding: '12px 16px',
          fontSize: 13,
          fontWeight: 600,
          color: activeTab === 'traderepublic' ? 'var(--accent-cyan)' : 'var(--text-muted)',
          borderBottom: activeTab === 'traderepublic' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
          background: 'none',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.2s ease',
        }}
      >
        📱 Trade Republic (DCA Auto)
      </button>
    </div>
  );
}

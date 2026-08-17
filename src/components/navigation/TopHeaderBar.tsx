'use client';

import React from 'react';
import type { PageView } from '@/types/navigation';
import type { AnalysisStatus } from '@/types/analysis';

interface TopHeaderBarProps {
  currentView: PageView;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenGlossary: () => void;
  onOpenMonteCarlo: () => void;
  onOpenIntegrations: () => void;
  refreshingPrices: boolean;
  refreshing: boolean;
  onRefreshAll: () => Promise<void>;
  adjustInflation: boolean;
  setAdjustInflation: (val: boolean) => void;
  isRunning: boolean;
  analysisStatus: AnalysisStatus;
  pipelineSteps: Array<{ key: string; icon: string; label: string }>;
}

export function TopHeaderBar({
  currentView,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenGlossary,
  onOpenMonteCarlo,
  onOpenIntegrations,
  refreshingPrices,
  refreshing,
  onRefreshAll,
  adjustInflation,
  setAdjustInflation,
  isRunning,
  analysisStatus,
  pipelineSteps,
}: TopHeaderBarProps) {
  return (
    <header className="page-header">
      <h1 className="page-title">
        {currentView === 'dashboard' && '📊 Tableau de Bord'}
        {currentView === 'revenue' && '💼 Aura Budget Pro & Trésorerie'}
        {currentView === 'envelopes' && '🏛️ Enveloppes & Fiscalité'}
        {currentView === 'analysis' && '🔬 Analyse à la Demande'}
        {currentView === 'valuation' && '📐 Prix ≠ Valeur (20 Valeurs)'}
        {currentView === 'risk' && '⚡ Stress Tests & Risque'}
        {currentView === 'audit' && '📋 Journal d\'Audit'}
        {currentView === 'reports' && '📰 Rapports & Newsletters AI'}
      </h1>

      {/* Header Actions: Notification Bell & Global Inflation Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Notification Bell Button */}
        <button
          className="profile-pill-btn"
          onClick={onOpenNotifications}
          title="Centre de notifications & alertes"
          id="notification-bell-btn"
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: unreadNotificationsCount > 0 ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-secondary)',
            borderRadius: 10,
            border: unreadNotificationsCount > 0 ? '1px solid var(--accent-rose)' : '1px solid var(--border-subtle)',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 15 }}>🔔</span>
          {unreadNotificationsCount > 0 && (
            <span
              style={{
                background: 'var(--accent-rose)',
                color: 'white',
                fontSize: 'var(--text-xs)',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 10,
              }}
            >
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* 📚 Lexique & Explications Financières Button */}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{
            color: 'var(--accent-cyan)',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '6px 12px',
            borderRadius: 10,
            background: 'rgba(56, 189, 248, 0.08)',
          }}
          onClick={onOpenGlossary}
          title="Ouvrir le dictionnaire financier et les explications sans abréviations"
        >
          📚 Lexique &amp; Explications
        </button>

        {/* 🎲 Simulateur Monte Carlo (FIRE) Button */}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{
            color: 'var(--accent-emerald)',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '6px 12px',
            borderRadius: 10,
            background: 'rgba(16, 185, 129, 0.08)',
          }}
          onClick={onOpenMonteCarlo}
          title="Lancer la simulation stochastique Monte Carlo (10 000 scénarios)"
        >
          🎲 Monte Carlo &amp; FIRE
        </button>

        {/* 🔗 Hub Multi-Comptes & Sync API Directe (IBKR / BoursoBank / Trade Republic) */}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          id="open-integrations-hub-btn"
          style={{
            color: 'var(--accent-indigo, #818cf8)',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            border: '1px solid rgba(129, 140, 248, 0.4)',
            padding: '6px 12px',
            borderRadius: 10,
            background: 'rgba(129, 140, 248, 0.1)',
            cursor: 'pointer',
          }}
          onClick={onOpenIntegrations}
          title="Ouvrir le Hub de synchronisation multi-comptes (Interactive Brokers, BoursoBank, Trade Republic)"
        >
          🔗 Comptes &amp; Sync API
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: '#34d399',
              boxShadow: '0 0 8px #34d399',
              display: 'inline-block',
            }}
          />
        </button>

        {/* ⚡ Actualiser Tout Button (Global Synchronisation) */}
        <button
          type="button"
          className="btn btn-sm"
          id="global-refresh-all-btn"
          disabled={refreshingPrices || refreshing}
          style={{
            color: 'white',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: (refreshingPrices || refreshing) ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            padding: '6px 14px',
            borderRadius: 10,
            boxShadow: '0 2px 10px rgba(59, 130, 246, 0.25)',
            cursor: (refreshingPrices || refreshing) ? 'not-allowed' : 'pointer',
          }}
          onClick={onRefreshAll}
          title="Actualiser instantanément tous les cours (Bourse + Crypto + Forex) et re-scanner les balances de vos adresses On-Chain"
        >
          <span className={(refreshingPrices || refreshing) ? 'spin' : ''}>⚡</span>
          {(refreshingPrices || refreshing) ? 'Actualisation...' : 'Actualiser Tout'}
        </button>

        {/* Global Inflation Toggle Switch */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: adjustInflation ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)',
            padding: '6px 14px',
            borderRadius: 10,
            border: adjustInflation ? '1px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: 14 }}>🎈</span>
          <label style={{ fontSize: 12, fontWeight: 700, color: adjustInflation ? 'var(--accent-amber)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
            <input
              type="checkbox"
              checked={adjustInflation}
              onChange={(e) => setAdjustInflation(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: 'var(--accent-amber)' }}
            />
            Inflation (Pouvoir d&apos;Achat Réel)
          </label>
        </div>
      </div>

      {isRunning && (
        <div className="pipeline-steps" style={{ width: '100%' }}>
          {pipelineSteps.map((step, i) => {
            const stepStatuses: AnalysisStatus[] = ['data-collection', 'research', 'portfolio-eval', 'critique', 'synthesis'];
            const currentIdx = stepStatuses.indexOf(analysisStatus);
            const stepIdx = i;
            let cls = 'pipeline-step';
            if (stepIdx < currentIdx) cls += ' complete';
            else if (stepIdx === currentIdx) cls += ' active';
            return (
              <span key={step.key}>
                {i > 0 && <span className="pipeline-connector" />}
                <span className={cls}>{step.icon} {step.label}</span>
              </span>
            );
          })}
        </div>
      )}
    </header>
  );
}

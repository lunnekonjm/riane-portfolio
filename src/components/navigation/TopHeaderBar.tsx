'use client';

import React, { useState } from 'react';
import type { PageView } from '@/types/navigation';
import type { AnalysisStatus } from '@/types/analysis';
import type { User } from 'firebase/auth';
import { MobileQuickActionsDrawer } from './MobileQuickActionsDrawer';

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
  user?: User | null;
  onOpenProfile?: () => void;
  onNavigate?: (view: PageView) => void;
  isMobileDrawerOpen?: boolean;
  setIsMobileDrawerOpen?: (open: boolean) => void;
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
  user = null,
  onOpenProfile = () => {},
  onNavigate = () => {},
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
}: TopHeaderBarProps) {
  const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);
  const drawerOpen = isMobileDrawerOpen !== undefined ? isMobileDrawerOpen : internalDrawerOpen;
  const setDrawerOpen = setIsMobileDrawerOpen || setInternalDrawerOpen;

  const isRefreshing = refreshingPrices || refreshing;

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Tableau de Bord';
      case 'revenue':
        return 'Aura Budget Pro';
      case 'envelopes':
        return 'Enveloppes & Fiscalité';
      case 'analysis':
        return 'Analyse IA';
      case 'valuation':
        return 'Prix ≠ Valeur (20)';
      case 'risk':
        return 'Stress Tests & Risque';
      case 'audit':
        return 'Journal d\'Audit';
      case 'reports':
        return 'Rapports & Newsletters';
      default:
        return 'Patrimoine';
    }
  };

  const getViewIcon = () => {
    switch (currentView) {
      case 'dashboard': return '📊';
      case 'revenue': return '💼';
      case 'envelopes': return '🏛️';
      case 'analysis': return '🔬';
      case 'valuation': return '📐';
      case 'risk': return '⚡';
      case 'audit': return '📋';
      case 'reports': return '📰';
      default: return '📊';
    }
  };

  return (
    <>
      <header className="page-header">
        {/* ── DESKTOP HEADER VIEW ── */}
        <div className="desktop-header-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 12 }}>
          <h1 className="page-title" style={{ margin: 0 }}>
            {getViewIcon()} {getViewTitle()}
          </h1>

          {/* Desktop Actions */}
          <div className="desktop-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
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

            {/* 🔗 Hub Multi-Comptes & Sync API Directe */}
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

            {/* ⚡ Actualiser Tout Button */}
            <button
              type="button"
              className="btn btn-sm"
              id="global-refresh-all-btn"
              disabled={isRefreshing}
              style={{
                color: 'white',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: isRefreshing ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                border: '1px solid rgba(59, 130, 246, 0.5)',
                padding: '6px 14px',
                borderRadius: 10,
                boxShadow: '0 2px 10px rgba(59, 130, 246, 0.25)',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
              }}
              onClick={onRefreshAll}
              title="Actualiser instantanément tous les cours (Bourse + Crypto + Forex) et re-scanner les balances de vos adresses On-Chain"
            >
              <span className={isRefreshing ? 'spin' : ''}>⚡</span>
              {isRefreshing ? 'Actualisation...' : 'Actualiser Tout'}
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
                Inflation
              </label>
            </div>
          </div>
        </div>

        {/* ── MOBILE HEADER APP BAR (<= 768px) ── */}
        <div className="mobile-header-bar">
          <div className="mobile-header-left">
            <span className="mobile-view-icon">{getViewIcon()}</span>
            <div className="mobile-view-info">
              <span className="mobile-brand-tag">RIANE</span>
              <h1 className="mobile-view-title">{getViewTitle()}</h1>
            </div>
          </div>

          <div className="mobile-header-actions">
            {/* Quick Refresh Icon Button */}
            <button
              type="button"
              className="mobile-header-btn"
              onClick={onRefreshAll}
              disabled={isRefreshing}
              title="Actualiser les cours & comptes"
              aria-label="Actualiser"
            >
              <span className={isRefreshing ? 'spin' : ''} style={{ fontSize: 16 }}>⚡</span>
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              className="mobile-header-btn"
              onClick={onOpenNotifications}
              title="Notifications"
              aria-label="Notifications"
            >
              <span style={{ fontSize: 16 }}>🔔</span>
              {unreadNotificationsCount > 0 && (
                <span className="mobile-badge-rose">{unreadNotificationsCount}</span>
              )}
            </button>

            {/* Quick Drawer / Menu Trigger */}
            <button
              type="button"
              className="mobile-header-btn mobile-menu-trigger"
              onClick={() => setDrawerOpen(true)}
              title="Menu & Outils Rapides"
              aria-label="Menu et Outils"
              id="mobile-drawer-toggle-btn"
            >
              <span style={{ fontSize: 18, fontWeight: 800 }}>☰</span>
            </button>
          </div>
        </div>

        {/* Pipeline Steps if running analysis */}
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

      {/* ── GLOBAL MOBILE QUICK ACTIONS DRAWER ── */}
      <MobileQuickActionsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentView={currentView}
        onNavigate={onNavigate}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={onOpenNotifications}
        onOpenGlossary={onOpenGlossary}
        onOpenMonteCarlo={onOpenMonteCarlo}
        onOpenIntegrations={onOpenIntegrations}
        refreshingPrices={refreshingPrices}
        refreshing={refreshing}
        onRefreshAll={onRefreshAll}
        adjustInflation={adjustInflation}
        setAdjustInflation={setAdjustInflation}
        user={user}
        onOpenProfile={onOpenProfile}
      />
    </>
  );
}

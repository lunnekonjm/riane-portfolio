'use client';

import React from 'react';
import type { PageView } from '@/types/navigation';
import type { User } from 'firebase/auth';

interface MobileQuickActionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: PageView;
  onNavigate: (view: PageView) => void;
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
  user: User | null;
  onOpenProfile: () => void;
}

export function MobileQuickActionsDrawer({
  isOpen,
  onClose,
  currentView,
  onNavigate,
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
  user,
  onOpenProfile,
}: MobileQuickActionsDrawerProps) {
  if (!isOpen) return null;

  const isRefreshing = refreshingPrices || refreshing;

  const handleNav = (view: PageView) => {
    onNavigate(view);
    onClose();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div
      className="mobile-drawer-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="mobile-drawer-sheet"
        style={{
          width: '100%',
          maxHeight: '88vh',
          background: 'linear-gradient(180deg, #111827 0%, #0b0f19 100%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -16px 48px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
          animation: 'slideUpSheet 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Drag Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 6 }}>
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.25)',
            }}
          />
        </div>

        {/* Drawer Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px 14px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 800,
                color: 'white',
              }}
            >
              📊
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>RIANE PATRIMOINE</div>
              <div style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 600 }}>Menu &amp; Actions Rapides</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {/* Section: Actions Rapides */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
              ⚡ Actions &amp; Outils Financiers
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {/* Actualiser Tout */}
              <button
                type="button"
                onClick={async () => {
                  onClose();
                  await onRefreshAll();
                }}
                disabled={isRefreshing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: isRefreshing ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isRefreshing ? 'wait' : 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 18 }} className={isRefreshing ? 'spin' : ''}>⚡</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div>{isRefreshing ? 'En cours...' : 'Actualiser'}</div>
                  <div style={{ fontSize: 9.5, color: '#93c5fd', fontWeight: 500 }}>Cours &amp; Balances</div>
                </div>
              </button>

              {/* Hub Comptes & Sync */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenIntegrations();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(129, 140, 248, 0.12)',
                  border: '1px solid rgba(129, 140, 248, 0.35)',
                  color: 'var(--accent-indigo, #a5b4fc)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 18 }}>🔗</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    Sync API
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                  </div>
                  <div style={{ fontSize: 9.5, color: '#c7d2fe', fontWeight: 500 }}>Bourso, IBKR...</div>
                </div>
              </button>

              {/* Monte Carlo & FIRE */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMonteCarlo();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: 'var(--accent-emerald)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 18 }}>🎲</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div>Monte Carlo</div>
                  <div style={{ fontSize: 9.5, color: '#6ee7b7', fontWeight: 500 }}>10 000 scénarios</div>
                </div>
              </button>

              {/* Lexique & Explications */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGlossary();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: 'var(--accent-cyan)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 18 }}>📚</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div>Lexique</div>
                  <div style={{ fontSize: 9.5, color: '#7dd3fc', fontWeight: 500 }}>Sans jargon</div>
                </div>
              </button>
            </div>

            {/* Toggle Inflation */}
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 12,
                background: adjustInflation ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                border: adjustInflation ? '1px solid var(--accent-amber)' : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
              }}
              onClick={() => setAdjustInflation(!adjustInflation)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🎈</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: adjustInflation ? 'var(--accent-amber)' : 'var(--text-primary)' }}>
                    Pouvoir d&apos;Achat Réel (Inflation)
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                    {adjustInflation ? "Actif : valeurs corrigées de l'inflation" : "Inactif : montants nominaux bruts"}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={adjustInflation}
                onChange={(e) => setAdjustInflation(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--accent-amber)', cursor: 'pointer' }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Section: Modules & Vues Analytiques */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
              🧭 Modules &amp; Vues Avancées
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { id: 'analysis' as PageView, icon: '🔬', title: 'Analyse à la Demande', desc: 'Chat interactif & diagnostics IA de portefeuille' },
                { id: 'risk' as PageView, icon: '⚡', title: 'Stress Tests & Risque', desc: 'Simulations de krachs historiques & corrélations' },
                { id: 'reports' as PageView, icon: '📰', title: 'Rapports & Newsletters AI', desc: 'Synthèses périodiques & alertes macro' },
                { id: 'audit' as PageView, icon: '📋', title: 'Journal d&apos;Audit', desc: 'Historique exhaustif de toutes vos opérations' },
              ].map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: isActive ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: isActive ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.06)',
                      color: isActive ? 'var(--accent-cyan)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{item.title}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>{item.desc}</div>
                    </div>
                    {isActive && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-cyan)' }}>● Actif</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Profil & Notifications */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'R'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.displayName || user?.email || 'Investisseur'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--accent-emerald)', fontWeight: 600 }}>● Session Sécurisée</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNotifications();
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: unreadNotificationsCount > 0 ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  border: unreadNotificationsCount > 0 ? '1px solid var(--accent-rose)' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: unreadNotificationsCount > 0 ? 'var(--accent-rose)' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                🔔 {unreadNotificationsCount > 0 && <span>{unreadNotificationsCount}</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProfile();
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ⚙️ Profil
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

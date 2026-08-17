'use client';

import React from 'react';
import type { PageView } from '@/types/navigation';

interface MobileBottomNavProps {
  currentView: PageView;
  onNavigate: (view: PageView) => void;
  onOpenProfile: () => void;
  onOpenDrawer?: () => void;
}

export function MobileBottomNav({
  currentView,
  onNavigate,
  onOpenProfile,
  onOpenDrawer,
}: MobileBottomNavProps) {
  const handleNavClick = (view: PageView) => {
    onNavigate(view);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isMoreActive = ['analysis', 'risk', 'reports', 'audit'].includes(currentView);

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigation Mobile">
      {/* 1. Tableau de Bord */}
      <button
        type="button"
        className={`mobile-nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
        onClick={() => handleNavClick('dashboard')}
        id="mob-nav-dashboard"
      >
        <span className="icon">📊</span>
        <span className="label">Bord</span>
      </button>

      {/* 2. Budget & Trésorerie */}
      <button
        type="button"
        className={`mobile-nav-btn ${currentView === 'revenue' ? 'active' : ''}`}
        onClick={() => handleNavClick('revenue')}
        id="mob-nav-revenue"
      >
        <span className="icon">💰</span>
        <span className="label">Budget</span>
      </button>

      {/* 3. Enveloppes & Fiscalité */}
      <button
        type="button"
        className={`mobile-nav-btn ${currentView === 'envelopes' ? 'active' : ''}`}
        onClick={() => handleNavClick('envelopes')}
        id="mob-nav-envelopes"
      >
        <span className="icon">🏛️</span>
        <span className="label">Fiscalité</span>
      </button>

      {/* 4. Valorisation (Prix != Valeur) */}
      <button
        type="button"
        className={`mobile-nav-btn ${currentView === 'valuation' ? 'active' : ''}`}
        onClick={() => handleNavClick('valuation')}
        id="mob-nav-valuation"
      >
        <span className="icon">📐</span>
        <span className="label">Valeur</span>
      </button>

      {/* 5. Plus (Outils & Vues Analytiques) */}
      <button
        type="button"
        className={`mobile-nav-btn ${isMoreActive ? 'active' : ''}`}
        onClick={() => {
          if (onOpenDrawer) {
            onOpenDrawer();
          } else {
            onOpenProfile();
          }
        }}
        id="mob-nav-more"
      >
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <span className="icon">☰</span>
          {isMoreActive && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -4,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--accent-cyan)',
                boxShadow: '0 0 6px var(--accent-cyan)',
              }}
            />
          )}
        </div>
        <span className="label">Plus</span>
      </button>
    </nav>
  );
}

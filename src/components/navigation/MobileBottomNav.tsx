'use client';

import React from 'react';
import type { PageView } from '@/types/navigation';

interface MobileBottomNavProps {
  currentView: PageView;
  onNavigate: (view: PageView) => void;
  onOpenProfile: () => void;
}

export function MobileBottomNav({
  currentView,
  onNavigate,
  onOpenProfile,
}: MobileBottomNavProps) {
  const handleNavClick = (view: PageView) => {
    onNavigate(view);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigation Mobile">
      <button
        type="button"
        className={`mobile-nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
        onClick={() => handleNavClick('dashboard')}
        id="mob-nav-dashboard"
      >
        <span className="icon">📊</span>
        <span>Bord</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-btn ${currentView === 'envelopes' ? 'active' : ''}`}
        onClick={() => handleNavClick('envelopes')}
        id="mob-nav-envelopes"
      >
        <span className="icon">🏛️</span>
        <span>Fiscalité</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-btn ${currentView === 'revenue' ? 'active' : ''}`}
        onClick={() => handleNavClick('revenue')}
        id="mob-nav-revenue"
      >
        <span className="icon">💰</span>
        <span>Budget</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-btn ${currentView === 'analysis' ? 'active' : ''}`}
        onClick={() => handleNavClick('analysis')}
        id="mob-nav-analysis"
      >
        <span className="icon">🔬</span>
        <span>Analyse</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-btn ${currentView === 'valuation' ? 'active' : ''}`}
        onClick={() => handleNavClick('valuation')}
        id="mob-nav-valuation"
      >
        <span className="icon">📐</span>
        <span>Valorisation</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-btn ${currentView === 'risk' ? 'active' : ''}`}
        onClick={() => handleNavClick('risk')}
        id="mob-nav-risk"
      >
        <span className="icon">⚡</span>
        <span>Risque</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-btn ${currentView === 'reports' ? 'active' : ''}`}
        onClick={() => handleNavClick('reports')}
        id="mob-nav-reports"
      >
        <span className="icon">📰</span>
        <span>Rapports</span>
      </button>

      <button
        type="button"
        className="mobile-nav-btn"
        onClick={onOpenProfile}
        id="mob-nav-profile"
      >
        <span className="icon">⚙️</span>
        <span>Profil</span>
      </button>
    </nav>
  );
}

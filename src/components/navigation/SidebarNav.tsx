'use client';

import React from 'react';
import type { PageView } from '@/types/navigation';
import type { User } from 'firebase/auth';

interface SidebarNavProps {
  currentView: PageView;
  onNavigate: (view: PageView) => void;
  user: User | null;
  onOpenProfile: () => void;
}

export function SidebarNav({
  currentView,
  onNavigate,
  user,
  onOpenProfile,
}: SidebarNavProps) {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">📊</div>
        <div className="logo-text">
          <span className="logo-title">RIANE</span>
          <span className="logo-badge">PATRIMOINE</span>
        </div>
      </div>

      <button
        className={`sidebar-nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
        onClick={() => onNavigate('dashboard')}
        id="nav-dashboard"
        type="button"
      >
        <span className="nav-icon">📊</span> Tableau de Bord
      </button>
      <button
        className={`sidebar-nav-item ${currentView === 'envelopes' ? 'active' : ''}`}
        onClick={() => onNavigate('envelopes')}
        id="nav-envelopes"
        type="button"
      >
        <span className="nav-icon">🏛️</span> Enveloppes &amp; Fiscalité
      </button>
      <button
        className={`sidebar-nav-item ${currentView === 'revenue' ? 'active' : ''}`}
        onClick={() => onNavigate('revenue')}
        id="nav-revenue"
        type="button"
      >
        <span className="nav-icon">💼</span> Aura Budget Pro
      </button>
      <button
        className={`sidebar-nav-item ${currentView === 'analysis' ? 'active' : ''}`}
        onClick={() => onNavigate('analysis')}
        id="nav-analysis"
        type="button"
      >
        <span className="nav-icon">🔬</span> Analyse
      </button>
      <button
        className={`sidebar-nav-item ${currentView === 'valuation' ? 'active' : ''}`}
        onClick={() => onNavigate('valuation')}
        id="nav-valuation"
        type="button"
      >
        <span className="nav-icon">📐</span> Prix ≠ Valeur (20)
      </button>
      <button
        className={`sidebar-nav-item ${currentView === 'risk' ? 'active' : ''}`}
        onClick={() => onNavigate('risk')}
        id="nav-risk"
        type="button"
      >
        <span className="nav-icon">⚡</span> Risque
      </button>
      <button
        className={`sidebar-nav-item ${currentView === 'audit' ? 'active' : ''}`}
        onClick={() => onNavigate('audit')}
        id="nav-audit"
        type="button"
      >
        <span className="nav-icon">📋</span> Audit
      </button>
      <button
        className={`sidebar-nav-item ${currentView === 'reports' ? 'active' : ''}`}
        onClick={() => onNavigate('reports')}
        id="nav-reports"
        type="button"
      >
        <span className="nav-icon">📰</span> Rapports AI
      </button>

      <div style={{ flex: 1 }} />

      {user && (
        <div style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: 'white',
            }}
          >
            {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'R'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.displayName || user.email || 'Investisseur'}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-emerald)', fontWeight: 600 }}>● Session Sécurisée</div>
          </div>
          <button
            type="button"
            className="btn-ghost"
            onClick={onOpenProfile}
            style={{ padding: '6px 10px', fontSize: 12, fontWeight: 600, background: 'var(--bg-tertiary)', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
            id="profile-menu-btn"
            title="Mon Profil & Déconnexion"
          >
            ⚙️ Profil
          </button>
        </div>
      )}
    </nav>
  );
}

'use client';

import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import type { InvestorProfile } from '@/types/portfolio';

interface UserProfileModalProps {
  isOpen: boolean;
  user: User | null;
  investorProfile: InvestorProfile | null;
  onTestNotification: () => void;
  onTestEmail: () => void;
  onEditProfile: () => void;
  onSignOut: () => Promise<void>;
  onClose: () => void;
}

export function UserProfileModal({
  isOpen,
  user,
  investorProfile,
  onTestNotification,
  onTestEmail,
  onEditProfile,
  onSignOut,
  onClose,
}: UserProfileModalProps) {
  const [showConfirmSignOut, setShowConfirmSignOut] = useState(false);

  if (!isOpen || !user) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'R'}
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Mon Profil Investisseur</h3>
                <span style={{ fontSize: 12, color: 'var(--accent-emerald)', fontWeight: 600 }}>● Compte Sécurisé Firebase</span>
              </div>
            </div>
            <button className="modal-close" onClick={onClose} type="button" aria-label="Fermer">✕</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 10 }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Adresse Email</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{user.email}</div>
            </div>

            <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 10 }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Identifiant Unique (UID)</div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user.uid}</div>
            </div>

            <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Fournisseur d&apos;Accès</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{user.providerData[0]?.providerId === 'google.com' ? 'Google OAuth 2.0' : 'Email / Mot de passe'}</div>
              </div>
              <span style={{ fontSize: 20 }}>🛡️</span>
            </div>
          </div>

          {/* Investor Profile Card */}
          {investorProfile && investorProfile.onboardingCompleted && (
            <div style={{ padding: 14, background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)', borderRadius: 10, border: '1px solid var(--border-medium)', marginTop: 14 }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>Profil Investisseur</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Risque</span>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {investorProfile.riskProfile === 'conservative' ? '🛡️ Conservateur' : investorProfile.riskProfile === 'balanced' ? '⚖️ Équilibré' : investorProfile.riskProfile === 'dynamic' ? '🚀 Dynamique' : '⚡ Agressif'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Horizon</span>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>⏳ {investorProfile.horizonYears} ans</div>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Objectif</span>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {investorProfile.objective === 'wealth-building' ? '🏗️ Patrimoine' : investorProfile.objective === 'passive-income' ? '💰 Revenus' : investorProfile.objective === 'financial-independence' ? '🏝️ Indépendance' : '🎯 Spéculation'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Drawdown max</span>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>📉 -{(investorProfile.maxDrawdownTolerance * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>
          )}

          {/* 🛠️ Developer Test Tools */}
          <div style={{ padding: 14, background: 'rgba(6, 182, 212, 0.08)', borderRadius: 10, border: '1px dashed var(--accent-cyan)', marginTop: 14 }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>
              🛠️ Outils de Test (Notifications &amp; Mails)
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onTestNotification}
                style={{ fontSize: 12, borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', fontWeight: 600 }}
              >
                🔔 Tester Notification
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onTestEmail}
                style={{ fontSize: 12, borderColor: 'var(--accent-violet)', color: 'var(--accent-violet)', fontWeight: 600 }}
              >
                📧 Tester Envoi Email (Resend)
              </button>
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={onClose}>Fermer</button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  onEditProfile();
                }}
                style={{ fontSize: 12 }}
              >
                🎯 Modifier mon Profil
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowConfirmSignOut(true)}
                style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)', borderColor: 'var(--accent-rose)', fontWeight: 700 }}
              >
                🚪 Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🚪 Sign Out Confirmation Sub-Modal */}
      {showConfirmSignOut && (
        <div className="modal-overlay" onClick={() => setShowConfirmSignOut(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚪</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Confirmer la déconnexion ?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Vous devrez saisir à nouveau vos identifiants pour accéder à votre portefeuille RIANE.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowConfirmSignOut(false)} style={{ flex: 1 }}>
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  setShowConfirmSignOut(false);
                  onClose();
                  await onSignOut();
                }}
                style={{ flex: 1, background: 'var(--accent-rose)', borderColor: 'var(--accent-rose)', fontWeight: 700 }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

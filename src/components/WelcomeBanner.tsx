'use client';

import { useState } from 'react';
import type { Position } from '@/types/portfolio';
import type { AppNotification } from '@/types/notification';

interface WelcomeBannerProps {
  userName?: string;
  totalValue: number;
  totalCost: number;
  monthlyDCA: number;
  positions: Position[];
  notifications: AppNotification[];
  onOpenAnalysis: () => void;
  onOpenRebalance: () => void;
  onNavigateView: (view: 'dashboard' | 'envelopes' | 'analysis' | 'risk' | 'reports') => void;
}

export default function WelcomeBanner({
  userName,
  totalValue,
  totalCost,
  monthlyDCA,
  positions,
  notifications,
  onOpenAnalysis,
  onOpenRebalance,
  onNavigateView,
}: WelcomeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Bonjour' : currentHour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const displayName = userName ? userName.split(' ')[0] : 'Investisseur';
  const filledPositions = positions.filter((p) => p.quantity > 0 && p.avgPrice > 0);

  const overallGain = totalValue - totalCost;
  const overallGainPercent = totalCost > 0 ? (overallGain / totalCost) * 100 : 0;
  const activeAlerts = notifications.filter((n) => !n.read && (n.category === 'outlier' || n.category === 'risk'));

  // Determine dynamic status message
  let statusMessage = '';
  let statusBadge = { label: '🟢 Portefeuille Équilibré', color: 'var(--accent-emerald)', bg: 'rgba(16, 185, 129, 0.12)' };

  const topAlert = activeAlerts.length > 0 ? activeAlerts[0] : null;

  if (topAlert) {
    statusBadge = { label: `🚨 ${activeAlerts.length} Alerte(s) Active(s)`, color: 'var(--accent-rose)', bg: 'rgba(244, 63, 94, 0.15)' };
    statusMessage = topAlert.message;
  } else if (overallGain >= 0) {
    statusMessage = `Votre portefeuille enregistre une plus-value globale de +${overallGainPercent.toFixed(1)}% (+${Math.round(overallGain).toLocaleString('fr-FR')} €). Vos plafonds sectoriels sont respectés.`;
  } else {
    statusMessage = `Marché sous pression : Votre portefeuille affiche une moins-value latente de ${overallGainPercent.toFixed(1)}%. C'est l'opportunité idéale pour votre DCA mensuel.`;
  }

  return (
    <div
      className="card"
      style={{
        background: topAlert ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(17, 24, 39, 0.85) 100%)' : 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(17, 24, 39, 0.8) 100%)',
        borderLeft: topAlert ? '4px solid var(--accent-rose)' : '4px solid var(--accent-cyan)',
        padding: '14px 18px',
        marginBottom: 16,
        position: 'relative',
        animation: 'fadeInUp 0.4s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 260 }}>
          <span style={{ fontSize: 32 }}>👋</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {greeting}, {displayName} !
              </h3>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: statusBadge.bg, color: statusBadge.color, fontWeight: 700 }}>
                {statusBadge.label}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.5 }}>
              {statusMessage}
            </p>
            {topAlert?.actionHint && (
              <div style={{ fontSize: 12, color: 'var(--text-primary)', background: 'rgba(255, 255, 255, 0.05)', padding: '6px 10px', borderRadius: 6, marginTop: 8, borderLeft: '3px solid var(--accent-rose)', lineHeight: 1.4 }}>
                <strong>👉 Que faire :</strong> {topAlert.actionHint}
              </div>
            )}
          </div>
        </div>

        {/* Action Shortcuts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {topAlert ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ fontSize: 11, background: 'var(--accent-rose)', color: 'white' }}
              onClick={() => {
                if (topAlert.actionType === 'open-envelopes') onNavigateView('envelopes');
                else if (topAlert.actionType === 'open-analysis') onOpenAnalysis();
                else onOpenRebalance();
              }}
            >
              {topAlert.actionCtaLabel || '🎯 Corriger via DCA'}
            </button>
          ) : (
            filledPositions.length > 0 && monthlyDCA > 0 ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                onClick={onOpenRebalance}
              >
                🎯 Versement DCA ({Math.round(monthlyDCA)}€)
              </button>
            ) : null
          )}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ fontSize: 11 }}
            onClick={onOpenAnalysis}
          >
            🔬 Lancer une Analyse IA
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', fontSize: 16, cursor: 'pointer', padding: '0 4px' }}
            title="Fermer le message d'accueil"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

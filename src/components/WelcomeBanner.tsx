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

  const overallGain = totalValue - totalCost;
  const overallGainPercent = totalCost > 0 ? (overallGain / totalCost) * 100 : 0;

  // Filtrer les alertes actives
  const activeAlerts = notifications.filter((n) => !n.read && (n.category === 'outlier' || n.category === 'risk' || n.category === 'fiscal'));
  const criticalAlerts = activeAlerts.filter((n) => n.priority === 'high');
  const topAlert = activeAlerts.length > 0 ? (criticalAlerts[0] || activeAlerts[0]) : null;
  const isHighUrgency = topAlert?.priority === 'high';

  // Determine dynamic status message & styling
  let statusMessage = '';
  let statusBadge = { label: '🟢 Portefeuille Équilibré', color: 'var(--accent-emerald)', bg: 'rgba(16, 185, 129, 0.15)' };

  if (topAlert && isHighUrgency) {
    statusBadge = { label: `🚨 ${criticalAlerts.length} Alerte(s) Active(s)`, color: 'var(--accent-rose)', bg: 'rgba(244, 63, 94, 0.18)' };
    statusMessage = topAlert.message;
  } else if (topAlert) {
    statusBadge = { label: `💡 Conseil d'Allocation DCA`, color: 'var(--accent-cyan)', bg: 'rgba(6, 182, 212, 0.15)' };
    statusMessage = topAlert.message;
  } else if (overallGain >= 0) {
    statusMessage = `Votre portefeuille enregistre une plus-value globale de +${overallGainPercent.toFixed(1)}% (+${Math.round(overallGain).toLocaleString('fr-FR')} €). Vos plafonds sectoriels sont respectés.`;
  } else {
    statusMessage = `Marché sous pression : Votre portefeuille affiche une moins-value latente de ${overallGainPercent.toFixed(1)}%. C'est l'opportunité idéale pour votre DCA mensuel.`;
  }

  const bannerBg = isHighUrgency
    ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.14) 0%, rgba(17, 24, 39, 0.9) 100%)'
    : topAlert
    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.14) 0%, rgba(17, 24, 39, 0.9) 100%)'
    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.10) 0%, rgba(17, 24, 39, 0.85) 100%)';

  const bannerBorder = isHighUrgency
    ? '4px solid var(--accent-rose)'
    : topAlert
    ? '4px solid var(--accent-cyan)'
    : '4px solid var(--accent-emerald)';

  return (
    <div
      className="card"
      style={{
        background: bannerBg,
        borderLeft: bannerBorder,
        padding: '16px 20px',
        marginBottom: 16,
        position: 'relative',
        animation: 'fadeInUp 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 260 }}>
          <span style={{ fontSize: 32 }}>👋</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {greeting}, {displayName} !
              </h3>
              <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, background: statusBadge.bg, color: statusBadge.color, fontWeight: 700, border: `1px solid ${statusBadge.color}` }}>
                {statusBadge.label}
              </span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '6px 0 0 0', lineHeight: 1.5 }}>
              {statusMessage}
            </p>
            {topAlert?.actionHint && (
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  padding: '8px 12px',
                  borderRadius: 8,
                  marginTop: 10,
                  borderLeft: isHighUrgency ? '3px solid var(--accent-rose)' : '3px solid var(--accent-cyan)',
                  lineHeight: 1.45,
                }}
              >
                <strong>👉 Que faire :</strong> {topAlert.actionHint}
              </div>
            )}
          </div>
        </div>

        {/* Action Shortcuts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {topAlert ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{
                fontSize: 13,
                background: isHighUrgency ? 'var(--accent-rose)' : 'var(--accent-cyan)',
                color: isHighUrgency ? 'white' : '#001a30',
                padding: '7px 14px',
                fontWeight: 700,
              }}
              onClick={() => {
                if (topAlert.actionType === 'open-envelopes') onNavigateView('envelopes');
                else onOpenRebalance();
              }}
            >
              {topAlert.actionCtaLabel || '🎯 Ajuster les Flux DCA'}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 13, padding: '7px 14px', fontWeight: 600 }}
              onClick={onOpenRebalance}
            >
              🎯 Rééquilibrer
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 13, padding: '7px 14px', fontWeight: 600 }}
            onClick={onOpenAnalysis}
          >
            🔬 Lancer une Analyse IA
          </button>

          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: 16, padding: '4px 8px', color: 'var(--text-muted)' }}
            onClick={() => setDismissed(true)}
            title="Masquer le message"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

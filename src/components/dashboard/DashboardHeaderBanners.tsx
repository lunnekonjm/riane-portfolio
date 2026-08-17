'use client';

import React from 'react';
import type { AppNotification } from '@/types/notification';
import type { Position } from '@/types/portfolio';

interface DashboardHeaderBannersProps {
  marketStatusLabel?: string;
  lastPricesUpdated: number | null;
  notifications: AppNotification[];
  setShowNotificationModal: (show: boolean) => void;
  pendingCount: number;
  positionsCount: number;
  adjustInflation: boolean;
  inflationRate: number;
  yearsElapsed: number;
  cumulativeInflationFactor: number;
}

export function DashboardHeaderBanners({
  marketStatusLabel,
  lastPricesUpdated,
  notifications,
  setShowNotificationModal,
  pendingCount,
  positionsCount,
  adjustInflation,
  inflationRate,
  yearsElapsed,
  cumulativeInflationFactor,
}: DashboardHeaderBannersProps) {
  const unreadOutlierNotifications = notifications.filter((n) => n.category === 'outlier' && !n.read);

  return (
    <>
      {/* 📅 Dashboard Date & Market Last Refresh Bar */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          padding: '12px 18px',
          background: 'var(--bg-secondary)',
          marginBottom: 16,
          borderLeft: '4px solid var(--accent-cyan)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>📅</span>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Aujourd&apos;hui :{' '}
            <span style={{ color: 'var(--accent-cyan)', textTransform: 'capitalize' }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span className="badge badge-violet" style={{ fontSize: 12, padding: '4px 10px', fontWeight: 600 }}>
            {marketStatusLabel || '🔒 Cours de Clôture Officielle (Marché Fermé)'}
          </span>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Actualisé à{' '}
            <strong style={{ color: 'var(--accent-emerald)' }}>
              {lastPricesUpdated
                ? new Date(lastPricesUpdated).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </strong>{' '}
            (Yahoo Finance Live)
          </div>
        </div>
      </div>

      {/* 🚨 Proactive Outlier / Krach Alert Banner */}
      {unreadOutlierNotifications.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-rose)', background: 'rgba(244, 63, 94, 0.12)', padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>🚨</span>
              <div>
                <strong style={{ color: 'var(--accent-rose)', fontSize: 14 }}>
                  ALERTE PROACTIVE KRACH / ANOMALIE DE MARCHÉ DÉTECTÉE !
                </strong>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>
                  {unreadOutlierNotifications[0]?.message}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowNotificationModal(true)}
              style={{ borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)', fontWeight: 700 }}
            >
              Voir les alertes (🔔)
            </button>
          </div>
        </div>
      )}

      {/* Onboarding Banner */}
      {pendingCount > 0 && (
        <div className="card" style={{ borderLeft: '3px solid var(--accent-amber)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 28 }}>✍️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {pendingCount === positionsCount
                  ? 'Renseignez vos positions pour activer le tableau de bord'
                  : `${pendingCount} position${pendingCount > 1 ? 's' : ''} à compléter`}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Cliquez sur une ligne du tableau pour entrer vos quantités et prix réels d&apos;achat (PRU).
                Tant qu&apos;une donnée manque, elle est <strong style={{ color: 'var(--accent-amber)' }}>signalée</strong> plutôt que masquée — jamais de valeur fictive silencieuse.
              </div>
            </div>
          </div>

          {/* Légende de Provenance des Chiffres */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px dashed var(--border-subtle)', paddingTop: 12, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
              Provenance des chiffres :
            </span>

            <span className="badge-real">
              <span className="dot"></span> RÉEL — SAISI PAR VOUS
            </span>

            <span style={{ padding: '3px 10px', borderRadius: 12, border: '1px solid var(--accent-amber)', background: 'rgba(245, 158, 11, 0.14)', color: 'var(--accent-amber)', fontSize: 'var(--text-xs)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-amber)' }}></span> ESTIMÉ — DONNÉE MANQUANTE
            </span>

            <span className="badge-projected">
              <span className="dot"></span> PROJETÉ — CALCUL FUTUR
            </span>
          </div>
        </div>
      )}

      {/* 🎈 Active Inflation Banner */}
      {adjustInflation && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-amber)', background: 'rgba(245, 158, 11, 0.1)', padding: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-primary)' }}>
            <span style={{ fontSize: 20 }}>🎈</span>
            <div>
              <strong>Mode Inflation Actif (Pouvoir d&apos;Achat Réel) :</strong> Montants et plus-values exprimés en Euros constants (IPC Eurostat/INSEE ~{(inflationRate * 100).toFixed(1)}%/an sur {yearsElapsed.toFixed(1)} ans, inflation cumulée : {((cumulativeInflationFactor - 1) * 100).toFixed(1)}%).
            </div>
          </div>
        </div>
      )}
    </>
  );
}

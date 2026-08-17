'use client';

import React from 'react';
import type { NotificationSettings } from '@/types/notification';

interface NotificationSettingsTabProps {
  settings: NotificationSettings;
  onUpdateSettings: (newSettings: NotificationSettings) => void;
  onTestNotification?: () => void;
  onTestEmail?: () => void;
}

export function NotificationSettingsTab({
  settings,
  onUpdateSettings,
  onTestNotification,
  onTestEmail,
}: NotificationSettingsTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Setting 1: DCA Reminders */}
      <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>💸 Rappels de Versement DCA Mensuel</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>
            Notification automatique à la date choisie pour exécuter votre plan d&apos;épargne.
          </div>
        </div>
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={settings.dcaReminderEnabled}
            onChange={(e) => onUpdateSettings({ ...settings, dcaReminderEnabled: e.target.checked })}
            style={{ width: 18, height: 18, accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
          />
        </label>
      </div>

      {settings.dcaReminderEnabled && (
        <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Jour du versement mensuel :</span>
          <select
            value={settings.dcaDayOfMonth}
            onChange={(e) => onUpdateSettings({ ...settings, dcaDayOfMonth: parseInt(e.target.value) || 1 })}
            style={{ background: 'var(--bg-tertiary)', color: 'var(--accent-cyan)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '4px 10px', fontSize: 13, fontWeight: 700 }}
          >
            <option value={1}>Le 1er du mois</option>
            <option value={5}>Le 5 du mois</option>
            <option value={10}>Le 10 du mois</option>
            <option value={15}>Le 15 du mois</option>
            <option value={20}>Le 20 du mois</option>
            <option value={25}>Le 25 du mois</option>
          </select>
        </div>
      )}

      {/* Setting 2: PEA Ceiling Alerts */}
      <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>🏛️ Alertes Plafond Légal PEA (150k€)</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>
            Avertissement dès 90% de remplissage et saturation pour réorienter le DCA vers le CTO.
          </div>
        </div>
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={settings.peaCeilingAlertsEnabled}
            onChange={(e) => onUpdateSettings({ ...settings, peaCeilingAlertsEnabled: e.target.checked })}
            style={{ width: 18, height: 18, accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
          />
        </label>
      </div>

      {/* Setting 3: Allocation Drift */}
      <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>⚡ Alertes Dérive Thématique & Risque</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>
            Signalement si l&apos;exposition à un thème dépasse la limite max de gestion.
          </div>
        </div>
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={settings.allocationDriftEnabled}
            onChange={(e) => onUpdateSettings({ ...settings, allocationDriftEnabled: e.target.checked })}
            style={{ width: 18, height: 18, accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
          />
        </label>
      </div>

      {/* Setting 4: Krach & Outliers Alert */}
      <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent-rose)' }}>🚨 Alertes Krach Boursier & Variations Anormales (Outliers)</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>
            Détection proactive en cas de baisse brutal ou d&apos;envolée exceptionnelle d&apos;un actif.
          </div>
        </div>
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={settings.outlierAlertsEnabled ?? true}
            onChange={(e) => onUpdateSettings({ ...settings, outlierAlertsEnabled: e.target.checked })}
            style={{ width: 18, height: 18, accentColor: 'var(--accent-rose)', cursor: 'pointer' }}
          />
        </label>
      </div>

      {settings.outlierAlertsEnabled && (
        <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Sensibilité de détection d&apos;Outliers :</span>
          <select
            value={settings.outlierThresholdPct || 3.0}
            onChange={(e) => onUpdateSettings({ ...settings, outlierThresholdPct: parseFloat(e.target.value) || 3.0 })}
            style={{ background: 'var(--bg-tertiary)', color: 'var(--accent-rose)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '4px 10px', fontSize: 13, fontWeight: 700 }}
          >
            <option value={3.0}>±3.0% (Haute Sensibilité)</option>
            <option value={5.0}>±5.0% (Sensibilité Normale)</option>
            <option value={7.0}>±7.0% (Chocs Majeurs Uniquement)</option>
          </select>
        </div>
      )}

      {/* Developer Test Tools in Settings */}
      {(onTestNotification || onTestEmail) && (
        <div style={{ padding: 14, background: 'rgba(6, 182, 212, 0.08)', borderRadius: 10, border: '1px dashed var(--accent-cyan)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent-cyan)', marginBottom: 8 }}>
            🛠️ Boutons de Test (Développeur)
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {onTestNotification && (
              <button type="button" className="btn btn-sm btn-primary" onClick={onTestNotification}>
                🧪 Déclencher une fausse notification
              </button>
            )}
            {onTestEmail && (
              <button type="button" className="btn btn-sm btn-secondary" onClick={onTestEmail}>
                📧 Envoyer un email de test (Resend)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

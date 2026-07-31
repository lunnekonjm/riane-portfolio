'use client';

import { useState } from 'react';
import type { AppNotification, NotificationSettings, NotificationCategory } from '@/types/notification';

interface NotificationCenterModalProps {
  notifications: AppNotification[];
  settings: NotificationSettings;
  onClose: () => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onUpdateSettings: (newSettings: NotificationSettings) => void;
  onOpenRebalance?: () => void;
  onOpenAnalysis?: (query?: string) => void;
  onNavigateView?: (view: 'dashboard' | 'envelopes' | 'analysis' | 'risk' | 'reports') => void;
}

export default function NotificationCenterModal({
  notifications,
  settings,
  onClose,
  onMarkAllAsRead,
  onClearAll,
  onUpdateSettings,
  onOpenRebalance,
  onOpenAnalysis,
  onNavigateView,
}: NotificationCenterModalProps) {
  const [activeTab, setActiveTab] = useState<'alerts' | 'settings'>('alerts');
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'all'>('all');

  const filteredNotifs = notifications.filter((n) =>
    selectedCategory === 'all' ? true : n.category === selectedCategory
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🔔</span>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Centre de Notifications</h3>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {unreadCount > 0 ? `${unreadCount} alerte${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes les alertes sont à jour'}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* View Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginTop: 12, marginBottom: 16 }}>
          <button
            onClick={() => setActiveTab('alerts')}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'alerts' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              color: activeTab === 'alerts' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            📥 Alertes ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'settings' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              color: activeTab === 'settings' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ⚙️ Préférences
          </button>
        </div>

        {/* Tab 1: Alerts List */}
        {activeTab === 'alerts' && (
          <div>
            {/* Category Filter Pills & Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['all', 'dca', 'fiscal', 'risk', 'outlier'] as const).map((cat) => (
                  <button
                    key={cat}
                    className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedCategory(cat)}
                    style={{ fontSize: 11, padding: '4px 10px' }}
                  >
                    {cat === 'all' && 'Toutes'}
                    {cat === 'dca' && '💸 DCA'}
                    {cat === 'fiscal' && '🏛️ Fiscal'}
                    {cat === 'risk' && '⚡ Risque'}
                    {cat === 'outlier' && '🚨 Krach & Outliers'}
                  </button>
                ))}
              </div>

              {notifications.length > 0 && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm btn-secondary" onClick={onMarkAllAsRead} style={{ fontSize: 11 }}>
                    ✓ Tout lire
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={onClearAll} style={{ fontSize: 11 }}>
                    🗑 Tout effacer
                  </button>
                </div>
              )}
            </div>

            {/* Notification Cards */}
            {filteredNotifs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-tertiary)', borderRadius: 12 }}>
                <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>🎉</span>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Aucune notification active</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Votre portefeuille respecte parfaitement les règles d&apos;allocation et de fiscalité.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 360, overflowY: 'auto' }}>
                {filteredNotifs.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      background: n.priority === 'high' ? 'rgba(244, 63, 94, 0.1)' : 'var(--bg-tertiary)',
                      borderLeft: n.priority === 'high' ? '4px solid var(--accent-rose)' : n.category === 'dca' ? '4px solid var(--accent-cyan)' : '4px solid var(--accent-amber)',
                      opacity: n.read ? 0.7 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                        {n.title}
                      </div>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(n.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {n.message}
                    </p>
                    {n.actionHint && (
                      <div style={{ fontSize: 11, color: 'var(--text-primary)', background: 'rgba(255, 255, 255, 0.05)', padding: '6px 10px', borderRadius: 6, marginTop: 8, borderLeft: '3px solid var(--accent-cyan)', lineHeight: 1.4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                        <div>
                          <strong>👉 Que faire :</strong> {n.actionHint}
                        </div>
                        {n.actionCtaLabel && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: 10, padding: '3px 8px', whiteSpace: 'nowrap' }}
                            onClick={() => {
                              onClose();
                              if (n.actionType === 'open-envelopes') onNavigateView?.('envelopes');
                              else if (n.actionType === 'open-analysis') onOpenAnalysis?.(`Analyse et recommandations pour : ${n.title}`);
                              else onOpenRebalance?.();
                            }}
                          >
                            {n.actionCtaLabel}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Notification Preferences */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Setting 1: DCA Reminders */}
            <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>💸 Rappels de Versement DCA Mensuel</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
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
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Jour du versement mensuel :</span>
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
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
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
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
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
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
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
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

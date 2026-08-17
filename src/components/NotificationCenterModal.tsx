'use client';

import { useState } from 'react';
import type { AppNotification, NotificationSettings, NotificationCategory } from '@/types/notification';
import { NotificationCard } from './notifications/NotificationCard';
import { NotificationSettingsTab } from './notifications/NotificationSettingsTab';

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
  onTestNotification?: () => void;
  onTestEmail?: () => void;
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
  onTestNotification,
  onTestEmail,
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
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(['all', 'dca', 'fiscal', 'risk', 'outlier'] as const).map((cat) => (
                  <button
                    key={cat}
                    className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedCategory(cat)}
                    style={{ fontSize: 'var(--text-xs)', padding: '5px 12px', fontWeight: 600 }}
                  >
                    {cat === 'all' && 'Toutes'}
                    {cat === 'dca' && '💸 DCA'}
                    {cat === 'fiscal' && '🏛️ Fiscal'}
                    {cat === 'risk' && '⚡ Risque'}
                    {cat === 'outlier' && '🚨 Krach & Outliers'}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {onTestNotification && (
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={onTestNotification}
                    style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)', fontWeight: 600 }}
                    title="Générer une notification de test instantanée"
                  >
                    🧪 Tester notif
                  </button>
                )}
                {notifications.length > 0 && (
                  <>
                    <button className="btn btn-sm btn-secondary" onClick={onMarkAllAsRead} style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                      ✓ Tout lire
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={onClearAll} style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                      🗑 Tout effacer
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Notification Cards */}
            {filteredNotifs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-tertiary)', borderRadius: 12 }}>
                <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>🎉</span>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Aucune notification active</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Votre portefeuille respecte parfaitement les règles d&apos;allocation et de fiscalité.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 360, overflowY: 'auto' }}>
                {filteredNotifs.map((n) => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    onClose={onClose}
                    onOpenRebalance={onOpenRebalance}
                    onOpenAnalysis={onOpenAnalysis}
                    onNavigateView={onNavigateView}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Notification Preferences */}
        {activeTab === 'settings' && (
          <NotificationSettingsTab
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            onTestNotification={onTestNotification}
            onTestEmail={onTestEmail}
          />
        )}

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

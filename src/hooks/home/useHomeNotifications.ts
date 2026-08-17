'use client';

import { useState, useMemo } from 'react';
import type { Position, PortfolioConfig, InvestorProfile } from '@/types/portfolio';
import type { AppNotification, NotificationSettings } from '@/types/notification';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/types/notification';
import { generatePortfolioNotifications } from '@/engines/notificationEngine';

interface UseHomeNotificationsParams {
  positions: Position[];
  fxRates: Record<string, number>;
  config: PortfolioConfig | null;
  investorProfile: InvestorProfile | null;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function useHomeNotifications({
  positions,
  fxRates,
  config,
  investorProfile,
  showToast,
}: UseHomeNotificationsParams) {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [clearedNotificationIds, setClearedNotificationIds] = useState<string[]>([]);
  const [mockNotifications, setMockNotifications] = useState<AppNotification[]>([]);

  const rawNotifications = useMemo(() => {
    const monthlyBudget = config?.monthlyBudget || 1000;
    return generatePortfolioNotifications(positions, fxRates, notificationSettings, monthlyBudget, investorProfile);
  }, [positions, fxRates, notificationSettings, config?.monthlyBudget, investorProfile]);

  const notifications = useMemo(() => {
    return [...rawNotifications, ...mockNotifications]
      .filter((n) => !clearedNotificationIds.includes(n.id))
      .map((n) => ({ ...n, read: n.read || readNotificationIds.includes(n.id) }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [rawNotifications, mockNotifications, readNotificationIds, clearedNotificationIds]);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const handleTestNotification = () => {
    setMockNotifications((prev) => [
      {
        id: `test-notif-${Date.now()}`,
        category: 'dca',
        title: '🧪 Test de Notification DCA',
        message: 'Ceci est une notification générée manuellement pour vérifier l\x27interface utilisateur.',
        actionHint: 'Aucune action requise.',
        timestamp: Date.now(),
        read: false,
        priority: 'high',
      },
      ...prev,
    ]);
    showToast('Notification de test générée !');
  };

  return {
    notificationSettings,
    setNotificationSettings,
    readNotificationIds,
    setReadNotificationIds,
    clearedNotificationIds,
    setClearedNotificationIds,
    mockNotifications,
    setMockNotifications,
    notifications,
    unreadNotificationsCount,
    handleTestNotification,
  };
}

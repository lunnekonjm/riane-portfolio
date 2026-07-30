/**
 * Notification System Types
 */

export type NotificationCategory = 'dca' | 'fiscal' | 'risk' | 'market' | 'outlier';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

export interface NotificationSettings {
  dcaReminderEnabled: boolean;
  dcaDayOfMonth: number; // 1 to 28
  peaCeilingAlertsEnabled: boolean;
  allocationDriftEnabled: boolean;
  marketVolatilityEnabled: boolean;
  outlierAlertsEnabled: boolean;
  outlierThresholdPct: number; // Default 3.0%
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  dcaReminderEnabled: true,
  dcaDayOfMonth: 1,
  peaCeilingAlertsEnabled: true,
  allocationDriftEnabled: true,
  marketVolatilityEnabled: true,
  outlierAlertsEnabled: true,
  outlierThresholdPct: 3.0,
};

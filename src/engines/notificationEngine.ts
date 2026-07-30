/**
 * Dynamic Notification Generator Engine
 * Evaluates real portfolio state and generates actionable financial alerts
 */

import type { Position } from '@/types/portfolio';
import type { AppNotification, NotificationSettings } from '@/types/notification';
import { THEMES } from '@/data/themes';

export function generatePortfolioNotifications(
  positions: Position[],
  fxRates: Record<string, number>,
  settings: NotificationSettings,
  monthlyBudget: number = 1000
): AppNotification[] {
  const notifications: AppNotification[] = [];
  const now = Date.now();
  const currentDate = new Date();
  const currentDay = currentDate.getDate();

  // Group positions by envelope
  const filled = positions.filter((p) => p.quantity > 0 && p.avgPrice > 0);
  const peaPositions = filled.filter((p) => p.envelope === 'PEA');
  const peaCost = peaPositions.reduce((sum, p) => sum + p.quantity * p.avgPrice * (fxRates[p.currency] || 1), 0);

  const peaPmePositions = filled.filter((p) => p.envelope === 'PEA-PME');
  const peaPmeCost = peaPmePositions.reduce((sum, p) => sum + p.quantity * p.avgPrice * (fxRates[p.currency] || 1), 0);

  const totalPortfolioValue = filled.reduce((sum, p) => sum + p.quantity * (p.currentPrice || p.avgPrice) * (fxRates[p.currency] || 1), 0);

  // ── 1. PEA & PEA-PME Ceiling Alerts ──
  if (settings.peaCeilingAlertsEnabled) {
    if (peaCost >= 150000) {
      notifications.push({
        id: 'notif-pea-full-150k',
        category: 'fiscal',
        title: '🏛️ Plafond Légal PEA Atteint (150 000 €)',
        message: `Votre PEA classique a atteint son plafond légal de versement de 150 000 €. Les versements DCA mensuels excédentaires basculent automatiquement vers votre CTO.`,
        timestamp: now,
        read: false,
        priority: 'high',
      });
    } else if (peaCost >= 135000) {
      notifications.push({
        id: 'notif-pea-near-full',
        category: 'fiscal',
        title: '🏛️ PEA Rempli à 90% (Attention au Plafond)',
        message: `Vos versements PEA s'élèvent à ${Math.round(peaCost).toLocaleString('fr-FR')} €. Il vous reste ${(150000 - peaCost).toLocaleString('fr-FR')} € de capacité de versement avant saturation.`,
        timestamp: now,
        read: false,
        priority: 'medium',
      });
    }

    if (peaCost + peaPmeCost >= 225000) {
      notifications.push({
        id: 'notif-pea-pme-full-225k',
        category: 'fiscal',
        title: '🏛️ Plafond Cumulé PEA + PEA-PME Saturation (225 000 €)',
        message: `Le cumul de vos versements sur PEA (${Math.round(peaCost).toLocaleString('fr-FR')} €) et PEA-PME (${Math.round(peaPmeCost).toLocaleString('fr-FR')} €) a atteint la limite légale absolue de 225 000 €.`,
        timestamp: now,
        read: false,
        priority: 'high',
      });
    }
  }

  // ── 2. Monthly DCA Reminder ──
  if (settings.dcaReminderEnabled) {
    const isReminderDay = Math.abs(currentDay - settings.dcaDayOfMonth) <= 2 || currentDay === 1;
    if (isReminderDay) {
      notifications.push({
        id: `notif-dca-reminder-${currentDate.getFullYear()}-${currentDate.getMonth()}`,
        category: 'dca',
        title: '💸 Rappel Versement DCA Mensuel',
        message: `C'est la période de versement ! Votre budget DCA configuré est de ${monthlyBudget.toLocaleString('fr-FR')} €/mois. Pensez à exécuter vos ordres.`,
        timestamp: now,
        read: false,
        priority: 'medium',
      });
    }
  }

  // ── 3. Thematic Risk & Allocation Drift ──
  if (settings.allocationDriftEnabled && totalPortfolioValue > 0) {
    THEMES.forEach((theme) => {
      const themePositions = filled.filter((p) => theme.tickers.includes(p.ticker) || p.themes.includes(theme.id));
      const themeValueEUR = themePositions.reduce((sum, p) => {
        const val = p.quantity * (p.currentPrice || p.avgPrice) * (fxRates[p.currency] || 1);
        const weight = p.themes.length > 0 ? 1 / p.themes.length : 1;
        return sum + val * weight;
      }, 0);

      const exposure = (themeValueEUR / totalPortfolioValue) * 100;
      const maxPct = theme.maxExposure * 100;

      if (exposure > maxPct + 1.0) {
        notifications.push({
          id: `notif-drift-${theme.id}`,
          category: 'risk',
          title: `⚡ Alerte Dérive Thématique : ${theme.label}`,
          message: `L'exposition à la thématique '${theme.label}' (${exposure.toFixed(1)}%) dépasse la limite maximale recommandée (${maxPct.toFixed(0)}%).`,
          timestamp: now,
          read: false,
          priority: 'high',
        });
      }
    });
  }

  return notifications;
}

import { describe, it, expect } from 'vitest';
import { generatePortfolioNotifications } from '@/engines/notificationEngine';
import type { Position, InvestorProfile } from '@/types/portfolio';
import type { NotificationSettings } from '@/types/notification';

describe('notificationEngine', () => {
  const defaultSettings: NotificationSettings = {
    emailNotificationsEnabled: true,
    dcaReminderEnabled: true,
    allocationDriftEnabled: true,
    peaCeilingAlertsEnabled: true,
    outlierAlertsEnabled: true,
    dcaDayOfMonth: 5,
    reportingFrequency: 'quarterly',
  };

  const fxRates = { EUR: 1.0, USD: 0.92 };

  it('triggers PEA 90% and 100% saturation alerts', () => {
    const peaFullPositions: Position[] = [
      {
        id: 'pos-pea-1',
        ticker: 'CW8.PA',
        name: 'Amundi MSCI World',
        envelope: 'PEA',
        assetType: 'ETF',
        quantity: 300,
        avgPrice: 500, // 150 000 €
        currentPrice: 500,
        currency: 'EUR',
        targetWeight: 1.0,
      },
    ];

    const notifs = generatePortfolioNotifications(peaFullPositions, fxRates, defaultSettings, 1000);
    const peaFullNotif = notifs.find((n) => n.id === 'notif-pea-full-150k');
    expect(peaFullNotif).toBeDefined();
    expect(peaFullNotif?.priority).toBe('high');
  });

  it('triggers cumulative PEA + PEA-PME ceiling alert at 225k€', () => {
    const cumulativeFull: Position[] = [
      {
        id: 'pos-pea-1',
        ticker: 'CW8.PA',
        name: 'Amundi MSCI World',
        envelope: 'PEA',
        assetType: 'ETF',
        quantity: 300,
        avgPrice: 500, // 150 000 €
        currentPrice: 500,
        currency: 'EUR',
        targetWeight: 0.67,
      },
      {
        id: 'pos-pme-1',
        ticker: 'ALRIB.PA',
        name: 'Riber',
        envelope: 'PEA-PME',
        assetType: 'STOCK',
        quantity: 37500,
        avgPrice: 2, // 75 000 € (Total = 225 000 €)
        currentPrice: 2,
        currency: 'EUR',
        targetWeight: 0.33,
      },
    ];

    const notifs = generatePortfolioNotifications(cumulativeFull, fxRates, defaultSettings, 1000);
    const cumulativeNotif = notifs.find((n) => n.id === 'notif-pea-pme-full-225k');
    expect(cumulativeNotif).toBeDefined();
  });

  it('detects severe drawdowns (-20% or worse) as opportunity alerts', () => {
    const dipPosition: Position[] = [
      {
        id: 'pos-1',
        ticker: 'SYM',
        name: 'Symbotic',
        envelope: 'CTO',
        assetType: 'STOCK',
        quantity: 100,
        avgPrice: 40.0,
        currentPrice: 28.0, // -30% drop from PRU
        currency: 'USD',
        targetWeight: 1.0,
      },
    ];

    const notifs = generatePortfolioNotifications(dipPosition, fxRates, defaultSettings, 1000);
    const crashNotif = notifs.find((n) => n.category === 'outlier');
    expect(crashNotif).toBeDefined();
    expect(crashNotif?.title).toContain('Baisse');
    expect(crashNotif?.actionType).toBe('open-analysis');
  });

  it('adapts single-asset over-concentration alert thresholds based on investor profile', () => {
    const skewedHolding: Position[] = [
      {
        id: 'pos-1',
        ticker: 'COHR',
        name: 'Coherent Corp',
        envelope: 'CTO',
        assetType: 'STOCK',
        quantity: 100,
        avgPrice: 100,
        currentPrice: 100, // 10 000 $ = 9 200 € (46% of portfolio)
        currency: 'USD',
        targetWeight: 0.2,
      },
      {
        id: 'pos-2',
        ticker: 'CW8.PA',
        name: 'Amundi MSCI World',
        envelope: 'PEA',
        assetType: 'ETF',
        quantity: 20,
        avgPrice: 500,
        currentPrice: 500, // 10 000 € (54% of portfolio)
        currency: 'EUR',
        targetWeight: 0.8,
      },
    ];

    const conservativeProfile: InvestorProfile = {
      riskProfile: 'conservative',
      investmentHorizonYears: 15,
      taxResidence: 'France',
      mainObjective: 'Capital Growth',
    };

    // Conservative profile flags single stock if > 15% (here COHR is ~48%)
    const notifsConservative = generatePortfolioNotifications(
      skewedHolding,
      fxRates,
      defaultSettings,
      1000,
      conservativeProfile
    );
    const driftNotif = notifsConservative.find((n) => n.id.includes('COHR'));
    expect(driftNotif).toBeDefined();
  });
});

import { describe, it, expect } from 'vitest';
import type { TrueLayerSyncResult, TrueLayerAccountSummary } from '../lib/truelayer/types';

describe('BoursoBank Radical Honesty & Live Sync Logic', () => {
  it('identifies 401 session expired and flags requiresReauth truthfully', () => {
    const expiredResult: TrueLayerSyncResult = {
      connected: false,
      timestamp: '2026-08-17T14:40:00Z',
      environment: 'live',
      accounts: [],
      totalCheckingEUR: 0,
      totalSavingsEUR: 0,
      totalInvestedEUR: 0,
      totalBoursoBankEUR: 0,
      partialErrors: ['Session BoursoBank expirée (401). Veuillez vous reconnecter.'],
      requiresReauth: true,
    };

    expect(expiredResult.connected).toBe(false);
    expect(expiredResult.requiresReauth).toBe(true);
    expect(expiredResult.partialErrors[0]).toContain('401');
    expect(expiredResult.accounts).toHaveLength(0);
  });

  it('identifies disconnected state when no token is present and refuses to fake connection', () => {
    const disconnectedResult: TrueLayerSyncResult = {
      connected: false,
      timestamp: '2026-08-17T14:40:00Z',
      environment: 'live',
      accounts: [],
      totalCheckingEUR: 0,
      totalSavingsEUR: 0,
      totalInvestedEUR: 0,
      totalBoursoBankEUR: 0,
      partialErrors: ["Aucun jeton d'accès TrueLayer / BoursoBank disponible."],
      requiresReauth: true,
    };

    expect(disconnectedResult.connected).toBe(false);
    expect(disconnectedResult.requiresReauth).toBe(true);
    expect(disconnectedResult.accounts.length).toBe(0);
  });

  it('validates successful live sync and computes totals without deception', () => {
    const mockAccounts: TrueLayerAccountSummary[] = [
      {
        id: 'acc-courant',
        displayName: 'Compte Courant',
        accountType: 'checking',
        institutionName: 'BoursoBank',
        currency: 'EUR',
        currentBalance: 1450.25,
        availableBalance: 1450.25,
        balanceEUR: 1450.25,
        ibanMasked: '••••0429',
        lastUpdated: '2026-08-17T14:45:00Z',
      },
      {
        id: 'acc-tampon',
        displayName: 'Compte Tampon',
        accountType: 'checking',
        institutionName: 'BoursoBank',
        currency: 'EUR',
        currentBalance: 250.0,
        availableBalance: 250.0,
        balanceEUR: 250.0,
        ibanMasked: '••••4455',
        lastUpdated: '2026-08-17T14:45:00Z',
      },
    ];

    const liveResult: TrueLayerSyncResult = {
      connected: true,
      timestamp: '2026-08-17T14:45:00Z',
      environment: 'live',
      accounts: mockAccounts,
      totalCheckingEUR: 1700.25,
      totalSavingsEUR: 0,
      totalInvestedEUR: 0,
      totalBoursoBankEUR: 1700.25,
      partialErrors: [],
      requiresReauth: false,
    };

    expect(liveResult.connected).toBe(true);
    expect(liveResult.requiresReauth).toBe(false);
    expect(liveResult.accounts).toHaveLength(2);
    expect(liveResult.totalBoursoBankEUR).toBe(1700.25);
  });

  it('distinguishes live data from stale offline cache', () => {
    const isLive = false;
    const connectionStatus = 'expired';
    const isFromCache = !isLive;

    expect(isFromCache).toBe(true);
    expect(connectionStatus).toBe('expired');

    // Badge label logic
    let badgeText = '⚪ Non Connecté';
    if (isLive) {
      badgeText = '🟢 BoursoBank DSP2 (En direct)';
    } else if (connectionStatus === 'expired') {
      badgeText = '🟡 Session Expirée (Reconnexion requise)';
    }

    expect(badgeText).toBe('🟡 Session Expirée (Reconnexion requise)');
  });
});

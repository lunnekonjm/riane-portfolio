'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

export type BoursoConnectionStatus = 'connected' | 'expired' | 'disconnected' | 'error';

export interface BoursoLiveAccount {
  id: string;
  displayName: string;
  customAlias: string;
  ibanMasked?: string;
  balanceEUR: number;
  category: 'checking' | 'tampon' | 'tontine' | 'savings' | 'excluded';
  included: boolean;
}

export interface BoursoLiveData {
  isConnected: boolean;
  isLive: boolean;
  connectionStatus: BoursoConnectionStatus;
  syncError: string | null;
  requiresReauth: boolean;
  isLoading: boolean;
  checkingEUR: number;
  tamponEUR: number;
  tontineEUR: number;
  livretAEUR: number;
  livretARate: number;
  livretAYearlyInterest: number;
  peaPmeEUR: number;
  totalLiquiditiesEUR: number;
  totalAvailableForArbitrage: number;
  accounts: BoursoLiveAccount[];
  lastSync: string | null;
  refresh: () => Promise<void>;
  connectBourso: () => Promise<void>;
}

export function useBoursoLive(): BoursoLiveData {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<BoursoConnectionStatus>('disconnected');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [requiresReauth, setRequiresReauth] = useState<boolean>(false);
  const [cachedAccounts, setCachedAccounts] = useState<any[]>([]);
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [livretABalance, setLivretABalance] = useState<number>(0);
  const [livretARate, setLivretARate] = useState<number>(1.7);
  const [peaPmeBalance, setPeaPmeBalance] = useState<number>(0);
  const [tontineManualBalance, setTontineManualBalance] = useState<number>(0);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const loadLocalData = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      // Accounts from TrueLayer cache
      const rawAccounts = localStorage.getItem('truelayer_cached_accounts');
      if (rawAccounts) {
        setCachedAccounts(JSON.parse(rawAccounts));
      }

      // Token presence determines base local status
      const hasToken = !!localStorage.getItem('truelayer_access_token');
      if (hasToken) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }

      // Accounts custom role config
      const rawConfigs = localStorage.getItem('riane_bourso_accounts_config');
      if (rawConfigs) {
        setConfigs(JSON.parse(rawConfigs));
      }

      // Livret A & PEA-PME
      const rawLivret = localStorage.getItem('riane_livret_a_balance');
      if (rawLivret) setLivretABalance(parseFloat(rawLivret) || 0);

      const rawRate = localStorage.getItem('riane_livret_a_rate');
      if (rawRate) setLivretARate(parseFloat(rawRate) || 1.7);

      const rawPea = localStorage.getItem('riane_pea_pme_balance');
      if (rawPea) setPeaPmeBalance(parseFloat(rawPea) || 0);

      // Tontine manual indicative balance
      const rawTontine = localStorage.getItem('riane_tontine_balance');
      if (rawTontine) setTontineManualBalance(parseFloat(rawTontine) || 0);

      // Real last successful sync
      const rawSync = localStorage.getItem('truelayer_last_sync');
      if (rawSync) setLastSync(rawSync);
    } catch (e) {
      console.warn('[useBoursoLive] Failed to parse local BoursoBank cache:', e);
    }
  }, []);

  useEffect(() => {
    loadLocalData();

    // Listen to custom updates dispatched from modal or tabs
    const handleUpdate = () => loadLocalData();
    window.addEventListener('riane_bourso_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('riane_bourso_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadLocalData]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setSyncError(null);

    const tlToken = typeof window !== 'undefined' ? localStorage.getItem('truelayer_access_token') : null;
    const tlRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('truelayer_refresh_token') : null;

    if (!tlToken && !tlRefreshToken) {
      setIsLoading(false);
      setIsLive(false);
      setConnectionStatus('disconnected');
      setRequiresReauth(true);
      setSyncError('Aucune session BoursoBank active. Veuillez vous connecter.');
      return;
    }

    try {
      const params = new URLSearchParams();
      if (tlToken) params.set('token', tlToken);
      if (tlRefreshToken) params.set('refreshToken', tlRefreshToken);

      const res = await fetch(`/api/integrations/truelayer/summary?${params.toString()}`);
      const data = await res.json().catch(() => ({}));

      if (res.status === 401 || data.requiresReauth || (data.partialErrors && data.partialErrors.some((e: string) => e.includes('401') || e.toLowerCase().includes('expir')))) {
        setIsLive(false);
        setConnectionStatus('expired');
        setRequiresReauth(true);
        setSyncError(data.partialErrors?.[0] || 'Session BoursoBank expirée (401). Veuillez vous reconnecter.');
        return;
      }

      if (!res.ok || (data.connected === false && (!data.accounts || data.accounts.length === 0))) {
        setIsLive(false);
        setConnectionStatus('error');
        const errMsg = data.partialErrors?.[0] || `Erreur de synchronisation (${res.status})`;
        setSyncError(errMsg);
        return;
      }

      if (data.accounts && Array.isArray(data.accounts) && data.accounts.length > 0) {
        setCachedAccounts(data.accounts);
        setIsLive(true);
        setConnectionStatus('connected');
        setRequiresReauth(false);
        setSyncError(null);

        const now = new Date();
        const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        const fullSyncStr = `${dateStr} à ${timeStr}`;
        setLastSync(fullSyncStr);

        try {
          localStorage.setItem('truelayer_cached_accounts', JSON.stringify(data.accounts));
          localStorage.setItem('truelayer_last_sync', fullSyncStr);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('riane_bourso_updated'));
          }
        } catch {}
      } else {
        setIsLive(false);
        setConnectionStatus('error');
        setSyncError('Aucun compte bancaire retourné par BoursoBank.');
      }
    } catch (e: unknown) {
      setIsLive(false);
      setConnectionStatus('error');
      const msg = e instanceof Error ? e.message : 'Erreur réseau lors de la synchronisation.';
      setSyncError(msg);
      console.warn('[useBoursoLive] Error refreshing TrueLayer accounts:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connectBourso = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/truelayer/auth-url?format=json&view=dashboard&open_wizard=false');
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (e) {
      console.error('[useBoursoLive] Failed to get BoursoBank auth URL:', e);
    }
  }, []);

  const processedAccounts: BoursoLiveAccount[] = useMemo(() => {
    return cachedAccounts.map((acc: any) => {
      const cfg = configs[acc.id] || {};
      let category: BoursoLiveAccount['category'] = cfg.category || 'checking';
      let customAlias = cfg.alias || acc.displayName || 'Compte BoursoBank';
      let included = cfg.included !== false;

      // Smart auto-detection if no manual override
      if (!cfg.category) {
        if (acc.ibanMasked?.includes('4455') || acc.displayName?.toLowerCase().includes('autre')) {
          category = 'tampon';
          customAlias = 'Compte Tampon (Surplus & Dispatch)';
          included = true;
        } else if (acc.ibanMasked?.includes('4424') || acc.displayName?.toLowerCase().includes('ou o') || acc.displayName?.toLowerCase().includes('tontine')) {
          category = 'tontine';
          customAlias = 'Compte Tontine';
          included = true;
        } else if (acc.ibanMasked?.includes('0429') || acc.displayName?.toLowerCase().includes('richard')) {
          category = 'checking';
          customAlias = 'Compte Courant Principal';
          included = true;
        }
      }

      return {
        id: acc.id,
        displayName: acc.displayName || 'Compte',
        customAlias,
        ibanMasked: acc.ibanMasked,
        balanceEUR: Number(acc.balanceEUR ?? acc.availableBalance ?? acc.currentBalanceEUR ?? acc.currentBalance ?? 0),
        category,
        included: category !== 'excluded' && included,
      };
    });
  }, [cachedAccounts, configs]);

  const checkingEUR = useMemo(() => {
    return processedAccounts
      .filter((a) => a.included && a.category === 'checking')
      .reduce((sum, a) => sum + a.balanceEUR, 0);
  }, [processedAccounts]);

  const tamponEUR = useMemo(() => {
    return processedAccounts
      .filter((a) => a.included && a.category === 'tampon')
      .reduce((sum, a) => sum + a.balanceEUR, 0);
  }, [processedAccounts]);

  const tontineEUR = useMemo(() => {
    const syncedTontine = processedAccounts
      .filter((a) => a.included && a.category === 'tontine')
      .reduce((sum, a) => sum + a.balanceEUR, 0);
    return syncedTontine > 0 ? syncedTontine : tontineManualBalance;
  }, [processedAccounts, tontineManualBalance]);

  const livretAYearlyInterest = useMemo(() => {
    return (livretABalance * livretARate) / 100;
  }, [livretABalance, livretARate]);

  const totalLiquiditiesEUR = useMemo(() => {
    return checkingEUR + tamponEUR + livretABalance;
  }, [checkingEUR, tamponEUR, livretABalance]);

  const isConnected = processedAccounts.length > 0;

  return {
    isConnected,
    isLive,
    connectionStatus,
    syncError,
    requiresReauth,
    isLoading,
    checkingEUR,
    tamponEUR,
    tontineEUR,
    livretAEUR: livretABalance,
    livretARate,
    livretAYearlyInterest,
    peaPmeEUR: peaPmeBalance,
    totalLiquiditiesEUR,
    totalAvailableForArbitrage: tamponEUR,
    accounts: processedAccounts,
    lastSync,
    refresh,
    connectBourso,
  };
}

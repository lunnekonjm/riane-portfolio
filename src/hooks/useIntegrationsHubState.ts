'use client';

import { useState, useEffect, useMemo } from 'react';
import type { SnapTradeSyncResult } from '@/lib/snaptrade/types';
import type { TrueLayerSyncResult } from '@/lib/truelayer/types';

export interface BoursoAccountConfig {
  alias?: string;
  category: 'checking' | 'tampon' | 'tontine' | 'savings' | 'investment' | 'excluded';
  included: boolean;
}

export interface UseIntegrationsHubStateParams {
  isOpen: boolean;
  fxRateEURUSD: number;
}

export function useIntegrationsHubState({ isOpen, fxRateEURUSD }: UseIntegrationsHubStateParams) {
  const [loading, setLoading] = useState(false);
  const [snaptradeData, setSnaptradeData] = useState<SnapTradeSyncResult | null>(null);
  const [truelayerData, setTruelayerData] = useState<TrueLayerSyncResult | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'ibkr' | 'boursobank' | 'traderepublic'>('overview');
  const [connectingBourso, setConnectingBourso] = useState(false);

  // Manual Livret A, PEA-PME & Tontine Indicative state
  const [livretABalanceInput, setLivretABalanceInput] = useState<string>(() => {
    if (typeof window === 'undefined') return '0';
    return localStorage.getItem('riane_livret_a_balance') || '0';
  });
  const [livretARateInput, setLivretARateInput] = useState<string>(() => {
    if (typeof window === 'undefined') return '1.7';
    return localStorage.getItem('riane_livret_a_rate') || '1.7';
  });
  const [peaPmeBalanceInput, setPeaPmeBalanceInput] = useState<string>(() => {
    if (typeof window === 'undefined') return '0';
    return localStorage.getItem('riane_pea_pme_balance') || '0';
  });
  const [tontineBalanceInput, setTontineBalanceInput] = useState<string>(() => {
    if (typeof window === 'undefined') return '0';
    return localStorage.getItem('riane_tontine_balance') || '0';
  });
  const [manualSavedSuccess, setManualSavedSuccess] = useState(false);

  const handleSaveManualAssets = () => {
    try {
      const livVal = parseFloat(livretABalanceInput.replace(',', '.')) || 0;
      const rateVal = parseFloat(livretARateInput.replace(',', '.')) || 1.7;
      const peaVal = parseFloat(peaPmeBalanceInput.replace(',', '.')) || 0;
      const tontineVal = parseFloat(tontineBalanceInput.replace(',', '.')) || 0;
      localStorage.setItem('riane_livret_a_balance', livVal.toString());
      localStorage.setItem('riane_livret_a_rate', rateVal.toString());
      localStorage.setItem('riane_pea_pme_balance', peaVal.toString());
      localStorage.setItem('riane_tontine_balance', tontineVal.toString());
      setManualSavedSuccess(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('riane_bourso_updated'));
      }
      setTimeout(() => setManualSavedSuccess(false), 3500);
    } catch (e) {
      console.error('Erreur sauvegarde manuelle Livret/PEA/Tontine:', e);
    }
  };

  const livretABalance = parseFloat(livretABalanceInput.replace(',', '.')) || 0;
  const livretARate = parseFloat(livretARateInput.replace(',', '.')) || 1.7;
  const peaPmeBalance = parseFloat(peaPmeBalanceInput.replace(',', '.')) || 0;
  const livretAYearlyInterest = (livretABalance * livretARate) / 100;

  const [boursoConfigs, setBoursoConfigs] = useState<Record<string, BoursoAccountConfig>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem('riane_bourso_accounts_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const saveBoursoConfig = (accId: string, newConfig: Partial<BoursoAccountConfig>) => {
    setBoursoConfigs((prev) => {
      const current = prev[accId] || { category: 'checking', included: true };
      const updated = {
        ...prev,
        [accId]: {
          ...current,
          ...newConfig,
        },
      };
      try {
        localStorage.setItem('riane_bourso_accounts_config', JSON.stringify(updated));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('riane_bourso_updated'));
        }
      } catch {}
      return updated;
    });
  };

  const getAccountConfig = (acc: { id: string; displayName: string; ibanMasked?: string; accountType: string }): BoursoAccountConfig => {
    if (boursoConfigs[acc.id]) return boursoConfigs[acc.id];
    if (acc.ibanMasked?.includes('4455') || acc.displayName.toLowerCase().includes('autre')) {
      return { alias: 'Compte Tampon (Surplus & Dispatch)', category: 'tampon', included: true };
    }
    if (acc.ibanMasked?.includes('4424') || acc.displayName.toLowerCase().includes('ou o') || acc.displayName.toLowerCase().includes('tontine')) {
      return { alias: 'Compte Tontine (M ou Mme)', category: 'tontine', included: true };
    }
    if (acc.ibanMasked?.includes('0429') || acc.displayName.toLowerCase().includes('richard')) {
      return { alias: 'Compte Courant Principal', category: 'checking', included: true };
    }
    return { alias: acc.displayName, category: 'checking', included: true };
  };

  const handleConnectBourso = async () => {
    setConnectingBourso(true);
    try {
      const res = await fetch('/api/integrations/truelayer/auth-url?format=json');
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      console.error('Erreur TrueLayer Auth:', err);
    } finally {
      setConnectingBourso(false);
    }
  };

  const syncAll = async () => {
    setLoading(true);
    try {
      const tlToken = typeof window !== 'undefined' ? localStorage.getItem('truelayer_access_token') : null;
      const url = `/api/integrations/sync-all?fxRate=${fxRateEURUSD}${tlToken ? `&truelayerToken=${encodeURIComponent(tlToken)}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSnaptradeData(data.snaptrade);
        setTruelayerData(data.truelayer);
        const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncTime(timeStr);
        if (data.truelayer?.accounts && Array.isArray(data.truelayer.accounts)) {
          try {
            localStorage.setItem('truelayer_cached_accounts', JSON.stringify(data.truelayer.accounts));
            localStorage.setItem('truelayer_last_sync', timeStr);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('riane_bourso_updated'));
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error('Erreur lors de la synchronisation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      syncAll();
    }
  }, [isOpen]);

  const ibkrTotalEUR = snaptradeData?.totalPortfolioEUR || 0;
  const ibkrCashEUR = snaptradeData?.totalCashEUR || 0;
  const ibkrInvestedEUR = snaptradeData?.totalInvestedEUR || 0;

  const rawBoursoAccounts = truelayerData?.accounts || [];
  const processedBoursoAccounts = useMemo(() => {
    return rawBoursoAccounts.map((acc) => {
      const cfg = getAccountConfig(acc);
      return {
        ...acc,
        customAlias: cfg.alias || acc.displayName,
        effectiveCategory: cfg.category,
        isIncluded: cfg.included && cfg.category !== 'excluded',
      };
    });
  }, [rawBoursoAccounts, boursoConfigs]);

  const includedBoursoAccounts = useMemo(
    () => processedBoursoAccounts.filter((a) => a.isIncluded),
    [processedBoursoAccounts]
  );

  const boursoCheckingEUR = includedBoursoAccounts
    .filter((a) => a.effectiveCategory === 'checking')
    .reduce((sum, a) => sum + a.balanceEUR, 0);

  const boursoTamponEUR = includedBoursoAccounts
    .filter((a) => a.effectiveCategory === 'tampon')
    .reduce((sum, a) => sum + a.balanceEUR, 0);

  const boursoTontineEUR = includedBoursoAccounts
    .filter((a) => a.effectiveCategory === 'tontine')
    .reduce((sum, a) => sum + a.balanceEUR, 0);

  const boursoSavingsEUR =
    includedBoursoAccounts
      .filter((a) => a.effectiveCategory === 'savings')
      .reduce((sum, a) => sum + a.balanceEUR, 0) + livretABalance;

  const boursoInvestedEUR =
    includedBoursoAccounts
      .filter((a) => a.effectiveCategory === 'investment')
      .reduce((sum, a) => sum + a.balanceEUR, 0) + peaPmeBalance;

  const boursoTotalEUR =
    includedBoursoAccounts.reduce((sum, a) => sum + a.balanceEUR, 0) + livretABalance + peaPmeBalance;
  const consolidatedTotalEUR = ibkrTotalEUR + boursoTotalEUR;
  const isIbkrConnected = !!(snaptradeData?.authorizations && snaptradeData.authorizations.length > 0);

  const formatEUR = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

  return {
    loading,
    snaptradeData,
    truelayerData,
    lastSyncTime,
    activeTab,
    setActiveTab,
    connectingBourso,
    livretABalanceInput,
    setLivretABalanceInput,
    livretARateInput,
    setLivretARateInput,
    peaPmeBalanceInput,
    setPeaPmeBalanceInput,
    tontineBalanceInput,
    setTontineBalanceInput,
    manualSavedSuccess,
    handleSaveManualAssets,
    livretAYearlyInterest,
    processedBoursoAccounts,
    saveBoursoConfig,
    handleConnectBourso,
    syncAll,
    ibkrTotalEUR,
    ibkrCashEUR,
    ibkrInvestedEUR,
    boursoCheckingEUR,
    boursoTamponEUR,
    boursoTontineEUR,
    boursoSavingsEUR,
    boursoInvestedEUR,
    boursoTotalEUR,
    consolidatedTotalEUR,
    isIbkrConnected,
    formatEUR,
  };
}

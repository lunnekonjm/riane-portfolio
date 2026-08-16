'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthChange } from '@/services/firebase/auth';
import {
  getPositions,
  getPortfolioConfig,
  initializeUserData,
  saveAllPositions,
  savePosition,
  deletePosition as deletePositionFromDb,
  savePortfolioConfig,
  getInvestorProfile,
  saveInvestorProfile as saveInvestorProfileToDb,
} from '@/services/firebase/firestore';
import { DEFAULT_POSITIONS } from '@/data/portfolio';
import { getMultipleQuotes, getFxRates } from '@/services/market-data/provider';
import type { Position, PortfolioConfig, TransactionRecord, InvestorProfile } from '@/types/portfolio';
import type { User } from 'firebase/auth';
import { clearAnalysisCache } from '@/utils/analysisCache';
import { clearMarketCache } from '@/services/market-data/cache';
import { computeSavingsPositionInterest, REGULATED_SAVINGS_METADATA } from '@/engines/savingsInterestEngine';
import { getActiveDCATranche } from '@/utils/dcaHistoryHelper';
import { sanitizeCryptoPosition } from '@/utils/cryptoWalletEngine';

export function usePortfolio() {
  const [user, setUser] = useState<User | null>(null);

  const [positions, setPositions] = useState<Position[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('riane_local_positions');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(sanitizeCryptoPosition);
        }
      } catch (e) {
        console.warn('[usePortfolio] Failed to load local positions:', e);
      }
    }
    return DEFAULT_POSITIONS;
  });

  const [config, setConfig] = useState<PortfolioConfig | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('riane_portfolio_config');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('[usePortfolio] Failed to load local config:', e);
      }
    }
    return {
      monthlyBudget: 1000,
      annualCTOBudget: 8000,
      annualSpeculativeCap: 2000,
      riskProfile: 'dynamic',
      noLeverage: true,
      rebalanceByFlows: true,
      baseCurrency: 'EUR',
      horizonYears: 15,
    };
  });

  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('riane_investor_profile');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('[usePortfolio] Failed to load local investor profile:', e);
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const pricesFetched = useRef(false);

  const [fxRates, setFxRates] = useState<Record<string, number>>({ EUR: 1.0, USD: 0.92, GBP: 1.18, CHF: 1.04 });

  useEffect(() => {
    const unsubscribe = onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        try {
          await initializeUserData(u.uid);
          const [pos, cfg, profile] = await Promise.all([
            getPositions(u.uid),
            getPortfolioConfig(u.uid),
            getInvestorProfile(u.uid),
          ]);

          // Smart merge positions: keep local edits if newer than remote
          let localPos: Position[] = [];
          if (typeof window !== 'undefined') {
            try {
              const saved = localStorage.getItem('riane_local_positions');
              if (saved) localPos = JSON.parse(saved);
            } catch {}
          }

          const posMap = new Map<string, Position>();
          (pos || []).forEach((p) => posMap.set(p.id || p.ticker, p));

          (localPos || []).forEach((lp) => {
            const existingRemote = posMap.get(lp.id || lp.ticker);
            if (
              !existingRemote ||
              (lp.updatedAt && (!existingRemote.updatedAt || lp.updatedAt >= existingRemote.updatedAt))
            ) {
              posMap.set(lp.id || lp.ticker, lp);
            }
          });

          const mergedPos = Array.from(posMap.values()).map(sanitizeCryptoPosition);
          if (mergedPos.length > 0) {
            setPositions(mergedPos);
            try { localStorage.setItem('riane_local_positions', JSON.stringify(mergedPos)); } catch {}
            saveAllPositions(u.uid, mergedPos).catch((err) => console.warn('[usePortfolio] Cloud sync merge error:', err));
          }

          if (cfg) {
            setConfig(cfg);
            try { localStorage.setItem('riane_portfolio_config', JSON.stringify(cfg)); } catch {}
          } else if (config) {
            await savePortfolioConfig(u.uid, config);
          }

          if (profile) {
            setInvestorProfile(profile);
            try { localStorage.setItem('riane_investor_profile', JSON.stringify(profile)); } catch {}
          } else if (investorProfile) {
            await saveInvestorProfileToDb(u.uid, investorProfile);
          }
        } catch (err) {
          console.error('Error syncing portfolio with Firestore:', err);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ── Auto-fetch real market prices & FX rates on first load ──
  useEffect(() => {
    if (positions.length > 0 && !pricesFetched.current && !loading) {
      pricesFetched.current = true;
      refreshPricesInternal(positions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, loading]);

  const [lastPricesUpdated, setLastPricesUpdated] = useState<number | null>(null);
  const [marketStatusLabel, setMarketStatusLabel] = useState<string>('🔒 Cours de Clôture Officielle (Marché Fermé)');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const syncOnChainWallets = async (currentPositions: Position[]): Promise<Position[]> => {
    const cryptoPositions = currentPositions.filter(
      (p) => (p.assetType === 'CRYPTO' || p.envelope === 'CRYPTO') && p.cryptoWallets && p.cryptoWallets.length > 0
    );
    if (cryptoPositions.length === 0) return currentPositions;

    const updatedPositions = [...currentPositions];

    for (let i = 0; i < updatedPositions.length; i++) {
      const pos = updatedPositions[i];
      if ((pos.assetType === 'CRYPTO' || pos.envelope === 'CRYPTO') && pos.cryptoWallets && pos.cryptoWallets.length > 0) {
        let hasChanges = false;
        const newWallets = [...pos.cryptoWallets];

        for (let j = 0; j < newWallets.length; j++) {
          const wallet = newWallets[j];
          if (wallet.publicAddress && wallet.publicAddress.trim()) {
            try {
              const res = await fetch('/api/integrations/crypto-onchain/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  address: wallet.publicAddress.trim(),
                  institution: wallet.institution || wallet.walletName,
                }),
              });
              if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.assets)) {
                  const cleanTicker = pos.ticker.toUpperCase().replace('-EUR', '').replace('-USD', '');
                  const matchingAsset = data.assets.find(
                    (a: any) =>
                      a.ticker.toUpperCase() === pos.ticker.toUpperCase() ||
                      a.ticker.toUpperCase() === cleanTicker ||
                      a.symbol?.toUpperCase() === cleanTicker
                  );
                  if (matchingAsset && typeof matchingAsset.balance === 'number') {
                    newWallets[j] = {
                      ...wallet,
                      quantity: matchingAsset.balance,
                      lastSyncedAt: Date.now(),
                    };
                    hasChanges = true;
                  }
                }
              }
            } catch (err) {
              console.warn(`[usePortfolio] On-chain sync failed for ${wallet.publicAddress}:`, err);
            }
          }
        }

        if (hasChanges) {
          const newTotalQty = newWallets.reduce((sum, w) => sum + w.quantity, 0);
          updatedPositions[i] = {
            ...pos,
            quantity: newTotalQty,
            cryptoWallets: newWallets,
            updatedAt: Date.now(),
          };
        }
      }
    }

    return updatedPositions;
  };

  const refreshPricesInternal = async (currentPositions: Position[], force = false, rescanOnChain = false): Promise<Position[]> => {
    if (force) {
      clearMarketCache();
      clearAnalysisCache();
    }

    let workingPositions = currentPositions;
    if (rescanOnChain) {
      workingPositions = await syncOnChainWallets(workingPositions);
    }

    const tickers = workingPositions.map((p) => p.ticker);
    try {
      const [quotes, rates] = await Promise.all([
        getMultipleQuotes(tickers),
        getFxRates(),
      ]);

      if (rates) {
        setFxRates((prev) => ({ ...prev, ...rates }));
      }

      let updatedList = workingPositions;
      if (quotes.size > 0) {
        const firstQuote = Array.from(quotes.values())[0];
        if (firstQuote?.quoteTypeLabel) {
          setMarketStatusLabel(firstQuote.quoteTypeLabel);
        }

        updatedList = workingPositions.map((p) => {
          const quote = quotes.get(p.ticker);
          if (quote && quote.price > 0) {
            return { ...p, currentPrice: quote.price };
          }
          return p;
        });
      }

      setPositions(updatedList);
      setLastPricesUpdated(Date.now());

      try {
        localStorage.setItem('riane_local_positions', JSON.stringify(updatedList));
      } catch {}

      if (user) {
        try {
          await saveAllPositions(user.uid, updatedList);
        } catch (err) {
          console.warn('[Portfolio] Firestore update failed during price refresh:', err);
        }
      }

      return updatedList;
    } catch (err) {
      console.warn('[Portfolio] Price refresh failed:', err);
      return workingPositions;
    }
  };

  const [historyStack, setHistoryStack] = useState<Position[][]>([]);
  const [redoStack, setRedoStack] = useState<Position[][]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  // Load transactions from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('riane_transaction_history');
      if (raw) setTransactions(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const recordTransaction = useCallback((record: Omit<TransactionRecord, 'id' | 'date' | 'timestamp'>) => {
    const newRecord: TransactionRecord = {
      ...record,
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }),
    };
    setTransactions((prev) => {
      const updated = [newRecord, ...prev].slice(0, 100);
      try {
        localStorage.setItem('riane_transaction_history', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const pushSnapshot = useCallback(() => {
    if (positions.length > 0) {
      setHistoryStack((prev) => [JSON.parse(JSON.stringify(positions)), ...prev].slice(0, 15));
      setRedoStack([]); // Clear redo stack on new explicit action
    }
  }, [positions]);

  const undoLastAction = useCallback(async () => {
    if (historyStack.length === 0) return false;
    const previousState = historyStack[0];
    const newHistory = historyStack.slice(1);

    setRedoStack((prev) => [JSON.parse(JSON.stringify(positions)), ...prev].slice(0, 15));
    setHistoryStack(newHistory);
    setPositions(previousState);

    try {
      localStorage.setItem('riane_local_positions', JSON.stringify(previousState));
    } catch {
      // ignore
    }

    if (user) {
      try {
        await saveAllPositions(user.uid, previousState);
      } catch (err) {
        console.warn('[Portfolio] Undo save failed:', err);
      }
    }
    clearAnalysisCache();
    return true;
  }, [historyStack, positions, user]);

  const redoLastAction = useCallback(async () => {
    if (redoStack.length === 0) return false;
    const nextState = redoStack[0];
    const newRedo = redoStack.slice(1);

    setHistoryStack((prev) => [JSON.parse(JSON.stringify(positions)), ...prev].slice(0, 15));
    setRedoStack(newRedo);
    setPositions(nextState);

    try {
      localStorage.setItem('riane_local_positions', JSON.stringify(nextState));
    } catch {
      // ignore
    }

    if (user) {
      try {
        await saveAllPositions(user.uid, nextState);
      } catch (err) {
        console.warn('[Portfolio] Redo save failed:', err);
      }
    }
    clearAnalysisCache();
    return true;
  }, [redoStack, positions, user]);

  // ── CRUD ──
  const addPosition = useCallback(async (pos: Position) => {
    pushSnapshot();
    setSaving(true);
    clearAnalysisCache();
    // Guarantee quantity >= 1 and valid PRU
    const validPos: Position = sanitizeCryptoPosition({
      ...pos,
      quantity: pos.quantity || 0,
      avgPrice: pos.avgPrice || 0,
      updatedAt: Date.now(),
    });

    if (validPos.quantity > 0) {
      recordTransaction({
        positionId: validPos.id,
        ticker: validPos.ticker,
        name: validPos.name,
        type: 'BUY',
        sharesDelta: validPos.quantity,
        price: validPos.avgPrice || validPos.currentPrice || 1,
        totalAmount: validPos.quantity * (validPos.avgPrice || validPos.currentPrice || 1),
        currency: validPos.currency,
        reason: 'Création initiale de position',
      });
    }

    setPositions((prev) => {
      const filtered = prev.filter((p) => p.id !== validPos.id);
      const updated = [...filtered, validPos];
      try {
        localStorage.setItem('riane_local_positions', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    if (user) {
      try {
        await savePosition(user.uid, validPos);
      } catch (err) {
        console.warn('[Portfolio] Firestore save failed, kept in local state:', err);
      }
    }
    setSaving(false);
  }, [user, pushSnapshot, recordTransaction]);

  const updatePosition = useCallback(async (pos: Position, customReason?: string) => {
    pushSnapshot();
    setSaving(true);
    clearAnalysisCache();

    const updatedPos: Position = sanitizeCryptoPosition({
      ...pos,
      updatedAt: Date.now(),
    });

    // Log transaction automatically if quantity or PRU changed
    const existing = positions.find((p) => p.id === updatedPos.id || p.ticker === updatedPos.ticker);
    const oldQty = existing ? existing.quantity : 0;
    const sharesDelta = updatedPos.quantity - oldQty;
    const price = updatedPos.currentPrice || updatedPos.avgPrice || 1;

    if (sharesDelta !== 0 || (existing && existing.avgPrice !== updatedPos.avgPrice && updatedPos.avgPrice > 0)) {
      recordTransaction({
        positionId: updatedPos.id,
        ticker: updatedPos.ticker,
        name: updatedPos.name,
        type: sharesDelta > 0 ? 'BUY' : sharesDelta < 0 ? 'SELL' : 'REBALANCE',
        sharesDelta: sharesDelta !== 0 ? sharesDelta : updatedPos.quantity,
        price,
        totalAmount: Math.abs((sharesDelta !== 0 ? sharesDelta : updatedPos.quantity) * price),
        currency: updatedPos.currency,
        reason: customReason || (sharesDelta > 0 ? `Ajustement / Achat ponctuel (+${sharesDelta} part${Math.abs(sharesDelta) > 1 ? 's' : ''})` : sharesDelta < 0 ? `Arbitrage / Vente (${sharesDelta} part${Math.abs(sharesDelta) > 1 ? 's' : ''})` : `Modification du PRU à ${updatedPos.avgPrice} ${updatedPos.currency}`),
      });
    }

    setPositions((prev) => {
      const updated = prev.map((p) => (p.id === updatedPos.id ? updatedPos : p));
      try {
        localStorage.setItem('riane_local_positions', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    if (user) {
      try {
        await savePosition(user.uid, updatedPos);
      } catch (err) {
        console.warn('[Portfolio] Firestore update failed, kept in local state:', err);
      }
    }
    setSaving(false);
  }, [user, positions, pushSnapshot, recordTransaction]);

  const removePosition = useCallback(async (positionId: string) => {
    pushSnapshot();
    setSaving(true);
    clearAnalysisCache();

    const existing = positions.find((p) => p.id === positionId);
    if (existing && existing.quantity > 0) {
      recordTransaction({
        positionId: existing.id,
        ticker: existing.ticker,
        name: existing.name,
        type: 'SELL',
        sharesDelta: -existing.quantity,
        price: existing.currentPrice || existing.avgPrice || 1,
        totalAmount: existing.quantity * (existing.currentPrice || existing.avgPrice || 1),
        currency: existing.currency,
        reason: 'Suppression / Liquidation de la position',
      });
    }

    setPositions((prev) => {
      const updated = prev.filter((p) => p.id !== positionId);
      try {
        localStorage.setItem('riane_local_positions', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    if (user) {
      try {
        await deletePositionFromDb(user.uid, positionId);
      } catch (err) {
        console.warn('[Portfolio] Firestore delete failed:', err);
      }
    }
    setSaving(false);
  }, [user, positions, pushSnapshot, recordTransaction]);

  const updateConfig = useCallback(async (newConfig: PortfolioConfig) => {
    setSaving(true);
    clearAnalysisCache();
    setConfig(newConfig);
    try {
      localStorage.setItem('riane_portfolio_config', JSON.stringify(newConfig));
    } catch {
      // ignore
    }
    if (user) {
      try {
        await savePortfolioConfig(user.uid, newConfig);
      } catch (err) {
        console.error('Error updating config in Firestore:', err);
      }
    }
    setSaving(false);
  }, [user]);

  const refreshAllPortfolios = useCallback(async (options?: { forceOnChain?: boolean }) => {
    setRefreshing(true);
    try {
      const updatedList = await refreshPricesInternal(positions, true, options?.forceOnChain !== false);
      return {
        success: true,
        marketCount: updatedList.filter((p) => !['LIVRET', 'ASSURANCE_VIE', 'PER', 'PEE', 'IMMOBILIER', 'CRYPTO'].includes(p.envelope) && p.assetType !== 'CRYPTO').length,
        cryptoCount: updatedList.filter((p) => p.envelope === 'CRYPTO' || p.assetType === 'CRYPTO').length,
        savingsCount: updatedList.filter((p) => ['LIVRET', 'ASSURANCE_VIE', 'PER', 'PEE', 'IMMOBILIER'].includes(p.envelope)).length,
        totalUpdated: updatedList.length,
      };
    } finally {
      setRefreshing(false);
    }
  }, [positions, user]);

  const refreshMarketPrices = useCallback(async () => {
    setRefreshing(true);
    clearMarketCache();
    clearAnalysisCache();
    try {
      const marketPositions = positions.filter((p) => !['LIVRET', 'ASSURANCE_VIE', 'PER', 'PEE', 'IMMOBILIER', 'CRYPTO'].includes(p.envelope) && p.assetType !== 'CRYPTO');
      const tickers = marketPositions.map((p) => p.ticker);
      const [quotes, rates] = await Promise.all([
        getMultipleQuotes(tickers),
        getFxRates(),
      ]);

      if (rates) {
        setFxRates((prev) => ({ ...prev, ...rates }));
      }

      const updated = positions.map((p) => {
        const quote = quotes.get(p.ticker);
        if (quote && quote.price > 0) {
          return { ...p, currentPrice: quote.price };
        }
        return p;
      });

      setPositions(updated);
      setLastPricesUpdated(Date.now());
      try {
        localStorage.setItem('riane_local_positions', JSON.stringify(updated));
      } catch {}
      if (user) {
        saveAllPositions(user.uid, updated).catch(() => {});
      }
      return { success: true, count: marketPositions.length };
    } finally {
      setRefreshing(false);
    }
  }, [positions, user]);

  const refreshCryptoPrices = useCallback(async (forceOnChain: boolean = true) => {
    setRefreshing(true);
    clearMarketCache();
    clearAnalysisCache();
    try {
      let currentPos = positions;
      if (forceOnChain) {
        currentPos = await syncOnChainWallets(currentPos);
      }

      const cryptoPositions = currentPos.filter((p) => p.envelope === 'CRYPTO' || p.assetType === 'CRYPTO');
      const tickers = cryptoPositions.map((p) => p.ticker);
      const quotes = await getMultipleQuotes(tickers);

      const updated = currentPos.map((p) => {
        const quote = quotes.get(p.ticker);
        if (quote && quote.price > 0) {
          return { ...p, currentPrice: quote.price };
        }
        return p;
      });

      setPositions(updated);
      setLastPricesUpdated(Date.now());
      try {
        localStorage.setItem('riane_local_positions', JSON.stringify(updated));
      } catch {}
      if (user) {
        saveAllPositions(user.uid, updated).catch(() => {});
      }
      return { success: true, count: cryptoPositions.length };
    } finally {
      setRefreshing(false);
    }
  }, [positions, user]);

  const refreshSavingsPrices = useCallback(async () => {
    setLastPricesUpdated(Date.now());
    const savingsCount = positions.filter((p) => ['LIVRET', 'ASSURANCE_VIE', 'PER', 'PEE', 'IMMOBILIER'].includes(p.envelope)).length;
    return { success: true, count: savingsCount };
  }, [positions]);

  const refreshPrices = useCallback(async () => {
    await refreshPricesInternal(positions);
  }, [positions]);

  // ── Reset Portfolio (instant local reset + async sync) ──
  const resetPortfolio = useCallback(async () => {
    setSaving(true);
    clearAnalysisCache();

    // 1. Immediately reset local React state & localStorage
    setPositions([]);
    setTransactions([]);
    setHistoryStack([]);
    setRedoStack([]);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('riane_transaction_history');
      localStorage.removeItem('riane_local_positions');
      localStorage.removeItem('riane_portfolio_config');
      localStorage.removeItem('riane_investor_profile');
      localStorage.removeItem('riane_saved_reports');
    }

    // 2. Async non-blocking Firestore reset — delete all positions
    if (user) {
      try {
        for (const pos of positions) {
          deletePositionFromDb(user.uid, pos.id).catch(() => {});
        }
      } catch (err) {
        console.warn('[Portfolio] Firestore reset warning:', err);
      }
    }

    setSaving(false);
  }, [user, positions]);

  // ── Computed Values (only from REAL user data with FX conversion) ──

  /** Only positions where user has entered real data */
  const filledPositions = positions.filter((p) => {
    if (['LIVRET', 'ASSURANCE_VIE', 'PER', 'PEE', 'IMMOBILIER'].includes(p.envelope)) {
      return p.quantity > 0 && ((p.avgPrice || 0) > 0 || (p.monthlyDCA || 0) > 0);
    }
    return p.quantity > 0 && p.avgPrice > 0;
  });

  /** How many positions still need user input */
  const pendingCount = positions.length - filledPositions.length;

  const [peaSeniority, setPeaSeniority] = useState<'over5' | 'under5'>('over5');

  const activePositions = positions.filter((p) => p.quantity > 0);

  const marketPos = activePositions.filter((p) => !['LIVRET', 'ASSURANCE_VIE', 'PER', 'PEE', 'IMMOBILIER'].includes(p.envelope));
  const savingsPos = activePositions.filter((p) => ['LIVRET', 'ASSURANCE_VIE', 'PER', 'PEE', 'IMMOBILIER'].includes(p.envelope));

  const marketVal = marketPos.reduce((sum, p) => {
    const price = p.currentPrice || p.avgPrice || 0;
    const rate = fxRates[p.currency] || 1.0;
    return sum + p.quantity * price * rate;
  }, 0);

  const marketCostVal = marketPos.reduce((sum, p) => {
    const rate = fxRates[p.currency] || 1.0;
    return sum + p.quantity * (p.avgPrice || 0) * rate;
  }, 0);

  const marketGain = marketVal - marketCostVal;
  const marketDCAVal = marketPos.reduce((sum, p) => {
    const active = p.dcaHistory && p.dcaHistory.length > 0 ? getActiveDCATranche(p.dcaHistory) : null;
    const eff = active ? active.amount : (p.monthlyDCA || (p.annualBudget ? Math.round(p.annualBudget / 12) : 0));
    return sum + (eff || 0);
  }, 0);

  const savingsCalcs = savingsPos.map((p) => computeSavingsPositionInterest(p));
  const savingsVal = savingsCalcs.reduce((sum, c) => sum + c.currentBalance, 0);
  const savingsCostVal = savingsCalcs.reduce((sum, c) => sum + c.principalDeposited, 0);
  const savingsGain = savingsVal - savingsCostVal;
  const savingsAnnualInt = savingsCalcs.reduce((sum, c) => sum + c.projectedAnnualInterest, 0);
  const savingsDCAVal = savingsPos.reduce((sum, p) => {
    const active = p.dcaHistory && p.dcaHistory.length > 0 ? getActiveDCATranche(p.dcaHistory) : null;
    const eff = active ? active.amount : (p.monthlyDCA || (p.annualBudget ? Math.round(p.annualBudget / 12) : 0));
    return sum + (eff || 0);
  }, 0);

  const totalValue = marketVal + savingsVal;
  const totalCost = marketCostVal + savingsCostVal;

  const netLiquidationDetails = (() => {
    let totalGrossValue = 0;
    let totalCostBase = 0;
    let totalGrossGain = 0;
    let totalEstimatedTax = 0;
    let peaTax = 0;
    let ctoTax = 0;

    activePositions.forEach((p) => {
      const isMarket = ['PEA', 'PEA-PME', 'CTO', 'SPECULATIVE', 'OPPORTUNISTIC'].includes(p.envelope);
      const rateToEUR = fxRates[p.currency] || 1.0;

      let val = 0;
      let cost = 0;

      if (isMarket) {
        const price = p.currentPrice || p.avgPrice || 0;
        val = p.quantity * price * rateToEUR;
        cost = p.quantity * (p.avgPrice || 0) * rateToEUR;
      } else {
        const { currentBalance, principalDeposited } = computeSavingsPositionInterest(p);
        val = currentBalance * rateToEUR;
        cost = principalDeposited * rateToEUR;
      }

      totalGrossValue += val;
      totalCostBase += cost;

      const gain = val - cost;
      totalGrossGain += gain;

      if (gain > 0) {
        if (p.envelope === 'PEA' || p.envelope === 'PEA-PME') {
          // 2026 tax reform: 18.6% social contributions
          const rate = peaSeniority === 'over5' ? 0.186 : 0.314;
          const tax = gain * rate;
          peaTax += tax;
          totalEstimatedTax += tax;
        } else if (p.envelope === 'CTO' || p.envelope === 'SPECULATIVE' || p.envelope === 'OPPORTUNISTIC') {
          // 2026 tax reform: 31.4% PFU
          const tax = gain * 0.314;
          ctoTax += tax;
          totalEstimatedTax += tax;
        } else if (!isMarket) {
          const metaKey = p.name.toUpperCase().includes('LEP') ? 'LEP' : p.envelope;
          const metadata = REGULATED_SAVINGS_METADATA[metaKey] || { taxFree: true };
          if (!metadata.taxFree) {
            // Assurance-Vie, SCPI, etc. (Some were spared by the 2026 reform and stayed at 30%)
            const tax = gain * 0.30;
            totalEstimatedTax += tax;
          }
        }
      }
    });

    return {
      totalGrossValue,
      totalCostBase,
      totalGrossGain,
      totalEstimatedTax,
      peaTax,
      ctoTax,
      totalNetValue: totalGrossValue - totalEstimatedTax,
      totalNetGain: totalGrossGain - totalEstimatedTax,
    };
  })();

  const monthlyDCATotal = positions.reduce((sum, p) => {
    const monthlyVal = p.monthlyDCA || (p.annualBudget ? p.annualBudget / 12 : 0);
    return sum + monthlyVal;
  }, 0);

  const positionsByEnvelope = positions.reduce((acc, p) => {
    if (!acc[p.envelope]) acc[p.envelope] = [];
    acc[p.envelope].push(p);
    return acc;
  }, {} as Record<string, Position[]>);

  const updateInvestorProfile = useCallback(async (profile: InvestorProfile) => {
    setSaving(true);
    setInvestorProfile(profile);
    try {
      localStorage.setItem('riane_investor_profile', JSON.stringify(profile));
    } catch {
      // ignore
    }

    const updatedConfig: PortfolioConfig = {
      ...(config || {
        monthlyBudget: 1000,
        annualCTOBudget: 8000,
        annualSpeculativeCap: 2000,
        riskProfile: 'dynamic',
        noLeverage: true,
        rebalanceByFlows: true,
        baseCurrency: 'EUR',
        horizonYears: 15,
      }),
      riskProfile: profile.riskProfile,
      horizonYears: profile.horizonYears,
      monthlyBudget: profile.monthlyBudget,
    };
    setConfig(updatedConfig);
    try {
      localStorage.setItem('riane_portfolio_config', JSON.stringify(updatedConfig));
    } catch {
      // ignore
    }

    if (user) {
      try {
        await saveInvestorProfileToDb(user.uid, profile);
        await savePortfolioConfig(user.uid, updatedConfig);
      } catch (err) {
        console.error('Error saving investor profile in Firestore:', err);
      }
    }
    setSaving(false);
  }, [user, config]);

  const isOnboardingPending = !investorProfile || !investorProfile.onboardingCompleted;

  return {
    user,
    positions,
    config,
    investorProfile,
    isOnboardingPending,
    loading,
    saving,
    fxRates,
    lastPricesUpdated,
    marketStatusLabel,
    totalValue,
    totalCost,
    gainLoss: totalValue - totalCost,
    gainLossPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    marketVal,
    marketCostVal,
    marketGain,
    marketDCAVal,
    savingsVal,
    savingsCostVal,
    savingsGain,
    savingsAnnualInt,
    savingsDCAVal,
    netLiquidationDetails,
    peaSeniority,
    setPeaSeniority,
    monthlyDCATotal,
    pendingCount,
    filledPositions,
    positionsByEnvelope,
    canUndo: historyStack.length > 0,
    undoLastAction,
    canRedo: redoStack.length > 0,
    redoLastAction,
    transactions,
    recordTransaction,
    addPosition,
    updatePosition,
    removePosition,
    updateConfig,
    updateInvestorProfile,
    refreshing,
    refreshPrices,
    refreshAllPortfolios,
    refreshMarketPrices,
    refreshCryptoPrices,
    refreshSavingsPrices,
    resetPortfolio,
  };
}

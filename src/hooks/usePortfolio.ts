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
import { computeSavingsPositionInterest } from '@/engines/savingsInterestEngine';

export function usePortfolio() {
  const [user, setUser] = useState<User | null>(null);

  const [positions, setPositions] = useState<Position[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('riane_local_positions');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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

          const mergedPos = Array.from(posMap.values());
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

  const refreshPricesInternal = async (currentPositions: Position[]) => {
    const tickers = currentPositions.map((p) => p.ticker);
    try {
      const [quotes, rates] = await Promise.all([
        getMultipleQuotes(tickers),
        getFxRates(),
      ]);

      if (rates) {
        setFxRates((prev) => ({ ...prev, ...rates }));
      }

      if (quotes.size > 0) {
        const firstQuote = Array.from(quotes.values())[0];
        if (firstQuote?.quoteTypeLabel) {
          setMarketStatusLabel(firstQuote.quoteTypeLabel);
        }

        setPositions((prev) =>
          prev.map((p) => {
            const quote = quotes.get(p.ticker);
            if (quote && quote.price > 0) {
              return { ...p, currentPrice: quote.price };
            }
            return p;
          })
        );
      }
      setLastPricesUpdated(Date.now());
    } catch (err) {
      console.warn('[Portfolio] Price refresh failed:', err);
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
    const validPos: Position = {
      ...pos,
      quantity: pos.quantity || 0,
      avgPrice: pos.avgPrice || 0,
      updatedAt: Date.now(),
    };

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

    const updatedPos: Position = {
      ...pos,
      updatedAt: Date.now(),
    };

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
  const filledPositions = positions.filter((p) => p.quantity > 0 && p.avgPrice > 0);

  /** How many positions still need user input */
  const pendingCount = positions.length - filledPositions.length;

  const totalValue = filledPositions.reduce((sum, p) => {
    const isMarket = ['PEA', 'PEA-PME', 'CTO', 'SPECULATIVE', 'OPPORTUNISTIC'].includes(p.envelope);
    if (!isMarket) {
      const { currentBalance } = computeSavingsPositionInterest(p);
      const rateToEUR = fxRates[p.currency] || 1.0;
      return sum + (currentBalance * rateToEUR);
    }
    const price = p.currentPrice || p.avgPrice;
    const rateToEUR = fxRates[p.currency] || 1.0;
    return sum + (p.quantity * price * rateToEUR);
  }, 0);

  const totalCost = filledPositions.reduce((sum, p) => {
    const isMarket = ['PEA', 'PEA-PME', 'CTO', 'SPECULATIVE', 'OPPORTUNISTIC'].includes(p.envelope);
    if (!isMarket) {
      const { principalDeposited } = computeSavingsPositionInterest(p);
      const rateToEUR = fxRates[p.currency] || 1.0;
      return sum + (principalDeposited * rateToEUR);
    }
    const rateToEUR = fxRates[p.currency] || 1.0;
    return sum + (p.quantity * p.avgPrice * rateToEUR);
  }, 0);

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
    refreshPrices,
    resetPortfolio,
  };
}

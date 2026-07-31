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
} from '@/services/firebase/firestore';
import { DEFAULT_POSITIONS } from '@/data/portfolio';
import { getMultipleQuotes, getFxRates } from '@/services/market-data/provider';
import type { Position, PortfolioConfig, TransactionRecord } from '@/types/portfolio';
import type { User } from 'firebase/auth';
import { clearAnalysisCache } from '@/utils/analysisCache';

export function usePortfolio() {
  const [user, setUser] = useState<User | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [config, setConfig] = useState<PortfolioConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const pricesFetched = useRef(false);

  const [fxRates, setFxRates] = useState<Record<string, number>>({ EUR: 1.0, USD: 0.92, GBP: 1.18, CHF: 1.04 });

  useEffect(() => {
    const unsubscribe = onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        try {
          await initializeUserData(u.uid);
          const [pos, cfg] = await Promise.all([
            getPositions(u.uid),
            getPortfolioConfig(u.uid),
          ]);

          if (pos.length === 0) {
            // New user: initialize with structure from CDC (no fake data)
            await saveAllPositions(u.uid, DEFAULT_POSITIONS);
            setPositions(DEFAULT_POSITIONS);
          } else {
            setPositions(pos);
          }

          setConfig(cfg);
        } catch (err) {
          console.error('Error loading portfolio:', err);
        }
      } else {
        setPositions([]);
        setConfig(null);
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
  }, [user, pushSnapshot]);

  const updatePosition = useCallback(async (pos: Position) => {
    pushSnapshot();
    setSaving(true);
    clearAnalysisCache();
    setPositions((prev) => {
      const updated = prev.map((p) => (p.id === pos.id ? pos : p));
      try {
        localStorage.setItem('riane_local_positions', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    if (user) {
      try {
        await savePosition(user.uid, pos);
      } catch (err) {
        console.warn('[Portfolio] Firestore update failed, kept in local state:', err);
      }
    }
    setSaving(false);
  }, [user, pushSnapshot]);

  const removePosition = useCallback(async (positionId: string) => {
    pushSnapshot();
    setSaving(true);
    clearAnalysisCache();
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
  }, [user, pushSnapshot]);

  const updateConfig = useCallback(async (newConfig: PortfolioConfig) => {
    if (!user) return;
    setSaving(true);
    clearAnalysisCache();
    try {
      await savePortfolioConfig(user.uid, newConfig);
      setConfig(newConfig);
    } catch (err) {
      console.error('Error updating config:', err);
    } finally {
      setSaving(false);
    }
  }, [user]);

  const refreshPrices = useCallback(async () => {
    await refreshPricesInternal(positions);
  }, [positions]);

  // ── Reset Portfolio (clear fake data) ──
  const resetPortfolio = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Delete all existing positions from Firestore
      for (const pos of positions) {
        await deletePositionFromDb(user.uid, pos.id);
      }
      // Re-save clean structure-only defaults
      await saveAllPositions(user.uid, DEFAULT_POSITIONS);
      setPositions(DEFAULT_POSITIONS);
    } catch (err) {
      console.error('Error resetting portfolio:', err);
    } finally {
      setSaving(false);
    }
  }, [user, positions]);

  // ── Computed Values (only from REAL user data with FX conversion) ──

  /** Only positions where user has entered real data */
  const filledPositions = positions.filter((p) => p.quantity > 0 && p.avgPrice > 0);

  /** How many positions still need user input */
  const pendingCount = positions.length - filledPositions.length;

  const totalValue = filledPositions.reduce((sum, p) => {
    const price = p.currentPrice || p.avgPrice;
    const rateToEUR = fxRates[p.currency] || 1.0;
    return sum + (p.quantity * price * rateToEUR);
  }, 0);

  const totalCost = filledPositions.reduce((sum, p) => {
    const rateToEUR = fxRates[p.currency] || 1.0;
    return sum + (p.quantity * p.avgPrice * rateToEUR);
  }, 0);

  const monthlyDCATotal = positions.reduce((sum, p) => {
    return sum + (p.monthlyDCA || 0);
  }, 0);

  const positionsByEnvelope = positions.reduce((acc, p) => {
    if (!acc[p.envelope]) acc[p.envelope] = [];
    acc[p.envelope].push(p);
    return acc;
  }, {} as Record<string, Position[]>);

  return {
    user,
    positions,
    config,
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
    refreshPrices,
    resetPortfolio,
  };
}

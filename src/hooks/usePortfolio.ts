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
import type { Position, PortfolioConfig } from '@/types/portfolio';
import type { User } from 'firebase/auth';

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

  // ── CRUD ──
  const addPosition = useCallback(async (pos: Position) => {
    if (!user) return;
    setSaving(true);
    try {
      await savePosition(user.uid, pos);
      setPositions((prev) => [...prev, pos]);
    } catch (err) {
      console.error('Error adding position:', err);
    } finally {
      setSaving(false);
    }
  }, [user]);

  const updatePosition = useCallback(async (pos: Position) => {
    if (!user) return;
    setSaving(true);
    try {
      await savePosition(user.uid, pos);
      setPositions((prev) => prev.map((p) => (p.id === pos.id ? pos : p)));
    } catch (err) {
      console.error('Error updating position:', err);
    } finally {
      setSaving(false);
    }
  }, [user]);

  const removePosition = useCallback(async (positionId: string) => {
    if (!user) return;
    setSaving(true);
    try {
      await deletePositionFromDb(user.uid, positionId);
      setPositions((prev) => prev.filter((p) => p.id !== positionId));
    } catch (err) {
      console.error('Error deleting position:', err);
    } finally {
      setSaving(false);
    }
  }, [user]);

  const updateConfig = useCallback(async (newConfig: PortfolioConfig) => {
    if (!user) return;
    setSaving(true);
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
    totalValue,
    totalCost,
    gainLoss: totalValue - totalCost,
    gainLossPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    monthlyDCATotal,
    pendingCount,
    filledPositions,
    positionsByEnvelope,
    addPosition,
    updatePosition,
    removePosition,
    updateConfig,
    refreshPrices,
    resetPortfolio,
  };
}

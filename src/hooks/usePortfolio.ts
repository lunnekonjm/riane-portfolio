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
import { getMultipleQuotes } from '@/services/market-data/provider';
import type { Position, PortfolioConfig } from '@/types/portfolio';
import type { User } from 'firebase/auth';

export function usePortfolio() {
  const [user, setUser] = useState<User | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [config, setConfig] = useState<PortfolioConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const pricesFetched = useRef(false);

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

  // ── Auto-fetch real market prices on first load ──
  useEffect(() => {
    if (positions.length > 0 && !pricesFetched.current && !loading) {
      pricesFetched.current = true;
      refreshPricesInternal(positions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, loading]);

  const refreshPricesInternal = async (currentPositions: Position[]) => {
    const tickers = currentPositions.map((p) => p.ticker);
    try {
      const quotes = await getMultipleQuotes(tickers);
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

  // ── Computed Values (only from REAL user data) ──

  /** Only positions where user has entered real data */
  const filledPositions = positions.filter((p) => p.quantity > 0 && p.avgPrice > 0);

  /** How many positions still need user input */
  const pendingCount = positions.length - filledPositions.length;

  const totalValue = filledPositions.reduce((sum, p) => {
    const price = p.currentPrice || p.avgPrice;
    return sum + p.quantity * price;
  }, 0);

  const totalCost = filledPositions.reduce((sum, p) => {
    return sum + p.quantity * p.avgPrice;
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
  };
}

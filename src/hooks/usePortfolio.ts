'use client';

import { useState, useEffect, useCallback } from 'react';
import { onAuthChange } from '@/services/firebase/auth';
import { getPositions, getPortfolioConfig, initializeUserData, saveAllPositions } from '@/services/firebase/firestore';
import { DEFAULT_POSITIONS } from '@/data/portfolio';
import type { Position, PortfolioConfig } from '@/types/portfolio';
import type { User } from 'firebase/auth';

export function usePortfolio() {
  const [user, setUser] = useState<User | null>(null);
  const [positions, setPositions] = useState<Position[]>(DEFAULT_POSITIONS);
  const [config, setConfig] = useState<PortfolioConfig | null>(null);
  const [loading, setLoading] = useState(true);

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
          if (pos.length > 0) {
            setPositions(pos);
          } else {
            // Save defaults to Firestore
            await saveAllPositions(u.uid, DEFAULT_POSITIONS);
          }
          setConfig(cfg);
        } catch (err) {
          console.error('Error loading portfolio:', err);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const totalValue = positions.reduce((sum, p) => {
    return sum + p.quantity * (p.currentPrice || p.avgPrice);
  }, 0);

  const totalCost = positions.reduce((sum, p) => {
    return sum + p.quantity * p.avgPrice;
  }, 0);

  const refreshPrices = useCallback(async () => {
    // Will be called with market data
  }, []);

  return {
    user,
    positions,
    config,
    loading,
    totalValue,
    totalCost,
    gainLoss: totalValue - totalCost,
    gainLossPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    refreshPrices,
  };
}

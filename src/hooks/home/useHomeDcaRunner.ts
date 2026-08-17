'use client';

import { useState, useCallback } from 'react';
import type { Position } from '@/types/portfolio';
import { getQuote } from '@/services/market-data/provider';
import { simulatePositionDCA } from '@/engines/dcaSimulation';

interface UseHomeDcaRunnerParams {
  positions: Position[];
  updatePosition: (pos: Position, customReason?: string) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function useHomeDcaRunner({
  positions,
  updatePosition,
  showToast,
}: UseHomeDcaRunnerParams) {
  const [dcaGlobalStartDate, setDcaGlobalStartDate] = useState<string>('2024-01-05');
  const [refreshingPrices, setRefreshingPrices] = useState(false);

  const handleUpdateDcaStartDate = useCallback((newDate: string) => {
    setDcaGlobalStartDate(newDate);
    if (typeof window !== 'undefined') {
      localStorage.setItem('riane_dca_start_date', newDate);
    }
  }, []);

  const handleRunGlobalDCACalculation = async (startDate: string) => {
    if (!startDate) return;
    setRefreshingPrices(true);
    try {
      let updatedCount = 0;
      for (const pos of positions) {
        const monthlyBudget = pos.monthlyDCA || (pos.annualBudget ? pos.annualBudget / 12 : 100);
        const isIntegerOnly = pos.envelope === 'PEA' || pos.envelope === 'PEA-PME' || pos.envelope === 'CTO';

        let realLivePrice = pos.currentPrice;
        if (!realLivePrice) {
          try {
            const q = await getQuote(pos.ticker);
            if (q && q.price > 0) realLivePrice = q.price;
          } catch {}
        }
        const effectivePrice = realLivePrice || pos.avgPrice || (pos.ticker.includes('GPEA') ? 4.89 : 100);

        const sim = await simulatePositionDCA(
          pos.ticker,
          monthlyBudget,
          startDate,
          effectivePrice,
          isIntegerOnly,
          (pos.dcaFrequency || 'monthly') as any,
          pos.dcaDepositMonth || 1,
          pos.dcaDepositDay || 5,
          pos.dcaHistory,
          pos.depositsHistory
        );

        const finalShares = sim.totalShares;
        const finalPRU = sim.avgPrice > 0 ? sim.avgPrice : (pos.avgPrice || realLivePrice || effectivePrice);

        await updatePosition({
          ...pos,
          quantity: finalShares,
          avgPrice: finalPRU,
          ...(realLivePrice && realLivePrice > 0 ? { currentPrice: realLivePrice } : {}),
          updatedAt: Date.now(),
        });
        updatedCount++;
      }
      showToast(`DCA calculé automatiquement pour ${updatedCount} positions depuis ${startDate}`);
    } catch (err) {
      console.error(err);
      showToast('Erreur lors du calcul du DCA', 'error');
    } finally {
      setRefreshingPrices(false);
    }
  };

  return {
    dcaGlobalStartDate,
    setDcaGlobalStartDate,
    refreshingPrices,
    setRefreshingPrices,
    handleUpdateDcaStartDate,
    handleRunGlobalDCACalculation,
  };
}

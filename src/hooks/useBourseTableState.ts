'use client';

import { useState, useMemo } from 'react';
import type { Position } from '@/types/portfolio';
import { getActiveDCATranche } from '@/utils/dcaHistoryHelper';

export type BourseSortKey = 'name' | 'envelope' | 'price' | 'value' | 'perf' | 'dca' | 'weight' | null;
export type BourseSortDir = 'asc' | 'desc';

export function useBourseTableState(positions: Position[], fxRates: Record<string, number>) {
  const [selectedEnvelopeFilter, setSelectedEnvelopeFilter] = useState<string>('ALL');
  const [bourseSortKey, setBourseSortKey] = useState<BourseSortKey>(null);
  const [bourseSortDir, setBourseSortDir] = useState<BourseSortDir>('desc');

  const handleBourseSort = (key: NonNullable<BourseSortKey>) => {
    if (bourseSortKey === key) {
      setBourseSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setBourseSortKey(key);
      setBourseSortDir(key === 'name' || key === 'envelope' ? 'asc' : 'desc');
    }
  };

  const marketPositionsAll = useMemo(() => {
    return positions.filter(
      (p) =>
        ['PEA', 'PEA-PME', 'CTO', 'SPECULATIVE', 'OPPORTUNISTIC'].includes(p.envelope) &&
        p.assetType !== 'CRYPTO' &&
        p.envelope !== 'CRYPTO'
    );
  }, [positions]);

  const totalMarketValEUR = useMemo(() => {
    return marketPositionsAll.reduce((sum, p) => {
      const pr = p.currentPrice || p.avgPrice;
      const rate = fxRates[p.currency] || 1.0;
      return sum + p.quantity * pr * rate;
    }, 0);
  }, [marketPositionsAll, fxRates]);

  const totalMarketCostEUR = useMemo(() => {
    return marketPositionsAll.reduce((sum, p) => {
      const rate = fxRates[p.currency] || 1.0;
      return sum + p.quantity * p.avgPrice * rate;
    }, 0);
  }, [marketPositionsAll, fxRates]);

  const totalMarketPLEUR = totalMarketValEUR - totalMarketCostEUR;
  const totalMarketPLPct = totalMarketCostEUR > 0 ? (totalMarketPLEUR / totalMarketCostEUR) * 100 : 0;

  const totalMarketMonthlyDCA = useMemo(() => {
    return marketPositionsAll.reduce((sum, p) => {
      const activeTranche = p.dcaHistory && p.dcaHistory.length > 0 ? getActiveDCATranche(p.dcaHistory) : null;
      const effective = activeTranche ? activeTranche.amount : (p.monthlyDCA || (p.annualBudget ? Math.round(p.annualBudget / 12) : 0));
      return sum + (effective || 0);
    }, 0);
  }, [marketPositionsAll]);

  const filteredPositions = useMemo(() => {
    return positions.filter((p) => {
      const isMarket =
        ['PEA', 'PEA-PME', 'CTO', 'SPECULATIVE', 'OPPORTUNISTIC'].includes(p.envelope) &&
        p.assetType !== 'CRYPTO' &&
        p.envelope !== 'CRYPTO';
      if (!isMarket) return false;

      if (selectedEnvelopeFilter === 'ALL') return true;
      if (selectedEnvelopeFilter === 'PEA') return p.envelope === 'PEA';
      if (selectedEnvelopeFilter === 'PEA-PME') return p.envelope === 'PEA-PME';
      if (selectedEnvelopeFilter === 'CTO') return p.envelope === 'CTO';
      if (selectedEnvelopeFilter === 'SPECULATIVE') return p.envelope === 'SPECULATIVE' || p.envelope === 'OPPORTUNISTIC';
      if (selectedEnvelopeFilter === 'BOURSE') return p.envelope === 'PEA' || p.envelope === 'PEA-PME' || p.envelope === 'CTO';
      return p.envelope === selectedEnvelopeFilter;
    });
  }, [positions, selectedEnvelopeFilter]);

  const sortedPositions = useMemo(() => {
    return [...filteredPositions].sort((a, b) => {
      if (!bourseSortKey) return 0;
      const factor = bourseSortDir === 'asc' ? 1 : -1;

      if (bourseSortKey === 'name') {
        return factor * a.name.localeCompare(b.name, 'fr');
      }
      if (bourseSortKey === 'envelope') {
        return factor * a.envelope.localeCompare(b.envelope);
      }
      if (bourseSortKey === 'price') {
        const priceA = (a.currentPrice || a.avgPrice || 0) * (fxRates[a.currency] || 1);
        const priceB = (b.currentPrice || b.avgPrice || 0) * (fxRates[b.currency] || 1);
        return factor * (priceA - priceB);
      }
      if (bourseSortKey === 'value') {
        const valA = a.quantity * (a.currentPrice || a.avgPrice || 0) * (fxRates[a.currency] || 1);
        const valB = b.quantity * (b.currentPrice || b.avgPrice || 0) * (fxRates[b.currency] || 1);
        return factor * (valA - valB);
      }
      if (bourseSortKey === 'perf') {
        const costA = a.quantity * (a.avgPrice || 0) * (fxRates[a.currency] || 1);
        const valA = a.quantity * (a.currentPrice || a.avgPrice || 0) * (fxRates[a.currency] || 1);
        const plA = costA > 0 ? (valA - costA) / costA : -999999;

        const costB = b.quantity * (b.avgPrice || 0) * (fxRates[b.currency] || 1);
        const valB = b.quantity * (b.currentPrice || b.avgPrice || 0) * (fxRates[b.currency] || 1);
        const plB = costB > 0 ? (valB - costB) / costB : -999999;

        return factor * (plA - plB);
      }
      if (bourseSortKey === 'dca') {
        const dcaA = a.monthlyDCA || (a.annualBudget ? a.annualBudget / 12 : 0);
        const dcaB = b.monthlyDCA || (b.annualBudget ? b.annualBudget / 12 : 0);
        return factor * (dcaA - dcaB);
      }
      if (bourseSortKey === 'weight') {
        const valA = a.quantity * (a.currentPrice || a.avgPrice || 0) * (fxRates[a.currency] || 1);
        const valB = b.quantity * (b.currentPrice || b.avgPrice || 0) * (fxRates[b.currency] || 1);
        return factor * (valA - valB);
      }
      return 0;
    });
  }, [filteredPositions, bourseSortKey, bourseSortDir, fxRates]);

  return {
    selectedEnvelopeFilter,
    setSelectedEnvelopeFilter,
    bourseSortKey,
    bourseSortDir,
    handleBourseSort,
    marketPositionsAll,
    totalMarketValEUR,
    totalMarketCostEUR,
    totalMarketPLEUR,
    totalMarketPLPct,
    totalMarketMonthlyDCA,
    sortedPositions,
  };
}

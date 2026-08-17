'use client';

import { useState, useMemo } from 'react';
import type { Position } from '@/types/portfolio';
import { getActiveDCATranche } from '@/utils/dcaHistoryHelper';
import { calculateCryptoTaxAndNet, cleanWalletProviderName } from '@/utils/cryptoWalletEngine';

export type CryptoSortKey = 'name' | 'envelope' | 'price' | 'value' | 'perf' | 'dca' | 'weight' | null;
export type CryptoSortDir = 'asc' | 'desc';

export function useCryptoTableState(
  positions: Position[],
  fxRates: Record<string, number>,
  totalNetWorthEUR: number = 0
) {
  const [selectedWalletFilter, setSelectedWalletFilter] = useState<string>('ALL');
  const [selectedPositionForLot, setSelectedPositionForLot] = useState<Position | null>(null);
  const [showOnChainImportModal, setShowOnChainImportModal] = useState(false);
  const [sortKey, setSortKey] = useState<CryptoSortKey>(null);
  const [sortDir, setSortDir] = useState<CryptoSortDir>('desc');

  const handleSort = (key: NonNullable<CryptoSortKey>) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' || key === 'envelope' ? 'asc' : 'desc');
    }
  };

  const cryptoPositions = useMemo(() => {
    return positions.filter(
      (p) => p.assetType === 'CRYPTO' || p.envelope === 'CRYPTO'
    );
  }, [positions]);

  const totalCryptoValEUR = useMemo(() => {
    return cryptoPositions.reduce((sum, p) => {
      const pr = p.currentPrice || p.avgPrice;
      const rate = (fxRates as any)[p.currency] || 1.0;
      return sum + p.quantity * pr * rate;
    }, 0);
  }, [cryptoPositions, fxRates]);

  const totalCryptoCostEUR = useMemo(() => {
    return cryptoPositions.reduce((sum, p) => {
      const rate = (fxRates as any)[p.currency] || 1.0;
      const fees = p.totalFeesEUR || 0;
      return sum + p.quantity * p.avgPrice * rate + fees;
    }, 0);
  }, [cryptoPositions, fxRates]);

  const totalCryptoFeesEUR = useMemo(() => {
    return cryptoPositions.reduce((sum, p) => sum + (p.totalFeesEUR || 0), 0);
  }, [cryptoPositions]);

  const totalCryptoPLEUR = totalCryptoValEUR - totalCryptoCostEUR;
  const totalCryptoPLPct = totalCryptoCostEUR > 0 ? (totalCryptoPLEUR / totalCryptoCostEUR) * 100 : 0;

  const globalTaxMetrics = useMemo(() => {
    return calculateCryptoTaxAndNet(totalCryptoValEUR, totalCryptoCostEUR);
  }, [totalCryptoValEUR, totalCryptoCostEUR]);

  const totalCryptoMonthlyDCA = useMemo(() => {
    return cryptoPositions.reduce((sum, p) => {
      const activeTranche = p.dcaHistory && p.dcaHistory.length > 0 ? getActiveDCATranche(p.dcaHistory) : null;
      const effective = activeTranche ? activeTranche.amount : (p.monthlyDCA || (p.annualBudget ? Math.round(p.annualBudget / 12) : 0));
      return sum + (effective || 0);
    }, 0);
  }, [cryptoPositions]);

  const cryptoWeightInWealth = totalNetWorthEUR > 0 ? (totalCryptoValEUR / totalNetWorthEUR) * 100 : 0;

  const walletFilterTabs = useMemo(() => {
    const tabs = [
      { id: 'ALL', label: `🌐 Tout (${cryptoPositions.length})` },
    ];

    const walletCounts: Record<string, number> = {};
    cryptoPositions.forEach((p) => {
      const instSet = new Set<string>();
      if (p.cryptoWallets && p.cryptoWallets.length > 0) {
        p.cryptoWallets.forEach((w) => {
          const key = cleanWalletProviderName(w.institution || w.walletName);
          if (key) instSet.add(key);
        });
      } else if (p.institutionName) {
        const key = cleanWalletProviderName(p.institutionName);
        if (key) instSet.add(key);
      }
      instSet.forEach((key) => {
        walletCounts[key] = (walletCounts[key] || 0) + 1;
      });
    });

    Object.entries(walletCounts).forEach(([name, count]) => {
      const icon = name.toLowerCase().includes('trust') ? '🛡️' : name.toLowerCase().includes('revolut') ? '⚡' : name.toLowerCase().includes('ledger') || name.toLowerCase().includes('cold') ? '🔒' : '🪙';
      tabs.push({ id: name, label: `${icon} ${name} (${count})` });
    });

    return tabs;
  }, [cryptoPositions]);

  const filteredCryptoPositions = useMemo(() => {
    if (selectedWalletFilter === 'ALL') return cryptoPositions;
    const cleanFilter = cleanWalletProviderName(selectedWalletFilter).toLowerCase();
    return cryptoPositions.filter((p) => {
      if (p.cryptoWallets?.some((w) => cleanWalletProviderName(w.institution || w.walletName).toLowerCase() === cleanFilter)) return true;
      if (p.institutionName && cleanWalletProviderName(p.institutionName).toLowerCase() === cleanFilter) return true;
      return false;
    });
  }, [cryptoPositions, selectedWalletFilter]);

  const sortedPositions = useMemo(() => {
    return [...filteredCryptoPositions].sort((a, b) => {
      if (!sortKey) return 0;
      const factor = sortDir === 'asc' ? 1 : -1;

      if (sortKey === 'name') {
        return factor * a.name.localeCompare(b.name, 'fr');
      }
      if (sortKey === 'envelope') {
        return factor * a.envelope.localeCompare(b.envelope);
      }
      if (sortKey === 'price') {
        const priceA = (a.currentPrice || a.avgPrice || 0) * (fxRates[a.currency] || 1);
        const priceB = (b.currentPrice || b.avgPrice || 0) * (fxRates[b.currency] || 1);
        return factor * (priceA - priceB);
      }
      if (sortKey === 'value') {
        const valA = a.quantity * (a.currentPrice || a.avgPrice || 0) * (fxRates[a.currency] || 1);
        const valB = b.quantity * (b.currentPrice || b.avgPrice || 0) * (fxRates[b.currency] || 1);
        return factor * (valA - valB);
      }
      if (sortKey === 'perf') {
        const costA = a.quantity * (a.avgPrice || 0) * (fxRates[a.currency] || 1);
        const valA = a.quantity * (a.currentPrice || a.avgPrice || 0) * (fxRates[a.currency] || 1);
        const plA = costA > 0 ? (valA - costA) / costA : -999999;

        const costB = b.quantity * (b.avgPrice || 0) * (fxRates[b.currency] || 1);
        const valB = b.quantity * (b.currentPrice || b.avgPrice || 0) * (fxRates[b.currency] || 1);
        const plB = costB > 0 ? (valB - costB) / costB : -999999;

        return factor * (plA - plB);
      }
      if (sortKey === 'dca') {
        const dcaA = a.monthlyDCA || (a.annualBudget ? a.annualBudget / 12 : 0);
        const dcaB = b.monthlyDCA || (b.annualBudget ? b.annualBudget / 12 : 0);
        return factor * (dcaA - dcaB);
      }
      if (sortKey === 'weight') {
        const valA = a.quantity * (a.currentPrice || a.avgPrice || 0) * (fxRates[a.currency] || 1);
        const valB = b.quantity * (b.currentPrice || b.avgPrice || 0) * (fxRates[b.currency] || 1);
        return factor * (valA - valB);
      }
      return 0;
    });
  }, [filteredCryptoPositions, sortKey, sortDir, fxRates]);

  return {
    selectedWalletFilter,
    setSelectedWalletFilter,
    selectedPositionForLot,
    setSelectedPositionForLot,
    showOnChainImportModal,
    setShowOnChainImportModal,
    sortKey,
    sortDir,
    handleSort,
    cryptoPositions,
    totalCryptoValEUR,
    totalCryptoCostEUR,
    totalCryptoFeesEUR,
    totalCryptoPLEUR,
    totalCryptoPLPct,
    globalTaxMetrics,
    totalCryptoMonthlyDCA,
    cryptoWeightInWealth,
    walletFilterTabs,
    sortedPositions,
  };
}

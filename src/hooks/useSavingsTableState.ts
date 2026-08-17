'use client';

import { useState, useMemo } from 'react';
import type { Position } from '@/types/portfolio';
import { computeSavingsPositionInterest, type SavingsInterestResult } from '@/engines/savingsInterestEngine';
import { getActiveDCATranche } from '@/utils/dcaHistoryHelper';

export type SavingsSortKey = 'name' | 'envelope' | 'rate' | 'value' | 'perf' | 'dca' | 'cap' | null;
export type SavingsSortDir = 'asc' | 'desc';

export interface SavingsCalculatedItem {
  position: Position;
  interest: SavingsInterestResult;
}

export function useSavingsTableState(positions: Position[]) {
  const [selectedSavingsEnvelope, setSelectedSavingsEnvelope] = useState<string>('ALL');
  const [sortKey, setSortKey] = useState<SavingsSortKey>(null);
  const [sortDir, setSortDir] = useState<SavingsSortDir>('desc');

  const handleSort = (key: NonNullable<SavingsSortKey>) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' || key === 'envelope' ? 'asc' : 'desc');
    }
  };

  const savingsPositions = useMemo(() => {
    return positions.filter(
      (p) =>
        p.envelope === 'LIVRET' ||
        p.envelope === 'ASSURANCE_VIE' ||
        p.envelope === 'PER' ||
        p.envelope === 'PEE' ||
        p.envelope === 'IMMOBILIER'
    );
  }, [positions]);

  const calculations = useMemo<SavingsCalculatedItem[]>(() => {
    return savingsPositions.map((p) => ({
      position: p,
      interest: computeSavingsPositionInterest(p),
    }));
  }, [savingsPositions]);

  const savingsFilterTabs = useMemo(() => {
    const tabs = [{ id: 'ALL', label: `🌐 Tout (${savingsPositions.length})` }];
    if (savingsPositions.some((p) => p.envelope === 'LIVRET')) {
      const count = savingsPositions.filter((p) => p.envelope === 'LIVRET').length;
      tabs.push({ id: 'LIVRET', label: `🛡️ Livrets (${count})` });
    }
    if (savingsPositions.some((p) => p.envelope === 'PEE')) {
      const count = savingsPositions.filter((p) => p.envelope === 'PEE').length;
      tabs.push({ id: 'PEE', label: `🏢 PEE & Salariale (${count})` });
    }
    if (savingsPositions.some((p) => p.envelope === 'ASSURANCE_VIE')) {
      const count = savingsPositions.filter((p) => p.envelope === 'ASSURANCE_VIE').length;
      tabs.push({ id: 'ASSURANCE_VIE', label: `📜 Assurance-Vie (${count})` });
    }
    if (savingsPositions.some((p) => p.envelope === 'PER')) {
      const count = savingsPositions.filter((p) => p.envelope === 'PER').length;
      tabs.push({ id: 'PER', label: `🎯 PER (${count})` });
    }
    if (savingsPositions.some((p) => p.envelope === 'IMMOBILIER')) {
      const count = savingsPositions.filter((p) => p.envelope === 'IMMOBILIER').length;
      tabs.push({ id: 'IMMOBILIER', label: `🏠 Immobilier (${count})` });
    }
    return tabs;
  }, [savingsPositions]);

  const filteredCalculations = useMemo(() => {
    if (selectedSavingsEnvelope === 'ALL') return calculations;
    return calculations.filter(({ position }) => position.envelope === selectedSavingsEnvelope);
  }, [calculations, selectedSavingsEnvelope]);

  const totalValue = calculations.reduce((acc, c) => acc + c.interest.currentBalance, 0);
  const totalAnnualInterest = calculations.reduce((acc, c) => acc + c.interest.projectedAnnualInterest, 0);
  const totalMonthlyDCA = savingsPositions.reduce((acc, p) => {
    const active = p.dcaHistory && p.dcaHistory.length > 0 ? getActiveDCATranche(p.dcaHistory) : null;
    const effective = active ? active.amount : (p.monthlyDCA || (p.annualBudget ? Math.round(p.annualBudget / 12) : 0));
    return acc + (effective || 0);
  }, 0);

  const sortedCalculations = useMemo(() => {
    return [...filteredCalculations].sort((a, b) => {
      if (!sortKey) return 0;
      const factor = sortDir === 'asc' ? 1 : -1;
      const posA = a.position;
      const posB = b.position;

      if (sortKey === 'name') return factor * posA.name.localeCompare(posB.name, 'fr');
      if (sortKey === 'envelope') return factor * posA.envelope.localeCompare(posB.envelope);
      if (sortKey === 'rate') {
        const rateA = a.interest.effectiveRatePercent || 0;
        const rateB = b.interest.effectiveRatePercent || 0;
        return factor * (rateA - rateB);
      }
      if (sortKey === 'value') return factor * (a.interest.currentBalance - b.interest.currentBalance);
      if (sortKey === 'perf') {
        const perfA = a.interest.interestEarnedToDate || a.interest.projectedAnnualInterest;
        const perfB = b.interest.interestEarnedToDate || b.interest.projectedAnnualInterest;
        return factor * (perfA - perfB);
      }
      if (sortKey === 'dca') {
        const dcaA = posA.monthlyDCA || (posA.annualBudget ? posA.annualBudget / 12 : 0);
        const dcaB = posB.monthlyDCA || (posB.annualBudget ? posB.annualBudget / 12 : 0);
        return factor * (dcaA - dcaB);
      }
      if (sortKey === 'cap') {
        const fillA = a.interest.capUtilizationPercent || 0;
        const fillB = b.interest.capUtilizationPercent || 0;
        return factor * (fillA - fillB);
      }
      return 0;
    });
  }, [filteredCalculations, sortKey, sortDir]);

  return {
    selectedSavingsEnvelope,
    setSelectedSavingsEnvelope,
    sortKey,
    sortDir,
    handleSort,
    savingsPositions,
    calculations,
    savingsFilterTabs,
    filteredCalculations,
    sortedCalculations,
    totalValue,
    totalAnnualInterest,
    totalMonthlyDCA,
  };
}

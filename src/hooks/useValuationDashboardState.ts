'use client';

import { useState } from 'react';
import type { Position } from '@/types/portfolio';
import {
  VALUATION_STOCKS,
  VALUATION_STOCK_KEYS,
  VALUATION_SECTIONS,
} from '@/data/valuationData';
import { computeStockValuation } from '@/engines/valuationEngine';

export function useValuationDashboardState(positions: Position[] = []) {
  const [activeKey, setActiveKey] = useState<string>(VALUATION_STOCK_KEYS[0]);
  const [activeView, setActiveView] = useState<'detail' | 'matrix'>('detail');
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterHeldOnly, setFilterHeldOnly] = useState<boolean>(false);

  const stock = VALUATION_STOCKS[activeKey] || VALUATION_STOCKS[VALUATION_STOCK_KEYS[0]];
  const val = computeStockValuation(stock);

  const currentIndex = VALUATION_STOCK_KEYS.indexOf(activeKey);

  const handlePrev = () => {
    const nextIdx = (currentIndex - 1 + VALUATION_STOCK_KEYS.length) % VALUATION_STOCK_KEYS.length;
    setActiveKey(VALUATION_STOCK_KEYS[nextIdx]);
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % VALUATION_STOCK_KEYS.length;
    setActiveKey(VALUATION_STOCK_KEYS[nextIdx]);
  };

  const isStockHeld = (k: string) => {
    const s = VALUATION_STOCKS[k];
    if (!s || positions.length === 0) return false;
    return positions.some((p) => {
      const cleanP = p.ticker.toUpperCase().replace(/^[A-Z0-9]+:/, '');
      return (
        cleanP === s.shortTick.toUpperCase() ||
        s.tick.toUpperCase().includes(cleanP) ||
        p.ticker.toUpperCase() === s.shortTick.toUpperCase() ||
        p.name.toLowerCase().includes(s.name.toLowerCase())
      );
    });
  };

  const getStockHolding = (k: string) => {
    const s = VALUATION_STOCKS[k];
    if (!s || positions.length === 0) return null;
    return (
      positions.find((p) => {
        const cleanP = p.ticker.toUpperCase().replace(/^[A-Z0-9]+:/, '');
        return (
          cleanP === s.shortTick.toUpperCase() ||
          s.tick.toUpperCase().includes(cleanP) ||
          p.ticker.toUpperCase() === s.shortTick.toUpperCase() ||
          p.name.toLowerCase().includes(s.name.toLowerCase())
        );
      }) || null
    );
  };

  const matchingPosition = getStockHolding(activeKey);
  const totalHeldInValuation = VALUATION_STOCK_KEYS.filter(isStockHeld).length;

  const filteredSections = VALUATION_SECTIONS.map((sec) => ({
    ...sec,
    keys: sec.keys.filter((k) => {
      if (filterHeldOnly && !isStockHeld(k)) return false;
      const s = VALUATION_STOCKS[k];
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.tick.toLowerCase().includes(q) ||
        s.shortTick.toLowerCase().includes(q)
      );
    }),
  })).filter((sec) => sec.keys.length > 0);

  return {
    activeKey,
    setActiveKey,
    activeView,
    setActiveView,
    isPickerOpen,
    setIsPickerOpen,
    searchQuery,
    setSearchQuery,
    filterHeldOnly,
    setFilterHeldOnly,
    stock,
    val,
    currentIndex,
    handlePrev,
    handleNext,
    isStockHeld,
    matchingPosition,
    totalHeldInValuation,
    filteredSections,
  };
}

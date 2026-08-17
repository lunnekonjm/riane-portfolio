'use client';

import { useState } from 'react';
import type { SalaryRecord, RevenueConfig, ReserveAllocation, ExtraCashEntry } from '@/types/revenue';
import { DEFAULT_REVENUE_CONFIG } from '@/types/revenue';

export const REVENUE_STORAGE_KEYS = {
  SALARY_RECORDS: 'riane_salary_records',
  REVENUE_CONFIG: 'riane_revenue_config',
  RESERVE_ALLOCATIONS: 'riane_reserve_allocations',
  EXTRA_CASH: 'riane_extra_cash_entries',
};

export function useRevenueState() {
  const [records, setRecords] = useState<SalaryRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(REVENUE_STORAGE_KEYS.SALARY_RECORDS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const realOnly = parsed.filter((r: SalaryRecord) => !r.id?.startsWith('sal-sample-') && !r.id?.includes('sample'));
            if (realOnly.length !== parsed.length) {
              try {
                localStorage.setItem(REVENUE_STORAGE_KEYS.SALARY_RECORDS, JSON.stringify(realOnly));
              } catch {}
            }
            return realOnly;
          }
        }
      } catch (e) {
        console.warn('[useRevenue] Failed to load local salary records:', e);
      }
    }
    return [];
  });

  const [revenueConfig, setRevenueConfig] = useState<RevenueConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(REVENUE_STORAGE_KEYS.REVENUE_CONFIG);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...DEFAULT_REVENUE_CONFIG,
            ...parsed,
            allocationSplit: {
              ...DEFAULT_REVENUE_CONFIG.allocationSplit,
              ...(parsed.allocationSplit || {}),
            },
          };
        }
      } catch (e) {
        console.warn('[useRevenue] Failed to load local revenue config:', e);
      }
    }
    return DEFAULT_REVENUE_CONFIG;
  });

  const [allocations, setAllocations] = useState<ReserveAllocation[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(REVENUE_STORAGE_KEYS.RESERVE_ALLOCATIONS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.warn('[useRevenue] Failed to load local reserve allocations:', e);
      }
    }
    return [];
  });

  const [extraCashEntries, setExtraCashEntries] = useState<ExtraCashEntry[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(REVENUE_STORAGE_KEYS.EXTRA_CASH);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.warn('[useRevenue] Failed to load local extra cash entries:', e);
      }
    }
    return [];
  });

  const [loading, setLoading] = useState(true);

  return {
    records,
    setRecords,
    revenueConfig,
    setRevenueConfig,
    allocations,
    setAllocations,
    extraCashEntries,
    setExtraCashEntries,
    loading,
    setLoading,
  };
}

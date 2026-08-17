'use client';

import { useState, useEffect, useMemo } from 'react';
import { onAuthChange } from '@/services/firebase/auth';
import {
  getSalaryRecords,
  saveSalaryRecord as saveSalaryRecordToDb,
  getRevenueConfig,
  getReserveAllocations,
  getExtraCashEntries,
} from '@/services/firebase/firestore';
import type { SalaryRecord, RevenueConfig } from '@/types/revenue';
import { DEFAULT_REVENUE_CONFIG } from '@/types/revenue';
import type { User } from 'firebase/auth';
import { useRevenueState, REVENUE_STORAGE_KEYS } from './revenue/useRevenueState';
import { useRevenueActions } from './revenue/useRevenueActions';

export function useRevenue() {
  const [user, setUser] = useState<User | null>(null);

  const {
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
  } = useRevenueState();

  // Sync with Firestore on Auth Change
  useEffect(() => {
    const unsubscribe = onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        try {
          const [salaryRecords, cfg, reserveAllocations, extras] = await Promise.all([
            getSalaryRecords(u.uid).catch(() => []),
            getRevenueConfig(u.uid).catch(() => null),
            getReserveAllocations(u.uid).catch(() => []),
            getExtraCashEntries(u.uid).catch(() => []),
          ]);

          if (salaryRecords && salaryRecords.length > 0) {
            const realOnly = salaryRecords.filter((r: SalaryRecord) => !r.id?.startsWith('sal-sample-') && !r.id?.includes('sample'));
            setRecords(realOnly);
            try {
              localStorage.setItem(REVENUE_STORAGE_KEYS.SALARY_RECORDS, JSON.stringify(realOnly));
            } catch {}
          } else {
            if (records.length > 0) {
              const realOnly = records.filter((r: SalaryRecord) => !r.id?.startsWith('sal-sample-') && !r.id?.includes('sample'));
              for (const r of realOnly) {
                saveSalaryRecordToDb(u.uid, r).catch(console.warn);
              }
            }
          }

          if (cfg) {
            const mergedCfg: RevenueConfig = {
              ...DEFAULT_REVENUE_CONFIG,
              ...cfg,
              allocationSplit: {
                ...DEFAULT_REVENUE_CONFIG.allocationSplit,
                ...(cfg.allocationSplit || {}),
              },
              defaultReserveEnvelope: cfg.defaultReserveEnvelope || DEFAULT_REVENUE_CONFIG.defaultReserveEnvelope,
            };
            setRevenueConfig(mergedCfg);
            try {
              localStorage.setItem(REVENUE_STORAGE_KEYS.REVENUE_CONFIG, JSON.stringify(mergedCfg));
            } catch {}
          }

          if (reserveAllocations && reserveAllocations.length > 0) {
            setAllocations(reserveAllocations);
            try {
              localStorage.setItem(REVENUE_STORAGE_KEYS.RESERVE_ALLOCATIONS, JSON.stringify(reserveAllocations));
            } catch {}
          }

          if (extras && extras.length > 0) {
            setExtraCashEntries(extras);
            try {
              localStorage.setItem(REVENUE_STORAGE_KEYS.EXTRA_CASH, JSON.stringify(extras));
            } catch {}
          }
        } catch (err) {
          console.error('[useRevenue] Error loading remote revenue data:', err);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [records, setAllocations, setExtraCashEntries, setLoading, setRecords, setRevenueConfig]);

  const actions = useRevenueActions({
    user,
    setRecords,
    setRevenueConfig,
    setAllocations,
    setExtraCashEntries,
  });

  const totalAvailableExtraCash = useMemo(() => {
    return extraCashEntries
      .filter((e) => e.isAvailable)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [extraCashEntries]);

  return {
    records,
    revenueConfig,
    allocations,
    extraCashEntries,
    totalAvailableExtraCash,
    loading,
    ...actions,
  };
}

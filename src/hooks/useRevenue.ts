'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { onAuthChange } from '@/services/firebase/auth';
import {
  getSalaryRecords,
  saveSalaryRecord as saveSalaryRecordToDb,
  deleteSalaryRecord as deleteSalaryRecordFromDb,
  getRevenueConfig,
  saveRevenueConfig as saveRevenueConfigToDb,
  getReserveAllocations,
  saveReserveAllocation as saveReserveAllocationToDb,
  deleteReserveAllocation as deleteReserveAllocationFromDb,
  getExtraCashEntries,
  saveExtraCashEntry as saveExtraCashEntryToDb,
  deleteExtraCashEntry as deleteExtraCashEntryFromDb,
} from '@/services/firebase/firestore';
import type { SalaryRecord, RevenueConfig, ReserveAllocation, ExtraCashEntry } from '@/types/revenue';
import { DEFAULT_REVENUE_CONFIG } from '@/types/revenue';
import type { User } from 'firebase/auth';

const STORAGE_KEYS = {
  SALARY_RECORDS: 'riane_salary_records',
  REVENUE_CONFIG: 'riane_revenue_config',
  RESERVE_ALLOCATIONS: 'riane_reserve_allocations',
  EXTRA_CASH: 'riane_extra_cash_entries',
};

export function useRevenue() {
  const [user, setUser] = useState<User | null>(null);

  const [records, setRecords] = useState<SalaryRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.SALARY_RECORDS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            // Strip any ghost sample records
            const realOnly = parsed.filter((r: SalaryRecord) => !r.id?.startsWith('sal-sample-') && !r.id?.includes('sample'));
            if (realOnly.length !== parsed.length) {
              try {
                localStorage.setItem(STORAGE_KEYS.SALARY_RECORDS, JSON.stringify(realOnly));
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
        const saved = localStorage.getItem(STORAGE_KEYS.REVENUE_CONFIG);
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
        const saved = localStorage.getItem(STORAGE_KEYS.RESERVE_ALLOCATIONS);
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
        const saved = localStorage.getItem(STORAGE_KEYS.EXTRA_CASH);
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
              localStorage.setItem(STORAGE_KEYS.SALARY_RECORDS, JSON.stringify(realOnly));
            } catch {}
          } else {
            // If remote is empty but local has records, sync local to remote
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
              localStorage.setItem(STORAGE_KEYS.REVENUE_CONFIG, JSON.stringify(mergedCfg));
            } catch {}
          }

          if (reserveAllocations && reserveAllocations.length > 0) {
            setAllocations(reserveAllocations);
            try {
              localStorage.setItem(STORAGE_KEYS.RESERVE_ALLOCATIONS, JSON.stringify(reserveAllocations));
            } catch {}
          }

          if (extras && extras.length > 0) {
            setExtraCashEntries(extras);
            try {
              localStorage.setItem(STORAGE_KEYS.EXTRA_CASH, JSON.stringify(extras));
            } catch {}
          }
        } catch (err) {
          console.error('[useRevenue] Error loading remote revenue data:', err);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const saveRecord = useCallback(
    async (record: SalaryRecord) => {
      // 1. Immediate optimistic state update
      setRecords((prev) => {
        const idx = prev.findIndex((r) => r.id === record.id);
        const next = idx >= 0 ? [...prev] : [record, ...prev];
        if (idx >= 0) next[idx] = record;
        // 2. Persist to localStorage
        try {
          localStorage.setItem(STORAGE_KEYS.SALARY_RECORDS, JSON.stringify(next));
        } catch (e) {
          console.warn('[useRevenue] Local storage write error:', e);
        }
        return next;
      });

      // 3. Sync with Firestore if authenticated
      if (user) {
        try {
          await saveSalaryRecordToDb(user.uid, record);
        } catch (err) {
          console.error('[useRevenue] Firestore saveSalaryRecord error:', err);
        }
      }
    },
    [user]
  );

  const deleteRecord = useCallback(
    async (id: string) => {
      setRecords((prev) => {
        const next = prev.filter((r) => r.id !== id);
        try {
          localStorage.setItem(STORAGE_KEYS.SALARY_RECORDS, JSON.stringify(next));
        } catch {}
        return next;
      });

      if (user) {
        try {
          await deleteSalaryRecordFromDb(user.uid, id);
        } catch (err) {
          console.error('[useRevenue] Firestore deleteSalaryRecord error:', err);
        }
      }
    },
    [user]
  );

  const saveConfig = useCallback(
    async (cfg: RevenueConfig) => {
      setRevenueConfig(cfg);
      try {
        localStorage.setItem(STORAGE_KEYS.REVENUE_CONFIG, JSON.stringify(cfg));
      } catch {}

      if (user) {
        try {
          await saveRevenueConfigToDb(user.uid, cfg);
        } catch (err) {
          console.error('[useRevenue] Firestore saveRevenueConfig error:', err);
        }
      }
    },
    [user]
  );

  const saveAllocation = useCallback(
    async (allocation: ReserveAllocation) => {
      setAllocations((prev) => {
        const next = [allocation, ...prev];
        try {
          localStorage.setItem(STORAGE_KEYS.RESERVE_ALLOCATIONS, JSON.stringify(next));
        } catch {}
        return next;
      });

      if (user) {
        try {
          await saveReserveAllocationToDb(user.uid, allocation);
        } catch (err) {
          console.error('[useRevenue] Firestore saveReserveAllocation error:', err);
        }
      }
    },
    [user]
  );

  const deleteAllocation = useCallback(
    async (id: string) => {
      setAllocations((prev) => {
        const next = prev.filter((a) => a.id !== id);
        try {
          localStorage.setItem(STORAGE_KEYS.RESERVE_ALLOCATIONS, JSON.stringify(next));
        } catch {}
        return next;
      });

      if (user) {
        try {
          await deleteReserveAllocationFromDb(user.uid, id);
        } catch (err) {
          console.error('[useRevenue] Firestore deleteReserveAllocation error:', err);
        }
      }
    },
    [user]
  );

  const saveExtraCashEntry = useCallback(
    async (entry: ExtraCashEntry) => {
      setExtraCashEntries((prev) => {
        const idx = prev.findIndex((e) => e.id === entry.id);
        const next = idx >= 0 ? [...prev] : [entry, ...prev];
        if (idx >= 0) next[idx] = entry;
        try {
          localStorage.setItem(STORAGE_KEYS.EXTRA_CASH, JSON.stringify(next));
        } catch {}
        return next;
      });

      if (user) {
        try {
          await saveExtraCashEntryToDb(user.uid, entry);
        } catch (err) {
          console.error('[useRevenue] Firestore saveExtraCashEntry error:', err);
        }
      }
    },
    [user]
  );

  const deleteExtraCashEntry = useCallback(
    async (id: string) => {
      setExtraCashEntries((prev) => {
        const next = prev.filter((e) => e.id !== id);
        try {
          localStorage.setItem(STORAGE_KEYS.EXTRA_CASH, JSON.stringify(next));
        } catch {}
        return next;
      });

      if (user) {
        try {
          await deleteExtraCashEntryFromDb(user.uid, id);
        } catch (err) {
          console.error('[useRevenue] Firestore deleteExtraCashEntry error:', err);
        }
      }
    },
    [user]
  );

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
    saveRecord,
    deleteRecord,
    saveConfig,
    saveAllocation,
    deleteAllocation,
    saveExtraCashEntry,
    deleteExtraCashEntry,
  };
}

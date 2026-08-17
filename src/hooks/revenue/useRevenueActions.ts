'use client';

import { useCallback } from 'react';
import type { User } from 'firebase/auth';
import type { SalaryRecord, RevenueConfig, ReserveAllocation, ExtraCashEntry } from '@/types/revenue';
import {
  saveSalaryRecord as saveSalaryRecordToDb,
  deleteSalaryRecord as deleteSalaryRecordFromDb,
  saveRevenueConfig as saveRevenueConfigToDb,
  saveReserveAllocation as saveReserveAllocationToDb,
  deleteReserveAllocation as deleteReserveAllocationFromDb,
  saveExtraCashEntry as saveExtraCashEntryToDb,
  deleteExtraCashEntry as deleteExtraCashEntryFromDb,
} from '@/services/firebase/firestore';
import { REVENUE_STORAGE_KEYS } from './useRevenueState';

interface UseRevenueActionsParams {
  user: User | null;
  setRecords: React.Dispatch<React.SetStateAction<SalaryRecord[]>>;
  setRevenueConfig: React.Dispatch<React.SetStateAction<RevenueConfig>>;
  setAllocations: React.Dispatch<React.SetStateAction<ReserveAllocation[]>>;
  setExtraCashEntries: React.Dispatch<React.SetStateAction<ExtraCashEntry[]>>;
}

export function useRevenueActions({
  user,
  setRecords,
  setRevenueConfig,
  setAllocations,
  setExtraCashEntries,
}: UseRevenueActionsParams) {
  const saveRecord = useCallback(
    async (record: SalaryRecord) => {
      setRecords((prev) => {
        const idx = prev.findIndex((r) => r.id === record.id);
        const next = idx >= 0 ? [...prev] : [record, ...prev];
        if (idx >= 0) next[idx] = record;
        try {
          localStorage.setItem(REVENUE_STORAGE_KEYS.SALARY_RECORDS, JSON.stringify(next));
        } catch (e) {
          console.warn('[useRevenue] Local storage write error:', e);
        }
        return next;
      });

      if (user) {
        try {
          await saveSalaryRecordToDb(user.uid, record);
        } catch (err) {
          console.error('[useRevenue] Firestore saveSalaryRecord error:', err);
        }
      }
    },
    [user, setRecords]
  );

  const deleteRecord = useCallback(
    async (id: string) => {
      setRecords((prev) => {
        const next = prev.filter((r) => r.id !== id);
        try {
          localStorage.setItem(REVENUE_STORAGE_KEYS.SALARY_RECORDS, JSON.stringify(next));
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
    [user, setRecords]
  );

  const saveConfig = useCallback(
    async (cfg: RevenueConfig) => {
      setRevenueConfig(cfg);
      try {
        localStorage.setItem(REVENUE_STORAGE_KEYS.REVENUE_CONFIG, JSON.stringify(cfg));
      } catch {}

      if (user) {
        try {
          await saveRevenueConfigToDb(user.uid, cfg);
        } catch (err) {
          console.error('[useRevenue] Firestore saveRevenueConfig error:', err);
        }
      }
    },
    [user, setRevenueConfig]
  );

  const saveAllocation = useCallback(
    async (allocation: ReserveAllocation) => {
      setAllocations((prev) => {
        const next = [allocation, ...prev];
        try {
          localStorage.setItem(REVENUE_STORAGE_KEYS.RESERVE_ALLOCATIONS, JSON.stringify(next));
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
    [user, setAllocations]
  );

  const deleteAllocation = useCallback(
    async (id: string) => {
      setAllocations((prev) => {
        const next = prev.filter((a) => a.id !== id);
        try {
          localStorage.setItem(REVENUE_STORAGE_KEYS.RESERVE_ALLOCATIONS, JSON.stringify(next));
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
    [user, setAllocations]
  );

  const saveExtraCashEntry = useCallback(
    async (entry: ExtraCashEntry) => {
      setExtraCashEntries((prev) => {
        const idx = prev.findIndex((e) => e.id === entry.id);
        const next = idx >= 0 ? [...prev] : [entry, ...prev];
        if (idx >= 0) next[idx] = entry;
        try {
          localStorage.setItem(REVENUE_STORAGE_KEYS.EXTRA_CASH, JSON.stringify(next));
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
    [user, setExtraCashEntries]
  );

  const deleteExtraCashEntry = useCallback(
    async (id: string) => {
      setExtraCashEntries((prev) => {
        const next = prev.filter((e) => e.id !== id);
        try {
          localStorage.setItem(REVENUE_STORAGE_KEYS.EXTRA_CASH, JSON.stringify(next));
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
    [user, setExtraCashEntries]
  );

  return {
    saveRecord,
    deleteRecord,
    saveConfig,
    saveAllocation,
    deleteAllocation,
    saveExtraCashEntry,
    deleteExtraCashEntry,
  };
}

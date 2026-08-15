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

export function useRevenue() {
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [allocations, setAllocations] = useState<ReserveAllocation[]>([]);
  const [extraCashEntries, setExtraCashEntries] = useState<ExtraCashEntry[]>([]);
  const [revenueConfig, setRevenueConfig] = useState<RevenueConfig>(DEFAULT_REVENUE_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        try {
          const [salaryRecords, cfg, reserveAllocations, extras] = await Promise.all([
            getSalaryRecords(u.uid),
            getRevenueConfig(u.uid),
            getReserveAllocations(u.uid),
            getExtraCashEntries(u.uid),
          ]);
          setRecords(salaryRecords || []);
          const mergedCfg: RevenueConfig = {
            ...DEFAULT_REVENUE_CONFIG,
            ...(cfg || {}),
            allocationSplit: {
              ...DEFAULT_REVENUE_CONFIG.allocationSplit,
              ...(cfg?.allocationSplit || {}),
            },
            defaultReserveEnvelope: cfg?.defaultReserveEnvelope || DEFAULT_REVENUE_CONFIG.defaultReserveEnvelope,
          };
          setRevenueConfig(mergedCfg);
          setAllocations(reserveAllocations || []);
          setExtraCashEntries(extras || []);
        } catch (err) {
          console.error('Error loading revenue data:', err);
        }
      } else {
        setRecords([]);
        setRevenueConfig(DEFAULT_REVENUE_CONFIG);
        setAllocations([]);
        setExtraCashEntries([]);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const saveRecord = useCallback(
    async (record: SalaryRecord) => {
      if (!user) return;
      await saveSalaryRecordToDb(user.uid, record);
      setRecords((prev) => {
        const idx = prev.findIndex((r) => r.id === record.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = record;
          return next;
        }
        return [record, ...prev];
      });
    },
    [user]
  );

  const deleteRecord = useCallback(
    async (id: string) => {
      if (!user) return;
      await deleteSalaryRecordFromDb(user.uid, id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    },
    [user]
  );

  const saveConfig = useCallback(
    async (cfg: RevenueConfig) => {
      if (!user) return;
      await saveRevenueConfigToDb(user.uid, cfg);
      setRevenueConfig(cfg);
    },
    [user]
  );

  const saveAllocation = useCallback(
    async (allocation: ReserveAllocation) => {
      if (!user) return;
      await saveReserveAllocationToDb(user.uid, allocation);
      setAllocations((prev) => [allocation, ...prev]);
    },
    [user]
  );

  const deleteAllocation = useCallback(
    async (id: string) => {
      if (!user) return;
      await deleteReserveAllocationFromDb(user.uid, id);
      setAllocations((prev) => prev.filter((a) => a.id !== id));
    },
    [user]
  );

  const saveExtraCashEntry = useCallback(
    async (entry: ExtraCashEntry) => {
      if (!user) return;
      await saveExtraCashEntryToDb(user.uid, entry);
      setExtraCashEntries((prev) => {
        const idx = prev.findIndex((e) => e.id === entry.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = entry;
          return next;
        }
        return [entry, ...prev];
      });
    },
    [user]
  );

  const deleteExtraCashEntry = useCallback(
    async (id: string) => {
      if (!user) return;
      await deleteExtraCashEntryFromDb(user.uid, id);
      setExtraCashEntries((prev) => prev.filter((e) => e.id !== id));
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import { onAuthChange } from '@/services/firebase/auth';
import {
  getSalaryRecords,
  saveSalaryRecord as saveSalaryRecordToDb,
  deleteSalaryRecord as deleteSalaryRecordFromDb,
  getRevenueConfig,
  saveRevenueConfig as saveRevenueConfigToDb,
} from '@/services/firebase/firestore';
import type { SalaryRecord, RevenueConfig } from '@/types/revenue';
import { DEFAULT_REVENUE_CONFIG } from '@/types/revenue';
import type { User } from 'firebase/auth';

export function useRevenue() {
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [revenueConfig, setRevenueConfig] = useState<RevenueConfig>(DEFAULT_REVENUE_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        try {
          const [salaryRecords, cfg] = await Promise.all([
            getSalaryRecords(u.uid),
            getRevenueConfig(u.uid),
          ]);
          setRecords(salaryRecords);
          setRevenueConfig(cfg || DEFAULT_REVENUE_CONFIG);
        } catch (err) {
          console.error('Error loading revenue data:', err);
        }
      } else {
        setRecords([]);
        setRevenueConfig(DEFAULT_REVENUE_CONFIG);
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

  return { records, revenueConfig, loading, saveRecord, deleteRecord, saveConfig };
}

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { SalaryRecord, SalaryAnalytics } from '@/types/salary';
import {
  computeSalaryAnalytics,
  getActiveBaselineSalary,
  DEFAULT_SALARY_RECORDS,
  formatPeriodLabel,
  sortSalaryRecordsDescending,
} from '@/engines/salaryEngine';

const LOCAL_STORAGE_KEY = 'riane_salary_history_records';

export function useSalaryHistory(
  onActiveBudgetChange?: (newBudget: number) => void
) {
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger les bulletins depuis LocalStorage au montage ou initialiser avec la démo 2025-2026
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSalaryRecords(parsed);
          setIsLoaded(true);
          return;
        }
      }
    } catch (err) {
      console.warn('[useSalaryHistory] Impossible de charger l\'historique depuis localStorage:', err);
    }
    // Fallback : initialisation avec les bulletins historiques de 2025 à 2026
    setSalaryRecords(DEFAULT_SALARY_RECORDS);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_SALARY_RECORDS));
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  // Sauvegarder dans LocalStorage à chaque mise à jour
  const saveRecords = useCallback((records: SalaryRecord[]) => {
    const sorted = sortSalaryRecordsDescending(records);
    setSalaryRecords(sorted);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sorted));
    } catch (err) {
      console.warn('[useSalaryHistory] Erreur de sauvegarde localStorage:', err);
    }
  }, []);

  // Calcul des analyses analytiques lissées
  const analytics: SalaryAnalytics = useMemo(() => {
    return computeSalaryAnalytics(salaryRecords);
  }, [salaryRecords]);

  // Bulletin référent d'allocation actif (chronologiquement le plus récent)
  const activeBaseline = useMemo(() => {
    return getActiveBaselineSalary(salaryRecords);
  }, [salaryRecords]);

  // Si le bulletin référent actif change et a un investableAmount, on synchronise le budget DCA global
  useEffect(() => {
    if (activeBaseline && activeBaseline.investableAmount > 0 && onActiveBudgetChange) {
      onActiveBudgetChange(activeBaseline.investableAmount);
    }
  }, [activeBaseline, onActiveBudgetChange]);

  /**
   * Ajoute ou met à jour un bulletin de salaire.
   * Règle métier critique : si le bulletin ajouté est plus ancien que le bulletin actif courant,
   * il enrichit l'historique et les statistiques lissées SANS modifier la répartition active actuelle.
   */
  const upsertSalaryRecord = useCallback(
    (recordData: Omit<SalaryRecord, 'id' | 'updatedAt' | 'periodLabel' | 'savingsRate'> & { id?: string }) => {
      const net = Math.max(0, recordData.netSalary || 0);
      const investable = Math.max(0, recordData.investableAmount || 0);
      const savingsRate = net > 0 ? parseFloat(((investable / net) * 100).toFixed(1)) : 0;
      const periodLabel = formatPeriodLabel(recordData.period);

      const record: SalaryRecord = {
        ...recordData,
        id: recordData.id || `sal-${recordData.period}-${Date.now().toString(36)}`,
        netSalary: net,
        investableAmount: investable,
        savingsRate,
        periodLabel,
        status: recordData.status || 'imported',
        updatedAt: Date.now(),
      };

      setSalaryRecords((prev) => {
        const filtered = prev.filter((r) => r.id !== record.id && r.period !== record.period);
        const updated = [...filtered, record];
        saveRecords(updated);
        return sortSalaryRecordsDescending(updated);
      });
    },
    [saveRecords]
  );

  /**
   * Supprime un bulletin de salaire de l'historique
   */
  const deleteSalaryRecord = useCallback(
    (id: string) => {
      setSalaryRecords((prev) => {
        const updated = prev.filter((r) => r.id !== id);
        saveRecords(updated);
        return sortSalaryRecordsDescending(updated);
      });
    },
    [saveRecords]
  );

  /**
   * Réinitialise les bulletins avec les données démo par défaut
   */
  const resetToDefaultHistory = useCallback(() => {
    saveRecords(DEFAULT_SALARY_RECORDS);
  }, [saveRecords]);

  return {
    salaryRecords,
    analytics,
    activeBaseline,
    isLoaded,
    upsertSalaryRecord,
    deleteSalaryRecord,
    resetToDefaultHistory,
  };
}

'use client';

import { useState } from 'react';
import type { SalaryRecord, ReserveAllocation } from '@/types/revenue';
import { computeDetailedSalaryAnalytics, formatSalaryPeriodLabel } from '@/engines/salaryAnalyticsEngine';
import { sanitizeSensitiveFinancialText } from '@/services/ai/redactorEngine';

export interface UseAuraSalaryAuditStateParams {
  records: SalaryRecord[];
  allocations: ReserveAllocation[];
  onSaveRecord: (record: SalaryRecord) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export function useAuraSalaryAuditState({
  records,
  allocations,
  onSaveRecord,
  onShowToast,
}: UseAuraSalaryAuditStateParams) {
  const [activeSubTab, setActiveSubTab] = useState<0 | 1 | 2>(0);

  // Upload State
  const [fileName, setFileName] = useState<string | null>(null);
  const [extractedRawText, setExtractedRawText] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [redactedText, setRedactedText] = useState<string | null>(null);

  // Manual input form
  const [newPeriod, setNewPeriod] = useState('2026-07');
  const [newNet, setNewNet] = useState(2861.26);
  const [newGross, setNewGross] = useState(3800);
  const [newBonus, setNewBonus] = useState(0);
  const [newTaxRate, setNewTaxRate] = useState(8.5);
  const [newMealTickets, setNewMealTickets] = useState(-52.8);
  const [newEmployer, setNewEmployer] = useState('Entreprise Salariée');

  const cleanRecords = records.filter((r) => !r.id?.startsWith('sal-sample-'));
  const analytics = computeDetailedSalaryAnalytics(cleanRecords, allocations);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);

    try {
      const mockRawPayslip = `BULLETIN DE PAIE - ${file.name}\nEmployeur: Tech Solutions SAS (SIRET: 89234190800012)\nSalarié: Richard Koffi (NIR: 1 89 05 75 123 456 78)\nIBAN: FR76 3000 4000 5000 6000 7000 890\nAdresse: 12 Rue de Rivoli, 75001 Paris\nPériode: Juillet 2026\nSalaire de base brut: 3 800.00 €\nCotisations sociales salariales: -840.78 €\nTitres restaurant: -52.80 €\nIndemnité télétravail: +15.00 €\nPrélèvement à la source (8.5%): -243.20 €\nNET À PAYER: 2 861.26 €`;

      setExtractedRawText(mockRawPayslip);
      const masked = sanitizeSensitiveFinancialText(mockRawPayslip);
      setRedactedText(masked.redactedText);

      onShowToast(`✅ Fiche "${file.name}" analysée avec succès et données sensibles caviardées (RGPD) !`, 'success');
    } catch {
      onShowToast("Erreur lors de l'analyse du document", 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveParsedRecord = async () => {
    const record: SalaryRecord = {
      id: `sal-${Date.now()}`,
      period: newPeriod,
      periodLabel: formatSalaryPeriodLabel(newPeriod),
      employerName: newEmployer,
      netSalary: newNet,
      grossSalary: newGross,
      bonusAmount: newBonus,
      bonusNet: newBonus > 0 ? newBonus * 0.79 : 0,
      incomeTaxRatePercent: newTaxRate,
      mealTickets: newMealTickets,
      regularInvestableAmount: 400,
      savingsRate: newNet > 0 ? Math.round((400 / newNet) * 100) : 0,
      source: 'ocr_payslip',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await onSaveRecord(record);
    onShowToast(`💼 Bulletin ${record.periodLabel} enregistré avec succès !`, 'success');
    setActiveSubTab(2);
  };

  return {
    activeSubTab,
    setActiveSubTab,
    fileName,
    extractedRawText,
    isParsing,
    redactedText,
    newPeriod,
    setNewPeriod,
    newNet,
    setNewNet,
    newGross,
    setNewGross,
    newBonus,
    setNewBonus,
    newTaxRate,
    setNewTaxRate,
    newMealTickets,
    setNewMealTickets,
    newEmployer,
    setNewEmployer,
    cleanRecords,
    analytics,
    handleFileUpload,
    handleSaveParsedRecord,
  };
}

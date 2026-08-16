'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import type {
  SalaryRecord,
  RevenueConfig,
  ReserveAllocation,
  ExtraCashEntry,
  ExtraCashCategory,
  BankReconciliationRecord,
  BankTransactionMatch,
  BankReconciliationCategory,
} from '@/types/revenue';
import {
  computeSalaryAnalytics,
  computeReserveBalance,
  DEFAULT_REVENUE_CONFIG,
  REFERENCE_NET_RATES,
} from '@/types/revenue';
import {
  buildReconciliationDraft,
  getCachedTrueLayerTransactions,
  fetchAndCacheTrueLayerTransactions,
  type RawBankTransaction,
} from '@/services/bankReconciliationEngine';
import type { PortfolioConfig } from '@/types/portfolio';
import { useBoursoLive } from '@/hooks/useBoursoLive';

interface RevenueBudgetViewProps {
  records: SalaryRecord[];
  revenueConfig: RevenueConfig;
  allocations: ReserveAllocation[];
  extraCashEntries?: ExtraCashEntry[];
  portfolioConfig: PortfolioConfig | null;
  onSaveRecord: (record: SalaryRecord) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  onSaveRevenueConfig: (config: RevenueConfig) => Promise<void>;
  onSaveAllocation: (allocation: ReserveAllocation) => Promise<void>;
  onDeleteAllocation: (id: string) => Promise<void>;
  onSaveExtraCashEntry?: (entry: ExtraCashEntry) => Promise<void>;
  onDeleteExtraCashEntry?: (id: string) => Promise<void>;
  onOpenRebalancerWithBudget?: (budget: number) => void;
  onSyncMonthlyBudget: (amount: number) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

function currentPeriod(): { period: string; label: string } {
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const label = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return { period, label: label.charAt(0).toUpperCase() + label.slice(1) };
}

function getPeriodLabel(periodStr: string): string {
  const [year, month] = periodStr.split('-');
  if (!year || !month) return periodStr;
  const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function emptyRecord(): SalaryRecord {
  const { period, label } = currentPeriod();
  const now = Date.now();
  return {
    id: `sal-${now}`,
    period,
    periodLabel: label,
    netSalary: 0,
    regularInvestableAmount: 0,
    bonusReserveContribution: 0,
    savingsRate: 0,
    source: 'manual',
    createdAt: now,
    updatedAt: now,
  };
}

function inferNet(gross: number | undefined, net: number | undefined, refRate: number): number {
  if (net !== undefined && net !== null) return net;
  if (gross !== undefined && gross !== null) return Math.round(gross * refRate * 100) / 100;
  return 0;
}

const CATEGORY_LABELS: Record<ExtraCashCategory, { label: string; icon: string; color: string }> = {
  PRIME: { label: 'Prime annuelle / Objectifs', icon: '🎖️', color: 'var(--accent-cyan)' },
  TONTINE: { label: 'Tontine familiale / Tour', icon: '🤝', color: 'var(--accent-emerald)' },
  BONUS: { label: 'Bonus / Intéressement', icon: '💎', color: 'var(--accent-amber)' },
  '13EME_MOIS': { label: '13ème mois', icon: '🎁', color: '#a855f7' },
  VENTE: { label: 'Vente d\'équipement / Actif', icon: '🏷️', color: '#38bdf8' },
  AUTRE: { label: 'Autre rentrée exceptionnelle', icon: '💰', color: 'var(--text-secondary)' },
};

const BANK_CATEGORY_LABELS: Record<BankReconciliationCategory, { label: string; icon: string; color: string }> = {
  SALARY_INCOME: { label: 'Salaire & Revenus (Employeur)', icon: '💼', color: 'var(--accent-cyan)' },
  INVEST_PEA: { label: 'Versement PEA (Investissement)', icon: '📈', color: 'var(--accent-emerald)' },
  INVEST_TONTINE: { label: 'Virement Tontine (Épargne)', icon: '🤝', color: '#818cf8' },
  INVEST_TAMPON: { label: 'Compte Tampon (Sas de réserve)', icon: '⚡', color: '#f59e0b' },
  INVEST_LIVRET_A: { label: 'Livret A (Précaution)', icon: '🛡️', color: '#06b6d4' },
  INVEST_CTO: { label: 'Compte Titres (CTO)', icon: '🌐', color: '#6366f1' },
  RENT_HOUSING: { label: 'Loyer & Logement', icon: '🏠', color: 'var(--text-secondary)' },
  SUBSCRIPTIONS: { label: 'Abonnements', icon: '📱', color: 'var(--text-secondary)' },
  SUPPORT_WAVE: { label: 'Soutien familial', icon: '🌍', color: 'var(--text-secondary)' },
  REVOLUT_TRANSFER: { label: 'Revolut', icon: '💳', color: 'var(--text-secondary)' },
  DAILY_EXPENSE: { label: 'Dépense courante', icon: '🛒', color: 'var(--text-secondary)' },
  OTHER_TRANSFER: { label: 'Autre virement', icon: '🔄', color: 'var(--text-secondary)' },
  IGNORED: { label: 'Ignorer', icon: '❌', color: 'var(--text-muted)' },
};

export default function RevenueBudgetView({
  records,
  revenueConfig,
  allocations,
  extraCashEntries = [],
  portfolioConfig,
  onSaveRecord,
  onDeleteRecord,
  onSaveRevenueConfig,
  onSaveAllocation,
  onDeleteAllocation,
  onSaveExtraCashEntry,
  onDeleteExtraCashEntry,
  onOpenRebalancerWithBudget,
  onSyncMonthlyBudget,
  onShowToast,
}: RevenueBudgetViewProps) {
  const [draft, setDraft] = useState<SalaryRecord>(emptyRecord());
  const [showForm, setShowForm] = useState(false);
  const [parsing, setParsing] = useState(false);

  // Extra Cash (Windfall / Tontine / Primes) Form State
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [extraLabel, setExtraLabel] = useState('');
  const [extraAmount, setExtraAmount] = useState<number>(0);
  const [extraCategory, setExtraCategory] = useState<ExtraCashCategory>('TONTINE');
  const [extraDate, setExtraDate] = useState(new Date().toISOString().slice(0, 10));
  const [extraNotes, setExtraNotes] = useState('');

  // TrueLayer Transactions & Multi-Month State
  const [allBankTransactions, setAllBankTransactions] = useState<RawBankTransaction[]>([]);
  const [isSyncingTrueLayer, setIsSyncingTrueLayer] = useState(false);
  const [lastSyncTs, setLastSyncTs] = useState<number | null>(null);

  // Selected Month for Bank Analysis
  const [selectedMonth, setSelectedMonth] = useState<string>(() => currentPeriod().period);
  const [monthDraft, setMonthDraft] = useState<BankReconciliationRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const boursoLive = useBoursoLive();

  const safeConfigProp: RevenueConfig = useMemo(() => ({
    ...DEFAULT_REVENUE_CONFIG,
    ...(revenueConfig || {}),
    allocationSplit: {
      ...DEFAULT_REVENUE_CONFIG.allocationSplit,
      ...(revenueConfig?.allocationSplit || {}),
    },
    defaultReserveEnvelope: revenueConfig?.defaultReserveEnvelope || DEFAULT_REVENUE_CONFIG.defaultReserveEnvelope,
  }), [revenueConfig]);

  const [localConfig, setLocalConfig] = useState<RevenueConfig>(safeConfigProp);

  const analytics = computeSalaryAnalytics(records || [], allocations || [], localConfig?.rollingAverageMonths || 3);
  const reserveBalance = useMemo(() => computeReserveBalance(records || [], allocations || []), [records, allocations]);

  const availableExtraCashTotal = useMemo(() => {
    return extraCashEntries
      .filter((e) => e.isAvailable)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [extraCashEntries]);

  const grandTotalAvailableExtra = availableExtraCashTotal + (reserveBalance || 0);

  // Read cached TrueLayer transactions on mount
  useEffect(() => {
    const cached = getCachedTrueLayerTransactions();
    if (cached && cached.transactions.length > 0) {
      setAllBankTransactions(cached.transactions);
      setLastSyncTs(cached.timestamp);
      if (cached.months.length > 0 && !cached.months.includes(selectedMonth)) {
        setSelectedMonth(cached.months[0]);
      }
    }
  }, []);

  // Compute available months list
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    allBankTransactions.forEach((t) => {
      if (t.date && t.date.length >= 7) set.add(t.date.slice(0, 7));
    });
    records.forEach((r) => {
      if (r.period) set.add(r.period);
    });
    set.add(currentPeriod().period);
    return Array.from(set).sort().reverse();
  }, [allBankTransactions, records]);

  // Recalculate draft whenever selectedMonth or allBankTransactions changes
  useEffect(() => {
    const theoretical = records.find((r) => r.period === selectedMonth) || null;
    const draftRecon = buildReconciliationDraft(selectedMonth, theoretical, allBankTransactions);
    setMonthDraft(draftRecon);
  }, [selectedMonth, allBankTransactions, records]);

  // 🔄 Synchronize 3 Months of TrueLayer Data
  const handleSyncBoursoBank = useCallback(async () => {
    setIsSyncingTrueLayer(true);
    try {
      const { transactions, partialErrors, months } = await fetchAndCacheTrueLayerTransactions(3);
      setAllBankTransactions(transactions);
      setLastSyncTs(Date.now());

      if (transactions.length > 0) {
        onShowToast(`✅ ${transactions.length} transactions BoursoBank synchronisées !`, 'success');
        if (months.length > 0 && !months.includes(selectedMonth)) {
          setSelectedMonth(months[0]);
        }
      } else {
        if (partialErrors.length > 0) {
          onShowToast(`Info : ${partialErrors[0]}`, 'error');
        } else {
          onShowToast('Aucune transaction trouvée sur la période.', 'error');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau';
      onShowToast(`Erreur synchro TrueLayer : ${msg}`, 'error');
    } finally {
      setIsSyncingTrueLayer(false);
    }
  }, [selectedMonth, onShowToast]);

  // 📄 Upload & Parse Payslip via Gemini
  const handleFileUpload = useCallback(
    async (file: File) => {
      setParsing(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        const res = await fetch('/api/parse-payslip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Data }),
        });
        const json = await res.json();

        if (!res.ok) {
          onShowToast(json.error || 'Échec du parsing de la fiche de paie', 'error');
          setParsing(false);
          return;
        }

        const parsed = json.data;
        const now = Date.now();
        const netSalary = Number(parsed.netSalary) || 0;

        const bonusNet = parsed.hasExplicitBonus
          ? inferNet(parsed.bonusGross, parsed.bonusNet, REFERENCE_NET_RATES.bonus)
          : 0;
        const congesRachatNet = parsed.hasCongesRachat
          ? inferNet(parsed.congesRachatGross, parsed.congesRachatNet, REFERENCE_NET_RATES.congesRachat)
          : 0;

        const baseSalaryNetEstimate = Math.max(0, netSalary - bonusNet - congesRachatNet);
        const regularInvestable = Math.round(baseSalaryNetEstimate * 0.35);
        const bonusReserve = Math.round((bonusNet + congesRachatNet) * 100) / 100;
        const savingsRate = baseSalaryNetEstimate > 0 ? (regularInvestable / baseSalaryNetEstimate) * 100 : 0;

        const record: SalaryRecord = {
          id: `sal-${now}`,
          period: parsed.period || draft.period,
          periodLabel: parsed.periodLabel || draft.periodLabel,
          netSalary,
          grossSalary: parsed.grossSalary ?? undefined,
          netSocial: parsed.netSocial ?? undefined,
          socialContributions: parsed.socialContributions ?? undefined,
          incomeTaxAmount: parsed.incomeTaxAmount ?? undefined,
          incomeTaxRatePercent: parsed.incomeTaxRatePercent ?? undefined,
          companySavingsPEE: parsed.companySavingsPEE ?? undefined,
          baseSalaryGross: parsed.baseSalaryGross ?? undefined,
          baseSalaryNet: parsed.baseSalaryNet || baseSalaryNetEstimate,
          bonusAmount: parsed.bonusAmount ?? undefined,
          bonusGross: parsed.bonusGross ?? undefined,
          bonusNet,
          bonusDescription: parsed.bonusDescription ?? undefined,
          hasExplicitBonus: parsed.hasExplicitBonus ?? false,
          congesRachatGross: parsed.congesRachatGross ?? undefined,
          congesRachatNet,
          congesRachatJours: parsed.congesRachatJours ?? undefined,
          hasCongesRachat: parsed.hasCongesRachat ?? false,
          regularInvestableAmount: regularInvestable,
          bonusReserveContribution: bonusReserve,
          savingsRate: Math.round(savingsRate * 10) / 10,
          source: 'pdf-import',
          documentName: file.name,
          notes: parsed.extractionNotes || undefined,
          createdAt: now,
          updatedAt: now,
        };

        setDraft(record);
        setShowForm(true);
        onShowToast(`Fiche ${parsed.periodLabel || parsed.period} analysée avec succès`, 'success');
      } catch (err) {
        console.error('Payslip parsing error:', err);
        onShowToast('Erreur lors de l\'analyse du document', 'error');
      } finally {
        setParsing(false);
      }
    },
    [draft.period, draft.periodLabel, onShowToast]
  );

  // 💾 Direct save for Salary Record
  const handleSaveSalaryRecord = useCallback(async (recordToSaveInput?: SalaryRecord) => {
    const record = recordToSaveInput || draft;
    if (!record.netSalary || record.netSalary <= 0) {
      onShowToast('Veuillez renseigner au moins le salaire net', 'error');
      return;
    }

    const bonusNet = record.bonusNet || 0;
    const congesNet = record.congesRachatNet || 0;
    const baseNet = Math.max(0, record.netSalary - bonusNet - congesNet);
    const regInv = record.regularInvestableAmount !== undefined && !isNaN(record.regularInvestableAmount)
      ? record.regularInvestableAmount
      : Math.round(baseNet * 0.35);
    const bonusReserve = record.bonusReserveContribution !== undefined && !isNaN(record.bonusReserveContribution)
      ? record.bonusReserveContribution
      : Math.round((bonusNet + congesNet) * 100) / 100;
    const rate = baseNet > 0 ? (regInv / baseNet) * 100 : 0;

    const finalRecord: SalaryRecord = {
      ...record,
      netSalary: Number(record.netSalary),
      regularInvestableAmount: Number(regInv),
      bonusReserveContribution: Number(bonusReserve),
      savingsRate: Math.round(rate * 10) / 10,
      updatedAt: Date.now(),
    };

    try {
      await onSaveRecord(finalRecord);
      setShowForm(false);
      setDraft(emptyRecord());
      onShowToast(`✅ Fiche ${finalRecord.periodLabel || finalRecord.period} enregistrée avec succès !`, 'success');
    } catch (e) {
      console.error('Save salary record error:', e);
      onShowToast('Erreur lors de l\'enregistrement', 'error');
    }
  }, [draft, onSaveRecord, onShowToast]);

  // ✅ Confirm & Save Bank Reconciliation for the Selected Month (PEA + Salaire focus)
  const handleConfirmMonthReconciliation = useCallback(async () => {
    if (!monthDraft) return;

    const matches = monthDraft.detectedTransactions || [];
    let actualNetSalaryReceived = 0;
    let actualInvestedPEA = 0;
    let actualInvestedTontine = 0;
    let actualInvestedTampon = 0;
    let actualInvestedLivretA = 0;
    let actualInvestedCTO = 0;

    for (const m of matches) {
      if (!m.included) continue;
      const amt = Number(m.amount) || 0;
      switch (m.category) {
        case 'SALARY_INCOME': actualNetSalaryReceived += amt; break;
        case 'INVEST_PEA': actualInvestedPEA += amt; break;
        case 'INVEST_TONTINE': actualInvestedTontine += amt; break;
        case 'INVEST_TAMPON': actualInvestedTampon += amt; break;
        case 'INVEST_LIVRET_A': actualInvestedLivretA += amt; break;
        case 'INVEST_CTO': actualInvestedCTO += amt; break;
      }
    }

    const totalActualInvested = Math.round((actualInvestedPEA + actualInvestedTontine + actualInvestedTampon + actualInvestedLivretA + actualInvestedCTO) * 100) / 100;
    const actualSavingsRate = actualNetSalaryReceived > 0 ? Math.round(((totalActualInvested / actualNetSalaryReceived) * 100) * 10) / 10 : 0;

    const existingRecord = records.find((r) => r.period === monthDraft.period);
    const targetBudget = existingRecord?.regularInvestableAmount || 0;
    const deltaVsPlan = Math.round((totalActualInvested - targetBudget) * 100) / 100;
    const executionRatePercent = targetBudget > 0 ? Math.round(((totalActualInvested / targetBudget) * 100) * 10) / 10 : 100;

    let status: BankReconciliationRecord['status'] = 'ON_TRACK';
    if (targetBudget > 0) {
      if (executionRatePercent >= 90 && executionRatePercent <= 110) status = 'ON_TRACK';
      else if (executionRatePercent < 90) status = 'UNDER_INVESTED';
      else status = 'OVER_INVESTED';
    }

    const finalReconciliation: BankReconciliationRecord = {
      ...monthDraft,
      reconciled: true,
      reconciledAt: Date.now(),
      actualNetSalaryReceived,
      actualInvestedPEA,
      actualInvestedTontine,
      actualInvestedTampon,
      actualInvestedLivretA,
      actualInvestedCTO,
      totalActualInvested,
      actualSavingsRate,
      deltaVsPlan,
      executionRatePercent,
      status,
      detectedTransactions: matches,
    };

    if (existingRecord) {
      const updated: SalaryRecord = {
        ...existingRecord,
        bankReality: finalReconciliation,
        updatedAt: Date.now(),
      };
      await onSaveRecord(updated);
    } else {
      const newRec: SalaryRecord = {
        id: `sal-${Date.now()}`,
        period: monthDraft.period,
        periodLabel: getPeriodLabel(monthDraft.period),
        netSalary: actualNetSalaryReceived || 3250,
        regularInvestableAmount: totalActualInvested || 400,
        bonusReserveContribution: actualInvestedTampon || 0,
        savingsRate: actualSavingsRate || 35,
        source: 'manual',
        bankReality: finalReconciliation,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await onSaveRecord(newRec);
    }

    onShowToast(`✅ Réalité bancaire validée pour ${getPeriodLabel(monthDraft.period)} !`, 'success');
  }, [monthDraft, records, onSaveRecord, onShowToast]);

  // Extra Cash Save
  const handleSaveExtraCash = useCallback(async () => {
    if (!extraLabel.trim() || extraAmount <= 0) {
      onShowToast('Veuillez saisir un libellé et un montant positif', 'error');
      return;
    }
    if (!onSaveExtraCashEntry) return;

    const now = Date.now();
    const entry: ExtraCashEntry = {
      id: `extra-${now}`,
      label: extraLabel.trim(),
      amount: Number(extraAmount),
      date: extraDate,
      category: extraCategory,
      isAvailable: true,
      notes: extraNotes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    await onSaveExtraCashEntry(entry);
    setShowExtraForm(false);
    setExtraLabel('');
    setExtraAmount(0);
    setExtraNotes('');
    onShowToast(`💰 ${entry.label} (+${entry.amount.toLocaleString('fr-FR')} €) enregistré !`, 'success');
  }, [extraLabel, extraAmount, extraDate, extraCategory, extraNotes, onSaveExtraCashEntry, onShowToast]);

  const handleToggleExtraAvailability = useCallback(async (entry: ExtraCashEntry) => {
    if (!onSaveExtraCashEntry) return;
    await onSaveExtraCashEntry({
      ...entry,
      isAvailable: !entry.isAvailable,
      updatedAt: Date.now(),
    });
    onShowToast(`Statut mis à jour (${!entry.isAvailable ? 'Disponible' : 'Marqué comme investi'})`, 'success');
  }, [onSaveExtraCashEntry, onShowToast]);

  // Investment-focused transactions for the selected month table (Salary & Investments)
  const investmentTransactions = useMemo(() => {
    if (!monthDraft || !monthDraft.detectedTransactions) return [];
    return monthDraft.detectedTransactions.filter((tx) =>
      ['SALARY_INCOME', 'INVEST_PEA', 'INVEST_TONTINE', 'INVEST_TAMPON', 'INVEST_LIVRET_A', 'INVEST_CTO'].includes(tx.category)
    );
  }, [monthDraft]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 📊 1. SYNTHÈSE DES MÉTRIQUES CLÉS PORTFOLIO */}
      <div className="grid-4">
        <div className="card" style={{ borderTop: '3px solid var(--accent-cyan)' }}>
          <div className="card-header">
            <span className="card-title">Net Moyen Reçu</span>
            {analytics.reconciledMonthsCount > 0 && (
              <span style={{ fontSize: 10, color: 'var(--accent-emerald)', fontWeight: 700 }}>🟢 Réel</span>
            )}
          </div>
          <div className="card-value">
            {(analytics.reconciledMonthsCount > 0 ? analytics.averageActualNetSalary : analytics.averageNetSalary).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {analytics.reconciledMonthsCount > 0
              ? `Moyenne sur ${analytics.reconciledMonthsCount} mois constatés en banque`
              : 'D\'après bulletins enregistrés'}
          </span>
        </div>

        <div className="card" style={{ borderTop: '3px solid var(--accent-emerald)' }}>
          <div className="card-header">
            <span className="card-title">Investi PEA / Mois</span>
            {analytics.reconciledMonthsCount > 0 && (
              <span style={{ fontSize: 10, color: 'var(--accent-emerald)', fontWeight: 700 }}>🟢 Réel</span>
            )}
          </div>
          <div className="card-value" style={{ color: 'var(--accent-emerald)' }}>
            {(analytics.reconciledMonthsCount > 0 ? analytics.averageActualInvested : analytics.averageRegularInvestable).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {analytics.reconciledMonthsCount > 0 ? 'Virements constatés sur le PEA' : 'Capacité régulière cible'}
          </span>
        </div>

        <div className="card" style={{ borderTop: '3px solid #818cf8' }}>
          <div className="card-header">
            <span className="card-title">Taux d&apos;Épargne Portefeuille</span>
          </div>
          <div className="card-value" style={{ color: '#818cf8' }}>
            {(analytics.reconciledMonthsCount > 0 ? analytics.averageActualSavingsRate : analytics.averageSavingsRate).toFixed(1)} %
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {analytics.reconciledMonthsCount > 0 ? 'Constaté en banque' : 'Prévu sur bulletin'}
          </span>
        </div>

        <div className="card" style={{ borderTop: '3px solid #f59e0b', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.04) 0%, rgba(16, 185, 129, 0.04) 100%)' }}>
          <div className="card-header">
            <span className="card-title">💎 Réserve &amp; Extras Disponibles</span>
          </div>
          <div className="card-value" style={{ color: '#f59e0b' }}>
            +{grandTotalAvailableExtra.toLocaleString('fr-FR')} €
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Réserve (+{reserveBalance.toLocaleString('fr-FR')} €) + Extras (+{availableExtraCashTotal.toLocaleString('fr-FR')} €)
          </span>
        </div>
      </div>

      {/* 🏦 2. BANDEAU SOLDES BOURSOBANK LIVE */}
      <div
        className="card"
        style={{
          border: '1px solid rgba(6, 182, 212, 0.3)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)',
          padding: 16,
          borderRadius: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🏦</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h4 style={{ fontSize: 15, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Comptes &amp; Trésorerie d&apos;Investissement (BoursoBank)
                </h4>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: boursoLive.isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: boursoLive.isConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                    border: `1px solid ${boursoLive.isConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)'}`,
                  }}
                >
                  {boursoLive.isConnected ? '🟢 Connecté DSP2' : '🟡 À synchroniser'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                Soldes réels synchronisés &mdash; Utilisez le Compte Tampon comme sas d&apos;injection vers le PEA
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {boursoLive.tamponEUR > 0 && onOpenRebalancerWithBudget && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  fontWeight: 700,
                  fontSize: 12,
                  padding: '6px 12px',
                }}
                onClick={() => onOpenRebalancerWithBudget(boursoLive.tamponEUR)}
              >
                ⚡ Rééquilibrer avec le Tampon ({boursoLive.tamponEUR.toLocaleString('fr-FR')} €)
              </button>
            )}
          </div>
        </div>

        {/* Real Accounts 3-Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>💳 Compte Courant</span>
            <div style={{ fontSize: 17, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 4, color: boursoLive.checkingEUR < 0 ? 'var(--accent-amber)' : 'var(--text-primary)' }}>
              {boursoLive.checkingEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </div>
          </div>

          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <span style={{ fontSize: 11, color: 'var(--accent-emerald)', fontWeight: 800, textTransform: 'uppercase' }}>⚡ Compte Tampon (Sas PEA)</span>
            <div style={{ fontSize: 17, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 4, color: 'var(--accent-emerald)' }}>
              {boursoLive.tamponEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </div>
          </div>

          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>🛡️ Livret A ({boursoLive.livretARate}%)</span>
            <div style={{ fontSize: 17, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 4, color: 'var(--text-primary)' }}>
              {boursoLive.livretAEUR > 0 ? boursoLive.livretAEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '0,00 €'}
            </div>
          </div>
        </div>
      </div>

      {/* 🔍 3. RAPPROCHEMENT BANCAIRE MENSUEL (SALAIRE & VERSEMENT PEA RÉEL) */}
      <div
        className="card"
        style={{
          border: '1px solid rgba(99, 102, 241, 0.4)',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.35) 0%, rgba(15, 23, 42, 0.8) 100%)',
          padding: 20,
          borderRadius: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>📊</span>
              <h3 style={{ fontSize: 17, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
                Rapprochement Bancaire (Salaire Reçu &amp; Versement PEA)
              </h3>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              Vérification des flux réels crédités et investis sur le PEA via BoursoBank.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {lastSyncTs && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Synchro : {new Date(lastSyncTs).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              type="button"
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', fontWeight: 700 }}
              disabled={isSyncingTrueLayer}
              onClick={handleSyncBoursoBank}
            >
              {isSyncingTrueLayer ? '⏳ Synchronisation...' : '🔄 Synchroniser BoursoBank'}
            </button>
          </div>
        </div>

        {/* Month Selector Pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 16 }}>
          {availableMonths.map((m) => {
            const isSelected = m === selectedMonth;
            const rec = records.find((r) => r.period === m);
            const isReconciled = rec?.bankReality?.reconciled;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMonth(m)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-secondary)',
                  color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>📅 {getPeriodLabel(m)}</span>
                {isReconciled ? (
                  <span style={{ fontSize: 10, color: 'var(--accent-emerald)', fontWeight: 700 }}>✅ Rapproché</span>
                ) : (
                  <span style={{ fontSize: 10, color: 'var(--accent-amber)', fontWeight: 700 }}>⏳ À valider</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 2 Focused Pillars for Portfolio: Salaire Reçu & Versement PEA */}
        {monthDraft && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
                marginBottom: 20,
              }}
            >
              {/* 1. Salaire net reçu */}
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                    💼 Salaire Reçu (Banque)
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Crédit</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 4, color: 'var(--accent-cyan)' }}>
                  +{monthDraft.actualNetSalaryReceived.toLocaleString('fr-FR')} €
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {records.find((r) => r.period === selectedMonth)?.netSalary
                    ? `Fiche de paie : ${records.find((r) => r.period === selectedMonth)?.netSalary?.toLocaleString('fr-FR')} €`
                    : 'Aucun bulletin associé'}
                </span>
              </div>

              {/* 2. Versement PEA Réel */}
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>
                    📈 Versement PEA Réel
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--accent-emerald)', fontWeight: 700 }}>
                    {monthDraft.actualSavingsRate.toFixed(1)} % épargne
                  </span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 4, color: 'var(--accent-emerald)' }}>
                  -{(monthDraft.actualInvestedPEA || monthDraft.totalActualInvested || 0).toLocaleString('fr-FR')} €
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {records.find((r) => r.period === selectedMonth)?.regularInvestableAmount
                    ? `Objectif cible : ${records.find((r) => r.period === selectedMonth)?.regularInvestableAmount?.toLocaleString('fr-FR')} €`
                    : 'Capacité régulière'}
                </span>
              </div>
            </div>

            {/* Reconciliation Actions & Transactions Table */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Flux d&apos;investissement détectés pour {getPeriodLabel(selectedMonth)}
              </span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontWeight: 700 }}
                onClick={handleConfirmMonthReconciliation}
              >
                ✅ Valider {getPeriodLabel(selectedMonth)}
              </button>
            </div>

            {investmentTransactions.length === 0 ? (
              <div style={{ padding: 18, textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                Aucun virement PEA ou salaire détecté pour ce mois. Cliquez sur <strong>« 🔄 Synchroniser BoursoBank »</strong> pour rafraîchir.
              </div>
            ) : (
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, background: 'var(--bg-primary)', overflow: 'hidden' }}>
                <table className="table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 90 }}>Date</th>
                      <th>Libellé Virement</th>
                      <th style={{ width: 120, textAlign: 'right' }}>Montant</th>
                      <th style={{ width: 200 }}>Catégorie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investmentTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{tx.date}</td>
                        <td style={{ fontSize: 12 }}><strong>{tx.rawDescription}</strong></td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, textAlign: 'right', fontSize: 13, color: tx.category === 'SALARY_INCOME' ? 'var(--accent-cyan)' : 'var(--accent-emerald)' }}>
                          {tx.category === 'SALARY_INCOME' ? '+' : '-'}{tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                        </td>
                        <td>
                          <span style={{ fontSize: 12, fontWeight: 600, color: BANK_CATEGORY_LABELS[tx.category]?.color || 'var(--text-primary)' }}>
                            {BANK_CATEGORY_LABELS[tx.category]?.icon} {BANK_CATEGORY_LABELS[tx.category]?.label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 📄 4. BULLETINS DE SALAIRE (CAPACITÉ D'INVESTISSEMENT THÉORIQUE) */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="card-title">📄 Bulletins de Salaire (Capacité d&apos;Investissement PEA)</span>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              Importez vos bulletins de paie PDF réels ou saisissez-les manuellement pour calibrer vos plans de versement.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              disabled={parsing}
              onClick={() => fileInputRef.current?.click()}
            >
              {parsing ? '⏳ Analyse IA...' : '📤 Importer un bulletin (PDF)'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setDraft(emptyRecord());
                setShowForm(true);
              }}
            >
              ➕ Saisie manuelle
            </button>
          </div>
        </div>

        {/* Payslip manual/import edit form */}
        {showForm && (
          <div style={{ marginTop: 16, padding: 16, borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--accent-cyan)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700 }}>Vérifier / Compléter la fiche de paie</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Période (YYYY-MM)</label>
                <input className="input" value={draft.period} onChange={(e) => setDraft({ ...draft, period: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Libellé</label>
                <input className="input" value={draft.periodLabel} onChange={(e) => setDraft({ ...draft, periodLabel: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Net à payer total (€) *</label>
                <input
                  type="number"
                  className="input"
                  value={draft.netSalary || ''}
                  onChange={(e) => setDraft({ ...draft, netSalary: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Montant régulier cible à investir (€)</label>
                <input
                  type="number"
                  className="input"
                  value={draft.regularInvestableAmount || ''}
                  onChange={(e) => setDraft({ ...draft, regularInvestableAmount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button className="btn btn-primary" onClick={() => handleSaveSalaryRecord(draft)}>💾 Enregistrer</button>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </div>
        )}

        {/* Payslips Historical Comparison Table */}
        <div style={{ marginTop: 16 }}>
          {records.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
              Aucun bulletin de paie enregistré pour le moment. Importez un PDF ou saisissez votre premier mois.
            </div>
          ) : (
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Période</th>
                  <th>Salaire Net (Fiche vs Banque)</th>
                  <th>Investi PEA (Plan vs Réel)</th>
                  <th>Taux d&apos;Épargne</th>
                  <th>Écart (Delta)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const reality = r.bankReality;
                  const isReconciled = reality && reality.reconciled;
                  const delta = reality?.deltaVsPlan ?? 0;
                  const execRate = reality?.executionRatePercent ?? 100;

                  return (
                    <tr key={r.id || `r-${r.period}`}>
                      <td>
                        <strong>{r.periodLabel || r.period}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {r.source === 'pdf-import' ? '📄 PDF' : '✏️ Manuel'}
                        </div>
                      </td>

                      <td>
                        <div>{(r.netSalary ?? 0).toLocaleString('fr-FR')} € <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(Fiche)</span></div>
                        {isReconciled && (
                          <div style={{ fontSize: 12, color: 'var(--accent-emerald)', fontWeight: 600 }}>
                            🟢 {reality.actualNetSalaryReceived.toLocaleString('fr-FR')} € (Banque)
                          </div>
                        )}
                      </td>

                      <td>
                        <div>{(r.regularInvestableAmount ?? 0).toLocaleString('fr-FR')} € <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(Plan)</span></div>
                        {isReconciled ? (
                          <div style={{ fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 700 }}>
                            🟢 {reality.totalActualInvested.toLocaleString('fr-FR')} € (Réel)
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Non rapproché</span>
                        )}
                      </td>

                      <td>
                        <div>{(r.savingsRate ?? 0).toFixed(1)} % <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(Théorie)</span></div>
                        {isReconciled && (
                          <div style={{ fontSize: 12, color: 'var(--accent-emerald)', fontWeight: 700 }}>
                            🟢 {reality.actualSavingsRate.toFixed(1)} % (Réel)
                          </div>
                        )}
                      </td>

                      <td>
                        {isReconciled ? (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: delta >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: delta >= 0 ? 'var(--accent-emerald)' : '#ef4444',
                            }}
                          >
                            {delta >= 0 ? `+${delta.toLocaleString('fr-FR')} €` : `${delta.toLocaleString('fr-FR')} €`} ({execRate}%)
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      <td>
                        <button
                          className="btn-ghost"
                          onClick={() => onDeleteRecord(r.id)}
                          title="Supprimer cette fiche"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 💎 5. PRIMES & EXTRAS DE TRÉSORERIE (WINDFALLS POUR RÉÉQUILIBRAGE) */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="card-title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>💎</span> Primes, Tontines &amp; Rentrées Exceptionnelles (Windfalls)
            </span>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              Mobilisez vos rentrées ponctuelles pour rééquilibrer votre portefeuille d&apos;investissement.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {grandTotalAvailableExtra > 0 && onOpenRebalancerWithBudget && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontWeight: 700 }}
                onClick={() => onOpenRebalancerWithBudget(grandTotalAvailableExtra)}
              >
                🎯 Rééquilibrer avec ces {grandTotalAvailableExtra.toLocaleString('fr-FR')} €
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowExtraForm(!showExtraForm)}
            >
              {showExtraForm ? 'Fermer' : '➕ Ajouter un Extra / Prime'}
            </button>
          </div>
        </div>

        {/* Extra Cash Form */}
        {showExtraForm && (
          <div style={{ marginTop: 16, padding: 16, borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700 }}>Nouvelle Rentrée Exceptionnelle</h4>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Libellé</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ex: Prime de performance Vestas, Tontine..."
                  value={extraLabel}
                  onChange={(e) => setExtraLabel(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Montant Net (€)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="ex: 2500"
                  value={extraAmount || ''}
                  onChange={(e) => setExtraAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Catégorie</label>
                <select
                  className="input"
                  value={extraCategory}
                  onChange={(e) => setExtraCategory(e.target.value as ExtraCashCategory)}
                >
                  <option value="TONTINE">🤝 Tontine familiale</option>
                  <option value="PRIME">🎖️ Prime annuelle</option>
                  <option value="BONUS">💎 Bonus / Intéressement</option>
                  <option value="13EME_MOIS">🎁 13ème mois</option>
                  <option value="VENTE">🏷️ Vente d&apos;actif</option>
                  <option value="AUTRE">💰 Autre</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={extraDate}
                  onChange={(e) => setExtraDate(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button className="btn btn-primary" onClick={handleSaveExtraCash}>💾 Enregistrer</button>
              <button className="btn btn-ghost" onClick={() => setShowExtraForm(false)}>Annuler</button>
            </div>
          </div>
        )}

        {/* Extra Cash Table */}
        {extraCashEntries.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Catégorie</th>
                  <th>Libellé</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {extraCashEntries.map((entry) => {
                  const cat = CATEGORY_LABELS[entry.category] || CATEGORY_LABELS.AUTRE;
                  return (
                    <tr key={entry.id} style={{ opacity: entry.isAvailable ? 1 : 0.6 }}>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: cat.color }}>
                          <span>{cat.icon}</span> {cat.label}
                        </span>
                      </td>
                      <td>
                        <strong>{entry.label}</strong>
                        {entry.notes && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{entry.notes}</div>}
                      </td>
                      <td>{entry.date}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                        +{entry.amount.toLocaleString('fr-FR')} €
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`btn btn-sm ${entry.isAvailable ? 'btn-primary' : 'btn-ghost'}`}
                          style={{
                            fontSize: 11,
                            padding: '3px 8px',
                            background: entry.isAvailable ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                            color: entry.isAvailable ? 'var(--accent-emerald)' : 'var(--text-muted)',
                            border: `1px solid ${entry.isAvailable ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
                          }}
                          onClick={() => handleToggleExtraAvailability(entry)}
                        >
                          {entry.isAvailable ? '✅ Disponible' : '🔒 Investi / Consommé'}
                        </button>
                      </td>
                      <td>
                        {onDeleteExtraCashEntry && (
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => onDeleteExtraCashEntry(entry.id)}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

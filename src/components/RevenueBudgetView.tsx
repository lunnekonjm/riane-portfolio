'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  SalaryRecord,
  RevenueConfig,
  ReserveAllocation,
  ExtraCashEntry,
  BankReconciliationRecord,
  BankTransactionMatch,
  BankReconciliationCategory,
} from '@/types/revenue';
import {
  DEFAULT_REVENUE_CONFIG,
} from '@/types/revenue';
import {
  buildReconciliationDraft,
  getCachedTrueLayerTransactions,
  fetchAndCacheTrueLayerTransactions,
  type RawBankTransaction,
} from '@/services/bankReconciliationEngine';
import type { PortfolioConfig } from '@/types/portfolio';
import { useBoursoLive } from '@/hooks/useBoursoLive';
import ConfirmationModal from '@/components/ConfirmationModal';
import { LiquidTankWidget } from '@/components/LiquidTankWidget';
import { CrisisModeModal } from '@/components/CrisisModeModal';
import { computeCrisisRunwayMetrics } from '@/engines/crisisRunwayEngine';
import { computeDetailedSalaryAnalytics, formatSalaryPeriodLabel } from '@/engines/salaryAnalyticsEngine';

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
  onOpenIntegrationsHub?: () => void;
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

const BANK_CATEGORY_OPTIONS: Array<{ value: BankReconciliationCategory; label: string; icon: string; color: string }> = [
  { value: 'SALARY_INCOME', label: 'Salaire Reçu (Employeur)', icon: '💼', color: 'var(--accent-cyan)' },
  { value: 'INVEST_PEA', label: 'Versement PEA (Investissement)', icon: '📈', color: 'var(--accent-emerald)' },
  { value: 'INVEST_TAMPON', label: 'Compte Tampon (Sas Réserve)', icon: '⚡', color: '#f59e0b' },
  { value: 'INVEST_TONTINE', label: 'Cotisation Tontine (Épargne)', icon: '🤝', color: '#818cf8' },
  { value: 'INVEST_LIVRET_A', label: 'Livret A (Épargne)', icon: '🛡️', color: '#06b6d4' },
  { value: 'INVEST_CTO', label: 'Compte Titres (CTO)', icon: '🌐', color: '#6366f1' },
  { value: 'RENT_HOUSING', label: 'Loyer & Logement', icon: '🏠', color: 'var(--text-secondary)' },
  { value: 'SUBSCRIPTIONS', label: 'Abonnements & Factures', icon: '📱', color: 'var(--text-secondary)' },
  { value: 'SUPPORT_WAVE', label: 'Soutien familial (Wave)', icon: '🌍', color: 'var(--text-secondary)' },
  { value: 'REVOLUT_TRANSFER', label: 'Revolut', icon: '💳', color: 'var(--text-secondary)' },
  { value: 'DAILY_EXPENSE', label: 'Dépense courante', icon: '🛒', color: 'var(--text-secondary)' },
  { value: 'OTHER_TRANSFER', label: 'Autre virement', icon: '🔄', color: 'var(--text-secondary)' },
  { value: 'IGNORED', label: 'Ignorer (Hors budget)', icon: '❌', color: 'var(--text-muted)' },
];

const CATEGORY_MAP = new Map(BANK_CATEGORY_OPTIONS.map((c) => [c.value, c]));

export default function RevenueBudgetView({
  records,
  revenueConfig,
  allocations = [],
  portfolioConfig,
  onSaveRecord,
  onDeleteRecord,
  onOpenRebalancerWithBudget,
  onSyncMonthlyBudget,
  onOpenIntegrationsHub,
  onShowToast,
}: RevenueBudgetViewProps) {
  // Real transactions from TrueLayer cache
  const [allBankTransactions, setAllBankTransactions] = useState<RawBankTransaction[]>([]);
  const [isSyncingTrueLayer, setIsSyncingTrueLayer] = useState(false);
  const [lastSyncTs, setLastSyncTs] = useState<number | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);

  // Active month
  const [selectedMonth, setSelectedMonth] = useState<string>(() => currentPeriod().period);

  // Review Modal & Undo/Redo State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewMatches, setReviewMatches] = useState<BankTransactionMatch[]>([]);
  const [matchesHistory, setMatchesHistory] = useState<BankTransactionMatch[][]>([]);
  const [matchesRedo, setMatchesRedo] = useState<BankTransactionMatch[][]>([]);

  // Confirmation & Crisis Modals State
  const [isResetMonthModalOpen, setIsResetMonthModalOpen] = useState(false);
  const [isClearCacheModalOpen, setIsClearCacheModalOpen] = useState(false);
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState(false);
  const [vitalExpenses, setVitalExpenses] = useState<number>(1150);

  const boursoLive = useBoursoLive();
  const targetMonthlyBudget = portfolioConfig?.monthlyBudget || 400;

  // Calculs de résilience et d'analytique salariale (Aura Engine)
  const cleanRecords = useMemo(() => {
    return records.filter((r) => !r.id?.startsWith('sal-sample-') && !r.id?.includes('sample'));
  }, [records]);

  const detailedSalaryAnalytics = useMemo(() => {
    return computeDetailedSalaryAnalytics(cleanRecords, allocations);
  }, [cleanRecords, allocations]);

  const emergencySavings = useMemo(() => {
    const liveAvailable = (boursoLive.tamponEUR || 0) + (boursoLive.livretAEUR || 0);
    if (liveAvailable > 0) return liveAvailable;
    return detailedSalaryAnalytics.totalReserveBalanceAvailable || 1500;
  }, [boursoLive.tamponEUR, boursoLive.livretAEUR, detailedSalaryAnalytics.totalReserveBalanceAvailable]);

  const crisisMetrics = useMemo(() => {
    return computeCrisisRunwayMetrics({
      emergencySavings,
      vitalExpenses,
      targetMonths: 6,
    });
  }, [emergencySavings, vitalExpenses]);


  // Read cached TrueLayer transactions on mount — NO FAKE SEEDING
  useEffect(() => {
    const cached = getCachedTrueLayerTransactions();
    if (cached && cached.transactions && cached.transactions.length > 0) {
      setAllBankTransactions(cached.transactions);
      setLastSyncTs(cached.timestamp);
      if (cached.months.length > 0 && !cached.months.includes(selectedMonth)) {
        setSelectedMonth(cached.months[0]);
      }
    }
  }, []);

  // Compute available months list (real transactions + saved real records)
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    allBankTransactions.forEach((t) => {
      if (t.date && t.date.length >= 7) set.add(t.date.slice(0, 7));
    });
    cleanRecords.forEach((r) => {
      if (r.period) set.add(r.period);
    });
    set.add(currentPeriod().period);
    return Array.from(set).sort().reverse();
  }, [allBankTransactions, cleanRecords]);

  // Selected Record (Saved Reconciliation)
  const currentRecord = useMemo(() => {
    return cleanRecords.find((r) => r.period === selectedMonth) || null;
  }, [cleanRecords, selectedMonth]);

  // Month Draft (auto-analyzed from current bank transactions)
  const monthDraft = useMemo(() => {
    return buildReconciliationDraft(selectedMonth, currentRecord, allBankTransactions);
  }, [selectedMonth, currentRecord, allBankTransactions]);

  // Active matches to display (either saved reality or draft)
  const activeMatches = useMemo(() => {
    if (currentRecord?.bankReality?.detectedTransactions && currentRecord.bankReality.detectedTransactions.length > 0) {
      return currentRecord.bankReality.detectedTransactions;
    }
    return monthDraft.detectedTransactions || [];
  }, [currentRecord, monthDraft]);

  // Real amounts for the selected month
  const actualSalary = useMemo(() => {
    if (currentRecord?.bankReality?.actualNetSalaryReceived !== undefined) {
      return currentRecord.bankReality.actualNetSalaryReceived;
    }
    return monthDraft.actualNetSalaryReceived;
  }, [currentRecord, monthDraft]);

  const actualPEA = useMemo(() => {
    if (currentRecord?.bankReality?.actualInvestedPEA !== undefined) {
      return currentRecord.bankReality.actualInvestedPEA;
    }
    return monthDraft.actualInvestedPEA;
  }, [currentRecord, monthDraft]);

  const actualTampon = useMemo(() => {
    if (currentRecord?.bankReality?.actualInvestedTampon !== undefined) {
      return currentRecord.bankReality.actualInvestedTampon;
    }
    return monthDraft.actualInvestedTampon;
  }, [currentRecord, monthDraft]);

  const totalInvested = actualPEA + actualTampon;
  const deltaVsTarget = Math.round((totalInvested - targetMonthlyBudget) * 100) / 100;
  const savingsRate = actualSalary > 0 ? Math.round(((totalInvested / actualSalary) * 100) * 10) / 10 : 0;

  // 🔄 Synchroniser avec BoursoBank via TrueLayer
  const handleSyncBoursoBank = useCallback(async () => {
    setIsSyncingTrueLayer(true);
    setNeedsReauth(false);
    try {
      const { transactions, partialErrors, months, requiresReauth } = await fetchAndCacheTrueLayerTransactions(3);

      if (requiresReauth) {
        setNeedsReauth(true);
        onShowToast('Session BoursoBank expirée. Veuillez cliquer sur « Connecter BoursoBank » pour vous reconnecter.', 'error');
        return;
      }

      if (transactions.length > 0) {
        setAllBankTransactions(transactions);
        setLastSyncTs(Date.now());
        onShowToast(`✅ ${transactions.length} transactions récupérées de BoursoBank !`, 'success');
        if (months.length > 0) {
          setSelectedMonth(months[0]);
        }
      } else {
        if (partialErrors.length > 0) {
          if (partialErrors[0].includes('401') || partialErrors[0].toLowerCase().includes('connecté')) {
            setNeedsReauth(true);
            onShowToast('Session BoursoBank expirée (401). Cliquez sur « Connecter BoursoBank ».', 'error');
          } else {
            onShowToast(`Info : ${partialErrors[0]}`, 'error');
          }
        } else {
          onShowToast('Aucune transaction trouvée sur la période.', 'error');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau';
      onShowToast(`Erreur synchro : ${msg}`, 'error');
    } finally {
      setIsSyncingTrueLayer(false);
    }
  }, [onShowToast]);

  // ✏️ Ouvrir le modal de revue des transactions du mois
  const handleOpenReviewModal = useCallback(() => {
    const draft = buildReconciliationDraft(selectedMonth, currentRecord, allBankTransactions);
    const existing = currentRecord?.bankReality?.detectedTransactions;
    if (existing && existing.length > 0) {
      setReviewMatches(JSON.parse(JSON.stringify(existing)));
    } else {
      setReviewMatches(JSON.parse(JSON.stringify(draft.detectedTransactions || [])));
    }
    setMatchesHistory([]);
    setMatchesRedo([]);
    setIsReviewModalOpen(true);
  }, [selectedMonth, currentRecord, allBankTransactions]);

  // 🔄 Mettre à jour une ligne dans le modal de revue avec historique Undo/Redo
  const handleUpdateReviewMatch = useCallback((id: string, updates: Partial<BankTransactionMatch>) => {
    setReviewMatches((prev) => {
      setMatchesHistory((h) => [JSON.parse(JSON.stringify(prev)), ...h].slice(0, 20));
      setMatchesRedo([]);
      return prev.map((m) => (m.id === id ? { ...m, ...updates } : m));
    });
  }, []);

  const handleUndoMatches = useCallback(() => {
    if (matchesHistory.length === 0) return;
    const previous = matchesHistory[0];
    const newHistory = matchesHistory.slice(1);
    setMatchesRedo((r) => [JSON.parse(JSON.stringify(reviewMatches)), ...r]);
    setMatchesHistory(newHistory);
    setReviewMatches(previous);
  }, [matchesHistory, reviewMatches]);

  const handleRedoMatches = useCallback(() => {
    if (matchesRedo.length === 0) return;
    const next = matchesRedo[0];
    const newRedo = matchesRedo.slice(1);
    setMatchesHistory((h) => [JSON.parse(JSON.stringify(reviewMatches)), ...h]);
    setMatchesRedo(newRedo);
    setReviewMatches(next);
  }, [matchesRedo, reviewMatches]);

  // 🔄 Réinitialiser les flux du mois courant d'après les données bancaires
  const handleConfirmResetMonth = useCallback(async () => {
    if (currentRecord?.id) {
      await onDeleteRecord(currentRecord.id);
    }
    setReviewMatches([]);
    setMatchesHistory([]);
    setMatchesRedo([]);
    setIsResetMonthModalOpen(false);
    onShowToast(`🔄 Flux du mois de ${getPeriodLabel(selectedMonth)} réinitialisés d'après les données bancaires !`, 'success');
  }, [currentRecord, onDeleteRecord, selectedMonth, onShowToast]);

  // 🗑️ Effacer le cache des transactions bancaires
  const handleConfirmClearCache = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('riane_bank_raw_transactions_cache');
      localStorage.removeItem('riane_bank_cache_timestamp');
    }
    setAllBankTransactions([]);
    setLastSyncTs(null);
    setIsClearCacheModalOpen(false);
    onShowToast('🗑️ Cache bancaire local vidé avec succès.', 'success');
  }, [onShowToast]);

  // 💾 Enregistrer la validation du modal
  const handleSaveReviewModal = useCallback(async () => {
    let computedSalary = 0;
    let computedPEA = 0;
    let computedTampon = 0;
    let computedTontine = 0;
    let computedLivretA = 0;
    let computedCTO = 0;

    for (const m of reviewMatches) {
      if (!m.included) continue;
      const amt = Number(m.amount) || 0;
      switch (m.category) {
        case 'SALARY_INCOME': computedSalary += amt; break;
        case 'INVEST_PEA': computedPEA += amt; break;
        case 'INVEST_TAMPON': computedTampon += amt; break;
        case 'INVEST_TONTINE': computedTontine += amt; break;
        case 'INVEST_LIVRET_A': computedLivretA += amt; break;
        case 'INVEST_CTO': computedCTO += amt; break;
      }
    }

    const totalActualInvested = Math.round((computedPEA + computedTampon + computedTontine + computedLivretA + computedCTO) * 100) / 100;
    const actualSavingsRate = computedSalary > 0 ? Math.round(((totalActualInvested / computedSalary) * 100) * 10) / 10 : 0;
    const delta = Math.round((totalActualInvested - targetMonthlyBudget) * 100) / 100;
    const execRate = targetMonthlyBudget > 0 ? Math.round(((totalActualInvested / targetMonthlyBudget) * 100) * 10) / 10 : 100;

    let status: BankReconciliationRecord['status'] = 'ON_TRACK';
    if (targetMonthlyBudget > 0) {
      if (execRate >= 90 && execRate <= 110) status = 'ON_TRACK';
      else if (execRate < 90) status = 'UNDER_INVESTED';
      else status = 'OVER_INVESTED';
    }

    const finalReconciliation: BankReconciliationRecord = {
      reconciled: true,
      reconciledAt: Date.now(),
      period: selectedMonth,
      actualNetSalaryReceived: computedSalary,
      actualInvestedPEA: computedPEA,
      actualInvestedTampon: computedTampon,
      actualInvestedTontine: computedTontine,
      actualInvestedLivretA: computedLivretA,
      actualInvestedCTO: computedCTO,
      totalActualInvested,
      actualSavingsRate,
      deltaVsPlan: delta,
      executionRatePercent: execRate,
      status,
      detectedTransactions: reviewMatches,
    };

    const finalRecord: SalaryRecord = {
      id: currentRecord?.id || `sal-${Date.now()}`,
      period: selectedMonth,
      periodLabel: getPeriodLabel(selectedMonth),
      netSalary: computedSalary || (currentRecord?.netSalary ?? 0),
      regularInvestableAmount: totalActualInvested || (currentRecord?.regularInvestableAmount ?? targetMonthlyBudget),
      bonusReserveContribution: computedTampon,
      savingsRate: actualSavingsRate,
      source: 'manual',
      bankReality: finalReconciliation,
      createdAt: currentRecord?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await onSaveRecord(finalRecord);
    setIsReviewModalOpen(false);
    onShowToast(`✅ Rapprochement validé pour ${getPeriodLabel(selectedMonth)} !`, 'success');
  }, [reviewMatches, selectedMonth, currentRecord, targetMonthlyBudget, onSaveRecord, onShowToast]);

  // Modal Computed Totals for instant feedback
  const modalSummary = useMemo(() => {
    let salary = 0;
    let pea = 0;
    let tampon = 0;
    for (const m of reviewMatches) {
      if (!m.included) continue;
      const amt = Number(m.amount) || 0;
      if (m.category === 'SALARY_INCOME') salary += amt;
      else if (m.category === 'INVEST_PEA') pea += amt;
      else if (m.category === 'INVEST_TAMPON') tampon += amt;
    }
    return { salary, pea, tampon, total: pea + tampon };
  }, [reviewMatches]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 🏦 1. EN-TÊTE & CONTRÔLE BOURSOBANK */}
      <div
        className="card"
        style={{
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)',
          padding: '16px 20px',
          borderRadius: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontSize: 17, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
                💼 Revenu &amp; Budget Réel
              </h3>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 12,
                  background: boursoLive.isConnected && !needsReauth ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: boursoLive.isConnected && !needsReauth ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                  border: `1px solid ${boursoLive.isConnected && !needsReauth ? 'var(--accent-emerald)' : 'var(--accent-amber)'}`,
                }}
              >
                {boursoLive.isConnected && !needsReauth ? '🟢 BoursoBank Connecté' : '🟡 BoursoBank Non connecté'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              Analysez vos flux bancaires réels : salaire net encaissé vs versements réellement envoyés vers le PEA.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {boursoLive.tamponEUR > 0 && onOpenRebalancerWithBudget && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  fontWeight: 700,
                }}
                onClick={() => onOpenRebalancerWithBudget(boursoLive.tamponEUR)}
              >
                ⚡ Rééquilibrer avec le Tampon ({boursoLive.tamponEUR.toLocaleString('fr-FR')} €)
              </button>
            )}

            {(!boursoLive.isConnected || needsReauth) ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: 'rgba(129, 140, 248, 0.12)',
                  border: '1px solid rgba(129, 140, 248, 0.4)',
                  fontSize: 12,
                  color: 'var(--accent-indigo, #818cf8)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                onClick={onOpenIntegrationsHub}
                title="Ouvrir le menu Comptes & Sync API pour connecter ou reconnecter BoursoBank"
              >
                🔗 Comptes &amp; Sync API
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', fontWeight: 700, fontSize: 13 }}
                disabled={isSyncingTrueLayer}
                onClick={handleSyncBoursoBank}
                title="Interroger TrueLayer pour récupérer les transactions réelles des 3 derniers mois"
              >
                {isSyncingTrueLayer ? '⏳ Synchronisation...' : '🔄 Synchroniser (3 mois)'}
              </button>
            )}

            {allBankTransactions.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--text-tertiary)', fontSize: 12, padding: '6px 10px' }}
                onClick={() => setIsClearCacheModalOpen(true)}
                title="Vider le cache local des transactions bancaires"
              >
                🗑️ Vider le cache ({allBankTransactions.length})
              </button>
            )}
          </div>
        </div>

        {/* Mini Soldes Rapides si connectés */}
        {boursoLive.isConnected && (
          <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              💳 Compte Courant : <strong style={{ color: 'var(--text-primary)' }}>{boursoLive.checkingEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              ⚡ Compte Tampon : <strong style={{ color: 'var(--accent-emerald)' }}>{boursoLive.tamponEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              🛡️ Livret A : <strong style={{ color: 'var(--text-primary)' }}>{boursoLive.livretAEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
            </span>
            {lastSyncTs && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                Dernière synchro : {new Date(lastSyncTs).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 🛡️ 1.5. WIDGET DU RÉSERVOIR LIQUIDE & RÉSILIENCE FINANCIÈRE (AURA PRO ENGINE) */}
      <LiquidTankWidget
        metrics={crisisMetrics}
        onOpenCrisisModal={() => setIsCrisisModalOpen(true)}
      />

      {/* 📊 2. SECTION CENTRALE : ANALYSE DU MOIS ÉCOULÉ (THÉORIE VS RÉALITÉ) */}
      <div
        className="card"
        style={{
          border: '1px solid rgba(99, 102, 241, 0.3)',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.25) 0%, rgba(15, 23, 42, 0.9) 100%)',
          padding: 22,
          borderRadius: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
          <div>
            <h4 style={{ fontSize: 16, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
              Analyse Mensuelle : {getPeriodLabel(selectedMonth)}
            </h4>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>

              Confrontation directe des montants constatés en banque avec votre budget cible.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: 600, fontSize: 12 }}
              onClick={handleOpenReviewModal}
            >
              ✏️ Revoir &amp; Modifier les flux
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontWeight: 600, fontSize: 12, color: 'var(--accent-amber)' }}
              onClick={() => setIsResetMonthModalOpen(true)}
              title="Réinitialiser les flux de ce mois d'après les transactions réelles"
            >
              🔄 Réinitialiser ce mois
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontWeight: 700, fontSize: 12 }}
              onClick={handleSaveReviewModal}
            >
              ✅ Valider ce mois
            </button>
          </div>
        </div>

        {/* Sélecteur de mois horizontal */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 18 }}>
          {availableMonths.map((m) => {
            const isSelected = m === selectedMonth;
            const rec = cleanRecords.find((r) => r.period === m);
            const isReconciled = rec?.bankReality?.reconciled;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMonth(m)}
                style={{
                  padding: '7px 14px',
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
                  <span style={{ fontSize: 10, color: 'var(--accent-emerald)', fontWeight: 700 }}>✅ Validé</span>
                ) : (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>⏳ En attente</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3 Cartes Clés du Mois Écoulé */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 20 }}>
          {/* 1. Salaire net reçu */}
          <div style={{ padding: 16, borderRadius: 10, background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
              💼 Salaire Net Encaissé
            </span>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 6, color: 'var(--accent-cyan)' }}>
              +{actualSalary.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {actualSalary > 0 ? 'Constaté d\'après les virements employeur' : 'Aucun virement salaire détecté'}
            </span>
          </div>

          {/* 2. Investi PEA Réel */}
          <div style={{ padding: 16, borderRadius: 10, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>
              📈 Envoyé vers le PEA
            </span>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 6, color: 'var(--accent-emerald)' }}>
              -{actualPEA.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Budget cible prévu : <strong>{targetMonthlyBudget.toLocaleString('fr-FR')} €</strong>
            </span>
          </div>

          {/* 3. Bilan & Conformité */}
          <div style={{ padding: 16, borderRadius: 10, background: 'rgba(129, 140, 248, 0.08)', border: '1px solid rgba(129, 140, 248, 0.25)' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase' }}>
              🎯 Exécution &amp; Écart
            </span>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 6, color: deltaVsTarget >= 0 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
              {deltaVsTarget >= 0 ? `+${deltaVsTarget.toLocaleString('fr-FR')} €` : `${deltaVsTarget.toLocaleString('fr-FR')} €`}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {actualSalary > 0 ? `Taux d'effort réel : ${savingsRate}% du salaire` : 'Prêt pour validation'}
            </span>
          </div>
        </div>

        {/* Tableau des Flux Retenus pour ce mois */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Transactions bancaires retenues pour {getPeriodLabel(selectedMonth)} ({activeMatches.filter((m) => m.included).length})
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 12, color: 'var(--accent-cyan)' }}
              onClick={handleOpenReviewModal}
            >
              Modifier la sélection
            </button>
          </div>

          {activeMatches.filter((m) => m.included).length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
              Aucune transaction bancaire associée à ce mois.{' '}
              {boursoLive.isConnected ? (
                <span>Cliquez sur <strong>« 🔄 Synchroniser »</strong> ou <strong>« ✏️ Revoir &amp; Modifier les flux »</strong> pour attribuer des transactions.</span>
              ) : (
                <span>Connectez votre compte BoursoBank pour importer automatiquement vos relevés.</span>
              )}
            </div>
          ) : (
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, background: 'var(--bg-primary)', overflow: 'hidden' }}>
              <table className="table" style={{ width: '100%', margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: 100 }}>Date</th>
                    <th>Libellé Transaction</th>
                    <th style={{ width: 130, textAlign: 'right' }}>Montant</th>
                    <th style={{ width: 230 }}>Catégorie Retenue</th>
                  </tr>
                </thead>
                <tbody>
                  {activeMatches
                    .filter((tx) => tx.included)
                    .map((tx) => {
                      const cat = CATEGORY_MAP.get(tx.category) || CATEGORY_MAP.get('OTHER_TRANSFER')!;
                      const isCredit = tx.category === 'SALARY_INCOME';
                      return (
                        <tr key={tx.id}>
                          <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{tx.date}</td>
                          <td style={{ fontSize: 12 }}>
                            <strong>{tx.rawDescription}</strong>
                          </td>
                          <td
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              textAlign: 'right',
                              fontSize: 13,
                              color: isCredit ? 'var(--accent-cyan)' : 'var(--accent-emerald)',
                            }}
                          >
                            {isCredit ? '+' : '-'}{tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                          </td>
                          <td>
                            <span style={{ fontSize: 12, fontWeight: 600, color: cat.color }}>
                              {cat.icon} {cat.label}
                            </span>
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

      {/* 📈 3. HISTORIQUE MULTI-MOIS SIMPLIFIÉ */}
      {cleanRecords.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <span className="card-title">📈 Historique Mensuel des Flux Clôturés</span>
              <p style={{ margin: '3px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                Historique factuel du salaire encaissé et des versements réellement envoyés vers le PEA.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Mois</th>
                  <th>Salaire Net Réel</th>
                  <th>Investi PEA Réel</th>
                  <th>Objectif Prévu</th>
                  <th>Écart (Delta)</th>
                  <th>Statut</th>
                  <th style={{ width: 60 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cleanRecords.map((r) => {
                  const reality = r.bankReality;
                  const salary = reality?.actualNetSalaryReceived ?? r.netSalary ?? 0;
                  const invested = reality?.actualInvestedPEA ?? reality?.totalActualInvested ?? r.regularInvestableAmount ?? 0;
                  const delta = invested - targetMonthlyBudget;
                  const isOk = delta >= -20; // marge de tolérance

                  return (
                    <tr key={r.id || `r-${r.period}`}>
                      <td>
                        <strong>{r.periodLabel || getPeriodLabel(r.period)}</strong>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                        +{salary.toLocaleString('fr-FR')} €
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                        {invested.toLocaleString('fr-FR')} €
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {targetMonthlyBudget.toLocaleString('fr-FR')} €
                      </td>
                      <td>
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
                          {delta >= 0 ? `+${delta.toLocaleString('fr-FR')} €` : `${delta.toLocaleString('fr-FR')} €`}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isOk ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                          {isOk ? '🟢 Conforme' : '🟡 Écart constaté'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => onDeleteRecord(r.id)}
                          title="Supprimer cette ligne"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 💼 3.5. ANALYTIQUE SALARIALE & TENDANCE MULTI-ANNUELLE (AURA BUDGET PRO ENGINE) */}
      {detailedSalaryAnalytics.totalRecordsCount > 0 && (
        <div
          className="card"
          style={{
            border: '1px solid rgba(245, 158, 11, 0.3)',
            background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)',
            padding: 20,
            borderRadius: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>💼</span>
                <h4 style={{ fontSize: 15, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Analytique &amp; Croissance Salariale Multi-Annuelle (Moteur Aura)
                </h4>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                Agrégation continue de vos bulletins de paie : moyenne lissée, pouvoir d'achat réel et taux d'effort.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 12,
                  background: detailedSalaryAnalytics.growthTrendPercent >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: detailedSalaryAnalytics.growthTrendPercent >= 0 ? 'var(--accent-emerald)' : '#ef4444',
                  border: `1px solid ${detailedSalaryAnalytics.growthTrendPercent >= 0 ? 'var(--accent-emerald)' : '#ef4444'}`,
                }}
              >
                {detailedSalaryAnalytics.growthTrendPercent >= 0 ? `📈 +${detailedSalaryAnalytics.growthTrendPercent.toFixed(1)}%` : `📉 ${detailedSalaryAnalytics.growthTrendPercent.toFixed(1)}%`} Évolution
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Moyenne Net Mensuel</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {Math.round(detailedSalaryAnalytics.overallAverageNet).toLocaleString('fr-FR')} €
              </span>
            </div>

            <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Taux d'Épargne Global</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                {detailedSalaryAnalytics.overallSavingsRate.toFixed(1)}%
              </span>
            </div>

            <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Solde Réserve Disponible</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                {Math.round(detailedSalaryAnalytics.totalReserveBalanceAvailable).toLocaleString('fr-FR')} €
              </span>
            </div>

            <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Taux Prélèvement Source Moy.</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {detailedSalaryAnalytics.averageEffectiveTaxRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 4. MODAL DE REVUE & VALIDATION TRANSPARENTE DES TRANSACTIONS */}
      {isReviewModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 820,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 24,
              borderRadius: 14,
              border: '1px solid var(--accent-cyan)',
              background: 'var(--bg-primary)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
                  🔍 Revue des transactions bancaires &mdash; {getPeriodLabel(selectedMonth)}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  Cochez ou décochez les lignes et ajustez la catégorie pour chaque virement avant d&apos;enregistrer.
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: 18, cursor: 'pointer' }}
                onClick={() => setIsReviewModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Content Table Scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 18, border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
              {reviewMatches.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Aucune transaction brute trouvée pour ce mois.
                </div>
              ) : (
                <table className="table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 45, textAlign: 'center' }}>Actif</th>
                      <th style={{ width: 95 }}>Date</th>
                      <th>Libellé Exact de la Banque</th>
                      <th style={{ width: 110, textAlign: 'right' }}>Montant</th>
                      <th style={{ width: 220 }}>Catégorie Assignée</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewMatches.map((m) => (
                      <tr key={m.id} style={{ opacity: m.included ? 1 : 0.45 }}>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={m.included}
                            onChange={(e) => handleUpdateReviewMatch(m.id, { included: e.target.checked })}
                            style={{ cursor: 'pointer', width: 16, height: 16 }}
                          />
                        </td>
                        <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{m.date}</td>
                        <td style={{ fontSize: 12 }}>
                          <strong>{m.rawDescription}</strong>
                        </td>
                        <td
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            textAlign: 'right',
                            fontSize: 13,
                            color: m.category === 'SALARY_INCOME' ? 'var(--accent-cyan)' : 'var(--accent-emerald)',
                          }}
                        >
                          {m.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                        </td>
                        <td>
                          <select
                            className="input"
                            style={{ fontSize: 12, padding: '4px 8px', height: 32 }}
                            value={m.category}
                            onChange={(e) =>
                              handleUpdateReviewMatch(m.id, {
                                category: e.target.value as BankReconciliationCategory,
                              })
                            }
                          >
                            {BANK_CATEGORY_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.icon} {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bottom Summary Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                padding: '12px 16px',
                background: 'var(--bg-secondary)',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', gap: 20 }}>
                <span style={{ fontSize: 13 }}>
                  💼 Total Salaire :{' '}
                  <strong style={{ color: 'var(--accent-cyan)' }}>
                    +{modalSummary.salary.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                  </strong>
                </span>
                <span style={{ fontSize: 13 }}>
                  📈 Total PEA :{' '}
                  <strong style={{ color: 'var(--accent-emerald)' }}>
                    -{modalSummary.pea.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                  </strong>
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleUndoMatches}
                  disabled={matchesHistory.length === 0}
                  style={{ opacity: matchesHistory.length > 0 ? 1 : 0.4, padding: '6px 10px', fontSize: 13 }}
                  title="Annuler la dernière modification dans ce tableau"
                >
                  ↩️ Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleRedoMatches}
                  disabled={matchesRedo.length === 0}
                  style={{ opacity: matchesRedo.length > 0 ? 1 : 0.4, padding: '6px 10px', fontSize: 13 }}
                  title="Rétablir la dernière modification annulée"
                >
                  ↪️ Rétablir
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsReviewModalOpen(false)}
                >
                  Fermer
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontWeight: 700 }}
                  onClick={handleSaveReviewModal}
                >
                  💾 Valider &amp; Enregistrer ce mois
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ 5. MODAL DE CONFIRMATION : RÉINITIALISATION DU MOIS */}
      <ConfirmationModal
        isOpen={isResetMonthModalOpen}
        title={`Réinitialiser les flux de ${getPeriodLabel(selectedMonth)}`}
        variant="warning"
        icon="🔄"
        confirmText="Réinitialiser d'après la banque"
        cancelText="Annuler"
        message={
          <div>
            <p style={{ margin: '0 0 10px 0' }}>
              Êtes-vous sûr de vouloir réinitialiser les données de <strong>{getPeriodLabel(selectedMonth)}</strong> ?
            </p>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Cette action effacera toute validation ou modification manuelle enregistrée pour ce mois. Les montants (salaire encaissé, PEA, etc.) seront automatiquement recalculés à partir des transactions bancaires brutes.
            </p>
          </div>
        }
        onConfirm={handleConfirmResetMonth}
        onCancel={() => setIsResetMonthModalOpen(false)}
      />

      {/* ⚠️ 6. MODAL DE CONFIRMATION : VIDER LE CACHE DES TRANSACTIONS */}
      <ConfirmationModal
        isOpen={isClearCacheModalOpen}
        title="Vider le cache des transactions bancaires"
        variant="danger"
        icon="🗑️"
        confirmText="Vider le cache local"
        cancelText="Conserver"
        message={
          <div>
            <p style={{ margin: '0 0 10px 0' }}>
              Voulez-vous supprimer les <strong>{allBankTransactions.length} transactions bancaires</strong> actuellement stockées en cache local ?
            </p>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Vous pourrez relancer une synchronisation avec BoursoBank via le bouton « Synchroniser » ou le menu <strong>« Comptes &amp; Sync API »</strong> pour récupérer à nouveau vos transactions.
            </p>
          </div>
        }
        onConfirm={handleConfirmClearCache}
        onCancel={() => setIsClearCacheModalOpen(false)}
      />

      {/* 🚨 7. MODAL DE CRISE & COMPARATEUR CLIC (AURA PRO ENGINE) */}
      <CrisisModeModal
        isOpen={isCrisisModalOpen}
        onClose={() => setIsCrisisModalOpen(false)}
        currentEmergencySavings={emergencySavings}
        vitalMonthlyExpenses={vitalExpenses}
        monthlyNetIncome={actualSalary > 0 ? actualSalary : 2861.26}
        onApplyAdjustment={async (monthlyReduction, note) => {
          const newBudget = Math.max(100, targetMonthlyBudget - monthlyReduction);
          if (onSyncMonthlyBudget) {
            await onSyncMonthlyBudget(newBudget);
            onShowToast(`⚡ Budget d'investissement ajusté à ${newBudget} €/m (${note})`, 'success');
          }
        }}
      />
    </div>
  );
}


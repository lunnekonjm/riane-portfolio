'use client';

import { useState, useEffect, useCallback } from 'react';
import { onAuthChange, signInWithGoogle, signOut } from '@/services/firebase/auth';
import { isFirebaseConfigured } from '@/services/firebase/config';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useRevenue } from '@/hooks/useRevenue';
import RevenueBudgetView from '@/components/RevenueBudgetView';
import { computeSalaryAnalytics } from '@/types/revenue';
import { THEMES } from '@/data/themes';
import { ENVELOPE_LABELS } from '@/data/portfolio';
import { ALL_SCENARIOS } from '@/data/stressScenarios';
import { runStressTest } from '@/engines/stressTest';
import PositionEditor from '@/components/PositionEditor';
import ConfigEditor from '@/components/ConfigEditor';
import EnvelopesTaxView from '@/components/EnvelopesTaxView';
import NotificationCenterModal from '@/components/NotificationCenterModal';
import GlossaryInfoModal from '@/components/GlossaryInfoModal';
import MonteCarloModal from '@/components/MonteCarloModal';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import WelcomeBanner from '@/components/WelcomeBanner';
import ReportsView from '@/components/ReportsView';
import InvestorOnboarding from '@/components/InvestorOnboarding';
import BenchmarkWidget from '@/components/BenchmarkWidget';
import CustomDatePicker from '@/components/CustomDatePicker';
import { getQuote } from '@/services/market-data/provider';
import TransactionHistoryModal from '@/components/TransactionHistoryModal';
import AssetBadge from '@/components/AssetBadge';
import AssetLogo from '@/components/AssetLogo';
import { AnalysisChatView } from '@/components/AnalysisChatView';
import { getCleanAssetName } from '@/utils/assetMetadata';
import SavingsPortfolioTable from '@/components/SavingsPortfolioTable';
import CoreSatelliteView from '@/components/CoreSatelliteView';
import { computeSavingsPositionInterest, REGULATED_SAVINGS_METADATA } from '@/engines/savingsInterestEngine';

function formatDCAElapsedTime(startDateStr: string): string {
  if (!startDateStr) return '';
  const parts = startDateStr.split('-');
  const startYear = parseInt(parts[0], 10);
  const startMonth = parseInt(parts[1], 10) - 1;
  const startDay = parts[2] ? parseInt(parts[2], 10) : 5;

  const startDate = new Date(startYear, startMonth, startDay);
  const today = new Date();

  if (isNaN(startDate.getTime()) || startDate > today) {
    return '⏳ Début des versements à venir';
  }

  let years = today.getFullYear() - startDate.getFullYear();
  let months = today.getMonth() - startDate.getMonth();
  let days = today.getDate() - startDate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = years * 12 + months + (days >= 15 ? 1 : 0);

  const partsStr: string[] = [];
  if (years > 0) partsStr.push(`${years} an${years > 1 ? 's' : ''}`);
  if (months > 0) partsStr.push(`${months} mois`);
  if (days > 0 && years === 0) partsStr.push(`${days} jour${days > 1 ? 's' : ''}`);

  const durationLabel = partsStr.length > 0 ? partsStr.join(' et ') : "moins d'un jour";
  const depositsLabel = totalMonths > 0 ? `${totalMonths} versement${totalMonths > 1 ? 's' : ''}` : '1er versement en cours';

  return `⏳ Début des versements il y a ${durationLabel} (${depositsLabel})`;
}
import { clearAnalysisCache } from '@/utils/analysisCache';
import { generatePortfolioNotifications } from '@/engines/notificationEngine';
import type { AppNotification, NotificationSettings } from '@/types/notification';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/types/notification';
import { simulatePositionDCA } from '@/engines/dcaSimulation';
import { calculatePortfolioRiskMetrics } from '@/engines/riskAnalytics';
import { calculateSmartFlowRebalance, calculateActiveRebalance, type FlowRebalanceResult, type ActiveRebalanceResult } from '@/engines/flowRebalancer';
import { exportPortfolioToCSV } from '@/utils/export';
import type { User } from 'firebase/auth';
import type { Position, PortfolioConfig } from '@/types/portfolio';
import type { AnalysisStatus } from '@/types/analysis';
import type { StressTestResult } from '@/types/simulation';
import { useMemo } from 'react';

type PageView = 'dashboard' | 'envelopes' | 'analysis' | 'risk' | 'audit' | 'reports' | 'revenue';

const PIPELINE_STEPS: Array<{ key: AnalysisStatus; label: string; icon: string }> = [
  { key: 'data-collection', label: 'Données', icon: '📊' },
  { key: 'research', label: 'Recherche', icon: '🔬' },
  { key: 'portfolio-eval', label: 'Portefeuille', icon: '⚖️' },
  { key: 'critique', label: 'Contradicteur', icon: '🛡️' },
  { key: 'synthesis', label: 'Synthèse', icon: '🎯' },
];

function AuthScreen() {
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="sidebar-logo-icon" style={{ margin: '0 auto 20px', width: 56, height: 56, fontSize: 28 }}>R</div>
        <h1 className="auth-title">RIANE Portfolio</h1>
        <p className="auth-subtitle">Analyse multi-agents de portefeuille<br />Veille · Allocation · Simulations · Risque</p>
        <button className="google-btn" onClick={handleSignIn} id="google-sign-in-btn">
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Connexion avec Google
        </button>
        {error && <p style={{ color: 'var(--accent-rose)', marginTop: 16, fontSize: 13 }}>{error}</p>}
      </div>
    </div>
  );
}

function ConfigNeeded() {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="sidebar-logo-icon" style={{ margin: '0 auto 20px', width: 56, height: 56, fontSize: 28 }}>R</div>
        <h1 className="auth-title">Configuration requise</h1>
        <p className="auth-subtitle">
          Créez un fichier <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>.env.local</code> à la racine du projet avec vos clés Firebase et API de données marché.
        </p>
        <pre style={{
          background: 'var(--bg-tertiary)',
          padding: 16,
          borderRadius: 'var(--radius-md)',
          textAlign: 'left',
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
          overflow: 'auto',
          marginTop: 16,
        }}>
{`NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=...
NEXT_PUBLIC_FINNHUB_API_KEY=...`}
        </pre>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<PageView>('dashboard');
  const [queryInput, setQueryInput] = useState('');
  const [selectedStressResult, setSelectedStressResult] = useState<StressTestResult | null>(null);
  const [selectedEnvelopeFilter, setSelectedEnvelopeFilter] = useState<string>('ALL');
  const [editingPosition, setEditingPosition] = useState<Position | null | 'new' | 'new_savings'>(null);
  const [showConfigEditor, setShowConfigEditor] = useState(false);
  const [showFlowRebalanceModal, setShowFlowRebalanceModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showConfirmSignOut, setShowConfirmSignOut] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [clearedNotificationIds, setClearedNotificationIds] = useState<string[]>([]);
  const [mockNotifications, setMockNotifications] = useState<AppNotification[]>([]);
  const [activeProxyModalAsset, setActiveProxyModalAsset] = useState<any | null>(null);

  const [flowRebalanceResult, setFlowRebalanceResult] = useState<FlowRebalanceResult | null>(null);
  const [activeRebalanceResult, setActiveRebalanceResult] = useState<ActiveRebalanceResult | null>(null);
  const [rebalanceTab, setRebalanceTab] = useState<'dca' | 'active'>('dca');
  const [dcaGlobalStartDate, setDcaGlobalStartDate] = useState<string>('2024-01-05');

  // Sync saved DCA start date & URL deep-linking view on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDate = localStorage.getItem('riane_dca_start_date');
      if (savedDate) {
        setDcaGlobalStartDate(savedDate);
      }

      // Handle direct deep links (e.g. ?view=reports from emails)
      try {
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view') as PageView | null;
        if (viewParam && ['dashboard', 'envelopes', 'revenue', 'analysis', 'risk', 'audit', 'reports'].includes(viewParam)) {
          setCurrentView(viewParam);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const [adjustInflation, setAdjustInflation] = useState<boolean>(false);
  const [inflationRate, setInflationRate] = useState<number>(0.021); // 2.1% annual CPI inflation default
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [showEmptyThemes, setShowEmptyThemes] = useState<boolean>(false);
  const [hideProxyAssets, setHideProxyAssets] = useState<boolean>(false);
  const [showThemeInfoModal, setShowThemeInfoModal] = useState<boolean>(false);
  const [showGlossaryModal, setShowGlossaryModal] = useState<boolean>(false);
  const [showMonteCarloModal, setShowMonteCarloModal] = useState<boolean>(false);
  const [showTransactionModal, setShowTransactionModal] = useState<boolean>(false);
  const [selectedHistoryTicker, setSelectedHistoryTicker] = useState<string | undefined>(undefined);
  const [glossaryInitialTerm, setGlossaryInitialTerm] = useState<string | undefined>(undefined);

  const openGlossary = (term?: string) => {
    setGlossaryInitialTerm(term);
    setShowGlossaryModal(true);
  };

  const {
    positions, config, investorProfile, isOnboardingPending,
    totalValue, totalCost, gainLoss, gainLossPercent,
    marketVal, marketCostVal, marketGain, marketDCAVal,
    savingsVal, savingsCostVal, savingsGain, savingsAnnualInt, savingsDCAVal,
    netLiquidationDetails, peaSeniority, setPeaSeniority,
    monthlyDCATotal, saving, pendingCount, filledPositions, fxRates, lastPricesUpdated, marketStatusLabel,
    canUndo, undoLastAction, canRedo, redoLastAction, transactions, recordTransaction,
    addPosition, updatePosition, removePosition, updateConfig, updateInvestorProfile, refreshPrices, resetPortfolio,
  } = usePortfolio();
  const {
    records: salaryRecords, revenueConfig, allocations: reserveAllocations,
    extraCashEntries, totalAvailableExtraCash,
    saveRecord: saveSalaryRecord, deleteRecord: deleteSalaryRecord, saveConfig: saveRevenueConfig,
    saveAllocation: saveReserveAllocation, deleteAllocation: deleteReserveAllocation,
    saveExtraCashEntry, deleteExtraCashEntry,
  } = useRevenue();

  const [rebalanceBudgetMode, setRebalanceBudgetMode] = useState<'dca' | 'extra' | 'combo' | 'custom'>('dca');
  const [customRebalanceAmount, setCustomRebalanceAmount] = useState<number>(1000);
  const [simulatedMarketDrop, setSimulatedMarketDrop] = useState<number>(0.25);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showBenchmark, setShowBenchmark] = useState(false);

  const [showDcaFrequencyDropdown, setShowDcaFrequencyDropdown] = useState<boolean>(false);
  const [showTotalValueDropdown, setShowTotalValueDropdown] = useState<boolean>(false);
  const [showTotalCostDropdown, setShowTotalCostDropdown] = useState<boolean>(false);
  const [showGainLossDropdown, setShowGainLossDropdown] = useState<boolean>(false);
  const [showNetDetailsModal, setShowNetDetailsModal] = useState<boolean>(false);

  const handleRunGlobalDCACalculation = async (startDate: string) => {
    if (!startDate) return;
    setRefreshingPrices(true);
    try {
      let updatedCount = 0;
      for (const pos of positions) {
        const monthlyBudget = pos.monthlyDCA || (pos.annualBudget ? pos.annualBudget / 12 : 100);
        const isIntegerOnly = pos.envelope === 'PEA' || pos.envelope === 'PEA-PME' || pos.envelope === 'CTO';

        let realLivePrice = pos.currentPrice;
        if (!realLivePrice) {
          try {
            const q = await getQuote(pos.ticker);
            if (q && q.price > 0) realLivePrice = q.price;
          } catch {
            // keep existing
          }
        }
        const effectivePrice = realLivePrice || pos.avgPrice || (pos.ticker.includes('GPEA') ? 4.89 : 100);

        const sim = await simulatePositionDCA(
          pos.ticker,
          monthlyBudget,
          startDate,
          effectivePrice,
          isIntegerOnly,
          (pos.dcaFrequency || 'monthly') as any,
          pos.dcaDepositMonth || 1,
          pos.dcaDepositDay || 5
        );

        const finalShares = sim.totalShares;
        const finalPRU = sim.avgPrice > 0 ? sim.avgPrice : (pos.avgPrice || realLivePrice || effectivePrice);

        await updatePosition({
          ...pos,
          quantity: finalShares,
          avgPrice: finalPRU,
          ...(realLivePrice && realLivePrice > 0 ? { currentPrice: realLivePrice } : {}),
          updatedAt: Date.now(),
        });
        updatedCount++;
      }
      showToast(`DCA calculé automatiquement pour ${updatedCount} positions depuis ${startDate}`);
    } catch (err) {
      console.error(err);
      showToast('Erreur lors du calcul du DCA', 'error');
    } finally {
      setRefreshingPrices(false);
    }
  };

  const handleUpdateDcaStartDate = (newDate: string) => {
    setDcaGlobalStartDate(newDate);
    if (typeof window !== 'undefined') {
      localStorage.setItem('riane_dca_start_date', newDate);
    }
  };

  const dcaBreakdown = useMemo(() => {
    let monthlySum = 0;
    let monthlyCount = 0;
    let quarterlySum = 0;
    let quarterlyCount = 0;
    let semestrialSum = 0;
    let semestrialCount = 0;
    let annualSum = 0;
    let annualCount = 0;

    positions.forEach((p) => {
      const hasDCA = (p.monthlyDCA && p.monthlyDCA > 0) || (p.annualBudget && p.annualBudget > 0);
      if (!hasDCA) return;

      const freqStr = (p.dcaFrequency || (p.annualBudget && p.annualBudget > 0 ? 'annual' : 'monthly')) as string;

      if (freqStr === 'annual' || (p.annualBudget && p.annualBudget > 0)) {
        annualCount++;
        const val = p.annualBudget || (p.monthlyDCA ? p.monthlyDCA * 12 : 0);
        annualSum += val;
      } else if (freqStr === 'quarterly') {
        quarterlyCount++;
        const val = p.monthlyDCA ? p.monthlyDCA * 3 : (p.annualBudget ? p.annualBudget / 4 : 0);
        quarterlySum += val;
      } else if (freqStr === 'semestrial') {
        semestrialCount++;
        const val = p.monthlyDCA ? p.monthlyDCA * 6 : (p.annualBudget ? p.annualBudget / 2 : 0);
        semestrialSum += val;
      } else {
        monthlyCount++;
        const val = p.monthlyDCA || (p.annualBudget ? p.annualBudget / 12 : 0);
        monthlySum += val;
      }
    });

    // Total Annual Cumulative = (Monthly * 12) + (Quarterly * 4) + (Semestrial * 2) + Annual
    const totalAnnualCumulative = (monthlySum * 12) + (quarterlySum * 4) + (semestrialSum * 2) + annualSum;
    const monthlyEquivalent = totalAnnualCumulative > 0 ? totalAnnualCumulative / 12 : 0;
    const activeFrequenciesCount = [monthlyCount, quarterlyCount, semestrialCount, annualCount].filter(c => c > 0).length;

    return {
      monthlySum,
      monthlyCount,
      quarterlySum,
      quarterlyCount,
      semestrialSum,
      semestrialCount,
      annualSum,
      annualCount,
      totalAnnualCumulative,
      monthlyEquivalent,
      activeFrequenciesCount,
    };
  }, [positions]);

  // Global Ctrl+Z (Undo) / Ctrl+Y (Redo) Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toUpperCase();
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') return;

      // Redo: Ctrl+Y or Cmd+Shift+Z
      if (
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') ||
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        if (canRedo && !saving) {
          e.preventDefault();
          redoLastAction().then((success) => {
            if (success) {
              setToast({ message: '↪️ Rétablissement (Ctrl+Y) effectué avec succès !', type: 'success' });
              setTimeout(() => setToast(null), 5000);
            }
          });
        }
        return;
      }

      // Undo: Ctrl+Z
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && canUndo && !saving) {
        e.preventDefault();
        undoLastAction().then((success) => {
          if (success) {
            setToast({ message: '↩️ Annulation (Ctrl+Z) — État précédent rétabli !', type: 'success' });
            setTimeout(() => setToast(null), 5000);
          }
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, saving, undoLastAction, redoLastAction]);
  const { result, status, statusMessage, isRunning, isFromCache, runAnalysis, history, clearResult } = useAnalysis();

  const rawNotifications = useMemo(() => {
    const monthlyBudget = config?.monthlyBudget || 1000;
    return generatePortfolioNotifications(positions, fxRates, notificationSettings, monthlyBudget, investorProfile);
  }, [positions, fxRates, notificationSettings, config?.monthlyBudget, investorProfile]);

  const notifications = useMemo(() => {
    return [...rawNotifications, ...mockNotifications]
      .filter((n) => !clearedNotificationIds.includes(n.id))
      .map((n) => ({ ...n, read: n.read || readNotificationIds.includes(n.id) }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [rawNotifications, mockNotifications, readNotificationIds, clearedNotificationIds]);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Robust Multi-Stage Auto-Scroll to guarantee the Synthesis card is 100% visible
  const scrollToBottom = useCallback(() => {
    const chatEl = document.getElementById('chat-messages');
    const synthTargetEl = document.getElementById('synthesis-scroll-target');
    if (synthTargetEl) {
      synthTargetEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else if (chatEl) {
      chatEl.scrollTo({ top: chatEl.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (result?.synthesis || result?.marketData || status === 'synthesis' || !isRunning) {
      scrollToBottom();
      const t1 = setTimeout(scrollToBottom, 150);
      const t2 = setTimeout(scrollToBottom, 450);
      const t3 = setTimeout(scrollToBottom, 900);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [result?.synthesis, result?.marketData, status, isRunning, scrollToBottom]);

  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const cleanMessage = message.replace(/^[✅❌]\s*/, '');
    setToast({ message: cleanMessage, type });
  };

  const handleTestNotification = () => {
    setMockNotifications((prev) => [
      {
        id: `test-notif-${Date.now()}`,
        category: 'dca',
        title: '🧪 Test de Notification DCA',
        message: 'Ceci est une notification générée manuellement pour vérifier l\'interface utilisateur. Si vous voyez ce message, le système de notification est parfaitement fonctionnel.',
        actionHint: 'Aucune action requise.',
        timestamp: Date.now(),
        read: false,
        priority: 'high',
      },
      ...prev,
    ]);
    showToast('Notification de test générée');
  };

  const handleTestEmail = async () => {
    const targetEmail = user?.email;
    showToast('Envoi de l\'email de test en cours...');
    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Email de test envoyé avec succès à ${targetEmail || 'votre adresse'} !`);
      } else {
        showToast(data.error || 'Erreur lors de l\'envoi de l\'email', 'error');
      }
    } catch (err) {
      showToast('Erreur de connexion', 'error');
    }
  };

  const handleSavePosition = async (pos: Position) => {
    if (editingPosition === 'new' || editingPosition === 'new_savings') {
      await addPosition(pos);
      showToast(`${pos.name} ajouté au portefeuille`);
    } else {
      await updatePosition(pos);
      showToast(`${pos.name} mis à jour`);
    }
    setEditingPosition(null);
    refreshPrices();
  };

  const handleDeletePosition = async (id: string) => {
    const pos = positions.find((p) => p.id === id);
    await removePosition(id);
    showToast(`${pos?.name || 'Position'} supprimée`);
    setEditingPosition(null);
  };

  const handleSaveConfig = async (cfg: PortfolioConfig) => {
    await updateConfig(cfg);
    showToast('Configuration mise à jour');
    setShowConfigEditor(false);
  };

  if (!isFirebaseConfigured()) return <ConfigNeeded />;
  if (authLoading) return <div className="auth-screen"><div className="loading-spinner" style={{ width: 40, height: 40 }} /></div>;
  if (!user) return <AuthScreen />;

  const defaultConfig = {
    monthlyBudget: 1000,
    annualCTOBudget: 8000,
    annualSpeculativeCap: 2000,
    riskProfile: 'dynamic' as const,
    noLeverage: true,
    rebalanceByFlows: true,
    baseCurrency: 'EUR' as const,
    horizonYears: 15,
  };

  const handleRunAnalysis = (bypassCache = false) => {
    if (!queryInput.trim() || isRunning) return;
    if (positions.length === 0) {
      showToast('Ajoutez au moins une position avant de lancer une analyse', 'error');
      return;
    }
    runAnalysis(user.uid, queryInput.trim(), positions, config || defaultConfig, bypassCache);
    setCurrentView('analysis');
  };

  const handleDirectAnalysis = (promptText: string, bypassCache = false) => {
    if (positions.length === 0) {
      showToast('Ajoutez au moins une position avant de lancer une analyse', 'error');
      return;
    }
    setQueryInput(promptText);
    setCurrentView('analysis');
    runAnalysis(user.uid, promptText, positions, config || defaultConfig, bypassCache);
  };

  const openRebalanceModal = (targetBudget?: number | React.MouseEvent) => {
    if (filledPositions.length === 0) {
      showToast('Veuillez d\'abord renseigner vos positions réelles (Quantité & PRU) avant de calculer un rééquilibrage DCA', 'error');
      return;
    }
    const baseBudget = config?.monthlyBudget || 1000;
    const isExplicitNumber = typeof targetBudget === 'number';
    const initialBudget = isExplicitNumber ? targetBudget : baseBudget;
    if (isExplicitNumber) {
      setRebalanceBudgetMode('custom');
      setCustomRebalanceAmount(targetBudget);
    } else {
      setRebalanceBudgetMode('dca');
      setCustomRebalanceAmount(baseBudget);
    }
    const flowResult = calculateSmartFlowRebalance(positions, initialBudget, fxRates);
    setFlowRebalanceResult(flowResult);
    setShowFlowRebalanceModal(true);
  };

  const handleRunStressTest = (scenarioIdx: number) => {
    if (positions.length === 0) {
      showToast('Ajoutez des positions pour lancer un stress test', 'error');
      return;
    }
    const scenario = ALL_SCENARIOS[scenarioIdx];
    if (scenario) {
      const stressResult = runStressTest(positions, scenario);
      setSelectedStressResult(stressResult);
    }
  };

  const envelopeGroups = positions.reduce((acc, p) => {
    if (!acc[p.envelope]) acc[p.envelope] = [];
    acc[p.envelope].push(p);
    return acc;
  }, {} as Record<string, typeof positions>);

  return (
    <div className="app-layout">
      {/* 🎯 Investor Onboarding Wizard (first-time or edit) */}
      {(isOnboardingPending || showEditProfile) && (
        <InvestorOnboarding
          existingProfile={investorProfile}
          onComplete={async (profile) => {
            await updateInvestorProfile(profile);
            setShowEditProfile(false);
            showToast('Profil investisseur sauvegardé ✅');
          }}
        />
      )}
      {/* Sidebar */}
      <nav className="sidebar" id="main-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">R</div>
          <span className="sidebar-logo-text">RIANE</span>
        </div>

        <button className={`sidebar-nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')} id="nav-dashboard">
          <span className="nav-icon">📊</span> Dashboard
        </button>
        <button className={`sidebar-nav-item ${currentView === 'envelopes' ? 'active' : ''}`} onClick={() => setCurrentView('envelopes')} id="nav-envelopes">
          <span className="nav-icon">🏛️</span> Enveloppes & Fiscalité
        </button>
        <button className={`sidebar-nav-item ${currentView === 'revenue' ? 'active' : ''}`} onClick={() => setCurrentView('revenue')} id="nav-revenue">
          <span className="nav-icon">💰</span> Revenu & Budget
        </button>
        <button className={`sidebar-nav-item ${currentView === 'analysis' ? 'active' : ''}`} onClick={() => setCurrentView('analysis')} id="nav-analysis">
          <span className="nav-icon">🔬</span> Analyse
        </button>
        <button className={`sidebar-nav-item ${currentView === 'risk' ? 'active' : ''}`} onClick={() => setCurrentView('risk')} id="nav-risk">
          <span className="nav-icon">⚡</span> Risque
        </button>
        <button className={`sidebar-nav-item ${currentView === 'audit' ? 'active' : ''}`} onClick={() => setCurrentView('audit')} id="nav-audit">
          <span className="nav-icon">📋</span> Audit
        </button>
        <button className={`sidebar-nav-item ${currentView === 'reports' ? 'active' : ''}`} onClick={() => setCurrentView('reports')} id="nav-reports">
          <span className="nav-icon">📰</span> Rapports AI
        </button>

        <div style={{ flex: 1 }} />

        <div style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: 'white',
          }}>
            {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'R'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.displayName || user.email || 'Investisseur'}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-emerald)', fontWeight: 600 }}>● Session Sécurisée</div>
          </div>
          <button
            className="btn-ghost"
            onClick={() => setShowProfileModal(true)}
            style={{ padding: '6px 10px', fontSize: 12, fontWeight: 600, background: 'var(--bg-tertiary)', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
            id="profile-menu-btn"
            title="Mon Profil & Déconnexion"
          >
            ⚙️ Profil
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <header className="page-header">
          <h1 className="page-title">
            {currentView === 'dashboard' && '📊 Tableau de Bord'}
            {currentView === 'revenue' && '💰 Revenu & Budget'}
            {currentView === 'envelopes' && '🏛️ Enveloppes & Fiscalité'}
            {currentView === 'analysis' && '🔬 Analyse à la Demande'}
            {currentView === 'risk' && '⚡ Stress Tests & Risque'}
            {currentView === 'audit' && '📋 Journal d\'Audit'}
            {currentView === 'reports' && '📰 Rapports & Newsletters AI'}
          </h1>

          {/* Header Actions: Notification Bell & Global Inflation Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Notification Bell Button */}
            <button
              className="profile-pill-btn"
              onClick={() => setShowNotificationModal(true)}
              title="Centre de notifications & alertes"
              id="notification-bell-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: unreadNotificationsCount > 0 ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-secondary)',
                borderRadius: 10,
                border: unreadNotificationsCount > 0 ? '1px solid var(--accent-rose)' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 15 }}>🔔</span>
              {unreadNotificationsCount > 0 && (
                <span style={{
                  background: 'var(--accent-rose)',
                  color: 'white',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 10,
                }}>
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* 📚 Lexique & Explications Financières Button */}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{
                color: 'var(--accent-cyan)',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '6px 12px',
                borderRadius: 10,
                background: 'rgba(56, 189, 248, 0.08)',
              }}
              onClick={() => openGlossary()}
              title="Ouvrir le dictionnaire financier et les explications sans abréviations"
            >
              📚 Lexique & Explications
            </button>

            {/* 🎲 Simulateur Monte Carlo (FIRE) Button */}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{
                color: 'var(--accent-emerald)',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '6px 12px',
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.08)',
              }}
              onClick={() => setShowMonteCarloModal(true)}
              title="Lancer la simulation stochastique Monte Carlo (10 000 scénarios)"
            >
              🎲 Monte Carlo & FIRE
            </button>

            {/* Global Inflation Toggle Switch */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: adjustInflation ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)',
              padding: '6px 14px',
              borderRadius: 10,
              border: adjustInflation ? '1px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
              transition: 'all 0.2s ease',
            }}>
              <span style={{ fontSize: 14 }}>🎈</span>
              <label style={{ fontSize: 12, fontWeight: 700, color: adjustInflation ? 'var(--accent-amber)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                <input
                  type="checkbox"
                  checked={adjustInflation}
                  onChange={(e) => setAdjustInflation(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: 'var(--accent-amber)' }}
                />
                Inflation (Pouvoir d&apos;Achat Réel)
              </label>
            </div>
          </div>

          {isRunning && (
            <div className="pipeline-steps" style={{ width: '100%' }}>
              {PIPELINE_STEPS.map((step, i) => {
                const stepStatuses: AnalysisStatus[] = ['data-collection', 'research', 'portfolio-eval', 'critique', 'synthesis'];
                const currentIdx = stepStatuses.indexOf(status);
                const stepIdx = i;
                let cls = 'pipeline-step';
                if (stepIdx < currentIdx) cls += ' complete';
                else if (stepIdx === currentIdx) cls += ' active';
                return (
                  <span key={step.key}>
                    {i > 0 && <span className="pipeline-connector" />}
                    <span className={cls}>{step.icon} {step.label}</span>
                  </span>
                );
              })}
            </div>
          )}
        </header>

        <div className="page-body">
          {/* ═══ DASHBOARD ═══ */}
          {currentView === 'dashboard' && (
            <>
              {/* 👋 Dynamic Executive Welcome & Briefing Banner */}
              <WelcomeBanner
                userName={user.displayName || user.email || undefined}
                totalValue={totalValue}
                totalCost={totalCost}
                monthlyDCA={monthlyDCATotal}
                positions={positions}
                notifications={notifications}
                onOpenAnalysis={() => setCurrentView('analysis')}
                onNavigateView={setCurrentView}
                onOpenRebalance={openRebalanceModal}
              />

              {/* 📅 Dashboard Date & Market Last Refresh Bar */}
              <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '12px 18px', background: 'var(--bg-secondary)', marginBottom: 16, borderLeft: '4px solid var(--accent-cyan)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>📅</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Aujourd&apos;hui : <span style={{ color: 'var(--accent-cyan)', textTransform: 'capitalize' }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span className="badge badge-violet" style={{ fontSize: 12, padding: '4px 10px', fontWeight: 600 }}>
                    {marketStatusLabel || '🔒 Cours de Clôture Officielle (Marché Fermé)'}
                  </span>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Actualisé à <strong style={{ color: 'var(--accent-emerald)' }}>
                      {lastPricesUpdated ? new Date(lastPricesUpdated).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </strong> (Yahoo Finance Live)
                  </div>
                </div>
              </div>

              {/* 🚨 Proactive Outlier / Krach Alert Banner */}
              {notifications.filter((n) => n.category === 'outlier' && !n.read).length > 0 && (
                <div className="card" style={{ borderLeft: '4px solid var(--accent-rose)', background: 'rgba(244, 63, 94, 0.12)', padding: 14, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 24 }}>🚨</span>
                      <div>
                        <strong style={{ color: 'var(--accent-rose)', fontSize: 14 }}>
                          ALERTE PROACTIVE KRACH / ANOMALIE DE MARCHÉ DÉTECTÉE !
                        </strong>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>
                          {notifications.find((n) => n.category === 'outlier' && !n.read)?.message}
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowNotificationModal(true)}
                      style={{ borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)', fontWeight: 700 }}
                    >
                      Voir les alertes (🔔)
                    </button>
                  </div>
                </div>
              )}

              {/* Onboarding Banner */}
              {pendingCount > 0 && (
                <div className="card" style={{ borderLeft: '3px solid var(--accent-amber)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 28 }}>✍️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        {pendingCount === positions.length
                          ? 'Renseignez vos positions pour activer le tableau de bord'
                          : `${pendingCount} position${pendingCount > 1 ? 's' : ''} à compléter`}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Cliquez sur une ligne du tableau pour entrer vos quantités et prix réels d&apos;achat (PRU).
                        Tant qu&apos;une donnée manque, elle est <strong style={{color: 'var(--accent-amber)'}}>signalée</strong> plutôt que masquée — jamais de valeur fictive silencieuse.
                      </div>
                    </div>
                  </div>
                  
                  {/* Légende de Provenance des Chiffres */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px dashed var(--border-subtle)', paddingTop: 12, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Provenance des chiffres :</span>
                    
                    <span className="badge-real">
                      <span className="dot"></span> RÉEL — SAISI PAR VOUS
                    </span>
                    
                    <span style={{ padding: '3px 10px', borderRadius: 12, border: '1px solid var(--accent-amber)', background: 'rgba(245, 158, 11, 0.14)', color: 'var(--accent-amber)', fontSize: 'var(--text-xs)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-amber)' }}></span> ESTIMÉ — DONNÉE MANQUANTE
                    </span>
                    
                    <span className="badge-projected">
                      <span className="dot"></span> PROJETÉ — CALCUL FUTUR
                    </span>
                  </div>
                </div>
              )}

              {/* Inflation Factor & Breakdown Calculations */}
              {(() => {
                const startYear = parseInt(dcaGlobalStartDate.slice(0, 4)) || 2024;
                const currentYear = new Date().getFullYear();
                const yearsElapsed = Math.max(0, (currentYear - startYear) + (new Date().getMonth() / 12));
                const cumulativeInflationFactor = adjustInflation ? Math.pow(1 + inflationRate, yearsElapsed) : 1.0;

                const displayTotalValue = totalValue / cumulativeInflationFactor;
                const displayTotalCost = totalCost / cumulativeInflationFactor;
                const displayGainLoss = displayTotalValue - displayTotalCost;
                const displayGainLossPercent = displayTotalCost > 0 ? (displayGainLoss / displayTotalCost) * 100 : 0;

                const activePositions = positions.filter((p) => p.quantity > 0);
                const marketPos = activePositions.filter((p) => !['LIVRET', 'ASSURANCE_VIE', 'PER', 'PEE', 'IMMOBILIER'].includes(p.envelope));
                const savingsPos = activePositions.filter((p) => ['LIVRET', 'ASSURANCE_VIE', 'PER', 'PEE', 'IMMOBILIER'].includes(p.envelope));

                const displayMarketVal = marketVal / cumulativeInflationFactor;
                const displayMarketCostVal = marketCostVal / cumulativeInflationFactor;
                const displayMarketGain = displayMarketVal - displayMarketCostVal;
                const displayMarketGainPct = displayMarketCostVal > 0 ? (displayMarketGain / displayMarketCostVal) * 100 : 0;
                
                const displaySavingsVal = savingsVal / cumulativeInflationFactor;
                const displaySavingsCostVal = savingsCostVal / cumulativeInflationFactor;
                const displaySavingsGain = displaySavingsVal - displaySavingsCostVal;
                const displaySavingsAnnualInt = savingsAnnualInt / cumulativeInflationFactor;

                return (
                  <>
                    {adjustInflation && (
                      <div className="card" style={{ borderLeft: '4px solid var(--accent-amber)', background: 'rgba(245, 158, 11, 0.1)', padding: 12, marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-primary)' }}>
                          <span style={{ fontSize: 20 }}>🎈</span>
                          <div>
                            <strong>Mode Inflation Actif (Pouvoir d&apos;Achat Réel) :</strong> Montants et plus-values exprimés en Euros constants (IPC Eurostat/INSEE ~{(inflationRate * 100).toFixed(1)}%/an sur {yearsElapsed.toFixed(1)} ans, inflation cumulée : {((cumulativeInflationFactor - 1) * 100).toFixed(1)}%).
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Summary Cards — with custom dark tooltips */}
                    <div className="grid-4">
                      <div className="card" data-tooltip="Valeur marchande globale de votre patrimoine convertie en €">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <span className="card-title text-sm font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {adjustInflation ? 'Valeur Réelle (Ajustée)' : 'Valeur Totale'}
                          </span>
                          <span className="badge-real">
                            <span className="dot"></span> RÉEL
                          </span>
                        </div>
                        <div className="card-value font-extrabold text-3xl" style={{ color: displayTotalValue > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                          {displayTotalValue > 0
                            ? displayTotalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                            : '—'}
                        </div>
                        {displayTotalValue > 0 && (
                          <div style={{ marginTop: 8, position: 'relative' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm text-xs font-semibold"
                              style={{
                                padding: '5px 10px',
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: 'var(--accent-blue)',
                                border: '1px solid rgba(59, 130, 246, 0.35)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowTotalValueDropdown(!showTotalValueDropdown);
                              }}
                            >
                              <span>📊 Répartition des Enveloppes</span>
                              <span className="text-xs">{showTotalValueDropdown ? '▲' : '▼'}</span>
                            </button>
                            {showTotalValueDropdown && (
                              <div className="popover-card">
                                <div className="popover-header">
                                  <span>Répartition de la Valeur Totale</span>
                                </div>
                                <div className="popover-row">
                                  <span className="text-secondary">📈 Bourse &amp; Cryptos</span>
                                  <strong style={{ color: 'var(--accent-cyan)' }}>{displayMarketVal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</strong>
                                </div>
                                <div className="popover-row">
                                  <span className="text-secondary">🛡️ Épargne &amp; Immo</span>
                                  <strong style={{ color: 'var(--accent-emerald)' }}>{displaySavingsVal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</strong>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {displayTotalValue === 0 && <span className="text-sm text-muted">À renseigner</span>}
                        
                        {(positions.length - filledPositions.length) > 0 && (
                          <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px dashed var(--accent-amber)', borderRadius: 8, padding: '10px 14px', marginTop: 12, lineHeight: 1.4 }} className="text-xs text-secondary">
                            <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>{(positions.length - filledPositions.length)} position{(positions.length - filledPositions.length) > 1 ? 's' : ''}</span> sans prix ni PRU renseigné est provisoirement valorisée à titre indicatif.<br/>
                            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 500, behavior: 'smooth' }); }} style={{ color: 'var(--accent-cyan)', textDecoration: 'underline', marginTop: 4, display: 'inline-block', fontWeight: 600 }}>Compléter maintenant →</a>
                          </div>
                        )}
                        <span className="text-sm font-bold" style={{ color: 'var(--accent-cyan)', display: 'block', marginTop: 12 }}>
                          ✓ {filledPositions.length}/{positions.length} positions renseignées
                        </span>
                      </div>

                      <div className="card" data-tooltip="Total des capitaux réellement investis (somme des PRU)">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <span className="card-title text-sm font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {adjustInflation ? 'Coût Total Réel' : 'Coût Total (PRU)'}
                          </span>
                          <span className="badge-real">
                            <span className="dot"></span> RÉEL
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-sm font-semibold"
                            style={{ padding: '2px 8px', color: 'var(--accent-cyan)' }}
                            onClick={() => openGlossary('PRU')}
                            data-tooltip="Définition et calcul du PRU"
                          >
                            💡 PRU
                          </button>
                        </div>
                        <div className="card-value font-extrabold text-3xl">
                          {displayTotalCost > 0
                            ? displayTotalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                            : '—'}
                        </div>
                        {displayTotalCost > 0 && (
                          <div style={{ marginTop: 8, position: 'relative' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm text-xs font-semibold"
                              style={{
                                padding: '5px 10px',
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: 'var(--accent-blue)',
                                border: '1px solid rgba(59, 130, 246, 0.35)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowTotalCostDropdown(!showTotalCostDropdown);
                              }}
                            >
                              <span>📊 Détail des Apports</span>
                              <span className="text-xs">{showTotalCostDropdown ? '▲' : '▼'}</span>
                            </button>
                            {showTotalCostDropdown && (
                              <div className="popover-card">
                                <div className="popover-header">
                                  <span>Apports Investis (PRU)</span>
                                </div>
                                <div className="popover-row">
                                  <span className="text-secondary">📈 Bourse &amp; Cryptos</span>
                                  <strong className="text-primary">{displayMarketCostVal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</strong>
                                </div>
                                <div className="popover-row">
                                  <span className="text-secondary">🛡️ Épargne &amp; Immo</span>
                                  <strong className="text-primary">{displaySavingsCostVal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</strong>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {displayTotalCost === 0 && <span className="text-sm text-muted">Entrez vos PRU réels</span>}
                      </div>

                      <div className="card" data-tooltip="Plus ou moins-value latente et valeur nette de liquidation après impôts">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <span className="card-title text-sm font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {adjustInflation ? 'Plus/Moins-Value Réelle' : 'Plus / Moins-Value'}
                          </span>
                          <span className="badge-real">
                            <span className="dot"></span> RÉEL
                          </span>
                        </div>
                        {displayTotalCost > 0 ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                              <div className={`card-value font-extrabold text-3xl ${displayGainLoss >= 0 ? 'stat-gain' : 'stat-loss'}`}>
                                {displayGainLoss >= 0 ? '+' : ''}{displayGainLoss.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                              </div>
                              <span className={`stat-change text-sm font-bold ${displayGainLoss >= 0 ? 'positive' : 'negative'}`}>
                                {displayGainLossPercent >= 0 ? '↑' : '↓'} {Math.abs(displayGainLossPercent).toFixed(2)}%
                              </span>
                            </div>
                            
                            <div style={{ marginTop: 14 }}>
                              <span className="text-sm text-secondary font-semibold" style={{ display: 'block', marginBottom: 6 }}>Net Retrait</span>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm text-xs font-semibold"
                                  onClick={() => setShowNetDetailsModal(true)}
                                  style={{
                                    padding: '6px 10px',
                                    background: 'rgba(59, 130, 246, 0.12)', color: 'var(--text-secondary)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    display: 'flex', alignItems: 'center', gap: 6
                                  }}
                                >
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)' }}></span>
                                  PEA {peaSeniority === 'over5' ? '> 5 ans' : '< 5 ans'} · charges {peaSeniority === 'over5' ? '18,6 %' : '31,4 %'} ⓘ
                                </button>
                                <span className="text-xl font-extrabold" style={{ color: 'var(--accent-emerald)' }}>
                                  {(netLiquidationDetails.totalNetValue / cumulativeInflationFactor).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                </span>
                              </div>
                            </div>
                            
                            <div style={{ marginTop: 10, position: 'relative' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm text-xs font-semibold"
                                style={{
                                  padding: '5px 10px',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: 'var(--accent-emerald)',
                                  border: '1px solid rgba(16, 185, 129, 0.35)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowGainLossDropdown(!showGainLossDropdown);
                                }}
                              >
                                <span>📊 Ventilation des Gains</span>
                                <span className="text-xs">{showGainLossDropdown ? '▲' : '▼'}</span>
                              </button>
                              {showGainLossDropdown && (
                                <div className="popover-card">
                                  <div className="popover-header">
                                    <span>Plus-Values &amp; Intérêts Latents</span>
                                  </div>
                                  <div className="popover-row">
                                    <span className="text-secondary">📈 Bourse &amp; Cryptos</span>
                                    <strong style={{ color: displayMarketGain >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>{displayMarketGain >= 0 ? '+' : ''}{displayMarketGain.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</strong>
                                  </div>
                                  <div className="popover-row">
                                    <span className="text-secondary">🛡️ Intérêts d&apos;Épargne</span>
                                    <strong style={{ color: displaySavingsGain >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>{displaySavingsGain >= 0 ? '+' : ''}{displaySavingsGain.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</strong>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="card-value text-muted">—</div>
                            <span className="text-sm text-muted">Calculé depuis vos PRU</span>
                          </>
                        )}
                      </div>

                      <div className="card" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => setShowConfigEditor(true)} data-tooltip="Somme totale de vos versements d'accumulation">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <span className="card-title text-sm font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>DCA &amp; Épargne</span>
                            <div style={{ marginTop: 4 }}>
                              <span className="badge-real">
                                <span className="dot"></span> RÉEL
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm text-sm font-semibold"
                              style={{ padding: '2px 8px', color: 'var(--accent-cyan)' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openGlossary('DCA');
                              }}
                              title="Qu'est-ce que le DCA et la fréquence de versement ?"
                            >
                              💡 DCA
                            </button>
                            <span className="text-lg text-muted">⚙️</span>
                          </div>
                        </div>

                        <div className="card-value font-extrabold text-3xl" style={{ color: dcaBreakdown.monthlyEquivalent > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                          <span>
                            {dcaBreakdown.monthlyEquivalent > 0
                              ? (dcaBreakdown.monthlyEquivalent / cumulativeInflationFactor).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                              : '0,00 €'}
                          </span>
                          <span className="text-md font-semibold text-secondary">
                            {dcaBreakdown.monthlyEquivalent > 0 ? '/mois (lissés)' : ''}
                          </span>
                        </div>
                        <div className="card-subtitle" style={{ marginTop: 8, marginBottom: 12 }}>
                          Moyenne annualisée de vos versements programmés — pas un flux mensuel littéral.
                        </div>

                        {/* Interactive Mini Dropdown Badge Button */}
                        <div style={{ marginTop: 6, position: 'relative' }}>
                          {dcaBreakdown.activeFrequenciesCount > 0 ? (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm text-xs font-semibold"
                              style={{
                                padding: '5px 10px',
                                background: 'rgba(6, 182, 212, 0.15)',
                                color: 'var(--accent-cyan)',
                                border: '1px solid rgba(6, 182, 212, 0.35)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDcaFrequencyDropdown(!showDcaFrequencyDropdown);
                              }}
                            >
                              <span>📊 Détail des Fréquences ({dcaBreakdown.activeFrequenciesCount})</span>
                              <span className="text-xs">{showDcaFrequencyDropdown ? '▲' : '▼'}</span>
                            </button>
                          ) : (
                            <span className="text-sm text-muted">
                              ✍️ Définissez le DCA par position
                            </span>
                          )}

                          {/* Dropdown Popover */}
                          {showDcaFrequencyDropdown && (
                            <div className="popover-card" onClick={(e) => e.stopPropagation()}>
                              <div className="popover-header">
                                <span>Ventilation des Versements</span>
                                <span className="text-xs text-secondary">{positions.length} positions</span>
                              </div>

                              {dcaBreakdown.monthlyCount > 0 && (
                                <div className="popover-row">
                                  <span className="text-secondary">📅 Mensuel ({dcaBreakdown.monthlyCount})</span>
                                  <strong style={{ color: 'var(--accent-emerald)' }}>{dcaBreakdown.monthlySum.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / mois</strong>
                                </div>
                              )}

                              {dcaBreakdown.quarterlyCount > 0 && (
                                <div className="popover-row">
                                  <span className="text-secondary">📆 Trimestriel ({dcaBreakdown.quarterlyCount})</span>
                                  <strong style={{ color: 'var(--accent-cyan)' }}>{dcaBreakdown.quarterlySum.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / trim</strong>
                                </div>
                              )}

                              {dcaBreakdown.semestrialCount > 0 && (
                                <div className="popover-row">
                                  <span className="text-secondary">🌓 Semestriel ({dcaBreakdown.semestrialCount})</span>
                                  <strong style={{ color: 'var(--accent-amber)' }}>{dcaBreakdown.semestrialSum.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / sem</strong>
                                </div>
                              )}

                              {dcaBreakdown.annualCount > 0 && (
                                <div className="popover-row">
                                  <span className="text-secondary">🎆 Annuel ({dcaBreakdown.annualCount})</span>
                                  <strong style={{ color: 'var(--accent-rose)' }}>{dcaBreakdown.annualSum.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / an</strong>
                                </div>
                              )}

                              <div className="popover-total-row">
                                <span>💰 Cumul Annuel Global</span>
                                <span className="text-base" style={{ color: 'var(--accent-emerald)' }}>{dcaBreakdown.totalAnnualCumulative.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / an</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 360° Wealth Breakdown Sub-Cards: Bourse vs Hors-Bourse */}
                    {(() => {
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, marginTop: 14, marginBottom: 18 }}>
                          <div className="card" style={{ borderLeft: '4px solid var(--accent-cyan)', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)', padding: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="text-xl">📈</span>
                                <strong className="text-md font-bold text-primary">Portefeuille Boursier &amp; Cryptos</strong>
                              </div>
                              <span className="badge text-xs font-semibold text-primary" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', padding: '3px 8px' }}>{marketPos.length} positions</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '6px 0 10px 0' }}>
                              <span className="mono font-extrabold text-3xl" style={{ color: 'var(--accent-cyan)' }}>
                                {displayMarketVal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                              </span>
                              {displayMarketCostVal > 0 ? (
                                <div style={{ textAlign: 'right' }}>
                                  <div className="text-base font-bold" style={{ color: displayMarketGain >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                                    {displayMarketGain >= 0 ? '+' : ''}{displayMarketGain.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                  </div>
                                  <div className="text-xs font-bold" style={{ color: displayMarketGain >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                                    {displayMarketGainPct >= 0 ? '↑' : '↓'} {Math.abs(displayMarketGainPct).toFixed(2)} %
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-muted">PEA, CTO, Crypto</span>
                              )}
                            </div>
                            <div className="card-footer-stats">
                              <span>Coût PRU : <strong className="text-primary">{displayMarketCostVal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</strong></span>
                              <span>DCA Bourse : <strong className="text-primary">{marketDCAVal.toLocaleString('fr-FR')} €/mois</strong></span>
                            </div>
                          </div>

                          <div className="card" style={{ borderLeft: '4px solid var(--accent-emerald)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)', padding: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="text-xl">🛡️</span>
                                <strong className="text-md font-bold text-primary">Épargne &amp; Patrimoine Hors-Bourse</strong>
                              </div>
                              <span className="badge text-xs font-semibold text-primary" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', padding: '3px 8px' }}>{savingsPos.length} comptes</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '6px 0 10px 0' }}>
                              <span className="mono font-extrabold text-3xl" style={{ color: 'var(--accent-emerald)' }}>
                                {displaySavingsVal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                              </span>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                              <span className="text-sm text-secondary font-medium">Intérêts acquis à date</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="badge-real">
                                  <span className="dot"></span> RÉEL
                                </span>
                                <strong className="text-md font-bold" style={{ color: 'var(--accent-emerald)' }}>+{displaySavingsGain.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                              <span className="text-sm text-secondary font-medium" data-tooltip="Estimation des intérêts annuels perçus si les soldes actuels sont conservés sur 12 mois">
                                Projection annuelle (12 mois)
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="badge-projected">
                                  <span className="dot"></span> PROJETÉ
                                </span>
                                <strong className="text-md font-bold" style={{ color: 'var(--accent-purple, #a855f7)' }}>+{displaySavingsAnnualInt.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
                              </div>
                            </div>
                            
                            <div className="card-footer-stats">
                              <span>Apports cumulés : <strong className="text-primary">{displaySavingsCostVal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</strong></span>
                              <span>Épargne DCA : <strong className="text-primary">{savingsDCAVal.toLocaleString('fr-FR')} €/mois</strong></span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                );
              })()}

              {/* Quick Analysis Bar */}
              <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 18px' }}>
                <span style={{ fontSize: 22 }}>🔍</span>
                <input
                  className="input"
                  style={{ fontSize: 14 }}
                  placeholder="Analyse X-FAB dans mon portefeuille... | Compare cet ETF à mon ACWI..."
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunAnalysis()}
                  disabled={isRunning}
                  id="quick-analysis-input"
                />
                <button className="btn btn-primary" style={{ fontSize: 14, padding: '10px 20px' }} onClick={() => handleRunAnalysis(false)} disabled={isRunning || !queryInput.trim()} id="run-analysis-btn">
                  {isRunning ? <span className="loading-spinner" /> : 'Analyser'}
                </button>
              </div>

              {/* ⚡ Console de Simulation DCA & Période d'Accumulation */}
              <div className="card" style={{ borderLeft: '4px solid var(--accent-emerald)', background: 'var(--bg-secondary)', padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 26 }}>⚡</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                        Console d&apos;Accumulation DCA Historique
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                        Simulez l&apos;accumulation réelle depuis une date de départ (cours réels Yahoo Finance MAX, reliquats &amp; parts entières).
                      </div>
                    </div>
                  </div>

                  {/* Presets, Custom Month Selector & Inflation Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${dcaGlobalStartDate.startsWith('2025-01') ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleUpdateDcaStartDate('2025-01-05')}
                      style={{ fontSize: 13, padding: '6px 12px' }}
                    >
                      1 An (2025)
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${dcaGlobalStartDate.startsWith('2023-01') ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleUpdateDcaStartDate('2023-01-05')}
                      style={{ fontSize: 13, padding: '6px 12px' }}
                    >
                      3 Ans (2023)
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${dcaGlobalStartDate.startsWith('2021-01') ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleUpdateDcaStartDate('2021-01-05')}
                      style={{ fontSize: 13, padding: '6px 12px' }}
                    >
                      5 Ans (2021)
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${dcaGlobalStartDate.startsWith('2003-01') ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleUpdateDcaStartDate('2003-01-05')}
                      style={{ fontSize: 13, padding: '6px 12px' }}
                    >
                      23 Ans (2003)
                    </button>

                    {/* Modern Custom Dark Theme Date Picker Component */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <CustomDatePicker
                        value={dcaGlobalStartDate}
                        onChange={handleUpdateDcaStartDate}
                      />
                      <span style={{ fontSize: 13, color: 'var(--accent-cyan)', fontWeight: 600, background: 'rgba(6, 182, 212, 0.12)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                        {formatDCAElapsedTime(dcaGlobalStartDate)}
                      </span>
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={async () => {
                        if (!dcaGlobalStartDate) return;
                        if (!confirm(`⚠️ Attention : Vous allez calculer une simulation historique DCA depuis le ${dcaGlobalStartDate}.\n\nCela remplacera la quantité et le PRU de TOUTES vos positions par les résultats de la simulation historique.\n\nVoulez-vous vraiment écraser vos positions réelles actuelles ?`)) {
                          return;
                        }
                        setRefreshingPrices(true);
                        try {
                          let updatedCount = 0;
                          for (const pos of positions) {
                            const monthlyBudget = pos.monthlyDCA || (pos.annualBudget ? pos.annualBudget / 12 : 100);
                            const isIntegerOnly = pos.envelope === 'PEA' || pos.envelope === 'PEA-PME' || pos.envelope === 'CTO';

                            // Fetch real market quote if pos.currentPrice is missing or corrupted
                            let realLivePrice = pos.currentPrice;
                            if (!realLivePrice) {
                              try {
                                const q = await getQuote(pos.ticker);
                                if (q && q.price > 0) realLivePrice = q.price;
                              } catch {
                                // keep existing
                              }
                            }
                            const effectivePrice = realLivePrice || pos.avgPrice || (pos.ticker.includes('GPEA') ? 4.89 : 100);

                            const sim = await simulatePositionDCA(
                              pos.ticker,
                              monthlyBudget,
                              dcaGlobalStartDate,
                              effectivePrice,
                              isIntegerOnly,
                              pos.dcaFrequency || 'monthly',
                              pos.dcaDepositMonth || 1,
                              pos.dcaDepositDay || 5
                            );

                            const finalShares = sim.totalShares;
                            const finalPRU = sim.avgPrice > 0 ? sim.avgPrice : (pos.avgPrice || realLivePrice || effectivePrice);

                            await updatePosition({
                              ...pos,
                              quantity: finalShares,
                              avgPrice: finalPRU,
                              ...(realLivePrice && realLivePrice > 0 ? { currentPrice: realLivePrice } : {}),
                              updatedAt: Date.now(),
                            });
                            updatedCount++;
                          }
                          showToast(`DCA calculé automatiquement pour ${updatedCount} positions depuis ${dcaGlobalStartDate}`);
                        } catch (err) {
                          console.error(err);
                          showToast('Erreur lors du calcul du DCA', 'error');
                        } finally {
                          setRefreshingPrices(false);
                        }
                      }}
                      disabled={refreshingPrices || positions.length === 0}
                      style={{ padding: '8px 16px', fontWeight: 700 }}
                      id="auto-dca-btn"
                    >
                      {refreshingPrices ? <span className="loading-spinner" /> : '⚡ Simuler DCA'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Dedicated Savings & Non-Listed Wealth Table */}
              <SavingsPortfolioTable
                positions={positions}
                onEditPosition={(pos) => setEditingPosition(pos)}
                onDeletePosition={(id) => handleDeletePosition(id)}
                onAddSavingsPosition={() => setEditingPosition('new_savings')}
              />

              {/* Stock Market Portfolio Card (Listed Assets) */}
              {(() => {
                const marketPositionsAll = positions.filter(p => ['PEA', 'PEA-PME', 'CTO', 'SPECULATIVE', 'OPPORTUNISTIC'].includes(p.envelope));
                const totalMarketValEUR = marketPositionsAll.reduce((sum, p) => {
                  const pr = p.currentPrice || p.avgPrice;
                  const rate = (fxRates as any)[p.currency] || 1.0;
                  return sum + p.quantity * pr * rate;
                }, 0);
                const totalMarketCostEUR = marketPositionsAll.reduce((sum, p) => {
                  const rate = (fxRates as any)[p.currency] || 1.0;
                  return sum + p.quantity * p.avgPrice * rate;
                }, 0);
                const totalMarketPLEUR = totalMarketValEUR - totalMarketCostEUR;
                const totalMarketPLPct = totalMarketCostEUR > 0 ? (totalMarketPLEUR / totalMarketCostEUR) * 100 : 0;
                const totalMarketMonthlyDCA = marketPositionsAll.reduce((sum, p) => sum + (p.monthlyDCA || (p.annualBudget ? Math.round(p.annualBudget / 12) : 0)), 0);

                return (
                  <div className="card" style={{ marginBottom: 28, padding: 18 }}>
                    {/* Header Banner */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 24 }}>📈</span>
                          <h3 style={{ fontSize: 18, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
                            Portefeuille Boursier &amp; Cryptos ({marketPositionsAll.length})
                          </h3>
                          <span className="badge badge-cyan" style={{ fontSize: 12, padding: '4px 10px', fontWeight: 600 }}>Marchés Financiers &amp; Cours en direct</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
                          Suivi des comptes PEA, PEA-PME, CTO, devises USD/EUR et allocations d&apos;actifs cotés.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700 }}
                          onClick={async () => {
                            setRefreshingPrices(true);
                            try {
                              await refreshPrices();
                              showToast('Cours mis à jour (Yahoo Finance)');
                            } catch {
                              showToast('Impossible de récupérer les cours', 'error');
                            } finally {
                              setRefreshingPrices(false);
                            }
                          }}
                          disabled={refreshingPrices || positions.length === 0}
                          data-tooltip="Actualiser les cours du marché en direct (Yahoo Finance)"
                          id="refresh-prices-btn"
                        >
                          {refreshingPrices ? <span className="loading-spinner" /> : '📈'} Cours actuels
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={async () => {
                            const ok = await undoLastAction();
                            if (ok) {
                              showToast('↩️ Action annulée — État précédent du portefeuille rétabli !');
                            }
                          }}
                          disabled={!canUndo || saving}
                          data-tooltip="Annuler la dernière modification (Ctrl+Z)"
                          style={{
                            opacity: canUndo ? 1 : 0.4,
                            borderColor: canUndo ? 'var(--accent-cyan)' : undefined,
                            color: canUndo ? 'var(--accent-cyan)' : undefined,
                            fontSize: 14,
                            padding: '6px 10px',
                            minWidth: 36,
                            justifyContent: 'center',
                          }}
                          id="undo-action-btn"
                        >
                          ↩️
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={async () => {
                            const ok = await redoLastAction();
                            if (ok) {
                              showToast('↪️ Action rétablie avec succès !');
                            }
                          }}
                          disabled={!canRedo || saving}
                          data-tooltip="Rétablir l'action précédemment annulée (Ctrl+Y / Cmd+Shift+Z)"
                          style={{
                            opacity: canRedo ? 1 : 0.4,
                            borderColor: canRedo ? 'var(--accent-emerald)' : undefined,
                            color: canRedo ? 'var(--accent-emerald)' : undefined,
                            fontSize: 14,
                            padding: '6px 10px',
                            minWidth: 36,
                            justifyContent: 'center',
                          }}
                          id="redo-action-btn"
                        >
                          ↪️
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={() => {
                            setSelectedHistoryTicker(undefined);
                            setShowTransactionModal(true);
                          }}
                          data-tooltip="Consulter le journal d'historique de tous vos arbitrages et ajustements"
                          id="transaction-history-btn"
                        >
                          📜 Arbitrages ({transactions.length})
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={async () => {
                            if (confirm('Réinitialiser toutes les positions à zéro ?\nVous pourrez ensuite entrer vos données réelles.')) {
                              await resetPortfolio();
                              const todayStr = new Date().toISOString().split('T')[0];
                              handleUpdateDcaStartDate(todayStr);
                              showToast('Portefeuille réinitialisé — remis à la date d\'aujourd\'hui');
                            }
                          }}
                          data-tooltip="Remettre à zéro les positions et la date DCA"
                          id="reset-portfolio-btn"
                        >
                          🔄 Réinitialiser
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={openRebalanceModal}
                          disabled={positions.length === 0}
                          data-tooltip="Calculer la répartition optimale du versement mensuel"
                          id="smart-rebalance-btn"
                        >
                          🎯 Flux DCA
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={() => exportPortfolioToCSV(positions, fxRates)}
                          disabled={positions.length === 0}
                          data-tooltip="Exporter le portefeuille complet au format CSV"
                          id="export-csv-btn"
                        >
                          📥 CSV
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700 }}
                          onClick={() => setEditingPosition('new')}
                          data-tooltip="Ajouter une nouvelle ligne d'actif au portefeuille"
                          id="add-position-btn"
                        >
                          ➕ Ajouter
                        </button>
                      </div>
                    </div>

                    {/* KPI Cards Bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 18 }}>
                      <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px' }}>Valeur Bourse Totale</span>
                        <strong className="mono" style={{ fontSize: 20, color: 'var(--accent-cyan)', fontWeight: 800, marginTop: 4, display: 'block' }}>
                          {totalMarketValEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </strong>
                      </div>
                      <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px' }}>Plus-Value Latente Totale</span>
                        <strong className="mono" style={{ fontSize: 20, color: totalMarketPLEUR >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 800, marginTop: 4, display: 'block' }}>
                          {totalMarketPLEUR >= 0 ? '+' : ''}{totalMarketPLEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} ({totalMarketPLEUR >= 0 ? '+' : ''}{totalMarketPLPct.toFixed(1)}%)
                        </strong>
                      </div>
                      <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px' }}>Investissement Mensuel (DCA)</span>
                        <strong className="mono" style={{ fontSize: 20, color: 'var(--accent-amber)', fontWeight: 800, marginTop: 4, display: 'block' }}>
                          +{totalMarketMonthlyDCA.toLocaleString('fr-FR')} € /mois
                        </strong>
                      </div>
                    </div>

                    {positions.length === 0 ? (
                      <div className="empty-state" style={{ padding: '40px 24px' }}>
                        <div className="empty-state-icon">📂</div>
                        <div className="empty-state-text" style={{ marginBottom: 20 }}>
                          Aucune position dans votre portefeuille.
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                          <button className="btn btn-primary" onClick={() => setEditingPosition('new')}>
                            ➕ Ajouter une position
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{
                              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
                              borderColor: 'var(--accent-cyan)',
                            }}
                            onClick={async () => {
                              const { DEFAULT_POSITIONS } = await import('@/data/portfolio');
                              for (const pos of DEFAULT_POSITIONS) {
                                await addPosition({ ...pos, updatedAt: Date.now() });
                              }
                              showToast(`📋 ${DEFAULT_POSITIONS.length} positions prédéfinies chargées — complétez vos quantités et PRU`);
                            }}
                          >
                            📋 Charger mon portefeuille prédéfini
                          </button>
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 12, maxWidth: 420 }}>
                          Le portefeuille prédéfini charge vos actifs habituels (ETF ACWI, Nasdaq, PEA-PME, CTO) avec quantités à zéro.
                          Vous n&apos;aurez plus qu&apos;à renseigner vos données réelles.
                        </div>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, padding: '0 4px' }}>
                          {(() => {
                            const marketFilterTabs = [
                              { id: 'ALL', label: `🌐 Tout (${marketPositionsAll.length})` }
                            ];
                            if (marketPositionsAll.some(p => p.envelope === 'PEA')) {
                              const count = marketPositionsAll.filter(p => p.envelope === 'PEA').length;
                              marketFilterTabs.push({ id: 'PEA', label: `🇫🇷 PEA (${count})` });
                            }
                            if (marketPositionsAll.some(p => p.envelope === 'PEA-PME')) {
                              const count = marketPositionsAll.filter(p => p.envelope === 'PEA-PME').length;
                              marketFilterTabs.push({ id: 'PEA-PME', label: `🌱 PEA-PME (${count})` });
                            }
                            if (marketPositionsAll.some(p => p.envelope === 'CTO')) {
                              const count = marketPositionsAll.filter(p => p.envelope === 'CTO').length;
                              marketFilterTabs.push({ id: 'CTO', label: `🌍 CTO (${count})` });
                            }
                            if (marketPositionsAll.some(p => p.envelope === 'SPECULATIVE' || p.envelope === 'OPPORTUNISTIC')) {
                              const count = marketPositionsAll.filter(p => p.envelope === 'SPECULATIVE' || p.envelope === 'OPPORTUNISTIC').length;
                              marketFilterTabs.push({ id: 'SPECULATIVE', label: `🚀 Spéculatif (${count})` });
                            }

                            return marketFilterTabs.map((tab) => (
                              <button
                                key={tab.id}
                                type="button"
                                className={`btn ${selectedEnvelopeFilter === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ fontSize: 'var(--text-xs)', padding: '4px 10px', borderRadius: 20 }}
                                onClick={() => setSelectedEnvelopeFilter(tab.id)}
                              >
                                {tab.label}
                              </button>
                            ));
                          })()}
                        </div>
                        <table className="portfolio-table">
                          <thead>
                            <tr>
                              <th><span data-tooltip="Nom complet de l'actif et ticker boursier">Actif</span></th>
                              <th><span data-tooltip="Enveloppe fiscale (PEA, PEA-PME, CTO, Spéculatif...)">Enveloppe</span></th>
                              <th><span data-tooltip="Cours actuel du marché et PRU d'achat">Prix / Rendement</span></th>
                              <th><span data-tooltip="Valeur totale détenue et nombre de parts">Valeur / Solde</span></th>
                              <th><span data-tooltip="Plus ou Moins-value latente totale (% et montant €/$)">Gains &amp; Performance</span></th>
                              <th><span data-tooltip="Budget mensuel ou annuel d'accumulation DCA">DCA</span></th>
                              <th><span data-tooltip="Poids actuel comparé au Plafond d'Allocation Max de sécurité">Plafond &amp; Risque</span></th>
                              <th style={{ width: 80, textAlign: 'center' }}><span data-tooltip="Actions rapides : Historique, Édition, Suppression">Actions</span></th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const filteredPositions = positions.filter((p) => {
                                const isMarket = ['PEA', 'PEA-PME', 'CTO', 'SPECULATIVE', 'OPPORTUNISTIC'].includes(p.envelope);
                                if (!isMarket) return false;
                                
                                if (selectedEnvelopeFilter === 'ALL') return true;
                                if (selectedEnvelopeFilter === 'PEA') return p.envelope === 'PEA';
                                if (selectedEnvelopeFilter === 'PEA-PME') return p.envelope === 'PEA-PME';
                                if (selectedEnvelopeFilter === 'CTO') return p.envelope === 'CTO';
                                if (selectedEnvelopeFilter === 'SPECULATIVE') return p.envelope === 'SPECULATIVE' || p.envelope === 'OPPORTUNISTIC';
                                if (selectedEnvelopeFilter === 'BOURSE') return p.envelope === 'PEA' || p.envelope === 'PEA-PME' || p.envelope === 'CTO';
                                return p.envelope === selectedEnvelopeFilter;
                              });

                              if (filteredPositions.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-secondary)' }}>
                                      🔍 Aucun actif boursier ne correspond au filtre sélectionné.
                                    </td>
                                  </tr>
                                );
                              }

                              return filteredPositions.map((pos) => {
                                const hasFilled = pos.quantity > 0 && pos.avgPrice > 0;
                                const price = pos.currentPrice || pos.avgPrice;
                                const value = pos.quantity * price;
                                const cost = pos.quantity * pos.avgPrice;
                                const pl = value - cost;
                                const plPct = cost > 0 ? (pl / cost) * 100 : 0;

                                // Calcul de la part actuelle (%) et du Cap Max Recommandé (%)
                                const rateToEUR = (fxRates as any)[pos.currency] || 1.0;
                                const posValueEUR = pos.quantity * price * rateToEUR;
                                const currentWeightPct = totalMarketValEUR > 0 ? (posValueEUR / totalMarketValEUR) * 100 : 0;

                                const isCore = pos.ticker.includes('GPEA') || pos.ticker.includes('CW8') || pos.ticker.includes('WPEA') || pos.name.toLowerCase().includes('acwi');
                                const isSmallCap = pos.envelope === 'PEA-PME' || pos.ticker.includes('MEMS') || pos.ticker.includes('ALRIB');
                                const defaultCap = isCore ? 60.0 : isSmallCap ? 15.0 : 10.0;
                                const maxCapPct = pos.targetWeight ? pos.targetWeight * 100 : defaultCap;
                                const capUsagePct = maxCapPct > 0 ? (currentWeightPct / maxCapPct) * 100 : 0;

                                return (
                                  <tr
                                    key={pos.id}
                                    style={{
                                      cursor: 'pointer',
                                      borderLeft: !hasFilled ? '3px solid var(--accent-amber)' : undefined,
                                      opacity: hasFilled ? 1 : 0.7,
                                    }}
                                    onClick={() => setEditingPosition(pos)}
                                  >
                                    <td style={{ minWidth: 170, maxWidth: 260 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <AssetLogo
                                          ticker={pos.ticker}
                                          name={pos.name}
                                          envelope={pos.envelope}
                                          size={32}
                                        />
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                          <strong
                                            style={{
                                              color: 'var(--text-primary)',
                                              display: 'block',
                                              fontSize: 13,
                                              fontWeight: 700,
                                              lineHeight: 1.3,
                                              wordBreak: 'break-word',
                                              whiteSpace: 'normal',
                                            }}
                                            title={pos.name}
                                          >
                                            {getCleanAssetName(pos.ticker, pos.name)}
                                          </strong>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                                            <span className="mono" style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 600 }}>
                                              🏷️ {pos.ticker}
                                            </span>
                                            {!hasFilled && (
                                              <span style={{ fontSize: 10, color: 'var(--accent-amber)' }}>
                                                ✍️ Renseigner
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td>
                                      <span className={`envelope-tag ${pos.envelope.toLowerCase()}`} style={{ fontSize: 11, padding: '2px 7px' }}>
                                        {pos.envelope}
                                      </span>
                                    </td>
                                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                                      <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: 13 }}>
                                        {pos.currentPrice ? `${pos.currentPrice.toFixed(2)} ${pos.currency === 'EUR' ? '€' : '$'}` : '—'}
                                      </strong>
                                      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                                        PRU {pos.avgPrice > 0 ? `${pos.avgPrice.toFixed(2)} ${pos.currency === 'EUR' ? '€' : '$'}` : '—'}
                                      </span>
                                    </td>
                                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                                      <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: 14, fontWeight: 800 }}>
                                        {value > 0 ? `${Math.round(value).toLocaleString('fr-FR')} ${pos.currency === 'EUR' ? '€' : '$'}` : '—'}
                                      </strong>
                                      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                                        {pos.quantity > 0 ? `${pos.quantity} part${pos.quantity > 1 ? 's' : ''}` : '0 part'}
                                      </span>
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                      {cost > 0 ? (
                                        <div
                                          className={`stat-change ${pl >= 0 ? 'positive' : 'negative'}`}
                                          style={{
                                            display: 'inline-flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            padding: '3px 8px',
                                            borderRadius: 6,
                                            whiteSpace: 'nowrap',
                                            lineHeight: 1.2,
                                          }}
                                          title={`Plus/Moins-value : ${pl >= 0 ? '+' : ''}${pl.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${pos.currency === 'EUR' ? '€' : '$'}`}
                                        >
                                          <div style={{ fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <span>{pl >= 0 ? '↑' : '↓'}</span>
                                            <span>{pl >= 0 ? '+' : ''}{plPct.toFixed(1)}%</span>
                                          </div>
                                          <div style={{ fontSize: 10, opacity: 0.95, fontWeight: 600, marginTop: 1 }}>
                                            ({pl >= 0 ? '+' : ''}{Math.round(pl).toLocaleString('fr-FR')} {pos.currency === 'EUR' ? '€' : '$'})
                                          </div>
                                        </div>
                                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                    </td>
                                    <td className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                                      {(() => {
                                        const activeMarketTranche = pos.dcaHistory && pos.dcaHistory.length > 0
                                          ? (pos.dcaHistory.find(t => !t.endDate || t.endDate >= new Date().toISOString().split('T')[0]) || pos.dcaHistory[pos.dcaHistory.length - 1])
                                          : null;
                                        const effectiveMarketMonthlyDCA = activeMarketTranche ? activeMarketTranche.amount : (pos.monthlyDCA || (pos.annualBudget ? Math.round(pos.annualBudget / 12) : 0));
                                        const hasMarketActiveDCA = Boolean((effectiveMarketMonthlyDCA && effectiveMarketMonthlyDCA > 0) || (pos.annualBudget && pos.annualBudget > 0) || (pos.dcaHistory && pos.dcaHistory.length > 0));
                                        const marketDepositsCount = pos.depositsHistory?.length || 0;
                                        const totalMarketAdhocDeposits = pos.depositsHistory?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

                                        if (hasMarketActiveDCA) {
                                          return (
                                            <div>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ color: 'var(--accent-amber)', fontWeight: 700, fontSize: 13 }}>
                                                  +{pos.dcaFrequency === 'annual' || (!pos.monthlyDCA && pos.annualBudget)
                                                    ? `${(pos.annualBudget || (effectiveMarketMonthlyDCA ? effectiveMarketMonthlyDCA * 12 : 0)).toLocaleString('fr-FR')} €/an`
                                                    : pos.dcaFrequency === 'quarterly'
                                                    ? `${(effectiveMarketMonthlyDCA ? effectiveMarketMonthlyDCA * 3 : 0).toLocaleString('fr-FR')} €/trim`
                                                    : pos.dcaFrequency === 'semestrial'
                                                    ? `${(effectiveMarketMonthlyDCA ? effectiveMarketMonthlyDCA * 6 : 0).toLocaleString('fr-FR')} €/sem`
                                                    : `${(effectiveMarketMonthlyDCA || 0).toLocaleString('fr-FR')} €/m`}
                                                </span>
                                                {pos.dcaHistory && pos.dcaHistory.length > 1 && (
                                                  <span style={{
                                                    fontSize: 9,
                                                    padding: '1px 4px',
                                                    borderRadius: 4,
                                                    background: 'rgba(6, 182, 212, 0.15)',
                                                    color: 'var(--accent-cyan)',
                                                    border: '1px solid rgba(6, 182, 212, 0.3)',
                                                    fontWeight: 700,
                                                  }}>
                                                    {pos.dcaHistory.length} pal.
                                                  </span>
                                                )}
                                              </div>
                                              {(activeMarketTranche?.startDate || pos.dcaStartDate || dcaGlobalStartDate) && (
                                                <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1, display: 'block', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
                                                  depuis {activeMarketTranche?.startDate || pos.dcaStartDate || dcaGlobalStartDate}
                                                </span>
                                              )}
                                              {totalMarketAdhocDeposits > 0 && (
                                                <span style={{ fontSize: 10, color: 'var(--accent-cyan)', marginTop: 1, display: 'block', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
                                                  +{totalMarketAdhocDeposits.toLocaleString('fr-FR')} € apport
                                                </span>
                                              )}
                                            </div>
                                          );
                                        }

                                        if (marketDepositsCount > 0) {
                                          return (
                                            <div>
                                              <span style={{ color: 'var(--accent-cyan)', fontSize: 12, fontWeight: 700, display: 'block' }}>
                                                Apports ({totalMarketAdhocDeposits.toLocaleString('fr-FR')} €)
                                              </span>
                                              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'block', fontFamily: 'var(--font-sans)' }}>
                                                {marketDepositsCount} versement{marketDepositsCount > 1 ? 's' : ''}
                                              </span>
                                            </div>
                                          );
                                        }

                                        return <span style={{ color: 'var(--text-muted)' }}>—</span>;
                                      })()}
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 105, maxWidth: 115 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                                          <strong style={{ color: currentWeightPct > maxCapPct ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                                            {currentWeightPct.toFixed(1)}%
                                          </strong>
                                          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                                            / {maxCapPct.toFixed(0)}% max
                                          </span>
                                        </div>

                                        <div style={{ height: 4, width: '100%', background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                                          <div
                                            style={{
                                              height: '100%',
                                              width: `${Math.min(capUsagePct, 100)}%`,
                                              background: currentWeightPct > maxCapPct
                                                ? 'var(--accent-rose)'
                                                : currentWeightPct >= maxCapPct * 0.85
                                                ? 'var(--accent-amber)'
                                                : 'var(--accent-emerald)',
                                              borderRadius: 2,
                                            }}
                                          />
                                        </div>

                                        <div>
                                          {currentWeightPct > maxCapPct ? (
                                            <span
                                              className="badge badge-rose"
                                              style={{ fontSize: 10, padding: '1px 5px', fontWeight: 700 }}
                                              title={`Alerte sur-concentration : +${(currentWeightPct - maxCapPct).toFixed(1)}% au-dessus du plafond recommandé (${maxCapPct.toFixed(1)}% max)`}
                                            >
                                              ⚠️ +{(currentWeightPct - maxCapPct).toFixed(0)}% (Cap)
                                            </span>
                                          ) : currentWeightPct >= maxCapPct * 0.85 ? (
                                            <span
                                              className="badge badge-amber"
                                              style={{ fontSize: 10, padding: '1px 5px', fontWeight: 700 }}
                                              title={`Proche du plafond max : ${capUsagePct.toFixed(0)}% du cap d'allocation consommé`}
                                            >
                                              ⚡ {capUsagePct.toFixed(0)}%
                                            </span>
                                          ) : (
                                            <span
                                              className="badge badge-emerald"
                                              style={{ fontSize: 10, padding: '1px 5px', fontWeight: 700 }}
                                              title={`Niveau optimal : ${capUsagePct.toFixed(0)}% du plafond max d'allocation`}
                                            >
                                              ✓ OK ({capUsagePct.toFixed(0)}%)
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td onClick={(e) => e.stopPropagation()} style={{ width: 80, textAlign: 'center' }}>
                                      <div className="row-actions" style={{ justifyContent: 'center' }}>
                                        <button
                                          className="row-action-btn"
                                          onClick={() => {
                                            setSelectedHistoryTicker(pos.ticker);
                                            setShowTransactionModal(true);
                                          }}
                                          data-tooltip={`Historique des arbitrages pour ${pos.name}`}
                                        >
                                          📜
                                        </button>
                                        <button className="row-action-btn" onClick={() => setEditingPosition(pos)} data-tooltip="Éditer la position (Quantité, PRU, DCA)">✏️</button>
                                        <button className="row-action-btn danger" onClick={() => { if (confirm(`Supprimer ${pos.name} ?`)) handleDeletePosition(pos.id); }} data-tooltip="Supprimer cette ligne du portefeuille">🗑</button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Strategic Core vs Satellite View (CDC V4) */}
              <CoreSatelliteView
                positions={positions}
                fxRates={fxRates}
                onOpenInfoModal={() => setShowThemeInfoModal(true)}
                onOpenRebalance={openRebalanceModal}
              />
            </>
          )}

          {/* ═══ REVENU & BUDGET ═══ */}
          {currentView === 'revenue' && (
            <RevenueBudgetView
              records={salaryRecords}
              revenueConfig={revenueConfig}
              allocations={reserveAllocations}
              extraCashEntries={extraCashEntries}
              portfolioConfig={config}
              onSaveRecord={saveSalaryRecord}
              onDeleteRecord={deleteSalaryRecord}
              onSaveRevenueConfig={saveRevenueConfig}
              onSaveAllocation={saveReserveAllocation}
              onDeleteAllocation={deleteReserveAllocation}
              onSaveExtraCashEntry={saveExtraCashEntry}
              onDeleteExtraCashEntry={deleteExtraCashEntry}
              onOpenRebalancerWithBudget={openRebalanceModal}
              onSyncMonthlyBudget={async (amount: number) => {
                if (!config) return;
                await updateConfig({ ...config, monthlyBudget: amount });
              }}
              onShowToast={showToast}
            />
          )}

          {/* ═══ ENVELOPES & FISCALITÉ ═══ */}
          {currentView === 'envelopes' && (() => {
            const startYear = parseInt(dcaGlobalStartDate.slice(0, 4)) || 2024;
            const currentYear = new Date().getFullYear();
            const yearsElapsed = Math.max(0, (currentYear - startYear) + (new Date().getMonth() / 12));
            const cumulativeInflationFactor = adjustInflation ? Math.pow(1 + inflationRate, yearsElapsed) : 1.0;
            return (
              <EnvelopesTaxView
                positions={positions}
                fxRates={fxRates}
                adjustInflation={adjustInflation}
                cumulativeInflationFactor={cumulativeInflationFactor}
                inflationRate={inflationRate}
                yearsElapsed={yearsElapsed}
              />
            );
          })()}

          {/* ═══ ANALYSIS (Modern AI Chat with 1-Click Interactive Actions & Sidebar History) ═══ */}
          {currentView === 'analysis' && (
            <AnalysisChatView
              userUid={user.uid}
              positions={positions}
              config={config}
              investorProfile={investorProfile}
              updatePosition={updatePosition}
              updateConfig={updateConfig}
              onOpenGlossary={openGlossary}
              showToast={(msg, type) => showToast(msg, type)}
            />
          )}

          {/* ═══ RISK ═══ */}
          {currentView === 'risk' && (
            <>
              {/* ═══ SIMULATEUR PRATIQUE D'ABSORPTION DCA & RÉSILIENCE 15-20 ANS ═══ */}
              {(() => {
                const marketCapital = marketVal || 0;
                const monthlyBudget = config?.monthlyBudget || 1000;
                const nominalLoss = marketCapital * simulatedMarketDrop;
                const monthsToAbsorb = monthlyBudget > 0 ? (nominalLoss / monthlyBudget).toFixed(1) : '0.0';
                const partsBonusPercent = (100 / (1 - simulatedMarketDrop) - 100).toFixed(0);
                const pruDiscountPercent = marketCapital > 0
                  ? ((simulatedMarketDrop * monthlyBudget) / (marketCapital + monthlyBudget) * 100).toFixed(1)
                  : (simulatedMarketDrop * 100).toFixed(1);

                return (
                  <div className="card" style={{ borderLeft: '4px solid var(--accent-cyan)', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.04) 0%, rgba(16, 185, 129, 0.04) 100%)' }}>
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="card-title">🛡️ Simulateur d&apos;Absorption DCA &amp; Résilience de Marché</span>
                          <span className="badge badge-cyan" style={{ fontSize: 11, fontWeight: 700 }}>Horizon 15-20 ans</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          Simulez l&apos;impact d&apos;un krach sur vos actions cotées et visualisez comment vos versements mensuels absorbent la baisse et optimisent votre PRU.
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: 12, fontWeight: 700, background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}
                          onClick={() => setShowMonteCarloModal(true)}
                        >
                          🎲 Simulation Monte Carlo 15-20 ans
                        </button>
                      </div>
                    </div>

                    {/* Sélecteur Interactif de Baisse de Marché */}
                    <div style={{ margin: '14px 0 16px 0', background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Choc de Marché Testé :</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-rose)' }}>-{(simulatedMarketDrop * 100).toFixed(0)}%</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {[
                          { rate: 0.10, label: '🟡 Choc Léger (-10%)' },
                          { rate: 0.20, label: '🟠 Correction (-20%)' },
                          { rate: 0.30, label: '🔴 Krach Modéré (-30%)' },
                          { rate: 0.40, label: '⚡ Krach Sévère (-40%)' },
                          { rate: 0.50, label: '💥 Krach Historique (-50%)' },
                        ].map(({ rate, label }) => (
                          <button
                            key={rate}
                            type="button"
                            className={`btn btn-sm ${simulatedMarketDrop === rate ? 'btn-primary' : 'btn-ghost'}`}
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              padding: '4px 10px',
                              background: simulatedMarketDrop === rate ? 'var(--accent-rose)' : undefined,
                              color: simulatedMarketDrop === rate ? '#fff' : undefined,
                            }}
                            onClick={() => setSimulatedMarketDrop(rate)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 4 Indicateurs Pratiques & Mathématiques avec Info-Bulles */}
                    <div className="grid-4" style={{ marginBottom: 14, gap: 16 }}>
                      {/* 1. Perte Nominale sur Capital Coté */}
                      <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Baisse sur Capital Coté</span>
                          <span
                            style={{ cursor: 'help', fontSize: 13, color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.12)', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                            data-tooltip={`Cette baisse ne concerne que vos investissements boursiers (PEA, CTO). Il s'agit d'une perte latente (non réalisée) : tant que vous ne vendez pas, aucune perte n'est matérialisée.`}
                            data-tooltip-multiline="true"
                            data-tooltip-pos="down"
                          >
                            ℹ️
                          </span>
                        </div>
                        <strong className="mono" style={{ fontSize: 22, color: 'var(--accent-rose)', display: 'block', margin: '4px 0' }}>-{Math.round(nominalLoss).toLocaleString('fr-FR')} €</strong>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          Sur vos positions cotées ({Math.round(marketCapital).toLocaleString('fr-FR')} €). <em>(Perte latente)</em>.
                        </div>
                      </div>

                      {/* 2. Vitesse d'Absorption par le DCA */}
                      <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Temps d&apos;Absorption DCA</span>
                          <span
                            style={{ cursor: 'help', fontSize: 13, color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                            data-tooltip={`Nombre précis de mois de versements réguliers (${monthlyBudget.toLocaleString('fr-FR')} € / mois) nécessaires pour injecter un capital neuf équivalent à 100% de la baisse subie.`}
                            data-tooltip-multiline="true"
                            data-tooltip-pos="down"
                          >
                            ℹ️
                          </span>
                        </div>
                        <strong className="mono" style={{ fontSize: 22, color: 'var(--accent-emerald)', display: 'block', margin: '4px 0' }}>{monthsToAbsorb} mois</strong>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          Avec vos <strong>{monthlyBudget.toLocaleString('fr-FR')} € / mois</strong>, vous réinjectez 100% de la baisse en {Math.ceil(parseFloat(monthsToAbsorb))} versement(s).
                        </div>
                      </div>

                      {/* 3. Rabais Immédiat sur les Nouveaux Achats */}
                      <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Multiplicateur de Parts</span>
                          <span
                            style={{ cursor: 'help', fontSize: 13, color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.12)', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                            data-tooltip={`À budget d'épargne constant (${monthlyBudget.toLocaleString('fr-FR')} €), la baisse des cours vous permet d'acheter mathématiquement +${partsBonusPercent}% de parts d'ETF et d'actions supplémentaires par rapport au sommet.`}
                            data-tooltip-multiline="true"
                            data-tooltip-pos="down"
                          >
                            ℹ️
                          </span>
                        </div>
                        <strong className="mono" style={{ fontSize: 22, color: 'var(--accent-cyan)', display: 'block', margin: '4px 0' }}>+{partsBonusPercent}% de parts</strong>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          Pour le même versement mensuel, vous accumulez nettement plus de titres.
                        </div>
                      </div>

                      {/* 4. Levier de Baisse du PRU Moyen */}
                      <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Décote sur le PRU Global</span>
                          <span
                            style={{ cursor: 'help', fontSize: 13, color: 'var(--accent-amber)', background: 'rgba(245, 158, 11, 0.12)', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                            data-tooltip={`Mesure la baisse immédiate de votre Prix de Revient Unitaire (PRU) moyen global dès l'injection de votre versement mensuel de ${monthlyBudget.toLocaleString('fr-FR')} € à cours soldés.`}
                            data-tooltip-multiline="true"
                            data-tooltip-pos="down"
                          >
                            ℹ️
                          </span>
                        </div>
                        <strong className="mono" style={{ fontSize: 22, color: 'var(--accent-amber)', display: 'block', margin: '4px 0' }}>-{pruDiscountPercent}% sur le PRU</strong>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          Abaissment direct de votre prix moyen d&apos;achat grâce au versement mensuel.
                        </div>
                      </div>
                    </div>

                    {/* Bandeau de Matelas Garanti & Sécurité */}
                    <div style={{ padding: '10px 14px', background: 'rgba(6, 182, 212, 0.08)', borderRadius: 8, border: '1px solid rgba(6, 182, 212, 0.2)', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.45, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>🛡️</span>
                        <div>
                          <strong>Matelas de Sécurité Sanctuarisé :</strong> Vos <strong>{(savingsVal || 0).toLocaleString('fr-FR')} € de Livrets</strong> restent 100% intacts (0% de perte boursière) pour couvrir vos dépenses courantes sans jamais être contraint de vendre à perte.
                        </div>
                      </div>
                      <span
                        style={{ cursor: 'help', fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        data-tooltip="Le Livret A sert d'armure psychologique : il vous garantit de ne jamais liquider vos actions à bas prix en cas de coup dur."
                        data-tooltip-multiline="true"
                      >
                        Rôle du matelas ℹ️
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="card">
                <div className="card-header">
                  <div>
                    <span className="card-title">Stress Tests &amp; Simulation de Crises Historiques</span>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Testez le comportement spécifique de vos lignes face aux grands chocs macroéconomiques passés.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {ALL_SCENARIOS.map((scenario, idx) => (
                    <button
                      key={idx}
                      className="card"
                      onClick={() => handleRunStressTest(idx)}
                      style={{ cursor: 'pointer', textAlign: 'left' }}
                      id={`stress-test-${idx}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span className={`badge ${scenario.type === 'custom' ? 'badge-rose' : 'badge-amber'}`}>
                          {scenario.type === 'custom' ? '🎯 RIANE' : '📚 Historique'}
                        </span>
                      </div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{scenario.name}</h4>
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{scenario.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedStressResult && (
                <div className="card" style={{ animation: 'fadeInUp 0.3s ease' }}>
                  <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <span className="card-title">Résultat : {selectedStressResult.scenario.name}</span>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {selectedStressResult.scenario.description}
                      </div>
                    </div>
                    <span className={`badge ${Math.abs(selectedStressResult.portfolioLossPercent) > 20 ? 'badge-rose' : 'badge-amber'}`} style={{ fontSize: 14, padding: '4px 12px' }}>
                      {selectedStressResult.portfolioLossPercent.toFixed(1)}%
                    </span>
                  </div>

                  <div className="grid-3" style={{ marginBottom: 20 }}>
                    <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Perte Estimée sur le Portefeuille</span>
                        <span
                          style={{ cursor: 'help', fontSize: 13, color: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.12)', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                          data-tooltip="Montant nominal cumulé de la dépréciation sur l'ensemble de vos positions cotées (PEA, CTO) pour ce scénario."
                          data-tooltip-multiline="true"
                          data-tooltip-pos="down"
                        >
                          ℹ️
                        </span>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-rose)', fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
                        {selectedStressResult.portfolioLoss.toLocaleString('fr-FR')} €
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Sur l&apos;ensemble des positions cotées</div>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Absorption DCA Estimée</span>
                        <span
                          style={{ cursor: 'help', fontSize: 13, color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                          data-tooltip="Nombre de mois de versements réguliers nécessaires pour réinjecter 100% de la baisse subie."
                          data-tooltip-multiline="true"
                          data-tooltip-pos="down"
                        >
                          ℹ️
                        </span>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', margin: '4px 0', color: 'var(--accent-emerald)' }}>
                        {config?.monthlyBudget ? (Math.abs(selectedStressResult.portfolioLoss) / config.monthlyBudget).toFixed(1) : '1.5'} mois de DCA
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Pour réinjecter l&apos;équivalent de la baisse</div>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Diagnostic de Viabilité</span>
                        <span
                          style={{ cursor: 'help', fontSize: 13, color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.12)', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                          data-tooltip="Évaluation de la solidité de la structure d'allocation face aux tensions macroéconomiques de cette crise."
                          data-tooltip-multiline="true"
                          data-tooltip-pos="down"
                        >
                          ℹ️
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--accent-cyan)', fontWeight: 600, marginTop: 6 }}>
                        {selectedStressResult.objectiveImpact}
                      </div>
                    </div>
                  </div>

                  {selectedStressResult.contributionByAsset.length > 0 && (() => {
                    const displayAssets = hideProxyAssets
                      ? selectedStressResult.contributionByAsset.filter((a) => !a.isProxySimulated)
                      : selectedStressResult.contributionByAsset;

                    const proxyCount = selectedStressResult.contributionByAsset.filter((a) => a.isProxySimulated).length;

                    return (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                          <div>
                            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', margin: 0 }}>
                              Impact Détaillé par Actif ({displayAssets.length} titres)
                            </h4>
                            {proxyCount > 0 && (
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>
                                💡 {proxyCount} actif(s) créés après ce krach sont modélisés par leur indice sectoriel proxy.
                              </div>
                            )}
                          </div>

                          {proxyCount > 0 && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}
                              onClick={() => setHideProxyAssets(!hideProxyAssets)}
                            >
                              {hideProxyAssets ? '👁️ Afficher tous les actifs (avec Proxies)' : '🔒 Masquer les actifs créés après la crise'}
                            </button>
                          )}
                        </div>

                        {displayAssets.map((asset, i) => (
                          <div key={i} className="theme-bar-row" style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                            <div style={{ minWidth: 220, display: 'flex', flexDirection: 'column' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <AssetBadge ticker={asset.ticker} name={asset.name} showTicker={false} />
                                {asset.envelope && (
                                  <span className="badge badge-primary" style={{ fontSize: 10, padding: '1px 6px' }}>{asset.envelope}</span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 600 }}>{asset.ticker}</span>
                                {asset.isHeld ? (
                                  <span className="badge badge-emerald" style={{ fontSize: 10, padding: '1px 6px' }}>
                                    Détenu ({(asset.positionValue || 0).toLocaleString('fr-FR')} €)
                                  </span>
                                ) : (
                                  <span className="badge badge-amber" style={{ fontSize: 10, padding: '1px 6px' }}>
                                    Ligne cible non amorcée
                                  </span>
                                )}
                                {asset.isProxySimulated && (
                                  <button
                                    type="button"
                                    className="badge badge-amber"
                                    style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', cursor: 'pointer', border: '1px solid rgba(245, 158, 11, 0.5)', fontWeight: 700 }}
                                    onClick={() => setActiveProxyModalAsset(asset)}
                                    title="Cliquer pour voir l'explication de la simulation par proxy"
                                  >
                                    🔒 Proxy ({asset.inceptionYear}) 💡
                                  </button>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              {/* Baisse unitaire du cours */}
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Baisse du cours</div>
                                <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, color: (asset.priceShockPercent || 0) < 0 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                                  {asset.priceShockPercent !== undefined ? `${asset.priceShockPercent.toFixed(1)}%` : '-'}
                                </div>
                              </div>

                              {/* Perte nominale sur la position */}
                              <div style={{ textAlign: 'right', minWidth: 100 }}>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Perte sur la ligne</div>
                                <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 700, color: asset.contribution < 0 ? 'var(--accent-rose)' : 'var(--text-secondary)' }}>
                                  {asset.isHeld ? `${asset.contribution.toLocaleString('fr-FR')} €` : '0 €'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* 🛡️ RECOMMANDATIONS STRATÉGIQUES ANTI-CRISE & GUIDE DE CONDUITE DCA */}
                  {selectedStressResult.governanceActions.length > 0 && (
                    <div style={{ marginTop: 24, padding: 20, background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(6, 182, 212, 0.08))', border: '1px solid var(--accent-amber)', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 24 }}>🛡️</span>
                          <div>
                            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-amber)', margin: 0 }}>
                              Guide de Conduite Stratégique Anti-Crise (DCA 15-20 ans)
                            </h4>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                              Principes directeurs d&apos;allocation et de gestion des flux lors d&apos;une correction majeure
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {selectedStressResult.governanceActions.map((action, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: 'var(--bg-tertiary)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-subtle)',
                              padding: 14,
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 10,
                            }}
                          >
                            <span style={{ fontSize: 18, marginTop: 2 }}>{idx === 0 ? '🎯' : idx === 1 ? '🛡️' : '🚀'}</span>
                            <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                              {action}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ═══ AUDIT ═══ */}
          {currentView === 'audit' && (
            <>
              {/* Résumé portefeuille */}
              <div className="grid-3">
                <div className="card">
                  <div className="card-header"><span className="card-title">Positions</span></div>
                  <div className="card-value" style={{ color: 'var(--accent-cyan)' }}>{positions.length}</div>
                </div>
                <div className="card">
                  <div className="card-header"><span className="card-title">Enveloppes</span></div>
                  <div className="card-value">{Object.keys(envelopeGroups).length}</div>
                </div>
                <div className="card">
                  <div className="card-header"><span className="card-title">Analyses</span></div>
                  <div className="card-value">{history.length}</div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="card-title">Journal d&apos;Audit des Décisions</span>
                </div>
                {history.length === 0 ? (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 14, textAlign: 'center', padding: 40 }}>
                    Aucune analyse effectuée pour le moment.<br />
                    Lancez une analyse depuis le Dashboard ou la page Analyse.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {history.map((h) => (
                      <div key={h.id} style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                        onClick={() => { clearResult(); setCurrentView('analysis'); }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontWeight: 600 }}>{h.request.query}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                            {h.completedAt ? new Date(h.completedAt).toLocaleString('fr-FR') : '—'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span className={`badge ${h.request.status === 'complete' ? 'badge-emerald' : h.request.status === 'abstention' ? 'badge-amber' : 'badge-rose'}`}>
                            {h.request.status === 'complete' ? '✓ Complète' : h.request.status === 'abstention' ? '⛔ Abstention' : h.request.status}
                          </span>
                          {h.recommendation && (
                            <span className="badge badge-cyan">{h.recommendation.action}</span>
                          )}
                          {h.recommendation && (
                            <span className={`confidence-badge ${h.recommendation.confidence}`}>
                              {h.recommendation.confidence}
                            </span>
                          )}
                          {h.marketData && (
                            <span className="badge badge-violet">{h.marketData.ticker} · {h.marketData.price?.toFixed(2)} {h.marketData.currency}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══ REPORTS & NEWSLETTERS ═══ */}
          {currentView === 'reports' && (
            <ReportsView
              positions={positions}
              config={config}
              fxRates={fxRates}
              adjustInflation={adjustInflation}
              cumulativeInflationFactor={Math.pow(1 + inflationRate, Math.max(0, (new Date().getFullYear() - (parseInt(dcaGlobalStartDate.slice(0, 4)) || 2024)) + (new Date().getMonth() / 12)))}
              inflationRate={inflationRate}
              yearsElapsed={Math.max(0, (new Date().getFullYear() - (parseInt(dcaGlobalStartDate.slice(0, 4)) || 2024)) + (new Date().getMonth() / 12))}
              onShowToast={showToast}
              onTestEmail={handleTestEmail}
              uid={user?.uid}
              userEmail={user?.email}
            />
          )}
        </div>
      </main>
      {/* ═══ MODALS ═══ */}
      {editingPosition && (
        <PositionEditor
          position={(editingPosition === 'new' || editingPosition === 'new_savings') ? null : editingPosition}
          initialEnvelope={editingPosition === 'new_savings' ? 'LIVRET' : 'PEA'}
          onSave={handleSavePosition}
          onClose={() => setEditingPosition(null)}
          onDelete={(editingPosition !== 'new' && editingPosition !== 'new_savings') ? handleDeletePosition : undefined}
        />
      )}

      {showConfigEditor && config && (
        <ConfigEditor
          config={config}
          investorProfile={investorProfile}
          onSave={handleSaveConfig}
          onSyncProfile={updateInvestorProfile}
          onClose={() => setShowConfigEditor(false)}
          onTestNotification={handleTestNotification}
          onTestEmail={handleTestEmail}
        />
      )}

      {/* Smart Flow Rebalancer Modal (Institutional Order Sheet & Execution Checklist) */}
      {showFlowRebalanceModal && flowRebalanceResult && (
        <div className="modal-overlay" onClick={() => setShowFlowRebalanceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 660 }}>
            <div className="modal-header">
              <div>
                <h2>📋 Feuille d&apos;Ordres &amp; Rééquilibrage Stratégique</h2>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Calcule les ordres optimaux à passer sur vos comptes sans falsifier vos positions avant exécution.
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowFlowRebalanceModal(false)} type="button" aria-label="Fermer">✕</button>
            </div>

            {/* Capital Source Selector (DCA / Extra Cash / Combo / Custom) */}
            <div style={{ margin: '14px 0 10px 0', background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>
                Source de Capital &amp; Budget à Répartir :
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${rebalanceBudgetMode === 'dca' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, minWidth: 120, fontSize: 12, fontWeight: 700 }}
                  onClick={() => {
                    setRebalanceBudgetMode('dca');
                    const b = config?.monthlyBudget || 1000;
                    setFlowRebalanceResult(calculateSmartFlowRebalance(positions, b, fxRates));
                  }}
                >
                  🎯 DCA Seul ({(config?.monthlyBudget || 1000).toLocaleString('fr-FR')} €)
                </button>

                {totalAvailableExtraCash > 0 && (
                  <>
                    <button
                      type="button"
                      className={`btn btn-sm ${rebalanceBudgetMode === 'extra' ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ flex: 1, minWidth: 120, fontSize: 12, fontWeight: 700, background: rebalanceBudgetMode === 'extra' ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' : undefined }}
                      onClick={() => {
                        setRebalanceBudgetMode('extra');
                        setFlowRebalanceResult(calculateSmartFlowRebalance(positions, totalAvailableExtraCash, fxRates));
                      }}
                    >
                      💎 Primes/Extras (+{totalAvailableExtraCash.toLocaleString('fr-FR')} €)
                    </button>

                    <button
                      type="button"
                      className={`btn btn-sm ${rebalanceBudgetMode === 'combo' ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ flex: 1, minWidth: 130, fontSize: 12, fontWeight: 700, background: rebalanceBudgetMode === 'combo' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : undefined }}
                      onClick={() => {
                        setRebalanceBudgetMode('combo');
                        const b = (config?.monthlyBudget || 1000) + totalAvailableExtraCash;
                        setFlowRebalanceResult(calculateSmartFlowRebalance(positions, b, fxRates));
                      }}
                    >
                      🚀 Combo DCA + Primes ({((config?.monthlyBudget || 1000) + totalAvailableExtraCash).toLocaleString('fr-FR')} €)
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className={`btn btn-sm ${rebalanceBudgetMode === 'custom' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, minWidth: 100, fontSize: 12, fontWeight: 700 }}
                  onClick={() => {
                    setRebalanceBudgetMode('custom');
                    setFlowRebalanceResult(calculateSmartFlowRebalance(positions, customRebalanceAmount, fxRates));
                  }}
                >
                  ✍️ Sur-Mesure
                </button>
              </div>

              {rebalanceBudgetMode === 'custom' && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Montant personnalisé à injecter :</span>
                  <input
                    type="number"
                    className="input"
                    style={{ width: 140, padding: '4px 8px', fontSize: 13, fontWeight: 700 }}
                    value={customRebalanceAmount || ''}
                    min={50}
                    step={50}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setCustomRebalanceAmount(val);
                      setFlowRebalanceResult(calculateSmartFlowRebalance(positions, val, fxRates));
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>€</span>
                </div>
              )}
            </div>

            <div style={{ padding: '8px 12px', background: 'rgba(6, 182, 212, 0.08)', borderRadius: 6, border: '1px solid rgba(6, 182, 212, 0.2)', marginBottom: 12, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              💡 <strong>Ordres Calculés :</strong> Répartit votre capital ({flowRebalanceResult.totalDCA.toLocaleString('fr-FR')} €) en priorité sur vos sous-pondérations <strong>sans vendre aucun actif</strong>.
            </div>

            <div style={{ maxHeight: '42vh', overflowY: 'auto', paddingRight: 6, display: 'flex', flexDirection: 'column', gap: 10, margin: '10px 0 14px 0' }}>
              {flowRebalanceResult.instructions.map((inst) => (
                <div key={inst.positionId} style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 10, border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AssetLogo ticker={inst.ticker} name={inst.name} size={28} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                        {inst.name} ({inst.ticker})
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Enveloppe : <strong style={{ color: 'var(--accent-cyan)' }}>{inst.envelope}</strong> • Poids : {inst.currentWeight}% → Cible : {inst.targetWeight}%
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {inst.recommendedShares > 0 ? (
                      <>
                        <span className="badge badge-emerald" style={{ fontSize: 13, padding: '4px 10px', fontWeight: 700 }}>
                          🟢 Acheter +{inst.recommendedShares} part{inst.recommendedShares > 1 ? 's' : ''} ({inst.recommendedCost.toLocaleString('fr-FR')} €)
                        </span>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>
                          Nouveau poids projeté : {inst.newWeightAfter}%
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Conserver (conforme)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Budget alloué : </span>
                <strong className="mono" style={{ color: 'var(--accent-emerald)' }}>{flowRebalanceResult.totalSpent.toLocaleString('fr-FR')} €</strong>
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Reliquat trésorerie : </span>
                <strong className="mono" style={{ color: 'var(--accent-amber)' }}>{flowRebalanceResult.uninvestedCash.toLocaleString('fr-FR')} €</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  const orders = flowRebalanceResult.instructions
                    .filter((i) => i.recommendedShares > 0)
                    .map((i, idx) => `${idx + 1}. [${i.envelope}] Acheter ${i.recommendedShares} part(s) de ${i.ticker} (${i.name}) ~${i.recommendedCost} €`)
                    .join('\n');
                  const sourceLabel = rebalanceBudgetMode === 'dca' ? 'DCA Mensuel' : rebalanceBudgetMode === 'extra' ? 'Primes & Tontine' : rebalanceBudgetMode === 'combo' ? 'Combo DCA + Primes' : 'Montant Libre';
                  const text = `📋 FEUILLE D'ORDRES RIANE PORTFOLIO (${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })})\nSource : ${sourceLabel} | Budget : ${flowRebalanceResult.totalSpent} € (Reliquat : ${flowRebalanceResult.uninvestedCash} €)\n\n${orders}`;
                  navigator.clipboard.writeText(text);
                  showToast('📋 Feuille d\'ordres copiée dans le presse-papier !');
                }}
              >
                📋 Copier la Feuille d&apos;Ordres
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => setShowFlowRebalanceModal(false)}>Fermer</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '10px 18px', fontSize: 13, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)', fontWeight: 700 }}
                  onClick={async () => {
                    const confirmed = window.confirm(
                      `Avez-vous RÉELLEMENT passé ces ordres d'achat sur vos comptes de courtage (BoursoBank / CTO) ?\n\nCette action va enregistrer l'exécution des ordres dans votre portefeuille.`
                    );
                    if (!confirmed) return;

                    let appliedCount = 0;
                    for (const inst of flowRebalanceResult.instructions) {
                      if (inst.recommendedShares > 0) {
                        const pos = positions.find((p) => p.id === inst.positionId);
                        if (pos) {
                          const newQty = pos.quantity + inst.recommendedShares;
                          const unitPrice = inst.recommendedShares > 0 ? inst.recommendedCost / inst.recommendedShares : 0;
                          const effectivePrice = unitPrice || pos.currentPrice || pos.avgPrice || 10;
                          const newAvgPrice = pos.avgPrice > 0 ? pos.avgPrice : effectivePrice;
                          await updatePosition({
                            ...pos,
                            quantity: newQty,
                            avgPrice: newAvgPrice,
                            updatedAt: Date.now(),
                          });
                          appliedCount++;
                        }
                      }
                    }

                    // Si on a utilisé le mode Extra ou Combo, marquer les extras comme consommés
                    if ((rebalanceBudgetMode === 'extra' || rebalanceBudgetMode === 'combo') && extraCashEntries.length > 0) {
                      for (const extra of extraCashEntries) {
                        if (extra.isAvailable) {
                          await saveExtraCashEntry({ ...extra, isAvailable: false });
                        }
                      }
                    }

                    clearAnalysisCache();
                    setReadNotificationIds(notifications.map((n) => n.id));
                    showToast(`✅ Exécution réelle enregistrée (+${appliedCount} positions mises à jour)`);
                    setShowFlowRebalanceModal(false);
                  }}
                >
                  ✅ Enregistrer comme Exécuté
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 👤 User Profile Modal */}
      {showProfileModal && user && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: 'white',
                }}>
                  {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'R'}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>Mon Profil Investisseur</h3>
                  <span style={{ fontSize: 12, color: 'var(--accent-emerald)', fontWeight: 600 }}>● Compte Sécurisé Firebase</span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 10 }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Adresse Email</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{user.email}</div>
              </div>

              <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 10 }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Identifiant Unique (UID)</div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user.uid}</div>
              </div>

              <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Fournisseur d&apos;Accès</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{user.providerData[0]?.providerId === 'google.com' ? 'Google OAuth 2.0' : 'Email / Mot de passe'}</div>
                </div>
                <span style={{ fontSize: 20 }}>🛡️</span>
              </div>
            </div>

            {/* Investor Profile Card */}
            {investorProfile && investorProfile.onboardingCompleted && (
              <div style={{ padding: 14, background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)', borderRadius: 10, border: '1px solid var(--border-medium)', marginTop: 14 }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>Profil Investisseur</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Risque</span>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {investorProfile.riskProfile === 'conservative' ? '🛡️ Conservateur' : investorProfile.riskProfile === 'balanced' ? '⚖️ Équilibré' : investorProfile.riskProfile === 'dynamic' ? '🚀 Dynamique' : '⚡ Agressif'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Horizon</span>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>⏳ {investorProfile.horizonYears} ans</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Objectif</span>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {investorProfile.objective === 'wealth-building' ? '🏗️ Patrimoine' : investorProfile.objective === 'passive-income' ? '💰 Revenus' : investorProfile.objective === 'financial-independence' ? '🏝️ Indépendance' : '🎯 Spéculation'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Drawdown max</span>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>📉 -{(investorProfile.maxDrawdownTolerance * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* 🛠️ Developer Test Tools */}
            <div style={{ padding: 14, background: 'rgba(6, 182, 212, 0.08)', borderRadius: 10, border: '1px dashed var(--accent-cyan)', marginTop: 14 }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>
                🛠️ Outils de Test (Notifications &amp; Mails)
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleTestNotification}
                  style={{ fontSize: 12, borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', fontWeight: 600 }}
                >
                  🔔 Tester Notification
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleTestEmail}
                  style={{ fontSize: 12, borderColor: 'var(--accent-violet)', color: 'var(--accent-violet)', fontWeight: 600 }}
                >
                  📧 Tester Envoi Email (Resend)
                </button>
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>Fermer</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setShowProfileModal(false);
                    setShowEditProfile(true);
                  }}
                  style={{ fontSize: 12 }}
                >
                  🎯 Modifier mon Profil
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowProfileModal(false);
                    setShowConfirmSignOut(true);
                  }}
                  style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)', borderColor: 'var(--accent-rose)', fontWeight: 700 }}
                >
                  🚪 Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚪 Sign Out Confirmation Sub-Modal */}
      {showConfirmSignOut && (
        <div className="modal-overlay" onClick={() => setShowConfirmSignOut(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚪</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Confirmer la déconnexion ?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Vous devrez saisir à nouveau vos identifiants pour accéder à votre portefeuille RIANE.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowConfirmSignOut(false)} style={{ flex: 1 }}>
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  setShowConfirmSignOut(false);
                  await signOut();
                }}
                style={{ flex: 1, background: 'var(--accent-rose)', borderColor: 'var(--accent-rose)', fontWeight: 700 }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔔 Notification Center Modal */}
      {showNotificationModal && (
        <NotificationCenterModal
          notifications={notifications}
          settings={notificationSettings}
          onClose={() => setShowNotificationModal(false)}
          onMarkAllAsRead={() => setReadNotificationIds(notifications.map((n) => n.id))}
          onClearAll={() => setClearedNotificationIds(notifications.map((n) => n.id))}
          onUpdateSettings={(newSettings) => setNotificationSettings(newSettings)}
          onOpenAnalysis={(promptQuery?: string) => {
            const query = promptQuery || "Analyse globale de mon portefeuille";
            handleDirectAnalysis(query);
          }}
          onNavigateView={setCurrentView}
          onOpenRebalance={openRebalanceModal}
          onTestNotification={handleTestNotification}
          onTestEmail={handleTestEmail}
        />
      )}

      {/* 🔒 Modal d'Explication de la Simulation par Proxy */}
      {activeProxyModalAsset && (
        <div className="modal-overlay" onClick={() => setActiveProxyModalAsset(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620, border: '1px solid var(--accent-amber)', boxShadow: '0 8px 32px rgba(245, 158, 11, 0.25)' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>🔒</span>
                <div>
                  <h2 style={{ fontSize: 17, margin: 0, color: 'var(--accent-amber)' }}>Simulation par Proxy &amp; Reconstitution Historique</h2>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{activeProxyModalAsset.name} ({activeProxyModalAsset.ticker})</div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveProxyModalAsset(null)}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)', marginTop: 14 }}>
              <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ color: 'var(--accent-cyan)', margin: '0 0 6px 0', fontSize: 14 }}>💡 Pourquoi cet actif est-il simulé par Proxy ?</h4>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  <strong>{activeProxyModalAsset.name}</strong> a été introduit en bourse en <strong>{activeProxyModalAsset.inceptionYear}</strong>, soit <i>après</i> la survenue de ce krach historique.
                </p>
              </div>

              <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ color: 'var(--accent-amber)', margin: '0 0 6px 0', fontSize: 14 }}>📐 Méthodologie du Moteur de Risque RIANE</h4>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Pour estimer le comportement de vos capitaux actuels pendant cette crise sans laisser de trou dans les données, le moteur RIANE applique au cours de cet actif les variations réelles de son <strong>indice sectoriel de référence (Proxy Benchmark)</strong>.
                </p>
                <div style={{ marginTop: 10, padding: 10, background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-muted)' }}>
                  {activeProxyModalAsset.proxyNote || 'Modélisation basée sur la sensibilité sectorielle et le risque de change.'}
                </div>
              </div>

              <button className="btn btn-primary" onClick={() => setActiveProxyModalAsset(null)} style={{ alignSelf: 'flex-end', marginTop: 6 }}>
                Fermer l&apos;explication
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💡 Modal Stratégie Core / Satellite (CDC V4) */}
      {showThemeInfoModal && (
        <div className="modal-overlay" onClick={() => setShowThemeInfoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h2>🏛️ Stratégie Core / Satellite & Gouvernance CDC V4</h2>
              <button className="modal-close-btn" onClick={() => setShowThemeInfoModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)' }}>
              <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ color: 'var(--accent-cyan)', margin: '0 0 6px 0', fontSize: 15 }}>🎯 Les 3 Piliers de l&apos;Architecture Institutionnelle</h4>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                  L&apos;approche <strong>Core / Satellite</strong> sépare la recherche de rendement moyen de marché (Bêta) et la recherche de sur-performance (Alpha) tout en optimisant la fiscalité française :
                </p>
                <ul style={{ paddingLeft: 18, marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <li style={{ marginBottom: 6 }}>
                    <strong style={{ color: 'var(--accent-cyan)' }}>1. Pilier Cœur (40% - 50%) — PEA :</strong> ETF indiciels larges (Nasdaq-100 PUST, MSCI World). Frais minimes, diversification globale et réinvestissement automatique des dividendes.
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    <strong style={{ color: 'var(--accent-emerald)' }}>2. Pilier Pépites Europe (30% - 40%) — PEA-PME :</strong> Fonds Value et Small Caps européennes sous-évaluées (Indépendance AM, Riber, Memscap). Exonération fiscale totale d&apos;IR après 5 ans.
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    <strong style={{ color: 'var(--accent-purple)' }}>3. Pilier Satellites US (15% - 20%) — CTO :</strong> Pure-plays de conviction technologique (Symbotic, Coherent, Constellation Energy). Asymétrie haussière sur les mégatendances.
                  </li>
                </ul>
              </div>

              <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ color: 'var(--accent-amber)', margin: '0 0 6px 0', fontSize: 15 }}>🔄 Rééquilibrage Serein par Flux DCA (Sans Vente)</h4>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                  Sur un horizon de 15 à 20 ans, les rééquilibrages ne se font <strong>jamais par la vente d&apos;actifs</strong> (ce qui déclencherait des frottements fiscaux ou des frais de courtage inutiles).
                </p>
                <div style={{ marginTop: 8, fontSize: 13, color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 12px', borderRadius: 6 }}>
                  👉 <strong>Règle d&apos;or :</strong> Orientez simplement vos versements DCA mensuels vers le pilier actuellement sous-pondéré pour faire converger le portefeuille vers ses cibles.
                </div>
              </div>

              <div style={{ padding: 12, background: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-cyan)' }}>
                <span style={{ fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  ⚡ Isolation du Portefeuille : Ces ratios sont calculés exclusivement sur vos actifs boursiers cotés. Vos livrets d&apos;épargne et votre PEE restent dans leur réserve dédiée sans fausser ces métriques.
                </span>
              </div>

              <button className="btn btn-primary" onClick={() => setShowThemeInfoModal(false)} style={{ marginTop: 10, alignSelf: 'flex-end' }}>
                J&apos;ai compris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📚 Modal Lexique & Explications Financières */}
      {showGlossaryModal && (
        <GlossaryInfoModal
          onClose={() => setShowGlossaryModal(false)}
          initialTerm={glossaryInitialTerm}
        />
      )}

      {/* 🎲 Modal Simulation Monte Carlo & Indépendance (FIRE) */}
      {showMonteCarloModal && (
        <MonteCarloModal
          initialCapital={totalValue}
          monthlyDCA={monthlyDCATotal || (config?.monthlyBudget || 1000)}
          positions={positions}
          fxRates={fxRates}
          onClose={() => setShowMonteCarloModal(false)}
        />
      )}

      {/* 📜 Modal Historique des Arbitrages & Transaction Journal */}
      {showTransactionModal && (
        <TransactionHistoryModal
          transactions={transactions}
          initialTicker={selectedHistoryTicker}
          onClose={() => setShowTransactionModal(false)}
        />
      )}

      {/* 💰 Modal Montant Net Réel Viré en Compte */}
      {showNetDetailsModal && (
        <div className="modal-overlay" onClick={() => setShowNetDetailsModal(false)}>
          <div className="modal-content card" style={{ maxWidth: 480, width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                💰 Montant Net Réel si Retrait
              </h3>
              <button type="button" className="btn btn-ghost" onClick={() => setShowNetDetailsModal(false)}>✕</button>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 12, border: '2px solid var(--accent-emerald)', textAlign: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Somme nette virée sur votre compte bancaire aujourd&apos;hui
              </span>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-emerald)', margin: '8px 0' }}>
                {netLiquidationDetails.totalNetValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Après déduction de la fiscalité (PFU 31.4% et Prélèvements Sociaux)
              </span>
            </div>

            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid var(--accent-blue)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Hypothèse Fiscale PEA</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Ancienneté du PEA au retrait</span>
              </div>
              <div style={{ display: 'flex', gap: 6, background: 'var(--bg-primary)', padding: 4, borderRadius: 6 }}>
                <button
                  type="button"
                  className={`btn btn-sm ${peaSeniority === 'over5' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  onClick={() => setPeaSeniority('over5')}
                >
                  &gt; 5 ans (18.6%)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${peaSeniority === 'under5' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  onClick={() => setPeaSeniority('under5')}
                >
                  &lt; 5 ans (31.4%)
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <span style={{ color: 'var(--text-secondary)' }}>💵 Valeur brute totale</span>
                <strong>{netLiquidationDetails.totalGrossValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <span style={{ color: 'var(--text-secondary)' }}>📈 Plus-value brute réalisée</span>
                <strong style={{ color: netLiquidationDetails.totalGrossGain >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                  {netLiquidationDetails.totalGrossGain >= 0 ? '+' : ''}{netLiquidationDetails.totalGrossGain.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <span style={{ color: 'var(--text-secondary)' }}>🏛️ Impôts &amp; Cotisations déduits</span>
                <strong style={{ color: 'var(--accent-rose)' }}>
                  -{netLiquidationDetails.totalEstimatedTax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: 12 }}
                onClick={() => {
                  setShowNetDetailsModal(false);
                  setCurrentView('envelopes');
                }}
              >
                💼 Accéder à la simulation complète
              </button>
              <button type="button" className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => setShowNetDetailsModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast with Undo Action Button */}
      {toast && (
        <div className={`toast ${toast.type}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>{toast.type === 'success' ? '✅' : '❌'} {toast.message}</span>
          {canUndo && !toast.message.includes('Annulation') && (
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderColor: 'var(--accent-cyan)',
                color: 'var(--accent-cyan)',
                fontWeight: 700,
                background: 'rgba(6, 182, 212, 0.15)',
              }}
              onClick={async () => {
                const ok = await undoLastAction();
                if (ok) {
                  setToast({ message: '↩️ Action annulée — État précédent du portefeuille rétabli !', type: 'success' });
                }
              }}
            >
              ↩️ Annuler l&apos;action
            </button>
          )}
        </div>
      )}

      {/* 🧪 Benchmark Étalon Boursobank — Bouton flottant + Widget */}
      {!showBenchmark && (
        <button
          onClick={() => setShowBenchmark(true)}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '1px solid var(--border-medium)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            fontSize: 18,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9998,
            opacity: 0.6,
            transition: 'opacity 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.transform = 'scale(1)'; }}
          title="Ouvrir le portefeuille étalon Boursobank"
          id="benchmark-fab"
        >
          🧪
        </button>
      )}
      {/* 📱 Mobile Bottom Navigation Bar (Smartphones & Tablets) */}
      <nav className="mobile-bottom-nav" aria-label="Navigation Mobile">
        <button
          type="button"
          className={`mobile-nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => {
            setCurrentView('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          id="mob-nav-dashboard"
        >
          <span className="icon">📊</span>
          <span>Bord</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-btn ${currentView === 'envelopes' ? 'active' : ''}`}
          onClick={() => {
            setCurrentView('envelopes');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          id="mob-nav-envelopes"
        >
          <span className="icon">🏛️</span>
          <span>Fiscalité</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-btn ${currentView === 'revenue' ? 'active' : ''}`}
          onClick={() => {
            setCurrentView('revenue');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          id="mob-nav-revenue"
        >
          <span className="icon">💰</span>
          <span>Budget</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-btn ${currentView === 'analysis' ? 'active' : ''}`}
          onClick={() => {
            setCurrentView('analysis');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          id="mob-nav-analysis"
        >
          <span className="icon">🔬</span>
          <span>Analyse</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-btn ${currentView === 'risk' ? 'active' : ''}`}
          onClick={() => {
            setCurrentView('risk');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          id="mob-nav-risk"
        >
          <span className="icon">⚡</span>
          <span>Risque</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-btn ${currentView === 'reports' ? 'active' : ''}`}
          onClick={() => {
            setCurrentView('reports');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          id="mob-nav-reports"
        >
          <span className="icon">📰</span>
          <span>Rapports</span>
        </button>

        <button
          type="button"
          className="mobile-nav-btn"
          onClick={() => setShowProfileModal(true)}
          id="mob-nav-profile"
        >
          <span className="icon">⚙️</span>
          <span>Profil</span>
        </button>
      </nav>

      <BenchmarkWidget visible={showBenchmark} onClose={() => setShowBenchmark(false)} />
    </div>
  );
}

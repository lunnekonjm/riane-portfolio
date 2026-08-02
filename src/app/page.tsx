'use client';

import { useState, useEffect, useCallback } from 'react';
import { onAuthChange, signInWithGoogle, signOut } from '@/services/firebase/auth';
import { isFirebaseConfigured } from '@/services/firebase/config';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAnalysis } from '@/hooks/useAnalysis';
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
import CustomDatePicker from '@/components/CustomDatePicker';
import { getQuote } from '@/services/market-data/provider';
import TransactionHistoryModal from '@/components/TransactionHistoryModal';
import AssetBadge from '@/components/AssetBadge';
import { AnalysisChatView } from '@/components/AnalysisChatView';
import { getCleanAssetName } from '@/utils/assetMetadata';

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

type PageView = 'dashboard' | 'envelopes' | 'analysis' | 'risk' | 'audit' | 'reports';

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
          fontSize: 11,
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
  const [editingPosition, setEditingPosition] = useState<Position | null | 'new'>(null);
  const [showConfigEditor, setShowConfigEditor] = useState(false);
  const [showFlowRebalanceModal, setShowFlowRebalanceModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showConfirmSignOut, setShowConfirmSignOut] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [clearedNotificationIds, setClearedNotificationIds] = useState<string[]>([]);
  const [activeProxyModalAsset, setActiveProxyModalAsset] = useState<any | null>(null);

  const [flowRebalanceResult, setFlowRebalanceResult] = useState<FlowRebalanceResult | null>(null);
  const [activeRebalanceResult, setActiveRebalanceResult] = useState<ActiveRebalanceResult | null>(null);
  const [rebalanceTab, setRebalanceTab] = useState<'dca' | 'active'>('dca');
  const [dcaGlobalStartDate, setDcaGlobalStartDate] = useState<string>('2024-01-05');

  // Sync saved DCA start date from localStorage on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDate = localStorage.getItem('riane_dca_start_date');
      if (savedDate) {
        setDcaGlobalStartDate(savedDate);
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
    monthlyDCATotal, saving, pendingCount, filledPositions, fxRates, lastPricesUpdated, marketStatusLabel,
    canUndo, undoLastAction, canRedo, redoLastAction, transactions, recordTransaction,
    addPosition, updatePosition, removePosition, updateConfig, updateInvestorProfile, refreshPrices, resetPortfolio,
  } = usePortfolio();

  const [showEditProfile, setShowEditProfile] = useState(false);

  const [showDcaFrequencyDropdown, setShowDcaFrequencyDropdown] = useState<boolean>(false);

  const handleRunGlobalDCACalculation = async (startDate: string) => {
    if (!startDate) return;
    setRefreshingPrices(true);
    try {
      let updatedCount = 0;
      for (const pos of positions) {
        const monthlyBudget = pos.monthlyDCA || (pos.annualBudget ? pos.annualBudget / 12 : 100);
        const isIntegerOnly = pos.envelope === 'PEA' || pos.envelope === 'PEA-PME' || pos.envelope === 'CTO';

        let realLivePrice = pos.currentPrice;
        if (!realLivePrice || realLivePrice === 10) {
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
    return rawNotifications
      .filter((n) => !clearedNotificationIds.includes(n.id))
      .map((n) => ({ ...n, read: n.read || readNotificationIds.includes(n.id) }));
  }, [rawNotifications, readNotificationIds, clearedNotificationIds]);

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

  const handleSavePosition = async (pos: Position) => {
    if (editingPosition === 'new') {
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

  const openRebalanceModal = () => {
    if (filledPositions.length === 0) {
      showToast('Veuillez d\'abord renseigner vos positions réelles (Quantité & PRU) avant de calculer un rééquilibrage DCA', 'error');
      return;
    }
    const monthlyBudget = config?.monthlyBudget || 1000;
    const flowResult = calculateSmartFlowRebalance(positions, monthlyBudget, fxRates);
    const activeResult = calculateActiveRebalance(positions, fxRates);
    setFlowRebalanceResult(flowResult);
    setActiveRebalanceResult(activeResult);
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
            <div style={{ fontSize: 11, color: 'var(--accent-emerald)', fontWeight: 500 }}>● Session Sécurisée</div>
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
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 6px',
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
                <div className="card" style={{ borderLeft: '3px solid var(--accent-amber)', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 28 }}>✍️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {pendingCount === positions.length
                        ? 'Renseignez vos positions pour activer le tableau de bord'
                        : `${pendingCount} position${pendingCount > 1 ? 's' : ''} à compléter`}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      Cliquez sur chaque ligne du tableau pour entrer vos quantités et prix réels d&apos;achat (PRU).
                      Seules vos données réelles sont utilisées — aucune estimation.
                    </div>
                  </div>
                </div>
              )}

              {/* Inflation Factor Calculation */}
              {(() => {
                const startYear = parseInt(dcaGlobalStartDate.slice(0, 4)) || 2024;
                const currentYear = new Date().getFullYear();
                const yearsElapsed = Math.max(0, (currentYear - startYear) + (new Date().getMonth() / 12));
                const cumulativeInflationFactor = adjustInflation ? Math.pow(1 + inflationRate, yearsElapsed) : 1.0;

                const displayTotalValue = totalValue / cumulativeInflationFactor;
                const displayTotalCost = totalCost / cumulativeInflationFactor;
                const displayGainLoss = displayTotalValue - displayTotalCost;
                const displayGainLossPercent = displayTotalCost > 0 ? (displayGainLoss / displayTotalCost) * 100 : 0;

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
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="card-title">
                            {adjustInflation ? 'Valeur Réelle (Ajustée Inflation)' : 'Valeur Totale'}
                          </span>
                        </div>
                        <div className="card-value" style={{ color: displayTotalValue > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                          {displayTotalValue > 0
                            ? displayTotalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                            : '—'}
                        </div>
                        {displayTotalValue === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>À renseigner</span>}
                        {filledPositions.length > 0 && filledPositions.length < positions.length && (
                          <span style={{ fontSize: 11, color: 'var(--accent-amber)' }}>{filledPositions.length}/{positions.length} positions renseignées</span>
                        )}
                      </div>
                      <div className="card" data-tooltip="Total des capitaux réellement investis (somme des PRU)">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="card-title">
                            {adjustInflation ? 'Coût Total Réel (Euros Constants)' : 'Coût Total (PRU)'}
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0 4px', fontSize: 12, color: 'var(--accent-cyan)' }}
                            onClick={() => openGlossary('PRU')}
                            data-tooltip="Définition et calcul du PRU"
                          >
                            💡 PRU
                          </button>
                        </div>
                        <div className="card-value">
                          {displayTotalCost > 0
                            ? displayTotalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                            : '—'}
                        </div>
                        {displayTotalCost === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Entrez vos PRU réels</span>}
                      </div>
                      <div className="card" data-tooltip="Plus ou moins-value latente globale du portefeuille (€ et %)">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="card-title">
                            {adjustInflation ? 'Plus/Moins-Value Réelle' : 'Plus/Moins-Value'}
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0 4px', fontSize: 12, color: 'var(--accent-cyan)' }}
                            onClick={() => openGlossary('PFU')}
                            data-tooltip="Règles de fiscalité PEA (18.6%) et CTO (Flat Tax 30%)"
                          >
                            💡 Taxe
                          </button>
                        </div>
                        {displayTotalCost > 0 ? (
                          <>
                            <div className={`card-value ${displayGainLoss >= 0 ? 'stat-gain' : 'stat-loss'}`}>
                              {displayGainLoss >= 0 ? '+' : ''}{displayGainLoss.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                              <span className={`stat-change ${displayGainLoss >= 0 ? 'positive' : 'negative'}`}>
                                {displayGainLossPercent >= 0 ? '↑' : '↓'} {Math.abs(displayGainLossPercent).toFixed(2)}%
                              </span>
                              {displayGainLoss > 0 && (
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }} data-tooltip="Net d'impôts après PEA (18.6%) et CTO (30%)">
                                  Net: +{(filledPositions.reduce((sum, p) => {
                                    const price = p.currentPrice || p.avgPrice;
                                    const rateToEUR = (fxRates as any)[p.currency] || 1.0;
                                    const val = p.quantity * price * rateToEUR;
                                    const cost = p.quantity * p.avgPrice * rateToEUR;
                                    const pl = val - cost;
                                    if (pl <= 0) return sum + pl;
                                    const taxRate = (p.envelope === 'PEA' || p.envelope === 'PEA-PME') ? 0.186 : 0.30;
                                    return sum + (pl * (1 - taxRate));
                                  }, 0) / cumulativeInflationFactor).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="card-value" style={{ color: 'var(--text-muted)' }}>—</div>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Calculé depuis vos PRU</span>
                          </>
                        )}
                      </div>
                      <div className="card" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => setShowConfigEditor(true)} data-tooltip="Somme totale de vos versements d'accumulation">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="card-title">DCA &amp; Épargne</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '0 4px', fontSize: 12, color: 'var(--accent-cyan)' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openGlossary('DCA');
                              }}
                              title="Qu'est-ce que le DCA et la fréquence de versement ?"
                            >
                              💡 DCA
                            </button>
                            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>⚙️</span>
                          </div>
                        </div>

                        <div className="card-value" style={{ color: dcaBreakdown.monthlyEquivalent > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
                          <span>
                            {dcaBreakdown.monthlyEquivalent > 0
                              ? (dcaBreakdown.monthlyEquivalent / cumulativeInflationFactor).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                              : '0,00 €'}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                            {dcaBreakdown.monthlyEquivalent > 0 ? '/mois (lissés)' : '(Aucun DCA actif)'}
                          </span>
                        </div>

                        {/* Interactive Mini Dropdown Badge Button */}
                        <div style={{ marginTop: 6, position: 'relative' }}>
                          {dcaBreakdown.activeFrequenciesCount > 0 ? (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{
                                fontSize: 10,
                                padding: '3px 8px',
                                borderRadius: 6,
                                background: 'rgba(6, 182, 212, 0.12)',
                                color: 'var(--accent-cyan)',
                                border: '1px solid rgba(6, 182, 212, 0.3)',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDcaFrequencyDropdown(!showDcaFrequencyDropdown);
                              }}
                            >
                              <span>📊 Détail des Fréquences ({dcaBreakdown.activeFrequenciesCount})</span>
                              <span style={{ fontSize: 9 }}>{showDcaFrequencyDropdown ? '▴' : '▾'}</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              ✍️ Définissez le DCA par position
                            </span>
                          )}

                          {/* Dropdown Popover */}
                          {showDcaFrequencyDropdown && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                position: 'absolute',
                                top: '120%',
                                left: 0,
                                minWidth: 240,
                                background: 'rgba(15, 23, 42, 0.98)',
                                border: '1px solid var(--accent-cyan)',
                                borderRadius: 10,
                                padding: 12,
                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.6)',
                                backdropFilter: 'blur(16px)',
                                zIndex: 100,
                                fontSize: 11,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                              }}
                            >
                              <div style={{ fontWeight: 700, color: 'white', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 4, marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}>
                                <span>Ventilation des Versements</span>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{positions.length} positions</span>
                              </div>

                              {dcaBreakdown.monthlyCount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--text-secondary)' }}>📅 Mensuel ({dcaBreakdown.monthlyCount})</span>
                                  <strong style={{ color: 'var(--accent-emerald)' }}>{dcaBreakdown.monthlySum.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / mois</strong>
                                </div>
                              )}

                              {dcaBreakdown.quarterlyCount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--text-secondary)' }}>📆 Trimestriel ({dcaBreakdown.quarterlyCount})</span>
                                  <strong style={{ color: 'var(--accent-cyan)' }}>{dcaBreakdown.quarterlySum.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / trim</strong>
                                </div>
                              )}

                              {dcaBreakdown.semestrialCount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--text-secondary)' }}>🌓 Semestriel ({dcaBreakdown.semestrialCount})</span>
                                  <strong style={{ color: 'var(--accent-amber)' }}>{dcaBreakdown.semestrialSum.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / sem</strong>
                                </div>
                              )}

                              {dcaBreakdown.annualCount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--text-secondary)' }}>🎆 Annuel ({dcaBreakdown.annualCount})</span>
                                  <strong style={{ color: 'var(--accent-rose)' }}>{dcaBreakdown.annualSum.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / an</strong>
                                </div>
                              )}

                              <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: 6, marginTop: 2, display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'white' }}>
                                <span>💰 Cumul Annuel Global</span>
                                <span style={{ color: 'var(--accent-emerald)' }}>{dcaBreakdown.totalAnnualCumulative.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / an</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Quick Analysis Bar */}
              <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 20 }}>🔍</span>
                <input
                  className="input"
                  placeholder="Analyse X-FAB dans mon portefeuille... | Compare cet ETF à mon ACWI..."
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunAnalysis()}
                  disabled={isRunning}
                  id="quick-analysis-input"
                />
                <button className="btn btn-primary" onClick={() => handleRunAnalysis(false)} disabled={isRunning || !queryInput.trim()} id="run-analysis-btn">
                  {isRunning ? <span className="loading-spinner" /> : 'Analyser'}
                </button>
              </div>

              {/* ⚡ Console de Simulation DCA & Période d'Accumulation */}
              <div className="card" style={{ borderLeft: '4px solid var(--accent-emerald)', background: 'var(--bg-secondary)', padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24 }}>⚡</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                        Console d&apos;Accumulation DCA Historique
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
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
                      style={{ fontSize: 12 }}
                    >
                      1 An (2025)
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${dcaGlobalStartDate.startsWith('2023-01') ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleUpdateDcaStartDate('2023-01-05')}
                      style={{ fontSize: 12 }}
                    >
                      3 Ans (2023)
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${dcaGlobalStartDate.startsWith('2021-01') ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleUpdateDcaStartDate('2021-01-05')}
                      style={{ fontSize: 12 }}
                    >
                      5 Ans (2021)
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${dcaGlobalStartDate.startsWith('2003-01') ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleUpdateDcaStartDate('2003-01-05')}
                      style={{ fontSize: 12 }}
                    >
                      23 Ans (2003)
                    </button>

                    {/* Modern Custom Dark Theme Date Picker Component */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <CustomDatePicker
                        value={dcaGlobalStartDate}
                        onChange={handleUpdateDcaStartDate}
                      />
                      <span style={{ fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 600, background: 'rgba(6, 182, 212, 0.1)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                        {formatDCAElapsedTime(dcaGlobalStartDate)}
                      </span>
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={async () => {
                        if (!dcaGlobalStartDate) return;
                        setRefreshingPrices(true);
                        try {
                          let updatedCount = 0;
                          for (const pos of positions) {
                            const monthlyBudget = pos.monthlyDCA || (pos.annualBudget ? pos.annualBudget / 12 : 100);
                            const isIntegerOnly = pos.envelope === 'PEA' || pos.envelope === 'PEA-PME' || pos.envelope === 'CTO';

                            // Fetch real market quote if pos.currentPrice is missing or corrupted
                            let realLivePrice = pos.currentPrice;
                            if (!realLivePrice || realLivePrice === 10) {
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

              {/* Portfolio by Envelope */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Positions ({positions.length})</span>
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
                {positions.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📂</div>
                    <div className="empty-state-text">Aucune position.<br />Ajoutez votre premier ETF ou action.</div>
                    <button className="btn btn-primary" onClick={() => setEditingPosition('new')}>➕ Ajouter une position</button>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', borderRadius: 'var(--radius-md)' }}>
                    <table className="portfolio-table">
                    <thead>
                      <tr>
                        <th><span data-tooltip="Nom complet de l'actif ou de l'ETF">Actif</span></th>
                        <th><span data-tooltip="Code de cotation boursière (ex: PUST.PA, COHR)">Ticker</span></th>
                        <th><span data-tooltip="Enveloppe fiscale d'investissement (PEA, PEA-PME, CTO)">Enveloppe</span></th>
                        <th><span data-tooltip="Nombre total de parts actuellement détenues">Qté</span></th>
                        <th><span data-tooltip="Prix de Revient Unitaire moyen d'achat">PRU</span></th>
                        <th><span data-tooltip="Cours du marché en direct (Yahoo Finance)">Prix</span></th>
                        <th><span data-tooltip="Valeur totale actuelle en portefeuille (Quantité × Prix)">Valeur</span></th>
                        <th><span data-tooltip="Plus ou Moins-value latente totale (% et montant €/$)">P&L</span></th>
                        <th><span data-tooltip="Poids actuel dans le portefeuille comparé au Taux d'Allocation Max Recommandé (Plafond de sécurité)">Part / Cap Max</span></th>
                        <th><span data-tooltip="Budget mensuel ou annuel d'accumulation DCA">DCA</span></th>
                        <th><span data-tooltip="Actions rapides : Édition, Historique des arbitrages, Suppression">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const totalPortfolioValEUR = positions.reduce((sum, p) => {
                          const pr = p.currentPrice || p.avgPrice;
                          const rate = (fxRates as any)[p.currency] || 1.0;
                          return sum + p.quantity * pr * rate;
                        }, 0);

                        return positions.map((pos) => {
                          const hasFilled = pos.quantity > 0 && pos.avgPrice > 0;
                          const price = pos.currentPrice || pos.avgPrice;
                          const value = pos.quantity * price;
                          const cost = pos.quantity * pos.avgPrice;
                          const pl = value - cost;
                          const plPct = cost > 0 ? (pl / cost) * 100 : 0;

                          // Calcul de la part actuelle (%) et du Cap Max Recommandé (%)
                          const rateToEUR = (fxRates as any)[pos.currency] || 1.0;
                          const posValueEUR = pos.quantity * price * rateToEUR;
                          const currentWeightPct = totalPortfolioValEUR > 0 ? (posValueEUR / totalPortfolioValEUR) * 100 : 0;

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
                            <td style={{ fontWeight: 600 }}>
                              <AssetBadge ticker={pos.ticker} name={pos.name} showTicker={false} />
                              {!hasFilled && (
                                <span style={{ display: 'block', fontSize: 11, color: 'var(--accent-amber)', fontWeight: 400 }}>
                                  ✍️ Cliquez pour renseigner
                                </span>
                              )}
                            </td>
                            <td className="mono" style={{ whiteSpace: 'nowrap' }}>{pos.ticker}</td>
                            <td>
                              <span className={`envelope-tag ${pos.envelope.toLowerCase()}`}>
                                {pos.envelope}
                              </span>
                            </td>
                            <td className="mono">{pos.quantity > 0 ? pos.quantity : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                            <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                              {pos.avgPrice > 0 ? `${pos.avgPrice.toFixed(2)} ${pos.currency === 'EUR' ? '€' : '$'}` : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                            </td>
                            <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                              {pos.currentPrice ? `${pos.currentPrice.toFixed(2)} ${pos.currency === 'EUR' ? '€' : '$'}` : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                            </td>
                            <td className="mono" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {value > 0 ? `${Math.round(value).toLocaleString('fr-FR')} ${pos.currency === 'EUR' ? '€' : '$'}` : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              {cost > 0 ? (
                                <div
                                  className={`stat-change ${pl >= 0 ? 'positive' : 'negative'}`}
                                  style={{
                                    display: 'inline-flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    padding: '4px 10px',
                                    borderRadius: 8,
                                    whiteSpace: 'nowrap',
                                    lineHeight: 1.25,
                                  }}
                                  title={`Plus/Moins-value : ${pl >= 0 ? '+' : ''}${pl.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${pos.currency === 'EUR' ? '€' : '$'}`}
                                >
                                  <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <span>{pl >= 0 ? '↑' : '↓'}</span>
                                    <span>{pl >= 0 ? '+' : ''}{plPct.toFixed(1)}%</span>
                                  </div>
                                  <div style={{ fontSize: 11, opacity: 0.95, fontWeight: 600, marginTop: 2 }}>
                                    ({pl >= 0 ? '+' : ''}{Math.round(pl).toLocaleString('fr-FR')} {pos.currency === 'EUR' ? '€' : '$'})
                                  </div>
                                </div>
                              ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                            </td>
                            {/* 📊 Colonne : Part Actuelle / Cap Max Recommandé (%) */}
                            <td style={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 125 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                                  <strong style={{ color: currentWeightPct > maxCapPct ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                                    {currentWeightPct.toFixed(1)}%
                                  </strong>
                                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                                    / {maxCapPct.toFixed(1)}% max
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
                                      style={{ fontSize: 9, padding: '1px 5px' }}
                                      title={`Alerte sur-concentration : +${(currentWeightPct - maxCapPct).toFixed(1)}% au-dessus du plafond recommandé (${maxCapPct.toFixed(1)}% max)`}
                                    >
                                      ⚠️ +{(currentWeightPct - maxCapPct).toFixed(1)}% (Surchargé)
                                    </span>
                                  ) : currentWeightPct >= maxCapPct * 0.85 ? (
                                    <span
                                      className="badge badge-amber"
                                      style={{ fontSize: 9, padding: '1px 5px' }}
                                      title={`Proche du plafond max : ${capUsagePct.toFixed(0)}% du cap d'allocation consommé`}
                                    >
                                      ⚡ {capUsagePct.toFixed(0)}% du cap
                                    </span>
                                  ) : (
                                    <span
                                      className="badge badge-emerald"
                                      style={{ fontSize: 9, padding: '1px 5px' }}
                                      title={`Niveau optimal : ${capUsagePct.toFixed(0)}% du plafond max d'allocation`}
                                    >
                                      ✓ OK ({capUsagePct.toFixed(0)}%)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="mono" style={{ fontSize: 12 }}>{pos.monthlyDCA ? `${pos.monthlyDCA}€` : pos.annualBudget ? `${pos.annualBudget}€/an` : '—'}</td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="row-actions">
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

              {/* Thematic Exposure */}
              {positions.length > 0 && (() => {
                const calculatedThemes = THEMES.map((theme) => {
                  const themePositions = positions.filter((p) =>
                    theme.tickers.includes(p.ticker) || p.themes.includes(theme.id)
                  );
                  const themeValueEUR = themePositions.reduce((s, p) => {
                    const price = p.currentPrice || p.avgPrice;
                    const rate = (fxRates as any)[p.currency] || 1.0;
                    const posValEUR = p.quantity * price * rate;
                    const themeWeight = p.themes.length > 0 ? (1 / p.themes.length) : 1.0;
                    return s + posValEUR * themeWeight;
                  }, 0);

                  const exposure = totalValue > 0 ? (themeValueEUR / totalValue) * 100 : 0;
                  const cappedExposure = Math.min(100, Math.max(0, exposure));
                  const maxPct = Math.min(100, theme.maxExposure * 100);
                  const isOverLimit = exposure > maxPct;

                  return {
                    theme,
                    themePositions,
                    themeValueEUR,
                    exposure,
                    cappedExposure,
                    maxPct,
                    isOverLimit,
                  };
                });

                const visibleThemes = showEmptyThemes
                  ? calculatedThemes
                  : calculatedThemes.filter((t) => t.exposure > 0);

                return (
                  <div className="card" style={{ marginTop: 24 }}>
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="card-title">Exposition Thématique Transversale</span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 11, color: 'var(--accent-cyan)' }}
                          onClick={() => setShowThemeInfoModal(true)}
                          title="Voir les formules et explications des plafonds"
                        >
                          💡 Formules & Justification des Plafonds
                        </button>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: 11 }}
                        onClick={() => setShowEmptyThemes(!showEmptyThemes)}
                      >
                        {showEmptyThemes ? '🙈 Masquer thèmes à 0%' : '👁️ Afficher tous les thèmes'}
                      </button>
                    </div>

                    <div className="theme-bar-container" style={{ marginTop: 12 }}>
                      {visibleThemes.length === 0 ? (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: 16, textAlign: 'center' }}>
                          Aucune position n&apos;est actuellement exposée aux thèmes d&apos;investissement.
                        </div>
                      ) : (
                        visibleThemes.map(({ theme, exposure, cappedExposure, maxPct, isOverLimit }) => (
                          <div className="theme-bar-row" key={theme.id} style={{ marginBottom: 12 }}>
                            <div style={{ width: 190, display: 'flex', flexDirection: 'column' }}>
                              <span className="theme-bar-label" style={{ fontWeight: 600 }}>{theme.label}</span>
                              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Plafond recommandé : {maxPct}%</span>
                            </div>
                            <div className="theme-bar-track">
                              <div
                                className="theme-bar-fill"
                                style={{
                                  width: `${cappedExposure}%`,
                                  background: isOverLimit ? 'var(--accent-rose)' : undefined,
                                }}
                              />
                              {maxPct < 100 && (
                                <div className="theme-bar-limit" style={{ left: `${maxPct}%` }} title={`Plafond : ${maxPct}%`} />
                              )}
                            </div>
                            <span className="theme-bar-value" style={{ color: isOverLimit ? 'var(--accent-rose)' : undefined, minWidth: 60, textAlign: 'right', fontWeight: 700 }}>
                              {exposure.toFixed(1)}%
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}
            </>
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
              {/* Parametric VaR Card */}
              {(() => {
                const metrics = calculatePortfolioRiskMetrics(positions, fxRates);
                return (
                  <div className="card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <span className="card-title">⚡ Métriques de Risque Paramétrique &amp; Volatilité</span>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          Analyse statistique de la résilience de votre portefeuille face aux fluctuations de marché.
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: 'var(--accent-cyan)' }} onClick={() => openGlossary('var')}>
                          💡 Explication des Risques
                        </button>
                        <span className="badge badge-cyan" style={{ fontSize: 12, padding: '4px 10px' }}>
                          Score Diversification : {metrics.diversificationScore}/100
                        </span>
                      </div>
                    </div>

                    <div className="grid-4" style={{ marginBottom: 8, marginTop: 12, gap: 16 }}>
                      <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Volatilité Annuelle</span>
                          <span style={{ fontSize: 14 }}>📉</span>
                        </div>
                        <strong className="mono" style={{ fontSize: 22, color: 'var(--accent-amber)', display: 'block', margin: '4px 0' }}>{metrics.annualVolatility}%</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                          Amplitude moyenne des cours. 19% correspond à un profil dynamique équilibré.
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>VaR 95% (Choc Normal)</span>
                          <span style={{ fontSize: 14 }}>🛡️</span>
                        </div>
                        <strong className="mono" style={{ fontSize: 22, color: 'var(--accent-rose)', display: 'block', margin: '4px 0' }}>-{metrics.var95EUR.toLocaleString('fr-FR')} €</strong>
                        <div style={{ fontSize: 11, color: 'var(--accent-rose)', fontWeight: 600 }}>-{metrics.var95Percent}% de perte max</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.3 }}>
                          Pertes maximales estimées dans 95% des scénarios de marché normaux (1 an).
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>VaR 99% (Krach 1%)</span>
                          <span style={{ fontSize: 14 }}>⚡</span>
                        </div>
                        <strong className="mono" style={{ fontSize: 22, color: 'var(--accent-rose)', display: 'block', margin: '4px 0' }}>-{metrics.var99EUR.toLocaleString('fr-FR')} €</strong>
                        <div style={{ fontSize: 11, color: 'var(--accent-rose)', fontWeight: 600 }}>-{metrics.var99Percent}% de perte max</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.3 }}>
                          Choc extrême estimé lors du pire 1% des crises financières historiques.
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Ratio de Sharpe Estimé</span>
                          <span style={{ fontSize: 14 }}>⚖️</span>
                        </div>
                        <strong className="mono" style={{ fontSize: 22, color: 'var(--accent-emerald)', display: 'block', margin: '4px 0' }}>{metrics.estimatedSharpeRatio}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                          Rendement obtenu par unité de risque pris (&gt; 0.3 = rendement positif).
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="card">
                <div className="card-header">
                  <span className="card-title">Stress Tests &amp; Simulation de Crises Historiques</span>
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
                    <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>Perte Estimée sur le Portefeuille</span>
                      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-rose)', fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
                        {selectedStressResult.portfolioLoss.toLocaleString('fr-FR')} €
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Montant nominal déprécié</div>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>Coût Estimé de Rééquilibrage</span>
                      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
                        {Math.round(selectedStressResult.rebalanceCostEstimate).toLocaleString('fr-FR')} €
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Frais et frottements d&apos;arbitrage</div>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>Impact sur vos Objectifs</span>
                      <div style={{ fontSize: 13, color: 'var(--accent-amber)', fontWeight: 600, marginTop: 6 }}>
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
                              Impact Détail par Actif ({displayAssets.length} titres)
                            </h4>
                            {proxyCount > 0 && (
                              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                                💡 {proxyCount} actif(s) créés après ce krach sont modélisés par leur indice sectoriel proxy.
                              </div>
                            )}
                          </div>

                          {proxyCount > 0 && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: 11 }}
                              onClick={() => setHideProxyAssets(!hideProxyAssets)}
                            >
                              {hideProxyAssets ? '👁️ Afficher tous les actifs (avec Proxies)' : '🔒 Masquer les actifs créés après la crise'}
                            </button>
                          )}
                        </div>

                        {displayAssets.map((asset, i) => (
                          <div key={i} className="theme-bar-row" style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                            <div style={{ width: 220, display: 'flex', flexDirection: 'column' }}>
                              <AssetBadge ticker={asset.ticker} name={asset.name} showTicker={false} />
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{asset.ticker}</span>
                                {asset.isProxySimulated && (
                                  <button
                                    type="button"
                                    className="badge badge-amber"
                                    style={{ fontSize: 9, padding: '1px 6px', cursor: 'pointer', border: '1px solid rgba(245, 158, 11, 0.4)' }}
                                    onClick={() => setActiveProxyModalAsset(asset)}
                                    title="Cliquer pour voir l'explication de la simulation par proxy"
                                  >
                                    🔒 Simulé via Proxy ({asset.inceptionYear}) 💡
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="stress-bar" style={{ flex: 1 }}>
                              <div
                                className={`stress-bar-fill ${Math.abs(asset.contributionPercent) > 5 ? 'high' : Math.abs(asset.contributionPercent) > 2 ? 'medium' : 'low'}`}
                                style={{
                                  width: `${Math.min(Math.abs(asset.contributionPercent) * 3, 100)}%`,
                                  opacity: asset.isProxySimulated ? 0.75 : 1.0,
                                }}
                              />
                            </div>
                            <span style={{ width: 70, textAlign: 'right', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, color: asset.contribution < 0 ? 'var(--accent-rose)' : 'var(--text-secondary)' }}>
                              {asset.contributionPercent.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* 🎯 NOUVELLE ARCHITECTURE DES RECOMMANDATIONS ET ACTIONS DE GOUVERNANCE CONCRÈTES 1-CLICK */}
                  {selectedStressResult.governanceActions.length > 0 && (
                    <div style={{ marginTop: 24, padding: 20, background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(6, 182, 212, 0.08))', border: '1px solid var(--accent-amber)', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 24 }}>🛡️</span>
                          <div>
                            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-amber)', margin: 0 }}>
                              Plan d&apos;Action &amp; Décisions Stratégiques Anti-Crise
                            </h4>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                              Recommandations d&apos;arbitrage concrètes dérivées du comportement de votre portefeuille
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span className="badge badge-amber" style={{ fontSize: 10 }}>Moteur de Risque Paramétrique</span>
                          <span className="badge badge-cyan" style={{ fontSize: 10 }}>Gemini 3.5 Lite / 3.6 Flash</span>
                        </div>
                      </div>

                      {/* CARTES D'ACTIONS CONCRÈTES 1-CLICK */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {selectedStressResult.actionableGovernancePlans?.map((plan) => (
                          <div
                            key={plan.id}
                            style={{
                              background: 'var(--bg-tertiary)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-subtle)',
                              padding: 16,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 10,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <strong style={{ fontSize: 14, color: 'var(--accent-cyan)' }}>🎯 {plan.title}</strong>
                              <span className="badge badge-amber" style={{ fontSize: 10 }}>Action Recommandée</span>
                            </div>

                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                              <strong>Constat :</strong> {plan.diagnostic}
                            </p>
                            <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                              <strong>Solution :</strong> {plan.concreteAction}
                            </p>

                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{
                                alignSelf: 'flex-start',
                                marginTop: 6,
                                padding: '8px 16px',
                                fontSize: 12,
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan))',
                              }}
                              onClick={async () => {
                                if (plan.actionType === 'UPDATE_TARGET_WEIGHT' && plan.targetTicker && plan.targetValue) {
                                  const targetPos = positions.find((p) => p.ticker.toUpperCase() === plan.targetTicker?.toUpperCase());
                                  if (targetPos) {
                                    await updatePosition({
                                      ...targetPos,
                                      targetWeight: plan.targetValue,
                                      updatedAt: Date.now(),
                                    });
                                    showToast(`🎉 Poids cible de ${targetPos.name} ajusté à ${(plan.targetValue * 100).toFixed(1)}% avec succès !`);
                                  }
                                } else if (plan.actionType === 'INCREASE_DCA' && plan.targetTicker && plan.targetValue) {
                                  const acwiPos = positions.find((p) => p.ticker.includes('GPEA') || p.ticker.includes('CW8') || p.name.toLowerCase().includes('acwi'));
                                  if (acwiPos) {
                                    await updatePosition({
                                      ...acwiPos,
                                      monthlyDCA: (acwiPos.monthlyDCA || 0) + plan.targetValue,
                                      updatedAt: Date.now(),
                                    });
                                    showToast(`🎉 Versment DCA mensuel sur ${acwiPos.name} augmenté à ${(acwiPos.monthlyDCA || 0) + plan.targetValue} €/mois !`);
                                  }
                                } else if (plan.actionType === 'CAP_CTO_BUDGET' && plan.targetValue) {
                                  await updateConfig({
                                    ...(config || {}),
                                    annualCTOBudget: plan.targetValue,
                                  } as any);
                                  showToast(`🎉 Budget annuel CTO plafonné à ${plan.targetValue} €/an dans la configuration RIANE !`);
                                }
                              }}
                            >
                              {plan.buttonLabel}
                            </button>
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
            />
          )}
        </div>
      </main>
      {/* ═══ MODALS ═══ */}
      {editingPosition && (
        <PositionEditor
          position={editingPosition === 'new' ? null : editingPosition}
          onSave={handleSavePosition}
          onClose={() => setEditingPosition(null)}
          onDelete={editingPosition !== 'new' ? handleDeletePosition : undefined}
        />
      )}

      {showConfigEditor && config && (
        <ConfigEditor
          config={config}
          investorProfile={investorProfile}
          onSave={handleSaveConfig}
          onSyncProfile={updateInvestorProfile}
          onClose={() => setShowConfigEditor(false)}
        />
      )}

      {/* Smart Flow Rebalancer Modal */}
      {showFlowRebalanceModal && flowRebalanceResult && (
        <div className="modal-overlay" onClick={() => setShowFlowRebalanceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2>🎯 Moteur de Rééquilibrage du Portefeuille</h2>
              <button className="modal-close-btn" onClick={() => setShowFlowRebalanceModal(false)} type="button" aria-label="Fermer">✕</button>
            </div>

            {/* Mode Switcher Tabs */}
            <div style={{ display: 'flex', gap: 6, margin: '12px 0', background: 'var(--bg-secondary)', padding: 4, borderRadius: 'var(--radius-sm)' }}>
              <button
                type="button"
                className={`btn btn-sm ${rebalanceTab === 'dca' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setRebalanceTab('dca')}
                style={{ flex: 1, fontSize: 12, fontWeight: 700 }}
              >
                🎯 DCA Mensuel (Achats Seuls)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${rebalanceTab === 'active' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setRebalanceTab('active')}
                style={{ flex: 1, fontSize: 12, fontWeight: 700, background: rebalanceTab === 'active' ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' : undefined }}
              >
                ⚖️ Allègements & Ventes (Rééquilibrage Actif)
              </button>
            </div>

            {rebalanceTab === 'dca' ? (
              <>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Ce mode affecte votre versement mensuel ({flowRebalanceResult.totalDCA} €) pour résorber vos sous-pondérations <strong>sans vendre aucun actif</strong> (zéro frottement fiscal).
                </p>

                <div style={{ maxHeight: '45vh', overflowY: 'auto', paddingRight: 6, display: 'flex', flexDirection: 'column', gap: 10, margin: '10px 0 14px 0' }}>
                  {flowRebalanceResult.instructions.map((inst) => (
                    <div key={inst.positionId} style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 10, border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{inst.name} ({inst.ticker})</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Poids actuel : {inst.currentWeight}% → Cible : {inst.targetWeight}% (Écart : {inst.weightGap > 0 ? '+' : ''}{inst.weightGap}%)
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        {inst.recommendedShares > 0 ? (
                          <>
                            <span className="badge badge-emerald" style={{ fontSize: 13, padding: '4px 10px', fontWeight: 700 }}>
                              Acheter +{inst.recommendedShares} part{inst.recommendedShares > 1 ? 's' : ''} ({inst.recommendedCost} €)
                            </span>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                              Nouveau poids : {inst.newWeightAfter}%
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
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Reliquat non investi (trésorerie)</span>
                  <strong className="mono" style={{ color: 'var(--accent-amber)' }}>{flowRebalanceResult.uninvestedCash} €</strong>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button className="btn btn-secondary" onClick={() => setShowFlowRebalanceModal(false)}>Annuler</button>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '10px 18px', fontSize: 13, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)', fontWeight: 700 }}
                    onClick={async () => {
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
                      clearAnalysisCache();
                      setReadNotificationIds(notifications.map((n) => n.id));
                      showToast(`✅ Rebalancement DCA appliqué avec succès (+${appliedCount} positions ajustées)`);
                      setShowFlowRebalanceModal(false);
                    }}
                  >
                    ⚡ APPLIQUER LES ACHATS AU PORTEFEUILLE
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Ce mode calcule les <strong>ventes d&apos;allègement (lignes sur-concentrées)</strong> et les <strong>achats de réalignement</strong> pour ramener votre portefeuille exactement sur ses cibles.
                </p>

                <div style={{ maxHeight: '45vh', overflowY: 'auto', paddingRight: 6, display: 'flex', flexDirection: 'column', gap: 10, margin: '10px 0 14px 0' }}>
                  {activeRebalanceResult?.instructions.map((inst) => (
                    <div key={inst.positionId} style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 10, border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{inst.name} ({inst.ticker})</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Poids actuel : {inst.currentWeight}% → Cible : {inst.targetWeight}% (Écart : {inst.weightGap > 0 ? '+' : ''}{inst.weightGap}%)
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        {inst.action === 'SELL' ? (
                          <>
                            <span className="badge badge-rose" style={{ fontSize: 13, padding: '4px 10px', fontWeight: 700, background: 'rgba(244, 63, 94, 0.2)', color: 'var(--accent-rose)' }}>
                              🔻 Vendre {Math.abs(inst.deltaShares)} part{Math.abs(inst.deltaShares) > 1 ? 's' : ''} ({inst.deltaCostEUR.toLocaleString('fr-FR')} €)
                            </span>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                              Nouveau poids : {inst.newWeightAfter}%
                            </div>
                          </>
                        ) : inst.action === 'BUY' ? (
                          <>
                            <span className="badge badge-emerald" style={{ fontSize: 13, padding: '4px 10px', fontWeight: 700 }}>
                              🟢 Acheter +{inst.deltaShares} part{inst.deltaShares > 1 ? 's' : ''} ({inst.deltaCostEUR.toLocaleString('fr-FR')} €)
                            </span>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                              Nouveau poids : {inst.newWeightAfter}%
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
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Cash débloqué par les ventes</span>
                  <strong className="mono" style={{ color: 'var(--accent-emerald)' }}>+{activeRebalanceResult?.totalCashFreedEUR.toLocaleString('fr-FR')} €</strong>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button className="btn btn-secondary" onClick={() => setShowFlowRebalanceModal(false)}>Annuler</button>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '10px 18px', fontSize: 13, background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', boxShadow: '0 4px 14px rgba(244, 63, 94, 0.4)', fontWeight: 700 }}
                    onClick={async () => {
                      if (!activeRebalanceResult) return;
                      let appliedCount = 0;
                      for (const inst of activeRebalanceResult.instructions) {
                        if (inst.deltaShares !== 0) {
                          const pos = positions.find((p) => p.id === inst.positionId);
                          if (pos) {
                            const newQty = Math.max(0, pos.quantity + inst.deltaShares);
                            const effectivePrice = inst.deltaCostEUR ? Math.abs(inst.deltaCostEUR / (inst.deltaShares || 1)) : (pos.currentPrice || pos.avgPrice || 10);
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
                      clearAnalysisCache();
                      setReadNotificationIds(notifications.map((n) => n.id));
                      showToast(`✅ Rééquilibrage actif appliqué (+${appliedCount} positions ajustées)`);
                      setShowFlowRebalanceModal(false);
                    }}
                  >
                    ⚡ APPLIQUER LE RÉÉQUILIBRAGE ACTIF (VENTES & ACHATS)
                  </button>
                </div>
              </>
            )}
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
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>Adresse Email</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{user.email}</div>
              </div>

              <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>Identifiant Unique (UID)</div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user.uid}</div>
              </div>

              <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Fournisseur d&apos;Accès</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{user.providerData[0]?.providerId === 'google.com' ? 'Google OAuth 2.0' : 'Email / Mot de passe'}</div>
                </div>
                <span style={{ fontSize: 20 }}>🛡️</span>
              </div>
            </div>

            {/* Investor Profile Card */}
            {investorProfile && investorProfile.onboardingCompleted && (
              <div style={{ padding: 14, background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)', borderRadius: 10, border: '1px solid var(--border-medium)', marginTop: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>Profil Investisseur</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Risque</span>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {investorProfile.riskProfile === 'conservative' ? '🛡️ Conservateur' : investorProfile.riskProfile === 'balanced' ? '⚖️ Équilibré' : investorProfile.riskProfile === 'dynamic' ? '🚀 Dynamique' : '⚡ Agressif'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Horizon</span>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>⏳ {investorProfile.horizonYears} ans</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Objectif</span>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {investorProfile.objective === 'wealth-building' ? '🏗️ Patrimoine' : investorProfile.objective === 'passive-income' ? '💰 Revenus' : investorProfile.objective === 'financial-independence' ? '🏝️ Indépendance' : '🎯 Spéculation'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Drawdown max</span>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>📉 -{(investorProfile.maxDrawdownTolerance * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            )}

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

      {/* 💡 Modal Justification Thématiques */}
      {showThemeInfoModal && (
        <div className="modal-overlay" onClick={() => setShowThemeInfoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h2>💡 Calcul & Justifications des Plafonds Thématiques</h2>
              <button className="modal-close-btn" onClick={() => setShowThemeInfoModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)' }}>
              <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ color: 'var(--accent-cyan)', margin: '0 0 6px 0', fontSize: 15 }}>📊 Formule de Calcul Rigoureuse en Temps Réel</h4>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                  L&apos;exposition de chaque thème est calculée dynamiquement à partir des cours en direct Yahoo Finance :
                </p>
                <div className="mono" style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6, marginTop: 8, fontSize: 13, color: 'var(--accent-emerald)' }}>
                  Exposition (%) = ( Σ (Quantité × Prix Actuel € × Poids Thématique) / Valeur Totale du Portefeuille € ) × 100
                </div>
              </div>

              <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ color: 'var(--accent-amber)', margin: '0 0 6px 0', fontSize: 15 }}>🛡️ Justification des Plafonds Maximaux par Thème</h4>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                  Les plafonds rouges ne sont pas arbitraires : ils découlent de la <strong>Théorie Moderne du Portefeuille (Markowitz)</strong> et du contrôle du risque de sur-concentration sectorielle :
                </p>
                <ul style={{ paddingLeft: 18, marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <li style={{ marginBottom: 4 }}><strong>IA et Data Centers (45% max)</strong> : Évite une dépendance excessive à la bulle technologique et aux puces d&apos;IA.</li>
                  <li style={{ marginBottom: 4 }}><strong>Photonique (15% max)</strong> : Niche technologique (capteurs/lasers) à haute volatilité, plafonnée à 15% pour protéger le capital.</li>
                  <li style={{ marginBottom: 4 }}><strong>Small Caps Européennes (25% max)</strong> : Risque d&apos;illiquidité sur les petites capitalisations continentales.</li>
                  <li style={{ marginBottom: 4 }}><strong>Défense / Énergie (10-15% max)</strong> : Secteurs cycliques et réglementés à maîtriser.</li>
                </ul>
              </div>

              <div style={{ padding: 12, background: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-cyan)' }}>
                <span style={{ fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  ⚡ Mise à Jour Dynamique : Ces taux sont re-calculés automatiquement en temps réel à chaque seconde selon la fluctuation des cours de bourse et vos arbitrages DCA.
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
    </div>
  );
}

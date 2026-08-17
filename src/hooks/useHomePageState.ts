'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { onAuthChange } from '@/services/firebase/auth';
import type { Position, PortfolioConfig, InvestorProfile } from '@/types/portfolio';
import type { PageView } from '@/types/navigation';
import { computeDcaBreakdown } from '@/utils/dcaBreakdown';
import { useGlobalKeyboardShortcuts } from './useGlobalKeyboardShortcuts';
import { useTrueLayerDeepLink } from './useTrueLayerDeepLink';
import { useHomeModalsState } from './home/useHomeModalsState';
import { useHomeNotifications } from './home/useHomeNotifications';
import { useHomeDcaRunner } from './home/useHomeDcaRunner';

export interface UseHomePageStateParams {
  positions: Position[];
  fxRates: Record<string, number>;
  config: PortfolioConfig | null;
  investorProfile: InvestorProfile | null;
  canUndo: boolean;
  canRedo: boolean;
  saving: boolean;
  undoLastAction: () => Promise<boolean>;
  redoLastAction: () => Promise<boolean>;
  updatePosition: (pos: Position, customReason?: string) => Promise<void>;
  analysisResult: any;
  analysisStatus: any;
  isAnalysisRunning: boolean;
}

export function useHomePageState(params: UseHomePageStateParams) {
  const {
    positions,
    fxRates,
    config,
    investorProfile,
    canUndo,
    canRedo,
    saving,
    undoLastAction,
    redoLastAction,
    updatePosition,
    analysisResult,
    analysisStatus,
    isAnalysisRunning,
  } = params;

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<PageView>('dashboard');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const cleanMessage = message.replace(/^[✅❌]\s*/, '');
    setToast({ message: cleanMessage, type });
  }, []);

  const modalsState = useHomeModalsState();
  const { setGlossaryInitialTerm, setShowGlossaryModal, setAutoOpenBudgetWizard } = modalsState;

  const openGlossary = useCallback((term?: string) => {
    setGlossaryInitialTerm(term);
    setShowGlossaryModal(true);
  }, [setGlossaryInitialTerm, setShowGlossaryModal]);

  const dcaRunner = useHomeDcaRunner({
    positions,
    updatePosition,
    showToast,
  });
  const { setDcaGlobalStartDate } = dcaRunner;

  // Sync TrueLayer deep-links & OAuth callbacks
  useTrueLayerDeepLink({
    setDcaGlobalStartDate,
    setCurrentView,
    setAutoOpenBudgetWizard,
    showToast,
  });

  // Global Ctrl+Z (Undo) / Ctrl+Y (Redo) Shortcuts
  useGlobalKeyboardShortcuts({
    canUndo,
    canRedo,
    saving,
    undoLastAction,
    redoLastAction,
    setToast,
  });

  const notificationsState = useHomeNotifications({
    positions,
    fxRates,
    config,
    investorProfile,
    showToast,
  });

  const dcaBreakdown = useMemo(() => computeDcaBreakdown(positions), [positions]);

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
    if (analysisResult?.synthesis || analysisResult?.marketData || analysisStatus === 'synthesis' || !isAnalysisRunning) {
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
  }, [analysisResult?.synthesis, analysisResult?.marketData, analysisStatus, isAnalysisRunning, scrollToBottom]);

  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  return {
    user,
    setUser,
    authLoading,
    currentView,
    setCurrentView,
    toast,
    setToast,
    showToast,
    openGlossary,
    dcaBreakdown,
    ...modalsState,
    ...dcaRunner,
    ...notificationsState,
  };
}

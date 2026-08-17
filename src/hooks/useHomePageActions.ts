'use client';

import React from 'react';
import type { Position, PortfolioConfig } from '@/types/portfolio';
import type { PageView } from '@/types/navigation';
import type { StressTestResult } from '@/types/simulation';
import { calculateSmartFlowRebalance } from '@/engines/flowRebalancer';
import { ALL_SCENARIOS } from '@/data/stressScenarios';
import { runStressTest } from '@/engines/stressTest';

const DEFAULT_CONFIG = {
  monthlyBudget: 1000,
  annualCTOBudget: 8000,
  annualSpeculativeCap: 2000,
  riskProfile: 'dynamic' as const,
  noLeverage: true,
  rebalanceByFlows: true,
  baseCurrency: 'EUR' as const,
  horizonYears: 15,
};

interface UseHomePageActionsParams {
  user: any;
  positions: Position[];
  filledPositions: Position[];
  config: PortfolioConfig | null;
  fxRates: Record<string, number>;
  isRunning: boolean;
  queryInput: string;
  setQueryInput: (q: string) => void;
  setCurrentView: (v: PageView) => void;
  setEditingPosition: (pos: any) => void;
  setShowConfigEditor: (v: boolean) => void;
  setRebalanceBudgetMode: (mode: any) => void;
  setCustomRebalanceAmount: (amt: number) => void;
  setFlowRebalanceResult: (res: any) => void;
  setShowFlowRebalanceModal: (v: boolean) => void;
  setSelectedStressResult: (res: StressTestResult | null) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  updatePosition: (pos: Position) => Promise<void>;
  addPosition: (pos: Position) => Promise<void>;
  removePosition: (id: string) => Promise<void>;
  updateConfig: (cfg: PortfolioConfig) => Promise<void>;
  runAnalysis: (uid: string, query: string, positions: Position[], config: any, bypassCache: boolean) => void;
}

export function useHomePageActions({
  user,
  positions,
  filledPositions,
  config,
  fxRates,
  isRunning,
  queryInput,
  setQueryInput,
  setCurrentView,
  setEditingPosition,
  setShowConfigEditor,
  setRebalanceBudgetMode,
  setCustomRebalanceAmount,
  setFlowRebalanceResult,
  setShowFlowRebalanceModal,
  setSelectedStressResult,
  showToast,
  updatePosition,
  addPosition,
  removePosition,
  updateConfig,
  runAnalysis,
}: UseHomePageActionsParams) {
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
    } catch {
      showToast('Erreur de connexion', 'error');
    }
  };

  const handleSavePosition = async (pos: Position) => {
    const isExisting = positions.some((p) => p.id === pos.id || (p.envelope === pos.envelope && p.ticker === pos.ticker));
    if (isExisting) {
      await updatePosition(pos);
      showToast(`✓ ${pos.name} mis à jour instantanément`);
    } else {
      await addPosition(pos);
      showToast(`✓ ${pos.name} ajouté instantanément au portefeuille`);
    }
    setEditingPosition(null);
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

  const handleRunAnalysis = (bypassCache = false) => {
    if (!queryInput.trim() || isRunning || !user) return;
    if (positions.length === 0) {
      showToast('Ajoutez au moins une position avant de lancer une analyse', 'error');
      return;
    }
    runAnalysis(user.uid, queryInput.trim(), positions, config || DEFAULT_CONFIG, bypassCache);
    setCurrentView('analysis');
  };

  const handleDirectAnalysis = (promptText: string, bypassCache = false) => {
    if (positions.length === 0 || !user) {
      showToast('Ajoutez au moins une position avant de lancer une analyse', 'error');
      return;
    }
    setQueryInput(promptText);
    setCurrentView('analysis');
    runAnalysis(user.uid, promptText, positions, config || DEFAULT_CONFIG, bypassCache);
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

  return {
    handleTestEmail,
    handleSavePosition,
    handleDeletePosition,
    handleSaveConfig,
    handleRunAnalysis,
    handleDirectAnalysis,
    openRebalanceModal,
    handleRunStressTest,
  };
}

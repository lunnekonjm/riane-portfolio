'use client';

import { useState } from 'react';
import type { Position } from '@/types/portfolio';
import type { StressTestResult } from '@/types/simulation';
import type { FlowRebalanceResult, ActiveRebalanceResult } from '@/engines/flowRebalancer';

export function useHomeModalsState() {
  const [queryInput, setQueryInput] = useState('');
  const [selectedStressResult, setSelectedStressResult] = useState<StressTestResult | null>(null);
  const [editingPosition, setEditingPosition] = useState<Position | null | 'new' | 'new_savings' | 'new_crypto'>(null);
  const [showConfigEditor, setShowConfigEditor] = useState(false);
  const [showFlowRebalanceModal, setShowFlowRebalanceModal] = useState(false);
  const [showConfirmExecuteFlowRebalance, setShowConfirmExecuteFlowRebalance] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showConfirmSignOut, setShowConfirmSignOut] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [activeProxyModalAsset, setActiveProxyModalAsset] = useState<any | null>(null);

  const [flowRebalanceResult, setFlowRebalanceResult] = useState<FlowRebalanceResult | null>(null);
  const [activeRebalanceResult, setActiveRebalanceResult] = useState<ActiveRebalanceResult | null>(null);
  const [rebalanceTab, setRebalanceTab] = useState<'dca' | 'active'>('dca');
  const [autoOpenBudgetWizard, setAutoOpenBudgetWizard] = useState<boolean>(false);
  const [adjustInflation, setAdjustInflation] = useState<boolean>(false);
  const [inflationRate, setInflationRate] = useState<number>(0.021);

  const [showEmptyThemes, setShowEmptyThemes] = useState<boolean>(false);
  const [hideProxyAssets, setHideProxyAssets] = useState<boolean>(false);
  const [showThemeInfoModal, setShowThemeInfoModal] = useState<boolean>(false);
  const [showGlossaryModal, setShowGlossaryModal] = useState<boolean>(false);
  const [showMonteCarloModal, setShowMonteCarloModal] = useState<boolean>(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState<boolean>(false);
  const [showTransactionModal, setShowTransactionModal] = useState<boolean>(false);
  const [selectedHistoryTicker, setSelectedHistoryTicker] = useState<string | undefined>(undefined);
  const [glossaryInitialTerm, setGlossaryInitialTerm] = useState<string | undefined>(undefined);

  const [rebalanceBudgetMode, setRebalanceBudgetMode] = useState<'dca' | 'tampon' | 'extra' | 'combo' | 'custom'>('dca');
  const [customRebalanceAmount, setCustomRebalanceAmount] = useState<number>(1000);
  const [simulatedMarketDrop, setSimulatedMarketDrop] = useState<number>(0.25);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showBenchmark, setShowBenchmark] = useState(false);

  const [showDcaFrequencyDropdown, setShowDcaFrequencyDropdown] = useState<boolean>(false);
  const [showTotalValueDropdown, setShowTotalValueDropdown] = useState<boolean>(false);
  const [showTotalCostDropdown, setShowTotalCostDropdown] = useState<boolean>(false);
  const [showGainLossDropdown, setShowGainLossDropdown] = useState<boolean>(false);
  const [showNetDetailsModal, setShowNetDetailsModal] = useState<boolean>(false);

  return {
    queryInput,
    setQueryInput,
    selectedStressResult,
    setSelectedStressResult,
    editingPosition,
    setEditingPosition,
    showConfigEditor,
    setShowConfigEditor,
    showFlowRebalanceModal,
    setShowFlowRebalanceModal,
    showConfirmExecuteFlowRebalance,
    setShowConfirmExecuteFlowRebalance,
    showProfileModal,
    setShowProfileModal,
    showConfirmSignOut,
    setShowConfirmSignOut,
    showNotificationModal,
    setShowNotificationModal,
    activeProxyModalAsset,
    setActiveProxyModalAsset,
    flowRebalanceResult,
    setFlowRebalanceResult,
    activeRebalanceResult,
    setActiveRebalanceResult,
    rebalanceTab,
    setRebalanceTab,
    autoOpenBudgetWizard,
    setAutoOpenBudgetWizard,
    adjustInflation,
    setAdjustInflation,
    inflationRate,
    setInflationRate,
    showEmptyThemes,
    setShowEmptyThemes,
    hideProxyAssets,
    setHideProxyAssets,
    showThemeInfoModal,
    setShowThemeInfoModal,
    showGlossaryModal,
    setShowGlossaryModal,
    showMonteCarloModal,
    setShowMonteCarloModal,
    showIntegrationsModal,
    setShowIntegrationsModal,
    showTransactionModal,
    setShowTransactionModal,
    selectedHistoryTicker,
    setSelectedHistoryTicker,
    glossaryInitialTerm,
    setGlossaryInitialTerm,
    rebalanceBudgetMode,
    setRebalanceBudgetMode,
    customRebalanceAmount,
    setCustomRebalanceAmount,
    simulatedMarketDrop,
    setSimulatedMarketDrop,
    showEditProfile,
    setShowEditProfile,
    showBenchmark,
    setShowBenchmark,
    showDcaFrequencyDropdown,
    setShowDcaFrequencyDropdown,
    showTotalValueDropdown,
    setShowTotalValueDropdown,
    showTotalCostDropdown,
    setShowTotalCostDropdown,
    showGainLossDropdown,
    setShowGainLossDropdown,
    showNetDetailsModal,
    setShowNetDetailsModal,
  };
}

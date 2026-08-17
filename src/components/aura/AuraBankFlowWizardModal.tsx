'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type {
  TargetFlowItem,
  TemporaryExpenseItem,
  DetectedFlowCandidate,
} from '@/engines/bankingAnalyzerEngine';
import type { RuleCategoryItem } from './AuraRulesView';
import { AuraWizardHeader } from './wizard/AuraWizardHeader';
import { AuraWizardPillarsNav } from './wizard/AuraWizardPillarsNav';
import { AuraWizardSummaryBar } from './wizard/AuraWizardSummaryBar';
import { AuraWizardFlowCard } from './wizard/AuraWizardFlowCard';
import { AuraWizardUnclassifiedTab } from './wizard/AuraWizardUnclassifiedTab';
import { AuraWizardSmartInsights } from './wizard/AuraWizardSmartInsights';
import { AuraWizardFooter } from './wizard/AuraWizardFooter';
import { useAuraBankFlowWizardState } from '@/hooks/useAuraBankFlowWizardState';
import { fetchAndCacheTrueLayerTransactions, getCachedTrueLayerTransactions } from '@/services/reconciliation/truelayerTransactionFetcher';
import { recordUserWizardFeedback } from '@/services/banking/auraWizardMemoryService';

interface AuraBankFlowWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  netSalary: number;
  bankTransactions: TargetFlowItem[];
  currentSavings: RuleCategoryItem[];
  currentFixed: RuleCategoryItem[];
  currentDaily: RuleCategoryItem[];
  currentTempExpenses: TemporaryExpenseItem[];
  onApplySelection: (
    approvedCandidates: Array<{
      candidate: DetectedFlowCandidate;
      amount: number;
      isPercentage: boolean;
    }>,
    approvedTempExpenses: TemporaryExpenseItem[]
  ) => void;
  onRefreshTransactions?: () => Promise<any>;
  isSyncing?: boolean;
}

export const AuraBankFlowWizardModal: React.FC<AuraBankFlowWizardModalProps> = ({
  isOpen,
  onClose,
  netSalary: rawNetSalary,
  bankTransactions,
  currentSavings,
  currentFixed,
  currentDaily,
  currentTempExpenses,
  onApplySelection,
  onRefreshTransactions,
  isSyncing = false,
}) => {
  const [internalIsSyncing, setInternalIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    txCount: number;
    errors: string[];
    debug?: any;
    timestamp: number;
  } | null>(null);
  const [showDebugDetails, setShowDebugDetails] = useState(false);

  const effectiveIsSyncing = isSyncing || internalIsSyncing;

  // Lock body scroll when modal is open to prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      const origTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = origOverflow;
        document.body.style.touchAction = origTouchAction;
      };
    }
  }, [isOpen]);

  const {
    netSalary,
    periodDays,
    setPeriodDays,
    selectedAccount,
    setSelectedAccount,
    availableAccounts,
    activeTab,
    setActiveTab,
    targetSummary,
    detectedTempObligations,
    smartInsights,
    dismissedInsightIds,
    initialCandidates,
    candidateTxsMap,
    excludedTxIds,
    unclassifiedTxs,
    selectedIds,
    customAmounts,
    setCustomAmounts,
    isPercentageMap,
    setIsPercentageMap,
    handleTogglePercentage,
    handleChangeAmount,
    expandedTxIds,
    toggleSelect,
    handleSelectAll,
    handleDeselectAll,
    toggleExpandTx,
    toggleTxInclusion,
    removeTxFromCandidate,
    moveTxBetweenCandidates,
    assignUnclassifiedToCandidate,
    handleApplyEphemeralInsight,
    handleApplyTariffChangeInsight,
    handleApplyFixedInsight,
    handleDismissInsight,
    getEffectiveEuroForCandidate,
    getExistingRuleComparison,
    selectedCandidatesList,
    totalSelectedEuro,
    totalSelectedPercent,
    estimatedResteAVivre,
    displayedCandidates,
    learnedRulesCount,
    handleResetMemory,
  } = useAuraBankFlowWizardState({
    isOpen,
    rawNetSalary,
    bankTransactions,
    currentSavings,
    currentFixed,
    currentDaily,
    currentTempExpenses,
  });

  const handleRefreshTransactions = useCallback(async () => {
    setInternalIsSyncing(true);
    try {
      let res: any = null;
      if (onRefreshTransactions) {
        res = await onRefreshTransactions();
      } else {
        res = await fetchAndCacheTrueLayerTransactions(periodDays);
      }
      if (res) {
        setLastSyncResult({
          txCount: res.transactions ? res.transactions.length : 0,
          errors: res.partialErrors || [],
          debug: res.debug,
          timestamp: Date.now(),
        });
      }
      return res;
    } finally {
      setInternalIsSyncing(false);
    }
  }, [onRefreshTransactions, periodDays]);

  // Read cached debug info on mount
  useEffect(() => {
    if (isOpen) {
      const cached = getCachedTrueLayerTransactions();
      if (cached && cached.debug) {
        setLastSyncResult({
          txCount: cached.transactions.length,
          errors: [],
          debug: cached.debug,
          timestamp: cached.timestamp,
        });
      }
    }
  }, [isOpen]);

  // Auto-fetch if modal opens and 0 transactions are in memory
  useEffect(() => {
    if (isOpen && bankTransactions.length === 0 && !effectiveIsSyncing) {
      const hasToken = typeof window !== 'undefined' && (localStorage.getItem('truelayer_access_token') || document.cookie.includes('truelayer_access_token'));
      if (hasToken) {
        handleRefreshTransactions().catch(() => {});
      }
    }
  }, [isOpen, bankTransactions.length, effectiveIsSyncing, handleRefreshTransactions]);

  if (!isOpen) return null;

  const fmtEur = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

  const handleValidateAndApply = () => {
    const approvedList: Array<{ candidate: DetectedFlowCandidate; amount: number; isPercentage: boolean }> = [];
    const approvedTemps: TemporaryExpenseItem[] = [];

    for (const c of selectedCandidatesList) {
      const isPct = isPercentageMap[c.id] ?? c.isPercentage;
      const amt = customAmounts[c.id] !== undefined
        ? customAmounts[c.id]
        : (isPct ? c.defaultPercentage : c.detectedMonthlyAmount);

      if (c.pillar === 'TEMPORARY') {
        const foundTemp = detectedTempObligations.find((t) => c.id.includes(t.id));
        if (foundTemp) {
          approvedTemps.push({
            ...foundTemp,
            monthlyAmount: amt,
          });
        }
      } else {
        const refinedTxs = (candidateTxsMap[c.id] || c.transactions).filter((t) => !excludedTxIds.has(t.id));
        approvedList.push({
          candidate: {
            ...c,
            transactions: refinedTxs,
          },
          amount: amt,
          isPercentage: isPct,
        });
      }
    }

    // Persist user exclusions and selections into AI Learning Memory
    recordUserWizardFeedback({
      initialCandidates,
      selectedCandidateIds: selectedIds,
      candidateTxsMap,
      excludedTxIds,
      dismissedInsightIds,
      unclassifiedTxs,
    });

    onApplySelection(approvedList, approvedTemps);
    onClose();
  };

  const hasTokenInBrowser = typeof window !== 'undefined' && !!localStorage.getItem('truelayer_access_token');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(16px)',
        overscrollBehavior: 'contain',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 880,
          height: '92vh',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 22,
          background: 'linear-gradient(135deg, #0b132b 0%, #0f172a 100%)',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7), 0 0 32px rgba(6, 182, 212, 0.2)',
          overflow: 'hidden',
        }}
      >
        {/* 🌟 1. FIXED MODAL HEADER */}
        <AuraWizardHeader
          periodDays={periodDays}
          setPeriodDays={setPeriodDays}
          selectedAccount={selectedAccount}
          setSelectedAccount={setSelectedAccount}
          availableAccounts={availableAccounts}
          onClose={onClose}
          onRefresh={handleRefreshTransactions}
          isSyncing={effectiveIsSyncing}
          learnedRulesCount={learnedRulesCount}
          onResetMemory={handleResetMemory}
        />

        {/* 📊 2. FIXED LIVE SUMMARY BANNER */}
        <AuraWizardSummaryBar
          netSalary={netSalary}
          totalSelectedEuro={totalSelectedEuro}
          totalSelectedPercent={totalSelectedPercent}
          estimatedResteAVivre={estimatedResteAVivre}
          fmtEur={fmtEur}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
        />

        {/* 📜 3. MAIN SCROLLABLE INTERNAL CONTAINER */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {/* ℹ️ STATUS & DIAGNOSTIC BANNER */}
          <div
            style={{
              margin: '8px 22px 0 22px',
              padding: '12px 16px',
              borderRadius: 14,
              background: bankTransactions.length > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${bankTransactions.length > 0 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{bankTransactions.length > 0 ? '✅' : '⚠️'}</span>
                <div style={{ fontSize: 12.5, color: bankTransactions.length > 0 ? '#6ee7b7' : '#fcd34d', lineHeight: 1.4 }}>
                  <strong>
                    {bankTransactions.length > 0
                      ? `${bankTransactions.length} transactions BoursoBank actives & synchronisées.`
                      : '0 transaction BoursoBank chargée en mémoire.'}
                  </strong>
                  <span style={{ fontSize: 11.5, color: '#94a3b8', marginLeft: 8 }}>
                    (Token : {hasTokenInBrowser ? 'Présent 🔑' : 'Non détecté ❌'})
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    const exportPayload = {
                      dateExport: new Date().toISOString(),
                      compteSelectionne: selectedAccount,
                      totalTransactionsEnMemoire: bankTransactions.length,
                      transactions: bankTransactions.map(t => ({
                        date: t.date,
                        libelleBrut: t.rawTitle || t.title,
                        nomNettoye: t.title,
                        montant: t.amount,
                        compte: t.accountName || t.accountType || t.accountId,
                        categorieDetectee: t.category,
                      }))
                    };
                    navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2));
                    alert("✅ " + bankTransactions.length + " transactions copiées dans votre presse-papier ! Collez-les directement dans le chat.");
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'rgba(139, 92, 246, 0.25)',
                    border: '1px solid rgba(139, 92, 246, 0.5)',
                    color: '#c084fc',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  title="Copier toutes les transactions bancaires au format JSON pour analyse détaillée avec l'IA"
                >
                  📋 Copier pour l'IA
                </button>

                <button
                  type="button"
                  onClick={handleRefreshTransactions}
                  disabled={effectiveIsSyncing}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    border: '1px solid rgba(56, 189, 248, 0.5)',
                    color: '#ffffff',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: effectiveIsSyncing ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {effectiveIsSyncing ? '⏳ Synchro en cours...' : '🔄 Forcer la Synchro'}
                </button>

                <a
                  href="/api/integrations/truelayer/auth-url?view=revenue&open_wizard=true"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#f8fafc',
                    fontSize: 11.5,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  🏦 Reconnexion BoursoBank
                </a>

                <button
                  type="button"
                  onClick={() => setShowDebugDetails(!showDebugDetails)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#94a3b8',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {showDebugDetails ? 'Masquer Diagnostic ▲' : '🔍 Diagnostic API ▼'}
                </button>
              </div>
            </div>

            {/* EXPANDABLE DIAGNOSTIC TRACE */}
            {showDebugDetails && (
              <div
                style={{
                  marginTop: 6,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(10, 14, 23, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: 11.5,
                  color: '#cbd5e1',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {lastSyncResult && (
                  <>
                    <div>
                      <strong>Dernière requête API :</strong> {new Date(lastSyncResult.timestamp).toLocaleTimeString('fr-FR')}
                    </div>
                    <div>
                      <strong>Transactions brutes :</strong> {lastSyncResult.txCount}
                    </div>
                    {lastSyncResult.debug && (
                      <>
                        <div><strong>Comptes bancaires détectés :</strong> {lastSyncResult.debug.accountsCount}</div>
                        <div><strong>Cartes bancaires détectées :</strong> {lastSyncResult.debug.cardsCount}</div>
                        {lastSyncResult.debug.accountsDetails && lastSyncResult.debug.accountsDetails.length > 0 && (
                          <div>
                            <strong>Détail comptes :</strong>{' '}
                            {lastSyncResult.debug.accountsDetails.map((a: any) => `${a.name} (${a.type || 'compte'})`).join(', ')}
                          </div>
                        )}
                      </>
                    )}
                    {lastSyncResult.errors.length > 0 && (
                      <div style={{ color: 'var(--accent-rose)' }}>
                        <strong>Messages/Erreurs TrueLayer :</strong> {lastSyncResult.errors.join(' | ')}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* 🧠 MULTI-MONTH AI PATTERN INSIGHTS */}
          <AuraWizardSmartInsights
            insights={smartInsights}
            onApplyEphemeral={handleApplyEphemeralInsight}
            onApplyTariffChange={handleApplyTariffChangeInsight}
            onApplyFixed={handleApplyFixedInsight}
            onDismiss={handleDismissInsight}
            fmtEur={fmtEur}
          />

          {/* 🏷️ STICKY PILLAR TABS (sticks to top of scroll area) */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 30,
              background: '#0b132b',
              paddingTop: 8,
              paddingBottom: 4,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            }}
          >
            <AuraWizardPillarsNav
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              initialCandidatesCount={initialCandidates.length}
              detectedTempObligationsCount={detectedTempObligations.length}
              unclassifiedTxsCount={unclassifiedTxs.length}
            />
          </div>

          {/* 📜 CANDIDATES LIST / UNCLASSIFIED LIST */}
          <div
            style={{
              padding: '8px 22px 20px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {/* TAB 1 TO 5: CANDIDATES */}
            {activeTab !== 'UNCLASSIFIED' && displayedCandidates.map((cand) => {
              const isSelected = selectedIds.has(cand.id);
              const isExpanded = expandedTxIds.has(cand.id);
              const isPct = isPercentageMap[cand.id] ?? cand.isPercentage;

              const txList = candidateTxsMap[cand.id] || cand.transactions;
              const activeTxs = txList.filter((t) => !excludedTxIds.has(t.id));
              const calculatedSum = activeTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0) / (periodDays > 0 ? periodDays / 30.4375 : 1);

              const currentVal = customAmounts[cand.id] !== undefined
                ? customAmounts[cand.id]
                : (isPct ? (netSalary > 0 ? Math.round((calculatedSum / netSalary) * 100 * 10) / 10 : cand.defaultPercentage) : Math.round(calculatedSum * 100) / 100);

              const effectiveEuro = getEffectiveEuroForCandidate(cand);
              const comparison = getExistingRuleComparison(cand);
              const deltaEuro = comparison ? effectiveEuro - comparison.ruleEuro : 0;
              const isAligned = comparison ? Math.abs(deltaEuro) < 1.0 : false;

              return (
                <AuraWizardFlowCard
                  key={cand.id}
                  cand={cand}
                  isSelected={isSelected}
                  isExpanded={isExpanded}
                  isPct={isPct}
                  txList={txList}
                  excludedTxIds={excludedTxIds}
                  currentVal={currentVal}
                  effectiveEuro={effectiveEuro}
                  comparison={comparison}
                  deltaEuro={deltaEuro}
                  isAligned={isAligned}
                  netSalary={netSalary}
                  periodLabel={targetSummary?.periodLabel || '30 jours'}
                  onToggleSelect={toggleSelect}
                  onToggleExpand={toggleExpandTx}
                  onTogglePercentage={handleTogglePercentage}
                  onChangeAmount={handleChangeAmount}
                  onToggleTxInclusion={toggleTxInclusion}
                  onRemoveTx={(candId, tx) => removeTxFromCandidate(candId, tx)}
                  onMoveTx={(tx, fromId, toId) => moveTxBetweenCandidates(tx, fromId, toId)}
                  fmtEur={fmtEur}
                />
              );
            })}

            {/* TAB 6: UNCLASSIFIED TRANSACTIONS */}
            {activeTab === 'UNCLASSIFIED' && (
              <AuraWizardUnclassifiedTab
                unclassifiedTxs={unclassifiedTxs}
                fmtEur={fmtEur}
                onAssignToCandidate={(tx, candidateId) => assignUnclassifiedToCandidate(tx, candidateId)}
              />
            )}
          </div>
        </div>

        {/* 🏁 4. FIXED MODAL FOOTER */}
        <AuraWizardFooter
          selectedCount={selectedCandidatesList.length}
          totalSelectedEuro={totalSelectedEuro}
          totalSelectedPercent={totalSelectedPercent}
          fmtEur={fmtEur}
          onClose={onClose}
          onValidateAndApply={handleValidateAndApply}
        />
      </div>
    </div>
  );
};

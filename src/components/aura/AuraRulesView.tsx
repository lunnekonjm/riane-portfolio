'use client';

import React, { useState, useEffect } from 'react';
import { useAuraRulesState } from '@/hooks/useAuraRulesState';
import { useAuraRulesActions } from '@/hooks/useAuraRulesActions';
import { useAuraTargetRows } from '@/hooks/useAuraTargetRows';
import { AuraRulesModalsContainer } from './modals/AuraRulesModalsContainer';
import { AuraTargetFlowsSection } from './sections/AuraTargetFlowsSection';
import { AuraPredictiveHorizonSection } from './sections/AuraPredictiveHorizonSection';
import { AuraTemporaryExpensesSection } from './sections/AuraTemporaryExpensesSection';
import { AuraPillarsRulesSection } from './sections/AuraPillarsRulesSection';
import { AuraRulesNoticeHeader } from './AuraRulesNoticeHeader';
import { renderCategoryIcon } from './auraIconUtils';
import type { RuleCategoryItem, BudgetAuditLogEntry } from '@/types/auraRules';

export type { RuleCategoryItem, BudgetAuditLogEntry };

interface AuraRulesViewProps {
  netSalary?: number;
  autoOpenWizard?: boolean;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
  onSyncBank?: () => Promise<void> | Promise<boolean>;
}

export const AuraRulesView: React.FC<AuraRulesViewProps> = ({
  netSalary = 2713.74,
  autoOpenWizard = false,
  onShowToast,
  onSyncBank,
}) => {
  const [isFlowWizardOpen, setIsFlowWizardOpen] = useState<boolean>(false);

  useEffect(() => {
    if (autoOpenWizard) {
      setIsFlowWizardOpen(true);
    }
  }, [autoOpenWizard]);

  const {
    savingsCategories,
    setSavingsCategories,
    fixedCategories,
    setFixedCategories,
    dailyCategories,
    setDailyCategories,
    temporaryExpenses,
    setTemporaryExpenses,
    accountBalance,
    setAccountBalance,
    bufferMultiplier,
    setBufferMultiplier,
    selectedForecastOffset,
    setSelectedForecastOffset,
    selectedTargetPeriodDays,
    setSelectedTargetPeriodDays,
    auditLogs,
    setAuditLogs,
    bankTransactions,
    targetSummary,
    selectedPeriod,
    selectedDate,
    selectedMonthLong,
    monthsShortFr,
    activeTempExpensesForSelectedPeriod,
    activeTempMonthlyTotal,
    getEffectiveAmount,
    getEffectivePercent,
    totalSavings,
    baseFixed,
    totalFixed,
    totalDaily,
    resteAVivre,
    seuilSecurite,
    getDateForOffset,
    getPeriodForOffset,
    logBudgetChange,
  } = useAuraRulesState(netSalary);

  const {
    activeModal,
    setActiveModal,
    selectedFlowModalCat,
    setSelectedFlowModalCat,
    editingTempExpense,
    setEditingTempExpense,
    editingCategory,
    editingCategoryPillar,
    openCategoryEditor,
    handleResetInitial,
    handleClearAllRules,
    handleAdjustSingleFlow,
    handleRollbackAudit,
    handleApplyFlowWizardSelection,
  } = useAuraRulesActions({
    netSalary,
    savingsCategories,
    setSavingsCategories,
    fixedCategories,
    setFixedCategories,
    dailyCategories,
    setDailyCategories,
    temporaryExpenses,
    setTemporaryExpenses,
    logBudgetChange,
    getEffectiveAmount,
    periodLabel: targetSummary.periodLabel,
    onShowToast,
  });

  const targetRows = useAuraTargetRows(
    targetSummary,
    savingsCategories,
    fixedCategories,
    dailyCategories
  );

  const [arbitragePeaAmount, setArbitragePeaAmount] = useState<number>(() => {
    const c = savingsCategories.find((s) => (s?.name || '').toUpperCase().includes('PEA'));
    return c ? (c.isPercentage ? (netSalary * c.amount) / 100 : c.amount) : 950;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 🟣 NOTICE HEADER BANNER */}
      <AuraRulesNoticeHeader
        netSalary={netSalary}
        auditLogsCount={auditLogs.length}
        onOpenAudit={() => setActiveModal('AUDIT_HISTORY')}
      />

      {/* 🎯 SECTION 1: FLUX RÉELS BANCAIRES VS CIBLES DE RÉPARTITION */}
      <AuraTargetFlowsSection
        netSalary={netSalary}
        selectedTargetPeriodDays={selectedTargetPeriodDays}
        setSelectedTargetPeriodDays={setSelectedTargetPeriodDays}
        targetSummary={targetSummary}
        targetRows={targetRows}
        getEffectiveAmount={getEffectiveAmount}
        onOpenFlowTransactions={(flow) => {
          setSelectedFlowModalCat(flow);
          setActiveModal('FLOW_TRANSACTIONS');
        }}
        onAdjustSingleFlow={handleAdjustSingleFlow}
        onOpenWizard={() => setIsFlowWizardOpen(true)}
        onResetInitial={handleResetInitial}
        onOpenGlobalReset={() => setActiveModal('GLOBAL_RESET')}
      />

      {/* 📈 SECTION 2: HORIZON PRÉVISIONNEL & SIMULATION */}
      <AuraPredictiveHorizonSection
        netSalary={netSalary}
        totalFixed={totalFixed}
        totalSavings={totalSavings}
        totalDaily={totalDaily}
        resteAVivre={resteAVivre}
        accountBalance={accountBalance}
        bufferMultiplier={bufferMultiplier}
        seuilSecurite={seuilSecurite}
        selectedForecastOffset={selectedForecastOffset}
        setSelectedForecastOffset={setSelectedForecastOffset}
        temporaryExpenses={temporaryExpenses}
        getDateForOffset={getDateForOffset}
        getPeriodForOffset={getPeriodForOffset}
        monthsShortFr={monthsShortFr}
        selectedMonthLong={selectedMonthLong}
        selectedDate={selectedDate}
        onOpenForecastMatrix={() => setActiveModal('FORECAST_MATRIX')}
        onOpenEditBufferMult={() => setActiveModal('EDIT_BUFFER_MULT')}
        onOpenArbitrage={() => setActiveModal('ARBITRAGE')}
        onOpenEditBalance={() => setActiveModal('EDIT_BALANCE')}
        onSyncBank={onSyncBank}
        onShowToast={onShowToast}
      />

      {/* 📅 SECTION 3: DÉPENSES ÉCHÉANCÉES & TEMPORAIRES */}
      <AuraTemporaryExpensesSection
        temporaryExpenses={temporaryExpenses}
        selectedPeriod={selectedPeriod}
        onAddTempExpense={() => {
          setEditingTempExpense(null);
          setActiveModal('ADD_TEMP_EXPENSE');
        }}
        onEditTempExpense={(exp) => {
          setEditingTempExpense(exp);
          setActiveModal('EDIT_TEMP_EXPENSE');
        }}
        onDeleteTempExpense={(id, label) => {
          setTemporaryExpenses((prev) => prev.filter((e) => e.id !== id));
          onShowToast?.(`Échéancier "${label}" supprimé.`, 'error');
        }}
      />

      {/* 🏛️ SECTION 4: LES 3 PILIERS DE BUDGET */}
      <AuraPillarsRulesSection
        netSalary={netSalary}
        totalSavings={totalSavings}
        totalFixed={totalFixed}
        totalDaily={totalDaily}
        savingsCategories={savingsCategories}
        fixedCategories={fixedCategories}
        dailyCategories={dailyCategories}
        setSavingsCategories={setSavingsCategories}
        setFixedCategories={setFixedCategories}
        setDailyCategories={setDailyCategories}
        getEffectiveAmount={getEffectiveAmount}
        getEffectivePercent={getEffectivePercent}
        renderCategoryIcon={renderCategoryIcon}
        openCategoryEditor={openCategoryEditor}
        selectedPeriod={selectedPeriod}
        activeTempMonthlyTotal={activeTempMonthlyTotal}
        activeTempExpensesForSelectedPeriod={activeTempExpensesForSelectedPeriod}
        onShowToast={onShowToast}
      />

      {/* 🔮 MODALS POPUPS */}
      <AuraRulesModalsContainer
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        netSalary={netSalary}
        baseFixed={baseFixed}
        totalSavings={totalSavings}
        totalDaily={totalDaily}
        temporaryExpenses={temporaryExpenses}
        setTemporaryExpenses={setTemporaryExpenses}
        selectedFlowModalCat={selectedFlowModalCat}
        accountBalance={accountBalance}
        setAccountBalance={setAccountBalance}
        bufferMultiplier={bufferMultiplier}
        setBufferMultiplier={setBufferMultiplier}
        arbitragePeaAmount={arbitragePeaAmount}
        setArbitragePeaAmount={setArbitragePeaAmount}
        auditLogs={auditLogs}
        setAuditLogs={setAuditLogs}
        editingTempExpense={editingTempExpense}
        editingCategory={editingCategory}
        editingCategoryPillar={editingCategoryPillar}
        selectedPeriod={selectedPeriod}
        isFlowWizardOpen={isFlowWizardOpen}
        setIsFlowWizardOpen={setIsFlowWizardOpen}
        bankTransactions={bankTransactions}
        savingsCategories={savingsCategories}
        fixedCategories={fixedCategories}
        dailyCategories={dailyCategories}
        setSavingsCategories={setSavingsCategories}
        setFixedCategories={setFixedCategories}
        setDailyCategories={setDailyCategories}
        onRollbackAudit={handleRollbackAudit}
        onApplyArbitrage={(amount) => {
          setSavingsCategories((prev) =>
            prev.map((c) => {
              if ((c?.name || '').toUpperCase().includes('PEA')) {
                return {
                  ...c,
                  isPercentage: false,
                  amount: amount,
                };
              }
              return c;
            })
          );
          logBudgetChange({
            categoryName: 'Cible PEA',
            pillar: 'Épargne',
            actionLabel: 'Arbitrage Anti-Découvert',
            actionType: 'ARBITRAGE',
            newAmount: amount,
            effectiveDeltaEuro: amount - 950,
            note: 'Ajustement proactif pour absorption du découvert',
          });
          setActiveModal(null);
          onShowToast?.(`PEA ajusté à ${amount} € pour résorber le découvert.`, 'success');
        }}
        onResetInitial={handleResetInitial}
        onClearAllRules={handleClearAllRules}
        onApplyFlowWizardSelection={handleApplyFlowWizardSelection}
        logBudgetChange={logBudgetChange}
        onShowToast={onShowToast}
      />
    </div>
  );
};

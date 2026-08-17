'use client';

import React from 'react';
import type { TemporaryExpenseItem, TargetFlowCategory, TargetFlowItem, DetectedFlowCandidate } from '@/engines/bankingAnalyzerEngine';
import type { RuleCategoryItem, BudgetAuditLogEntry } from '../AuraRulesView';
import { ForecastMatrixModal } from './ForecastMatrixModal';
import { FlowTransactionsModal } from './FlowTransactionsModal';
import { ArbitrageModal } from './ArbitrageModal';
import { AuditHistoryModal } from './AuditHistoryModal';
import { EditBalanceModal } from './EditBalanceModal';
import { EditBufferMultModal } from './EditBufferMultModal';
import { TempExpenseModal } from './TempExpenseModal';
import { CategoryEditModal } from './CategoryEditModal';
import { GlobalResetModal } from './GlobalResetModal';
import { AuraBankFlowWizardModal } from '../AuraBankFlowWizardModal';

interface AuraRulesModalsContainerProps {
  activeModal: string | null;
  setActiveModal: (modal: any) => void;
  netSalary: number;
  baseFixed: number;
  totalSavings: number;
  totalDaily: number;
  temporaryExpenses: TemporaryExpenseItem[];
  setTemporaryExpenses: React.Dispatch<React.SetStateAction<TemporaryExpenseItem[]>>;
  selectedFlowModalCat: TargetFlowCategory | null;
  accountBalance: number;
  setAccountBalance: (val: number) => void;
  bufferMultiplier: number;
  setBufferMultiplier: (val: number) => void;
  arbitragePeaAmount: number;
  setArbitragePeaAmount: (val: number) => void;
  auditLogs: BudgetAuditLogEntry[];
  setAuditLogs: React.Dispatch<React.SetStateAction<BudgetAuditLogEntry[]>>;
  editingTempExpense: TemporaryExpenseItem | null;
  editingCategory: RuleCategoryItem | null;
  editingCategoryPillar: 'SAVINGS' | 'FIXED' | 'DAILY';
  selectedPeriod: string;
  isFlowWizardOpen: boolean;
  setIsFlowWizardOpen: (open: boolean) => void;
  bankTransactions: TargetFlowItem[];
  isSyncingTrueLayer?: boolean;
  refreshTrueLayerTransactions?: () => Promise<any>;
  savingsCategories: RuleCategoryItem[];
  fixedCategories: RuleCategoryItem[];
  dailyCategories: RuleCategoryItem[];
  setSavingsCategories: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>;
  setFixedCategories: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>;
  setDailyCategories: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>;
  onRollbackAudit: (entry: BudgetAuditLogEntry) => void;
  onApplyArbitrage: (amount: number) => void;
  onResetInitial: () => void;
  onClearAllRules: () => void;
  onApplyFlowWizardSelection: (
    approvedCandidates: Array<{
      candidate: DetectedFlowCandidate;
      amount: number;
      isPercentage: boolean;
    }>,
    approvedTempExpenses: TemporaryExpenseItem[]
  ) => void;
  logBudgetChange: (entry: Omit<BudgetAuditLogEntry, 'id' | 'timestamp'>) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

export function AuraRulesModalsContainer({
  activeModal,
  setActiveModal,
  netSalary,
  baseFixed,
  totalSavings,
  totalDaily,
  temporaryExpenses,
  setTemporaryExpenses,
  selectedFlowModalCat,
  accountBalance,
  setAccountBalance,
  bufferMultiplier,
  setBufferMultiplier,
  arbitragePeaAmount,
  setArbitragePeaAmount,
  auditLogs,
  setAuditLogs,
  editingTempExpense,
  editingCategory,
  editingCategoryPillar,
  selectedPeriod,
  isFlowWizardOpen,
  setIsFlowWizardOpen,
  bankTransactions,
  isSyncingTrueLayer,
  refreshTrueLayerTransactions,
  savingsCategories,
  fixedCategories,
  dailyCategories,
  setSavingsCategories,
  setFixedCategories,
  setDailyCategories,
  onRollbackAudit,
  onApplyArbitrage,
  onResetInitial,
  onClearAllRules,
  onApplyFlowWizardSelection,
  logBudgetChange,
  onShowToast,
}: AuraRulesModalsContainerProps) {
  return (
    <>
      {/* 1. Modal Matrice 6 Mois */}
      {activeModal === 'FORECAST_MATRIX' && (
        <ForecastMatrixModal
          netSalary={netSalary}
          baseFixed={baseFixed}
          totalSavings={totalSavings}
          totalDaily={totalDaily}
          temporaryExpenses={temporaryExpenses}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 2. Modal Transactions Réelles Détail */}
      {activeModal === 'FLOW_TRANSACTIONS' && selectedFlowModalCat && (
        <FlowTransactionsModal
          selectedFlowModalCat={selectedFlowModalCat}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 3. Modal Arbitrage Anti-Découvert */}
      {activeModal === 'ARBITRAGE' && (
        <ArbitrageModal
          accountBalance={accountBalance}
          arbitragePeaAmount={arbitragePeaAmount}
          setArbitragePeaAmount={setArbitragePeaAmount}
          onApplyArbitrage={onApplyArbitrage}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 4. Modal Journal d'Audit */}
      {activeModal === 'AUDIT_HISTORY' && (
        <AuditHistoryModal
          auditLogs={auditLogs}
          onRollback={onRollbackAudit}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 5. Modal Modifier Solde Bancaire Réel */}
      {activeModal === 'EDIT_BALANCE' && (
        <EditBalanceModal
          accountBalance={accountBalance}
          onSave={(val) => {
            setAccountBalance(val);
            onShowToast?.(`Solde mis à jour : ${val.toFixed(2)} €`, 'success');
            setActiveModal(null);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 6. Modal Multiplicateur Seuil Sécurité */}
      {activeModal === 'EDIT_BUFFER_MULT' && (
        <EditBufferMultModal
          bufferMultiplier={bufferMultiplier}
          onSave={(val) => {
            setBufferMultiplier(val);
            onShowToast?.(`Multiplicateur mis à jour : ${val.toFixed(1)}x`, 'success');
            setActiveModal(null);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 7. Modal Ajouter / Modifier Dépense Échéancée */}
      {(activeModal === 'ADD_TEMP_EXPENSE' || activeModal === 'EDIT_TEMP_EXPENSE') && (
        <TempExpenseModal
          isEdit={activeModal === 'EDIT_TEMP_EXPENSE'}
          editingTempExpense={editingTempExpense}
          defaultStartPeriod={selectedPeriod}
          onSave={({ label, monthlyAmount, durationMonths, startPeriod }) => {
            if (activeModal === 'EDIT_TEMP_EXPENSE' && editingTempExpense) {
              setTemporaryExpenses((prev) =>
                prev.map((e) => (e.id === editingTempExpense.id ? { ...e, label, monthlyAmount, durationMonths, startPeriod } : e))
              );
              onShowToast?.(`Échéancier "${label}" mis à jour.`, 'success');
            } else {
              const newExp: TemporaryExpenseItem = {
                id: `temp-${Date.now()}`,
                label,
                monthlyAmount,
                durationMonths,
                startPeriod,
              };
              setTemporaryExpenses((prev) => [...prev, newExp]);
              onShowToast?.(`Échéancier "${label}" ajouté.`, 'success');
            }
            setActiveModal(null);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 8. Modal Éditer / Créer Catégorie Complète */}
      {activeModal === 'EDIT_CATEGORY' && (
        <CategoryEditModal
          editingCategory={editingCategory}
          editingCategoryPillar={editingCategoryPillar}
          netSalary={netSalary}
          onSave={(updated) => {
            setSavingsCategories((prev) => prev.filter((c) => c.id !== updated.id));
            setFixedCategories((prev) => prev.filter((c) => c.id !== updated.id));
            setDailyCategories((prev) => prev.filter((c) => c.id !== updated.id));

            if (updated.categoryType === 'SAVINGS') {
              setSavingsCategories((prev) => [...prev, updated]);
            } else if (updated.categoryType === 'FIXED') {
              setFixedCategories((prev) => [...prev, updated]);
            } else {
              setDailyCategories((prev) => [...prev, updated]);
            }

            logBudgetChange({
              categoryName: updated.name,
              pillar: updated.categoryType,
              actionLabel: editingCategory ? 'Modification Catégorie' : 'Création Catégorie',
              actionType: 'EDIT_CAT',
              newAmount: updated.amount,
              newIsPercentage: updated.isPercentage,
              effectiveDeltaEuro: 0,
              note: `Icône: ${updated.iconType}, Couleur: ${updated.iconBgColor}`,
            });

            onShowToast?.(`Catégorie "${updated.name}" enregistrée avec succès.`, 'success');
            setActiveModal(null);
          }}
          onDelete={(id, pillar, name) => {
            if (pillar === 'SAVINGS') setSavingsCategories((prev) => prev.filter((c) => c.id !== id));
            else if (pillar === 'FIXED') setFixedCategories((prev) => prev.filter((c) => c.id !== id));
            else setDailyCategories((prev) => prev.filter((c) => c.id !== id));

            onShowToast?.(`Catégorie "${name}" supprimée.`, 'error');
            setActiveModal(null);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 9. Modal Reset Options */}
      {activeModal === 'GLOBAL_RESET' && (
        <GlobalResetModal
          onRestoreDefaults={() => {
            onResetInitial();
            setActiveModal(null);
          }}
          onClearAllRules={() => {
            onClearAllRules();
            setActiveModal(null);
          }}
          onClearAuditLogs={() => {
            setAuditLogs([]);
            setActiveModal(null);
            onShowToast?.("Journal d'audit vidé.", 'success');
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 10. Radar & Validation des Flux Bancaires (Wizard Modal) */}
      <AuraBankFlowWizardModal
        isOpen={isFlowWizardOpen}
        onClose={() => setIsFlowWizardOpen(false)}
        netSalary={netSalary}
        bankTransactions={bankTransactions}
        isSyncing={isSyncingTrueLayer}
        onRefreshTransactions={refreshTrueLayerTransactions}
        currentSavings={savingsCategories}
        currentFixed={fixedCategories}
        currentDaily={dailyCategories}
        currentTempExpenses={temporaryExpenses}
        onApplySelection={onApplyFlowWizardSelection}
      />
    </>
  );
}

'use client';

import React from 'react';
import type { SalaryRecord } from '@/types/revenue';
import type { RawBankTransaction } from '@/services/bankReconciliationEngine';
import ConfirmationModal from '@/components/ConfirmationModal';
import {
  useAuraBankReconciliationState,
  getPeriodLabel,
} from '@/hooks/useAuraBankReconciliationState';
import { AuraReconciliationReviewModal } from './reconciliation/AuraReconciliationReviewModal';
import { AuraReconciliationMonthSelector } from './reconciliation/AuraReconciliationMonthSelector';

interface AuraBankReconciliationViewProps {
  records: SalaryRecord[];
  allBankTransactions: RawBankTransaction[];
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  availableMonths: string[];
  isSyncingTrueLayer: boolean;
  needsReauth: boolean;
  onSyncBoursoBank: () => Promise<void>;
  onClearCache: () => void;
  onSaveRecord: (record: SalaryRecord) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  onOpenIntegrationsHub?: () => void;
  onOpenRebalancerWithBudget?: (budget: number) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  targetMonthlyBudget?: number;
}

export const AuraBankReconciliationView: React.FC<AuraBankReconciliationViewProps> = ({
  records,
  allBankTransactions,
  selectedMonth,
  setSelectedMonth,
  availableMonths,
  isSyncingTrueLayer,
  needsReauth,
  onSyncBoursoBank,
  onClearCache,
  onSaveRecord,
  onDeleteRecord,
  onOpenIntegrationsHub,
  onOpenRebalancerWithBudget,
  onShowToast,
  targetMonthlyBudget = 400,
}) => {
  const {
    boursoLive,
    isReviewModalOpen,
    setIsReviewModalOpen,
    reviewMatches,
    matchesHistory,
    matchesRedo,
    isResetMonthModalOpen,
    setIsResetMonthModalOpen,
    isClearCacheModalOpen,
    setIsClearCacheModalOpen,
    cleanRecords,
    activeMatches,
    actualSalary,
    actualPEA,
    deltaVsTarget,
    handleOpenReviewModal,
    handleUpdateReviewMatch,
    handleUndoMatches,
    handleRedoMatches,
    handleConfirmResetMonth,
    handleSaveReviewModal,
    modalSummary,
  } = useAuraBankReconciliationState({
    records,
    allBankTransactions,
    selectedMonth,
    onSaveRecord,
    onDeleteRecord,
    onShowToast,
    targetMonthlyBudget,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 🏦 HEADER BOURSOBANK CONTROL */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontSize: 17, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
                🏦 Flux Réels &amp; Rapprochement Bancaire
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
                {boursoLive.isConnected && !needsReauth ? '🟢 BoursoBank Connecté' : '🟡 Non Connecté'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              Rapprochement factuel des montants encaissés et des versements vers le PEA.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {boursoLive.tamponEUR > 0 && onOpenRebalancerWithBudget && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontWeight: 700 }}
                onClick={() => onOpenRebalancerWithBudget(boursoLive.tamponEUR)}
              >
                ⚡ Rééquilibrer avec le Tampon ({boursoLive.tamponEUR.toLocaleString('fr-FR')} €)
              </button>
            )}

            {(!boursoLive.isConnected || needsReauth) ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ background: 'rgba(129, 140, 248, 0.12)', border: '1px solid rgba(129, 140, 248, 0.4)', color: '#818cf8', fontWeight: 700 }}
                onClick={onOpenIntegrationsHub}
              >
                🔗 Comptes &amp; Sync API
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', fontWeight: 700, fontSize: 13 }}
                disabled={isSyncingTrueLayer}
                onClick={onSyncBoursoBank}
              >
                {isSyncingTrueLayer ? '⏳ Synchronisation...' : '🔄 Synchroniser (3 mois)'}
              </button>
            )}

            {allBankTransactions.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsClearCacheModalOpen(true)}
              >
                🗑️ Vider cache ({allBankTransactions.length})
              </button>
            )}
          </div>
        </div>

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
          </div>
        )}
      </div>

      {/* 📅 SÉLECTEUR DE MOIS & CONFRONTATION RÉEL VS PLAN */}
      <AuraReconciliationMonthSelector
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        availableMonths={availableMonths}
        cleanRecords={cleanRecords}
        actualSalary={actualSalary}
        actualPEA={actualPEA}
        deltaVsTarget={deltaVsTarget}
        targetMonthlyBudget={targetMonthlyBudget}
        activeMatches={activeMatches}
        handleOpenReviewModal={handleOpenReviewModal}
        handleSaveReviewModal={handleSaveReviewModal}
      />

      {/* 🔍 MODAL DE REVUE DES TRANSACTIONS */}
      <AuraReconciliationReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        selectedMonth={selectedMonth}
        reviewMatches={reviewMatches}
        handleUpdateReviewMatch={handleUpdateReviewMatch}
        modalSummary={modalSummary}
        handleUndoMatches={handleUndoMatches}
        handleRedoMatches={handleRedoMatches}
        matchesHistory={matchesHistory}
        matchesRedo={matchesRedo}
        handleSaveReviewModal={handleSaveReviewModal}
      />

      {/* ⚠️ MODALS DE CONFIRMATION */}
      <ConfirmationModal
        isOpen={isResetMonthModalOpen}
        title={`Réinitialiser les flux de ${getPeriodLabel(selectedMonth)}`}
        variant="warning"
        icon="🔄"
        confirmText="Réinitialiser d'après la banque"
        cancelText="Annuler"
        message={<p>Effacer toute validation manuelle pour recalculer depuis les transactions bancaires brutes ?</p>}
        onConfirm={handleConfirmResetMonth}
        onCancel={() => setIsResetMonthModalOpen(false)}
      />

      <ConfirmationModal
        isOpen={isClearCacheModalOpen}
        title="Vider le cache des transactions bancaires"
        variant="danger"
        icon="🗑️"
        confirmText="Vider le cache local"
        cancelText="Conserver"
        message={<p>Supprimer les {allBankTransactions.length} transactions stockées en cache local ?</p>}
        onConfirm={onClearCache}
        onCancel={() => setIsClearCacheModalOpen(false)}
      />
    </div>
  );
};

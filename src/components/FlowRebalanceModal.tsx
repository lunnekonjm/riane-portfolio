'use client';

import React, { useState } from 'react';
import type { Position, PortfolioConfig } from '@/types/portfolio';
import type { FlowRebalanceResult } from '@/engines/flowRebalancer';
import type { AppNotification } from '@/types/notification';
import ConfirmationModal from './ConfirmationModal';
import { RebalanceCapitalSourceSelector } from './rebalance/RebalanceCapitalSourceSelector';
import { RebalanceInstructionRow } from './rebalance/RebalanceInstructionRow';

interface FlowRebalanceModalProps {
  isOpen: boolean;
  flowRebalanceResult: FlowRebalanceResult | null;
  setFlowRebalanceResult: (res: FlowRebalanceResult | null) => void;
  rebalanceBudgetMode: 'dca' | 'tampon' | 'extra' | 'combo' | 'custom';
  setRebalanceBudgetMode: (mode: 'dca' | 'tampon' | 'extra' | 'combo' | 'custom') => void;
  customRebalanceAmount: number;
  setCustomRebalanceAmount: (amt: number) => void;
  config: PortfolioConfig | null;
  positions: Position[];
  fxRates: Record<string, number>;
  boursoLive: { tamponEUR: number };
  totalAvailableExtraCash: number;
  extraCashEntries: any[];
  saveExtraCashEntry: (entry: any) => Promise<void>;
  updatePosition: (pos: Position, customReason?: string) => Promise<void>;
  clearAnalysisCache: () => void;
  setReadNotificationIds: (ids: string[]) => void;
  notifications: AppNotification[];
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onClose: () => void;
}

export function FlowRebalanceModal({
  isOpen,
  flowRebalanceResult,
  setFlowRebalanceResult,
  rebalanceBudgetMode,
  setRebalanceBudgetMode,
  customRebalanceAmount,
  setCustomRebalanceAmount,
  config,
  positions,
  fxRates,
  boursoLive,
  totalAvailableExtraCash,
  extraCashEntries,
  saveExtraCashEntry,
  updatePosition,
  clearAnalysisCache,
  setReadNotificationIds,
  notifications,
  showToast,
  onClose,
}: FlowRebalanceModalProps) {
  const [showConfirmExecute, setShowConfirmExecute] = useState(false);

  if (!isOpen || !flowRebalanceResult) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 660 }}>
          <div className="modal-header">
            <div>
              <h2>📋 Feuille d&apos;Ordres &amp; Rééquilibrage Stratégique</h2>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Calcule les ordres optimaux à passer sur vos comptes sans falsifier vos positions avant exécution.
              </div>
            </div>
            <button className="modal-close-btn" onClick={onClose} type="button" aria-label="Fermer">✕</button>
          </div>

          {/* Capital Source Selector (DCA / Extra Cash / Combo / Custom) */}
          <RebalanceCapitalSourceSelector
            rebalanceBudgetMode={rebalanceBudgetMode}
            setRebalanceBudgetMode={setRebalanceBudgetMode}
            customRebalanceAmount={customRebalanceAmount}
            setCustomRebalanceAmount={setCustomRebalanceAmount}
            config={config}
            positions={positions}
            fxRates={fxRates}
            boursoLive={boursoLive}
            totalAvailableExtraCash={totalAvailableExtraCash}
            setFlowRebalanceResult={setFlowRebalanceResult}
          />

          <div style={{ padding: '8px 12px', background: 'rgba(6, 182, 212, 0.08)', borderRadius: 6, border: '1px solid rgba(6, 182, 212, 0.2)', marginBottom: 12, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>
            💡 <strong>Ordres Calculés :</strong> Répartit votre capital ({flowRebalanceResult.totalDCA.toLocaleString('fr-FR')} €) en priorité sur vos sous-pondérations <strong>sans vendre aucun actif</strong>.
          </div>

          <div style={{ maxHeight: '42vh', overflowY: 'auto', paddingRight: 6, display: 'flex', flexDirection: 'column', gap: 10, margin: '10px 0 14px 0' }}>
            {flowRebalanceResult.instructions.map((inst) => (
              <RebalanceInstructionRow key={inst.positionId} instruction={inst} />
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
                const sourceLabel = rebalanceBudgetMode === 'dca'
                  ? 'DCA Mensuel'
                  : rebalanceBudgetMode === 'tampon'
                  ? 'Compte Tampon BoursoBank (••••4455)'
                  : rebalanceBudgetMode === 'extra'
                  ? 'Primes & Tontine'
                  : rebalanceBudgetMode === 'combo'
                  ? 'Combo DCA + Primes'
                  : 'Montant Libre';
                const text = `📋 FEUILLE D'ORDRES RIANE PORTFOLIO (${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })})\nSource : ${sourceLabel} | Budget : ${flowRebalanceResult.totalSpent} € (Reliquat : ${flowRebalanceResult.uninvestedCash} €)\n\n${orders}`;
                navigator.clipboard.writeText(text);
                showToast('📋 Feuille d\'ordres copiée dans le presse-papier !');
              }}
            >
              📋 Copier la Feuille d&apos;Ordres
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '10px 18px', fontSize: 13, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)', fontWeight: 700 }}
                onClick={() => setShowConfirmExecute(true)}
              >
                ✅ Enregistrer comme Exécuté
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ⚠️ Confirmation Modal pour Exécution des Ordres de Rééquilibrage */}
      <ConfirmationModal
        isOpen={showConfirmExecute}
        title="Confirmer l'exécution réelle des ordres"
        variant="primary"
        icon="⚡"
        confirmText="Oui, enregistrer l'exécution"
        cancelText="Annuler"
        message={
          <div>
            <p style={{ margin: '0 0 10px 0' }}>
              Avez-vous <strong>RÉELLEMENT</strong> passé ces ordres d&apos;achat sur vos comptes de courtage (BoursoBank / CTO) ?
            </p>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Cette action va enregistrer l&apos;exécution des ordres, incrémenter le nombre de parts de vos positions et actualiser l&apos;historique de votre portefeuille.
            </p>
          </div>
        }
        onConfirm={async () => {
          setShowConfirmExecute(false);
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
          onClose();
        }}
        onCancel={() => setShowConfirmExecute(false)}
      />
    </>
  );
}

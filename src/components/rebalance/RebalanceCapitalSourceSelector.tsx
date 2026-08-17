'use client';

import React from 'react';
import type { Position, PortfolioConfig } from '@/types/portfolio';
import { calculateSmartFlowRebalance, type FlowRebalanceResult } from '@/engines/flowRebalancer';

interface RebalanceCapitalSourceSelectorProps {
  rebalanceBudgetMode: 'dca' | 'tampon' | 'extra' | 'combo' | 'custom';
  setRebalanceBudgetMode: (mode: 'dca' | 'tampon' | 'extra' | 'combo' | 'custom') => void;
  customRebalanceAmount: number;
  setCustomRebalanceAmount: (amt: number) => void;
  config: PortfolioConfig | null;
  positions: Position[];
  fxRates: Record<string, number>;
  boursoLive: { tamponEUR: number };
  totalAvailableExtraCash: number;
  setFlowRebalanceResult: (res: FlowRebalanceResult | null) => void;
}

export function RebalanceCapitalSourceSelector({
  rebalanceBudgetMode,
  setRebalanceBudgetMode,
  customRebalanceAmount,
  setCustomRebalanceAmount,
  config,
  positions,
  fxRates,
  boursoLive,
  totalAvailableExtraCash,
  setFlowRebalanceResult,
}: RebalanceCapitalSourceSelectorProps) {
  return (
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

        {boursoLive.tamponEUR > 0 && (
          <button
            type="button"
            className={`btn btn-sm ${rebalanceBudgetMode === 'tampon' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              flex: 1,
              minWidth: 140,
              fontSize: 12,
              fontWeight: 700,
              background: rebalanceBudgetMode === 'tampon' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : undefined,
              border: '1px solid rgba(16, 185, 129, 0.4)',
            }}
            onClick={() => {
              setRebalanceBudgetMode('tampon');
              setFlowRebalanceResult(calculateSmartFlowRebalance(positions, boursoLive.tamponEUR, fxRates));
            }}
          >
            ⚡ Tampon Bourso ({boursoLive.tamponEUR.toLocaleString('fr-FR')} €)
          </button>
        )}

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
  );
}

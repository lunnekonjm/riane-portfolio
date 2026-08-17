'use client';

import React, { useState } from 'react';
import type { Position } from '@/types/portfolio';
import CustomDatePicker from '@/components/CustomDatePicker';
import { simulatePositionDCA } from '@/engines/dcaSimulation';
import { getQuote } from '@/services/market-data/provider';
import DcaSimulationModal, { type PositionSimulationItem } from '@/components/DcaSimulationModal';

interface DcaSimulationBarProps {
  dcaGlobalStartDate: string;
  onUpdateDcaStartDate: (date: string) => void;
  positions: Position[];
  updatePosition: (pos: Position) => Promise<void>;
  refreshingPrices: boolean;
  setRefreshingPrices: (b: boolean) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function formatDCAElapsedTime(startDateStr: string): string {
  if (!startDateStr) return '0 m';
  const start = new Date(startDateStr);
  const now = new Date();
  if (isNaN(start.getTime())) return '0 m';

  let totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (totalMonths < 0) totalMonths = 0;

  const years = Math.floor(totalMonths / 12);
  const remainingMonths = totalMonths % 12;

  if (years === 0) {
    return `${remainingMonths} mois`;
  }
  if (remainingMonths === 0) {
    return `${years} an${years > 1 ? 's' : ''}`;
  }
  return `${years} an${years > 1 ? 's' : ''} ${remainingMonths} m`;
}

export default function DcaSimulationBar({
  dcaGlobalStartDate,
  onUpdateDcaStartDate,
  positions,
  updatePosition,
  refreshingPrices,
  setRefreshingPrices,
  showToast,
}: DcaSimulationBarProps) {
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationItems, setSimulationItems] = useState<PositionSimulationItem[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);

  const handleRunSimulation = async () => {
    if (!dcaGlobalStartDate || positions.length === 0) return;
    setRefreshingPrices(true);
    setIsSimulating(true);
    try {
      const items: PositionSimulationItem[] = [];
      for (const pos of positions) {
        const monthlyBudget = pos.monthlyDCA || (pos.annualBudget ? pos.annualBudget / 12 : 100);
        const isIntegerOnly = pos.envelope === 'PEA' || pos.envelope === 'PEA-PME' || pos.envelope === 'CTO';

        let realLivePrice = pos.currentPrice;
        if (!realLivePrice) {
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

        items.push({
          position: pos,
          simulation: sim,
          realLivePrice: effectivePrice,
        });
      }

      setSimulationItems(items);
      setShowModal(true);
      showToast(`⚡ Simulation DCA calculée pour ${items.length} positions — visualisez l'aperçu`);
    } catch (err) {
      console.error(err);
      showToast('Erreur lors du calcul de la simulation DCA', 'error');
    } finally {
      setIsSimulating(false);
      setRefreshingPrices(false);
    }
  };

  const handleApplyAll = async () => {
    let count = 0;
    for (const item of simulationItems) {
      const pos = item.position;
      const sim = item.simulation;
      const finalShares = sim.totalShares;
      const finalPRU = sim.avgPrice > 0 ? sim.avgPrice : pos.avgPrice || item.realLivePrice;

      await updatePosition({
        ...pos,
        quantity: finalShares,
        avgPrice: finalPRU,
        ...(item.realLivePrice && item.realLivePrice > 0 ? { currentPrice: item.realLivePrice } : {}),
        updatedAt: Date.now(),
      });
      count++;
    }
    showToast(`✓ DCA appliqué avec succès à ${count} positions`);
  };

  const handleApplySingle = async (posId: string) => {
    const item = simulationItems.find((i) => i.position.id === posId);
    if (!item) return;
    const pos = item.position;
    const sim = item.simulation;
    const finalShares = sim.totalShares;
    const finalPRU = sim.avgPrice > 0 ? sim.avgPrice : pos.avgPrice || item.realLivePrice;

    await updatePosition({
      ...pos,
      quantity: finalShares,
      avgPrice: finalPRU,
      ...(item.realLivePrice && item.realLivePrice > 0 ? { currentPrice: item.realLivePrice } : {}),
      updatedAt: Date.now(),
    });
    showToast(`✓ DCA appliqué pour ${pos.name}`);
  };

  return (
    <>
      <div className="card" style={{ borderLeft: '4px solid var(--accent-emerald)', background: 'var(--bg-secondary)', padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26 }}>⚡</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                Console d&apos;Accumulation DCA Historique (Sandbox)
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Simulez l&apos;accumulation réelle depuis une date de départ avec aperçu comparatif sécurisé.
              </div>
            </div>
          </div>

          {/* Presets, Custom Month Selector & Inflation Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${dcaGlobalStartDate.startsWith('2025-01') ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onUpdateDcaStartDate('2025-01-05')}
              style={{ fontSize: 13, padding: '6px 12px' }}
            >
              1 An (2025)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${dcaGlobalStartDate.startsWith('2023-01') ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onUpdateDcaStartDate('2023-01-05')}
              style={{ fontSize: 13, padding: '6px 12px' }}
            >
              3 Ans (2023)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${dcaGlobalStartDate.startsWith('2021-01') ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onUpdateDcaStartDate('2021-01-05')}
              style={{ fontSize: 13, padding: '6px 12px' }}
            >
              5 Ans (2021)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${dcaGlobalStartDate.startsWith('2003-01') ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onUpdateDcaStartDate('2003-01-05')}
              style={{ fontSize: 13, padding: '6px 12px' }}
            >
              23 Ans (2003)
            </button>

            {/* Modern Custom Dark Theme Date Picker Component */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <CustomDatePicker value={dcaGlobalStartDate} onChange={onUpdateDcaStartDate} />
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--accent-cyan)',
                  fontWeight: 600,
                  background: 'rgba(6, 182, 212, 0.12)',
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                }}
              >
                {formatDCAElapsedTime(dcaGlobalStartDate)}
              </span>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleRunSimulation}
              disabled={refreshingPrices || isSimulating || positions.length === 0}
              style={{ padding: '8px 16px', fontWeight: 700 }}
              id="auto-dca-btn"
            >
              {refreshingPrices || isSimulating ? <span className="loading-spinner" /> : '⚡ Simuler DCA'}
            </button>
          </div>
        </div>
      </div>

      <DcaSimulationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        startDate={dcaGlobalStartDate}
        items={simulationItems}
        onApplyAll={handleApplyAll}
        onApplySingle={handleApplySingle}
      />
    </>
  );
}

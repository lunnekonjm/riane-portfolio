'use client';

import React, { useState } from 'react';
import type { Position } from '@/types/portfolio';
import type { DCASimulationResult } from '@/engines/dcaSimulation';
import AssetLogo from '@/components/AssetLogo';
import { getCleanAssetName } from '@/utils/assetMetadata';

export interface PositionSimulationItem {
  position: Position;
  simulation: DCASimulationResult;
  realLivePrice: number;
}

interface DcaSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  items: PositionSimulationItem[];
  onApplyAll: () => Promise<void>;
  onApplySingle: (positionId: string) => Promise<void>;
}

export default function DcaSimulationModal({
  isOpen,
  onClose,
  startDate,
  items,
  onApplyAll,
  onApplySingle,
}: DcaSimulationModalProps) {
  const [applying, setApplying] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const totalInvested = items.reduce((sum, item) => sum + item.simulation.totalInvested, 0);
  const totalSimulatedValue = items.reduce((sum, item) => {
    const pr = item.realLivePrice || item.position.currentPrice || item.simulation.avgPrice;
    return sum + item.simulation.totalShares * pr;
  }, 0);
  const totalGain = totalSimulatedValue - totalInvested;
  const totalGainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  const handleApplyAllClick = async () => {
    if (
      !confirm(
        `⚠️ Confirmation : Voulez-vous vraiment écraser les quantités et PRU actuels de vos ${items.length} positions par les résultats simulés depuis le ${startDate} ?`
      )
    ) {
      return;
    }
    setApplying(true);
    try {
      await onApplyAll();
      setAppliedIds(new Set(items.map((i) => i.position.id)));
      onClose();
    } finally {
      setApplying(false);
    }
  };

  const handleApplySingleClick = async (posId: string) => {
    setApplying(true);
    try {
      await onApplySingle(posId);
      setAppliedIds((prev) => new Set([...prev, posId]));
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: '16px', overflowY: 'auto' }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 960,
          background: 'var(--bg-primary)',
          borderRadius: 14,
          border: '1px solid var(--border-medium)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          padding: 24,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>⚡</span>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Aperçu de la Simulation DCA Historique
              </h2>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Simulation Sandbox non-destructive calculée depuis le <strong>{startDate}</strong>.
              </span>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ fontSize: 20, padding: '4px 8px' }}>
            ×
          </button>
        </div>

        {/* Global Summary KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Capital Investi Total</span>
            <strong className="mono" style={{ fontSize: 18, color: 'var(--text-primary)', display: 'block', marginTop: 4 }}>
              {totalInvested.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </strong>
          </div>
          <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Valeur Simulée Actuelle</span>
            <strong className="mono" style={{ fontSize: 18, color: 'var(--accent-cyan)', display: 'block', marginTop: 4 }}>
              {totalSimulatedValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </strong>
          </div>
          <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Plus-Value Simulée</span>
            <strong className="mono" style={{ fontSize: 18, color: totalGain >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', display: 'block', marginTop: 4 }}>
              {totalGain >= 0 ? '+' : ''}{totalGain.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} ({totalGain >= 0 ? '+' : ''}{totalGainPct.toFixed(1)}%)
            </strong>
          </div>
        </div>

        {/* Comparison Table */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', marginBottom: 20, border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
          <table className="portfolio-table" style={{ margin: 0, width: '100%' }}>
            <thead>
              <tr>
                <th>Actif</th>
                <th>Quantité Réelle vs Simulée</th>
                <th>PRU Réel vs Simulé</th>
                <th>Investissement Simulé</th>
                <th>Valeur Simulée</th>
                <th style={{ textAlign: 'center', width: 90 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ position: pos, simulation: sim, realLivePrice }) => {
                const isApplied = appliedIds.has(pos.id);
                const currentVal = pos.quantity * (pos.currentPrice || pos.avgPrice || realLivePrice);
                const simVal = sim.totalShares * realLivePrice;
                const gain = simVal - sim.totalInvested;
                const gainPct = sim.totalInvested > 0 ? (gain / sim.totalInvested) * 100 : 0;

                return (
                  <tr key={pos.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AssetLogo ticker={pos.ticker} name={pos.name} envelope={pos.envelope} size={28} />
                        <div>
                          <strong style={{ fontSize: 12, color: 'var(--text-primary)', display: 'block' }}>
                            {getCleanAssetName(pos.ticker, pos.name)}
                          </strong>
                          <span className="mono" style={{ fontSize: 10, color: 'var(--accent-cyan)' }}>
                            {pos.ticker} ({pos.envelope})
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      <div style={{ color: 'var(--text-secondary)' }}>Actuel : {pos.quantity || 0}</div>
                      <strong style={{ color: 'var(--accent-cyan)' }}>DCA : {sim.totalShares} parts</strong>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      <div style={{ color: 'var(--text-secondary)' }}>Actuel : {(pos.avgPrice || 0).toFixed(2)} €</div>
                      <strong style={{ color: 'var(--accent-emerald)' }}>DCA : {sim.avgPrice.toFixed(2)} €</strong>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {sim.totalInvested.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{sim.monthsCount} versements</div>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      <strong>{simVal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
                      <div style={{ fontSize: 10, color: gain >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 700 }}>
                        {gain >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className={`btn btn-sm ${isApplied ? 'btn-ghost' : 'btn-secondary'}`}
                        style={{ fontSize: 11, padding: '4px 8px' }}
                        onClick={() => handleApplySingleClick(pos.id)}
                        disabled={applying || isApplied}
                      >
                        {isApplied ? '✓ Appliqué' : 'Appliquer'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            💡 Vous pouvez fermer cette fenêtre pour conserver vos données actuelles intactes.
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Fermer sans modifier
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleApplyAllClick}
              disabled={applying || items.length === 0}
              style={{ fontWeight: 700 }}
            >
              {applying ? <span className="loading-spinner" /> : '⚡ Appliquer à toutes les positions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

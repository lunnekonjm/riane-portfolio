'use client';

import React from 'react';
import type { DCASimulationResult } from '@/engines/dcaSimulation';

interface DcaSimulationResultCardProps {
  dcaResult: DCASimulationResult;
  currentPrice?: number;
  sym: string;
  showDCAHistory: boolean;
  setShowDCAHistory: (show: boolean) => void;
  onApplyDCAResult: () => void;
}

export function DcaSimulationResultCard({
  dcaResult,
  currentPrice,
  sym,
  showDCAHistory,
  setShowDCAHistory,
  onApplyDCAResult,
}: DcaSimulationResultCardProps) {
  if (!dcaResult || dcaResult.monthsCount <= 0) return null;

  const latestPrice = currentPrice || (dcaResult.logs.length > 0 ? dcaResult.logs[dcaResult.logs.length - 1].sharePrice : dcaResult.avgPrice);
  const currentValue = dcaResult.totalShares * latestPrice;
  const totalProfitLoss = dcaResult.totalProfitLoss ?? (currentValue - dcaResult.totalInvested);
  const profitLossPercent = dcaResult.profitLossPercent ?? (dcaResult.totalInvested > 0 ? (totalProfitLoss / dcaResult.totalInvested) * 100 : 0);
  const totalCapitalWithCash = currentValue + dcaResult.uninvestedCash;
  const isOneShot = dcaResult.simulationMode === 'lump_sum';

  return (
    <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-emerald)' }}>
          {isOneShot
            ? `🎯 Résultats Versement Unique One-Shot (${dcaResult.monthsCount} mois écoulés) :`
            : `📊 Résultats Simulation DCA (${dcaResult.monthsCount} mois passés) :`}
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', fontWeight: 600 }}
          onClick={() => setShowDCAHistory(!showDCAHistory)}
        >
          {showDCAHistory ? 'Masquer historique' : '🔍 Voir historique mois par mois'}
        </button>
      </div>

      {/* 🚀 Performance & Profit/Loss Banner */}
      <div
        style={{
          background: totalProfitLoss >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
          border: `1px solid ${totalProfitLoss >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`,
          borderRadius: 8,
          padding: '12px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
            {isOneShot ? "Gain Total de l'Investissement" : 'Gain / Perte Réalisé(e) du DCA'}
          </span>
          <div style={{ fontSize: 19, fontWeight: 800, color: totalProfitLoss >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', margin: '2px 0' }}>
            {totalProfitLoss >= 0 ? '+' : ''}
            {totalProfitLoss.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {sym} ({totalProfitLoss >= 0 ? '+' : ''}
            {profitLossPercent.toFixed(2)} %)
          </div>
          {dcaResult.multiplier > 0 && (
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'flex', gap: 12, marginTop: 4 }}>
              <span>
                Multiple : <strong style={{ color: 'var(--accent-cyan)' }}>x{dcaResult.multiplier.toFixed(2)}</strong>
              </span>
              {dcaResult.annualizedReturn !== 0 && (
                <span>
                  TRI / CAGR :{' '}
                  <strong style={{ color: dcaResult.annualizedReturn >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    {dcaResult.annualizedReturn >= 0 ? '+' : ''}
                    {dcaResult.annualizedReturn.toFixed(2)} % / an
                  </strong>
                </span>
              )}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'block' }}>Valeur Portefeuille Actuelle</span>
          <strong style={{ fontSize: 18, color: 'var(--accent-cyan)', fontWeight: 900 }}>
            {currentValue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {sym}
          </strong>
          {dcaResult.initialSharePrice && dcaResult.initialSharePrice > 0 && (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginTop: 2 }}>
              Cours initial : {dcaResult.initialSharePrice.toFixed(2)} {sym}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, textAlign: 'center', marginBottom: 14 }}>
        <div style={{ background: 'var(--bg-tertiary)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600 }}>Parts/Actions</span>
          <strong style={{ fontSize: 15, color: 'var(--accent-cyan)', fontWeight: 800 }}>{dcaResult.totalShares}</strong>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600 }}>PRU Moyen</span>
          <strong style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 800 }}>
            {dcaResult.avgPrice.toFixed(2)} {sym}
          </strong>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600 }}>Total Investi</span>
          <strong style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 800 }}>
            {dcaResult.totalInvested.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {sym}
          </strong>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600 }}>Total + Trésorerie</span>
          <strong style={{ fontSize: 15, color: 'var(--accent-amber)', fontWeight: 800 }}>
            {totalCapitalWithCash.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {sym}
          </strong>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-secondary"
        style={{ width: '100%', fontSize: 12.5, padding: '9px 14px', borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)', fontWeight: 700 }}
        onClick={onApplyDCAResult}
      >
        📋 Importer ce résultat dans mon portefeuille actuel ({dcaResult.totalShares} parts @ {dcaResult.avgPrice.toFixed(2)} {sym})
      </button>

      {showDCAHistory && (
        <div style={{ marginTop: 12, maxHeight: 180, overflowY: 'auto', fontSize: 'var(--text-xs)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th>Mois</th>
                <th>Cours</th>
                <th>Disponible</th>
                <th>Acheté</th>
                <th>Reliquat</th>
                <th>Cumul Actions</th>
                <th>PRU</th>
              </tr>
            </thead>
            <tbody>
              {dcaResult.logs.map((log) => (
                <tr key={log.date} style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <td style={{ padding: '4px 0' }}>{log.date}</td>
                  <td>
                    {log.sharePrice} {sym}
                  </td>
                  <td>
                    {log.cashAvailable} {sym}
                  </td>
                  <td style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>+{log.sharesBought}</td>
                  <td style={{ color: 'var(--accent-amber)' }}>
                    {log.rolloverCash} {sym}
                  </td>
                  <td style={{ fontWeight: 600 }}>{log.cumulativeShares}</td>
                  <td style={{ color: 'var(--accent-amber)' }}>
                    {log.cumulativePRU} {sym}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

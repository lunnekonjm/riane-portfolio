'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';
import type { StockValuationRecord } from '@/data/valuationData';
import type { ValuationEngineResult } from '@/engines/valuationEngine';
import { ValuationChart } from './ValuationChart';

interface ValuationStockDetailCardProps {
  stock: StockValuationRecord;
  val: ValuationEngineResult;
  matchingPosition: Position | null;
}

export function ValuationStockDetailCard({
  stock,
  val,
  matchingPosition,
}: ValuationStockDetailCardProps) {
  const badgeSignalClass =
    val.signalClass === 'good'
      ? 'val-badge-good'
      : val.signalClass === 'bad'
      ? 'val-badge-bad'
      : 'val-badge-warn';

  return (
    <div className="val-card">
      {/* Header & Badges */}
      <div className="val-card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#ffffff' }}>{stock.name}</h2>
            <span className="val-badge val-badge-cyan" style={{ fontSize: 12 }}>
              {stock.tick}
            </span>
            {matchingPosition && (
              <span
                style={{
                  fontSize: 12,
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: 'var(--accent-emerald)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontWeight: 700,
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                💼 En Portefeuille ({matchingPosition.envelope}) : {matchingPosition.quantity} parts ({(matchingPosition.quantity * (matchingPosition.currentPrice || matchingPosition.avgPrice || 0)).toLocaleString('fr-FR')} €)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <span className="val-badge val-badge-neutral">{stock.categoryLabel}</span>
            <span
              className={`val-badge ${
                stock.story === 'good' ? 'val-badge-good' : stock.story === 'bad' ? 'val-badge-bad' : 'val-badge-warn'
              }`}
            >
              {stock.storyLabel}
            </span>
            <span className={`val-badge ${badgeSignalClass}`}>
              {val.signal} · {val.gapPct >= 0 ? `${val.gapPct.toFixed(0)}% plus cher` : `${Math.abs(val.gapPct).toFixed(0)}% moins cher`} que sa moyenne
            </span>
          </div>
        </div>

        {/* Source Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <a
            href={stock.sources.secOrOfficial}
            target="_blank"
            rel="noopener noreferrer"
            className="val-btn"
            title="Accéder aux rapports officiels & dépôts"
          >
            🔗 {stock.country === 'US' ? 'SEC EDGAR' : 'Site Officiel'}
          </a>
          <a
            href={stock.sources.yahooFinance}
            target="_blank"
            rel="noopener noreferrer"
            className="val-btn"
            title="Consulter Yahoo Finance"
          >
            📈 Yahoo Finance
          </a>
          <a
            href={stock.sources.macrotrendsOrBourse}
            target="_blank"
            rel="noopener noreferrer"
            className="val-btn"
            title="Consulter l'historique des ratios"
          >
            📊 {stock.country === 'US' ? 'Macrotrends' : 'Boursorama'}
          </a>
        </div>
      </div>

      {/* Verdict */}
      <p style={{ fontSize: 13, lineHeight: 1.6, color: '#cbd5e1', margin: '16px 0' }}>
        {stock.verdict}
      </p>

      {/* Dual Axis Interactive Chart */}
      <ValuationChart stock={stock} val={val} />

      {/* 3 Core Stats Cards */}
      <div className="val-grid-3" style={{ marginTop: 16 }}>
        {/* Fundamental Metric Card */}
        <div className="val-subcard">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#06b6d4', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, background: '#06b6d4', borderRadius: 2 }} />
            <span>{val.growthMetricLabel}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: '#94a3b8' }}>Évolution Totale</span>
            <span style={{ fontWeight: 700, color: val.growthTotalPct && val.growthTotalPct > 0 ? '#10b981' : '#ffffff' }}>
              {val.growthTotalPct !== null ? `${val.growthTotalPct >= 0 ? '+' : ''}${val.growthTotalPct.toFixed(1)}%` : 'N/A'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
            <span style={{ color: '#94a3b8' }}>Taux Annuel (CAGR)</span>
            <span style={{ fontWeight: 700, color: val.growthCagrPct && val.growthCagrPct > 0 ? '#10b981' : '#ffffff' }}>
              {val.growthCagrPct !== null ? `+${val.growthCagrPct.toFixed(1)}%/an` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Price Evolution Card */}
        <div className="val-subcard">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, background: '#f59e0b', borderRadius: 2 }} />
            <span>Cours de Bourse ({stock.currency})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: '#94a3b8' }}>Évolution Totale</span>
            <span style={{ fontWeight: 700, color: val.priceTotalPct && val.priceTotalPct > 0 ? '#10b981' : '#f43f5e' }}>
              {val.priceTotalPct !== null ? `${val.priceTotalPct >= 0 ? '+' : ''}${val.priceTotalPct.toFixed(1)}%` : 'N/A'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
            <span style={{ color: '#94a3b8' }}>Taux Annuel (CAGR)</span>
            <span style={{ fontWeight: 700, color: '#ffffff' }}>
              {val.priceCagrPct !== null ? `+${val.priceCagrPct.toFixed(1)}%/an` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Valuation Metric Card */}
        <div className="val-subcard">
          <div style={{ color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            📐 Multiple {val.ratioName}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: '#94a3b8' }}>Multiple Actuel</span>
            <span style={{ fontWeight: 700, color: '#ffffff' }}>{val.currentRatio.toFixed(1)}×</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: '#94a3b8' }}>Moyenne Historique</span>
            <span style={{ color: '#94a3b8' }}>{val.avgRatio.toFixed(1)}×</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
            <span style={{ color: '#94a3b8' }}>Score Statistique (z)</span>
            <span style={{ fontWeight: 700, color: val.zScore > 1 ? '#f43f5e' : val.zScore < -1 ? '#10b981' : '#f59e0b' }}>
              {val.zScore >= 0 ? `+${val.zScore.toFixed(2)}σ` : `${val.zScore.toFixed(2)}σ`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { StockValuationRecord } from '@/data/valuationData';
import { ValuationEngineResult } from '@/engines/valuationEngine';

interface ValuationConsensusCardProps {
  stock: StockValuationRecord;
  val: ValuationEngineResult;
}

export const ValuationConsensusCard: React.FC<ValuationConsensusCardProps> = ({ stock, val }) => {
  const currentPrice = val.currentPrice;
  const targetMean = val.analystMean;
  const targetHigh = val.analystHigh;
  const targetLow = val.analystLow;
  const upsidePct = val.analystUpsidePct;

  // Calcul du positionnement sur la jauge min-max
  const minRange = Math.min(targetLow, currentPrice * 0.85);
  const maxRange = Math.max(targetHigh, currentPrice * 1.15);
  const totalSpan = maxRange - minRange || 1;

  const currentPosPct = Math.max(0, Math.min(100, ((currentPrice - minRange) / totalSpan) * 100));
  const meanPosPct = Math.max(0, Math.min(100, ((targetMean - minRange) / totalSpan) * 100));

  const alignBadgeClass =
    val.alignmentClass === 'good'
      ? 'val-badge-good'
      : val.alignmentClass === 'bad'
      ? 'val-badge-bad'
      : 'val-badge-warn';

  return (
    <div className="val-card">
      {/* Header */}
      <div className="val-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🎯</span>
          <span className="val-card-title">
            Consensus des Analystes de Marché &amp; Recoupement
          </span>
          <span className="val-badge val-badge-neutral">
            {stock.consensus.analystCount} analystes
          </span>
        </div>

        <div>
          <span className={`val-badge ${alignBadgeClass}`}>
            {val.alignmentLabel}
          </span>
        </div>
      </div>

      {/* Grid KPI */}
      <div className="val-grid-4" style={{ marginTop: 16 }}>
        {/* Consensus Rating */}
        <div className="val-subcard">
          <div className="val-subcard-title">Avis Global</div>
          <div className="val-subcard-value" style={{ fontSize: 15 }}>
            {stock.consensus.rating}
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
            Score : {stock.consensus.ratingScore.toFixed(2)} / 5.00
          </div>
        </div>

        {/* Target Mean */}
        <div className="val-subcard">
          <div className="val-subcard-title">Objectif Moyen</div>
          <div className="val-subcard-value" style={{ color: '#06b6d4' }}>
            {stock.currency === '$' ? '$' : ''}{targetMean.toFixed(2)}{stock.currency === '€' ? ' €' : ''}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', marginTop: 4, color: upsidePct >= 0 ? '#10b981' : '#f43f5e' }}>
            {upsidePct >= 0 ? '+' : ''}{upsidePct.toFixed(1)}% vs cours
          </div>
        </div>

        {/* Target Low / High */}
        <div className="val-subcard">
          <div className="val-subcard-title">Fourchette Analystes</div>
          <div className="val-subcard-value" style={{ fontSize: 13 }}>
            {targetLow.toFixed(0)} à {targetHigh.toFixed(0)} {stock.currency}
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
            Dispersion : {(((targetHigh - targetLow) / targetMean) * 100).toFixed(0)}%
          </div>
        </div>

        {/* Internal Model Comparison */}
        <div className="val-subcard">
          <div className="val-subcard-title">Modèle Quantitatif</div>
          <div className="val-subcard-value" style={{ color: val.signalClass === 'good' ? '#10b981' : val.signalClass === 'bad' ? '#f43f5e' : '#f59e0b' }}>
            {val.signal}
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
            Écart historique : {val.gapPct >= 0 ? '+' : ''}{val.gapPct.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Visual Price Bar */}
      <div className="val-subcard" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', marginBottom: 10 }}>
          <span>Bas : {targetLow.toFixed(0)}{stock.currency}</span>
          <span style={{ color: '#06b6d4', fontWeight: 700 }}>Cible Moyenne : {targetMean.toFixed(0)}{stock.currency}</span>
          <span>Haut : {targetHigh.toFixed(0)}{stock.currency}</span>
        </div>

        <div style={{ position: 'relative', width: '100%', height: 12, background: 'rgba(15, 23, 42, 0.8)', borderRadius: 9999, overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {/* Target Range Bar */}
          <div
            style={{
              position: 'absolute',
              height: '100%',
              background: 'rgba(6, 182, 212, 0.25)',
              borderRadius: 9999,
              left: `${Math.max(0, ((targetLow - minRange) / totalSpan) * 100)}%`,
              width: `${Math.min(100, ((targetHigh - targetLow) / totalSpan) * 100)}%`,
            }}
          />
          {/* Mean Target Marker */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 3,
              background: '#06b6d4',
              boxShadow: '0 0 8px #06b6d4',
              left: `${meanPosPct}%`,
            }}
            title={`Consensus Moyen : ${targetMean.toFixed(2)}${stock.currency}`}
          />
          {/* Current Price Marker */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 4,
              background: '#f59e0b',
              boxShadow: '0 0 10px #f59e0b',
              left: `${currentPosPct}%`,
            }}
            title={`Cours Actuel : ${currentPrice.toFixed(2)}${stock.currency}`}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#64748b', marginTop: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
            Cours Actuel ({currentPrice.toFixed(2)}{stock.currency})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4' }} />
            Objectif Consensus ({targetMean.toFixed(2)}{stock.currency})
          </span>
        </div>
      </div>

      {/* Synthesis Footnote */}
      <p style={{ fontSize: 12, color: '#94a3b8', margin: '14px 0 0 0', lineHeight: 1.55 }}>
        <b>Lecture de confrontation :</b> Le consensus des analystes offre une perspective prospective de Wall Street / Paris basée sur les prévisions de cash-flow futures, tandis que notre modèle mécanique mesure la déconnexion actuelle par rapport aux multiples réels historiques ({val.ratioName}). Les deux signaux se complètent sans se substituer.
      </p>
    </div>
  );
};

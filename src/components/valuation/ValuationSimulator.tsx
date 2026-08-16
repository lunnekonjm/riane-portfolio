'use client';

import React, { useState, useEffect } from 'react';
import { StockValuationRecord } from '@/data/valuationData';
import { ValuationEngineResult } from '@/engines/valuationEngine';

interface ValuationSimulatorProps {
  stock: StockValuationRecord;
  val: ValuationEngineResult;
}

export const ValuationSimulator: React.FC<ValuationSimulatorProps> = ({ stock, val }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [years, setYears] = useState<number>(3);
  const [growth, setGrowth] = useState<number>(10);
  const [decay, setDecay] = useState<number>(5);
  const [multiple, setMultiple] = useState<number>(15);
  const [discount, setDiscount] = useState<number>(10);

  const ocf = stock.ocf;

  useEffect(() => {
    if (ocf && ocf.applicable) {
      setGrowth(ocf.historicalGrowth !== null && ocf.historicalGrowth !== undefined ? ocf.historicalGrowth : 12);
      setMultiple(ocf.historicalMultiple !== null && ocf.historicalMultiple !== undefined ? ocf.historicalMultiple : 18);
    } else if (stock.salesModel && stock.salesModel.applicable) {
      setGrowth(stock.salesModel.revenueCagr || 15);
      setMultiple(stock.salesModel.historicalPsAvg || 5);
    }
  }, [stock, ocf]);

  if (!ocf?.applicable && !stock.salesModel?.applicable) {
    return (
      <div className="val-card" style={{ padding: 16 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>
          Simulateur de projection DCF
        </div>
        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
          {ocf?.reason || 'Données de cash-flow insuffisantes pour une projection DCF.'}
        </p>
      </div>
    );
  }

  const basePerShare = ocf?.applicable
    ? ocf.currentPerShare
    : (stock.salesModel?.currentRevenue || 100) / 10; // proxy

  // Projection logic
  let projectedMetric = basePerShare;
  let currentG = growth;
  for (let t = 1; t <= years; t++) {
    projectedMetric = projectedMetric * (1 + currentG / 100);
    currentG = currentG * (1 - decay / 100);
  }

  const futurePrice = projectedMetric * multiple;
  const fairValue = futurePrice / Math.pow(1 + discount / 100, years);
  const currentPrice = val.currentPrice;
  const gapPct = ((fairValue - currentPrice) / currentPrice) * 100;
  const cagr = (Math.pow(futurePrice / currentPrice, 1 / years) - 1) * 100;

  const isUnderValued = gapPct > 0;

  return (
    <div className="val-card">
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          paddingBottom: isOpen ? 12 : 0,
          borderBottom: isOpen ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🧮</span>
          <span className="val-card-title">
            Simulateur de Projection (Cash-Flow / CA &times; Multiple de Sortie)
          </span>
        </div>
        <span style={{ fontSize: 12, color: '#06b6d4', fontFamily: 'JetBrains Mono, monospace' }}>
          {isOpen ? 'Replier ▴' : 'Déplier ▾'}
        </span>
      </div>

      {isOpen && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.55 }}>
            Projette le cash-flow opérationnel par action à N ans avec tes propres hypothèses, applique un multiple de sortie, puis actualise le résultat au cours d&apos;aujourd&apos;hui.
          </p>

          {/* Form Fields */}
          <div className="val-grid-3">
            <div className="val-subcard">
              <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Années à projeter (N)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={years}
                onChange={(e) => setYears(Math.max(1, parseInt(e.target.value, 10) || 3))}
                className="val-input"
              />
            </div>

            <div className="val-subcard">
              <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Croissance annuelle (%)</label>
              <input
                type="number"
                step="0.5"
                value={growth}
                onChange={(e) => setGrowth(parseFloat(e.target.value) || 0)}
                className="val-input"
              />
              <span style={{ fontSize: 10, color: '#64748b', display: 'block', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                Réf: {ocf?.historicalGrowth ? `+${ocf.historicalGrowth.toFixed(1)}%/an` : 'Estimé'}
              </span>
            </div>

            <div className="val-subcard">
              <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Décroissance croissance (%/an)</label>
              <input
                type="number"
                step="1"
                value={decay}
                onChange={(e) => setDecay(parseFloat(e.target.value) || 0)}
                className="val-input"
              />
              <span style={{ fontSize: 10, color: '#64748b', display: 'block', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                Ralentissement annuel
              </span>
            </div>

            <div className="val-subcard">
              <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Multiple de sortie (&times;)</label>
              <input
                type="number"
                step="0.5"
                value={multiple}
                onChange={(e) => setMultiple(parseFloat(e.target.value) || 0)}
                className="val-input"
              />
              <span style={{ fontSize: 10, color: '#64748b', display: 'block', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                Réf: {ocf?.historicalMultiple ? `${ocf.historicalMultiple.toFixed(1)}×` : 'Moyenne'}
              </span>
            </div>

            <div className="val-subcard">
              <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Taux d&apos;actualisation (%)</label>
              <input
                type="number"
                step="0.5"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="val-input"
              />
              <span style={{ fontSize: 10, color: '#64748b', display: 'block', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                Exigence de rendement min.
              </span>
            </div>

            <div className="val-subcard">
              <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Base Actuelle / Action</label>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                {stock.currency === '$' ? '$' : ''}{basePerShare.toFixed(2)}{stock.currency === '€' ? ' €' : ''}
              </div>
              <span style={{ fontSize: 10, color: '#64748b', display: 'block', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                Cours : {currentPrice.toFixed(2)}{stock.currency}
              </span>
            </div>
          </div>

          {/* Results KPI */}
          <div className="val-grid-3" style={{ paddingTop: 6 }}>
            <div className="val-subcard" style={{ textAlign: 'center' }}>
              <div className="val-subcard-title">Cours Projeté dans {years} ans</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
                {stock.currency === '$' ? '$' : ''}{futurePrice.toFixed(2)}{stock.currency === '€' ? ' €' : ''}
              </div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                Rendement CAGR : {cagr >= 0 ? '+' : ''}{cagr.toFixed(1)}%/an
              </div>
            </div>

            <div className="val-subcard" style={{ textAlign: 'center', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
              <div className="val-subcard-title">Valeur Actualisée (Aujourd&apos;hui)</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#06b6d4', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
                {stock.currency === '$' ? '$' : ''}{fairValue.toFixed(2)}{stock.currency === '€' ? ' €' : ''}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                Actualisée à {discount}%/an
              </div>
            </div>

            <div className="val-subcard" style={{ textAlign: 'center' }}>
              <div className="val-subcard-title">Valeur Act. vs Cours Actuel</div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', marginTop: 4, color: isUnderValued ? '#10b981' : '#f43f5e' }}>
                {gapPct >= 0 ? '+' : ''}{gapPct.toFixed(1)}%
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4, color: isUnderValued ? '#10b981' : '#f43f5e' }}>
                {isUnderValued ? '🟢 Sous-évalué' : '🔴 Surévalué'} selon tes hypothèses
              </div>
            </div>
          </div>

          <p style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
            {ocf?.note || ''} Ce simulateur reflète mécaniquement les hypothèses saisies ci-dessus et constitue un outil de cadrage pédagogique.
          </p>
        </div>
      )}
    </div>
  );
};

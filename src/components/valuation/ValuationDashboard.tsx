'use client';

import React, { useState } from 'react';
import {
  VALUATION_STOCKS,
  VALUATION_STOCK_KEYS,
  VALUATION_SECTIONS,
} from '@/data/valuationData';
import { computeStockValuation } from '@/engines/valuationEngine';
import { ValuationChart } from './ValuationChart';
import { ValuationOverviewMatrix } from './ValuationOverviewMatrix';
import { ValuationHistoryPanel } from './ValuationHistoryPanel';
import { ValuationConsensusCard } from './ValuationConsensusCard';
import { ValuationAIDiagnostic } from './ValuationAIDiagnostic';
import { ValuationSimulator } from './ValuationSimulator';

export const ValuationDashboard: React.FC = () => {
  const [activeKey, setActiveKey] = useState<string>(VALUATION_STOCK_KEYS[0]);
  const [activeView, setActiveView] = useState<'detail' | 'matrix'>('detail');
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const stock = VALUATION_STOCKS[activeKey] || VALUATION_STOCKS[VALUATION_STOCK_KEYS[0]];
  const val = computeStockValuation(stock);

  const currentIndex = VALUATION_STOCK_KEYS.indexOf(activeKey);

  const handlePrev = () => {
    const nextIdx = (currentIndex - 1 + VALUATION_STOCK_KEYS.length) % VALUATION_STOCK_KEYS.length;
    setActiveKey(VALUATION_STOCK_KEYS[nextIdx]);
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % VALUATION_STOCK_KEYS.length;
    setActiveKey(VALUATION_STOCK_KEYS[nextIdx]);
  };

  const filteredSections = VALUATION_SECTIONS.map((sec) => ({
    ...sec,
    keys: sec.keys.filter((k) => {
      const s = VALUATION_STOCKS[k];
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.tick.toLowerCase().includes(q) ||
        s.shortTick.toLowerCase().includes(q)
      );
    }),
  })).filter((sec) => sec.keys.length > 0);

  const dotClass =
    stock.story === 'good' ? 'val-dot-good' : stock.story === 'bad' ? 'val-dot-bad' : 'val-dot-warn';
  const badgeSignalClass =
    val.signalClass === 'good'
      ? 'val-badge-good'
      : val.signalClass === 'bad'
      ? 'val-badge-bad'
      : 'val-badge-warn';

  return (
    <div className="val-container">
      {/* ── App Header ── */}
      <header className="val-header">
        <div>
          <div className="val-header-subtitle">
            <span className="val-pulse-dot" />
            <span>Cours de Bourse vs Fondamentaux Réels · Mise à jour : 16 août 2026</span>
          </div>
          <h1 className="val-title">
            <span>Prix</span> <span className="val-title-neq">≠</span> <span>Valeur</span>
          </h1>
          <p className="val-header-desc">
            À long terme, le cours d&apos;une action (<span style={{ color: '#f59e0b', fontWeight: 600 }}>en orange</span>) tend à suivre la trajectoire de ses résultats réels (<span style={{ color: '#06b6d4', fontWeight: 600 }}>BPA ou Chiffre d&apos;Affaires en bleu</span>). Vingt valeurs analysées avec mémoire temporelle, consensus et IA.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="val-nav-tabs">
          <button
            onClick={() => setActiveView('detail')}
            className={`val-nav-tab ${activeView === 'detail' ? 'active-detail' : ''}`}
          >
            <span>📄 Fiche Détaillée</span>
          </button>
          <button
            onClick={() => setActiveView('matrix')}
            className={`val-nav-tab ${activeView === 'matrix' ? 'active-matrix' : ''}`}
          >
            <span>📊 Matrice 20 Valeurs</span>
          </button>
        </div>
      </header>

      {/* ── Ticker Selector Bar ── */}
      <div className="val-ticker-bar">
        <button onClick={handlePrev} className="val-ticker-btn-arrow" title="Valeur précédente">
          ‹
        </button>

        <button onClick={() => setIsPickerOpen(true)} className="val-ticker-pill">
          <div className="val-ticker-pill-info">
            <span className={`val-dot ${dotClass}`} />
            <div>
              <span className="val-ticker-name" style={{ marginRight: 8 }}>
                {stock.name}
              </span>
              <span className="val-ticker-code">{stock.tick}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`val-badge ${badgeSignalClass}`}>
              {val.signal} ({val.gapPct >= 0 ? '+' : ''}
              {val.gapPct.toFixed(0)}%)
            </span>
            <span style={{ color: '#64748b', fontSize: 12 }}>▾</span>
          </div>
        </button>

        <button onClick={handleNext} className="val-ticker-btn-arrow" title="Valeur suivante">
          ›
        </button>
      </div>

      {/* ── Modal Picker ── */}
      {isPickerOpen && (
        <div onClick={() => setIsPickerOpen(false)} className="val-modal-backdrop">
          <div onClick={(e) => e.stopPropagation()} className="val-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontFamily: 'JetBrains Mono, monospace', color: '#ffffff', textTransform: 'uppercase' }}>
                Choisir une valeur parmi les 20
              </h3>
              <button
                onClick={() => setIsPickerOpen(false)}
                className="val-btn"
                style={{ padding: '4px 10px' }}
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom ou ticker (ex: Microsoft, META, RKLB)..."
              className="val-input"
              autoFocus
            />

            <div className="val-modal-body">
              {filteredSections.map((sec) => (
                <div key={sec.title}>
                  <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
                    {sec.title}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                    {sec.keys.map((k) => {
                      const s = VALUATION_STOCKS[k];
                      const v = computeStockValuation(s);
                      const isSel = k === activeKey;
                      const sDot =
                        s.story === 'good' ? 'val-dot-good' : s.story === 'bad' ? 'val-dot-bad' : 'val-dot-warn';
                      const sBadge =
                        v.signalClass === 'good'
                          ? 'val-badge-good'
                          : v.signalClass === 'bad'
                          ? 'val-badge-bad'
                          : 'val-badge-warn';

                      return (
                        <button
                          key={k}
                          onClick={() => {
                            setActiveKey(k);
                            setIsPickerOpen(false);
                            setActiveView('detail');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: isSel ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.06)',
                            background: isSel ? 'rgba(6, 182, 212, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={`val-dot ${sDot}`} />
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>{s.name}</div>
                              <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#64748b' }}>{s.shortTick}</div>
                            </div>
                          </div>

                          <span className={`val-badge ${sBadge}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                            {v.signal}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Main View Switcher ── */}
      {activeView === 'matrix' ? (
        <ValuationOverviewMatrix
          selectedKey={activeKey}
          onSelectStock={(k) => {
            setActiveKey(k);
            setActiveView('detail');
          }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* ── Main Stock Detail Card ── */}
          <div className="val-card">
            {/* Header & Badges */}
            <div className="val-card-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#ffffff' }}>{stock.name}</h2>
                  <span className="val-badge val-badge-cyan" style={{ fontSize: 12 }}>
                    {stock.tick}
                  </span>
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
                    {val.zScore >= 0 ? '+' : ''}{val.zScore.toFixed(2)}σ
                  </span>
                </div>
              </div>
            </div>

            {/* Price Targets Box */}
            <div className="val-subcard" style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Repères de Prix Quantitatifs (±1σ)
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#64748b' }}>
                  Position : <b style={{ color: '#ffffff' }}>{val.priceZoneLabel}</b>
                </span>
              </div>

              <div className="val-grid-3">
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>Repère Favorable (&lt; -1σ)</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
                    {val.lowerZone > 0 ? `${stock.currency === '$' ? '$' : ''}${val.lowerZone.toFixed(2)}${stock.currency === '€' ? ' €' : ''}` : 'N/A'}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Décote statistique</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>Valeur de Référence (Moyenne)</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
                    {val.fairValue > 0 ? `${stock.currency === '$' ? '$' : ''}${val.fairValue.toFixed(2)}${stock.currency === '€' ? ' €' : ''}` : 'N/A'}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{val.ratioName} moyen historique</div>
                </div>

                <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#f43f5e', fontFamily: 'JetBrains Mono, monospace' }}>Repère de Vigilance (&gt; +1σ)</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f43f5e', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
                    {val.upperZone > 0 ? `${stock.currency === '$' ? '$' : ''}${val.upperZone.toFixed(2)}${stock.currency === '€' ? ' €' : ''}` : 'N/A'}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Prime spéculative</div>
                </div>
              </div>

              <p style={{ fontSize: 11, color: '#64748b', margin: '10px 0 0 0', lineHeight: 1.5 }}>
                {val.methodExplanation}
              </p>
            </div>
          </div>

          {/* Module Consensus Analystes */}
          <ValuationConsensusCard stock={stock} val={val} />

          {/* Module Mémoire Temporelle (Snapshots & Historique) */}
          <ValuationHistoryPanel stock={stock} val={val} />

          {/* Module Diagnostic IA Gemini 3.7 Flash */}
          <ValuationAIDiagnostic stock={stock} val={val} />

          {/* Module Simulateur DCF / Multiple */}
          <ValuationSimulator stock={stock} val={val} />
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState, useMemo } from 'react';
import { VALUATION_STOCKS, VALUATION_STOCK_KEYS } from '@/data/valuationData';
import { computeStockValuation } from '@/engines/valuationEngine';
import { exportSnapshotsCSV } from '@/engines/valuationHistoryStore';

interface ValuationOverviewMatrixProps {
  onSelectStock: (key: string) => void;
  selectedKey: string;
}

type FilterCategory = 'all' | 'good_signal' | 'megacap' | 'growth_ai' | 'smallcap_fr' | 'high_upside';
type SortField = 'name' | 'signal' | 'gapPct' | 'upside' | 'cagr';

export const ValuationOverviewMatrix: React.FC<ValuationOverviewMatrixProps> = ({
  onSelectStock,
  selectedKey,
}) => {
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortField>('upside');
  const [sortDesc, setSortDesc] = useState<boolean>(true);

  // Pré-calcul de l'ensemble des 20 valeurs
  const items = useMemo(() => {
    return VALUATION_STOCK_KEYS.map((key) => {
      const stock = VALUATION_STOCKS[key];
      const val = computeStockValuation(stock);
      return { stock, val };
    });
  }, []);

  const filteredItems = useMemo(() => {
    let result = items.filter(({ stock, val }) => {
      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = stock.name.toLowerCase().includes(q);
        const matchTick = stock.tick.toLowerCase().includes(q) || stock.shortTick.toLowerCase().includes(q);
        if (!matchName && !matchTick) return false;
      }

      // Filter category
      if (filter === 'good_signal') {
        return val.signal === 'Favorable';
      }
      if (filter === 'megacap') {
        return stock.category === 'megacap';
      }
      if (filter === 'growth_ai') {
        return stock.category === 'growth_ai';
      }
      if (filter === 'smallcap_fr') {
        return stock.category === 'smallcap_fr';
      }
      if (filter === 'high_upside') {
        return val.analystUpsidePct >= 20;
      }
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') {
        cmp = a.stock.name.localeCompare(b.stock.name);
      } else if (sortBy === 'signal') {
        const order: Record<string, number> = { Favorable: 1, Neutre: 2, Vigilance: 3, Défavorable: 4, 'Non calculable': 5 };
        cmp = (order[a.val.signal] || 9) - (order[b.val.signal] || 9);
      } else if (sortBy === 'gapPct') {
        cmp = a.val.gapPct - b.val.gapPct;
      } else if (sortBy === 'upside') {
        cmp = a.val.analystUpsidePct - b.val.analystUpsidePct;
      } else if (sortBy === 'cagr') {
        cmp = (a.val.growthCagrPct || 0) - (b.val.growthCagrPct || 0);
      }
      return sortDesc ? -cmp : cmp;
    });

    return result;
  }, [items, filter, search, sortBy, sortDesc]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(field);
      setSortDesc(true);
    }
  };

  const handleExportCSV = () => {
    const csv = exportSnapshotsCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riane_valuation_20_stocks_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="val-card">
      {/* Header & Controls */}
      <div className="val-card-header">
        <div>
          <div className="val-card-title">
            <span>📊 Vue d&apos;Ensemble Comparative</span>
            <span className="val-badge val-badge-neutral">20 Valeurs</span>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0 0' }}>
            Comparez en un coup d&apos;œil les signaux de valorisation (BPA &amp; CA), les multiples historiques et le consensus des analystes.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={handleExportCSV} className="val-btn" title="Exporter l'historique et la matrice en CSV">
            <span>📥 Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, margin: '16px 0' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'Toutes (20)' },
            { key: 'good_signal', label: '🟢 Favorables' },
            { key: 'growth_ai', label: '💡 Croissance IA' },
            { key: 'megacap', label: '🇺🇸 Méga-Caps' },
            { key: 'smallcap_fr', label: '🇫🇷 Small-Caps FR' },
            { key: 'high_upside', label: '📈 Upside >+20%' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as FilterCategory)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                border: filter === tab.key ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                background: filter === tab.key ? '#10b981' : 'rgba(15, 23, 42, 0.6)',
                color: filter === tab.key ? '#022214' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ minWidth: 220, position: 'relative' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher ticker / nom..."
            className="val-input"
            style={{ padding: '6px 10px', fontSize: 11 }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table Matrix */}
      <div className="val-table-wrapper">
        <table className="val-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="sortable">
                Valeur / Ticker {sortBy === 'name' ? (sortDesc ? '▼' : '▲') : ''}
              </th>
              <th>Modèle Retenu</th>
              <th>Cours Actuel</th>
              <th onClick={() => handleSort('signal')} className="sortable">
                Signal Interne {sortBy === 'signal' ? (sortDesc ? '▼' : '▲') : ''}
              </th>
              <th onClick={() => handleSort('gapPct')} className="sortable">
                Écart vs Moyenne {sortBy === 'gapPct' ? (sortDesc ? '▼' : '▲') : ''}
              </th>
              <th>Multiple (P/E ou P/S)</th>
              <th onClick={() => handleSort('cagr')} className="sortable">
                Croissance (CAGR) {sortBy === 'cagr' ? (sortDesc ? '▼' : '▲') : ''}
              </th>
              <th onClick={() => handleSort('upside')} className="sortable">
                Consensus &amp; Upside {sortBy === 'upside' ? (sortDesc ? '▼' : '▲') : ''}
              </th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(({ stock, val }) => {
              const isSelected = stock.key === selectedKey;
              const badgeClass =
                val.signalClass === 'good'
                  ? 'val-badge-good'
                  : val.signalClass === 'bad'
                  ? 'val-badge-bad'
                  : 'val-badge-warn';

              return (
                <tr
                  key={stock.key}
                  onClick={() => onSelectStock(stock.key)}
                  className={isSelected ? 'selected-row' : ''}
                >
                  {/* Name & Ticker */}
                  <td>
                    <div style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{stock.name}</span>
                      <span className="val-badge val-badge-neutral" style={{ fontSize: 10, padding: '1px 5px' }}>
                        {stock.shortTick}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{stock.categoryLabel}</div>
                  </td>

                  {/* Model Type */}
                  <td>
                    <span
                      className="val-badge"
                      style={{
                        fontSize: 10,
                        padding: '2px 6px',
                        background: stock.metric === 'eps' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        color: stock.metric === 'eps' ? '#06b6d4' : '#f59e0b',
                        borderColor: stock.metric === 'eps' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(245, 158, 11, 0.3)',
                      }}
                    >
                      {stock.metric === 'eps' ? 'BPA & P/E' : 'CA & P/S'}
                    </span>
                  </td>

                  {/* Current Price */}
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: '#ffffff' }}>
                    {stock.currency === '$' ? '$' : ''}
                    {val.currentPrice.toFixed(2)}
                    {stock.currency === '€' ? ' €' : ''}
                  </td>

                  {/* Internal Signal */}
                  <td>
                    <span className={`val-badge ${badgeClass}`}>
                      {val.signal}
                    </span>
                  </td>

                  {/* Gap vs Average */}
                  <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: val.gapPct < -10 ? '#10b981' : val.gapPct > 15 ? '#f43f5e' : '#f59e0b',
                      }}
                    >
                      {val.gapPct >= 0 ? '+' : ''}
                      {val.gapPct.toFixed(0)}%
                    </span>
                    <span style={{ fontSize: 10, color: '#64748b', display: 'block' }}>
                      {val.zScore ? `(${val.zScore >= 0 ? '+' : ''}${val.zScore.toFixed(1)}σ)` : ''}
                    </span>
                  </td>

                  {/* Multiple */}
                  <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    <div style={{ color: '#ffffff', fontWeight: 600 }}>
                      {val.currentRatio.toFixed(1)}×{' '}
                      <span style={{ color: '#64748b', fontSize: 10 }}>({val.ratioName})</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>Moy: {val.avgRatio.toFixed(1)}×</div>
                  </td>

                  {/* Growth CAGR */}
                  <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {val.growthCagrPct !== null ? (
                      <span style={{ color: '#10b981', fontWeight: 600 }}>
                        +{val.growthCagrPct.toFixed(1)}%/an
                      </span>
                    ) : (
                      <span style={{ color: '#64748b' }}>—</span>
                    )}
                  </td>

                  {/* Analyst Consensus & Upside */}
                  <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#ffffff', fontWeight: 600 }}>
                        {stock.currency === '$' ? '$' : ''}
                        {val.analystMean.toFixed(0)}
                        {stock.currency === '€' ? ' €' : ''}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: val.analystUpsidePct >= 15 ? '#10b981' : val.analystUpsidePct < 0 ? '#f43f5e' : '#f59e0b',
                        }}
                      >
                        ({val.analystUpsidePct >= 0 ? '+' : ''}
                        {val.analystUpsidePct.toFixed(0)}%)
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>
                      {stock.consensus.rating} ({stock.consensus.analystCount} avis)
                    </div>
                  </td>

                  {/* Action */}
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStock(stock.key);
                      }}
                      className="val-btn val-btn-cyan"
                      style={{ padding: '3px 8px', fontSize: 10 }}
                    >
                      Fiche ➔
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

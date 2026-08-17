'use client';

import React, { useState, useMemo } from 'react';
import { VALUATION_STOCKS, VALUATION_STOCK_KEYS } from '@/data/valuationData';
import { computeStockValuation } from '@/engines/valuationEngine';
import { exportSnapshotsCSV } from '@/engines/valuationHistoryStore';
import { ValuationMatrixFilterBar, type FilterCategory } from './ValuationMatrixFilterBar';
import { ValuationMatrixRow } from './ValuationMatrixRow';

interface ValuationOverviewMatrixProps {
  onSelectStock: (key: string) => void;
  selectedKey: string;
}

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
      <ValuationMatrixFilterBar
        filter={filter}
        setFilter={setFilter}
        search={search}
        setSearch={setSearch}
      />

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
            {filteredItems.map(({ stock, val }) => (
              <ValuationMatrixRow
                key={stock.key}
                stock={stock}
                val={val}
                isSelected={stock.key === selectedKey}
                onSelectStock={onSelectStock}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

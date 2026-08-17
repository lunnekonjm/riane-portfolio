'use client';

import React from 'react';
import { VALUATION_STOCKS, VALUATION_STOCK_KEYS } from '@/data/valuationData';
import { computeStockValuation } from '@/engines/valuationEngine';

interface FilteredSection {
  title: string;
  keys: string[];
}

interface ValuationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeKey: string;
  onSelectKey: (k: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterHeldOnly: boolean;
  setFilterHeldOnly: (val: boolean) => void;
  totalHeldInValuation: number;
  filteredSections: FilteredSection[];
  isStockHeld: (k: string) => boolean;
}

export function ValuationPickerModal({
  isOpen,
  onClose,
  activeKey,
  onSelectKey,
  searchQuery,
  setSearchQuery,
  filterHeldOnly,
  setFilterHeldOnly,
  totalHeldInValuation,
  filteredSections,
  isStockHeld,
}: ValuationPickerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 840, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#ffffff' }}>
            Sélectionner une Valeur ({VALUATION_STOCK_KEYS.length} analysées)
          </h3>
          <button
            type="button"
            className="val-btn"
            style={{ padding: '4px 10px' }}
            onClick={onClose}
          >
            ✕ Fermer
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Rechercher par nom, ticker (ex: MSFT, OKLO, OVH)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
            style={{ flex: 1, minWidth: 200, fontSize: 13 }}
            autoFocus
          />
          {totalHeldInValuation > 0 && (
            <button
              type="button"
              className={`btn btn-sm ${filterHeldOnly ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterHeldOnly(!filterHeldOnly)}
              style={{ fontSize: 12 }}
            >
              💼 Mes actifs ({totalHeldInValuation})
            </button>
          )}
        </div>

        {/* Sections List */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>
          {filteredSections.map((sec) => (
            <div key={sec.title} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#06b6d4', marginBottom: 8, fontFamily: 'JetBrains Mono, monospace' }}>
                {sec.title}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                {sec.keys.map((k) => {
                  const s = VALUATION_STOCKS[k];
                  const v = computeStockValuation(s);
                  const isHeld = isStockHeld(k);
                  const isSel = k === activeKey;
                  const sBadge =
                    v.signalClass === 'good'
                      ? 'val-badge-good'
                      : v.signalClass === 'bad'
                      ? 'val-badge-bad'
                      : 'val-badge-warn';

                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        onSelectKey(k);
                        onClose();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: isSel ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-tertiary)',
                        border: `1px solid ${isSel ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                        borderRadius: 8,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          className={`val-dot ${
                            s.story === 'good' ? 'val-dot-good' : s.story === 'bad' ? 'val-dot-bad' : 'val-dot-warn'
                          }`}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: isSel ? '#06b6d4' : '#ffffff' }}>
                            {s.name} {isHeld && '💼'}
                          </div>
                          <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
                            {s.shortTick} · {s.categoryLabel}
                          </div>
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
  );
}

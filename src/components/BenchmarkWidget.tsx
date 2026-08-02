'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getQuote } from '@/services/market-data/provider';

/**
 * Portefeuille Étalon Boursobank
 * Complètement isolé du portefeuille principal — sert uniquement de référence.
 */

interface BenchmarkPosition {
  name: string;
  ticker: string;
  quantity: number;
  avgPrice: number;
  purchaseDate: string;
  currentPrice: number | null;
  loading: boolean;
}

const INITIAL_BENCHMARK: BenchmarkPosition[] = [
  {
    name: 'Indépendance Europe Small A',
    ticker: '0P0001DKPM.F',
    quantity: 10,
    avgPrice: 240.59,
    purchaseDate: '2026-07-31',
    currentPrice: null,
    loading: false,
  },
  {
    name: 'Memscap',
    ticker: 'MEMS.PA',
    quantity: 243,
    avgPrice: 4.965,
    purchaseDate: '2026-07-31',
    currentPrice: null,
    loading: false,
  },
  {
    name: 'Riber',
    ticker: 'ALRIB.PA',
    quantity: 128,
    avgPrice: 9.38,
    purchaseDate: '2026-07-31',
    currentPrice: null,
    loading: false,
  },
];

interface BenchmarkWidgetProps {
  visible: boolean;
  onClose: () => void;
}

export default function BenchmarkWidget({ visible, onClose }: BenchmarkWidgetProps) {
  const [positions, setPositions] = useState<BenchmarkPosition[]>(INITIAL_BENCHMARK);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPrices = useCallback(async () => {
    setRefreshing(true);
    const updated = [...positions];

    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], loading: true };
      setPositions([...updated]);

      try {
        const quote = await getQuote(updated[i].ticker);
        updated[i] = { ...updated[i], currentPrice: quote.price, loading: false };
      } catch {
        updated[i] = { ...updated[i], loading: false };
      }
      setPositions([...updated]);
    }

    setLastRefresh(Date.now());
    setRefreshing(false);
  }, []);

  // Auto-fetch on first open
  useEffect(() => {
    if (visible && lastRefresh === null) {
      fetchPrices();
    }
  }, [visible, lastRefresh, fetchPrices]);

  if (!visible) return null;

  const totalInvested = positions.reduce((s, p) => s + p.quantity * p.avgPrice, 0);
  const totalCurrent = positions.reduce((s, p) => s + p.quantity * (p.currentPrice ?? p.avgPrice), 0);
  const allLoaded = positions.every((p) => p.currentPrice !== null);
  const pnl = totalCurrent - totalInvested;
  const pnlPct = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 380,
        maxHeight: '70vh',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-medium)',
        borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        zIndex: 9999,
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
      }}
      id="benchmark-widget"
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(139, 92, 246, 0.06) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>🧪</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
              ÉTALON BOURSOBANK
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Portefeuille Virtuel de Référence
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={fetchPrices}
            disabled={refreshing}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-cyan)',
              cursor: refreshing ? 'wait' : 'pointer',
              fontSize: 14,
              padding: 4,
              borderRadius: 6,
              opacity: refreshing ? 0.5 : 1,
            }}
            title="Actualiser les cours"
          >
            🔄
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              fontSize: 16,
              padding: '2px 6px',
              borderRadius: 6,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Summary Bar */}
      <div
        style={{
          padding: '10px 16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(0,0,0,0.15)',
        }}
      >
        <div>
          <div style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Investi</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            {totalInvested.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Valeur</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: allLoaded ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
            {allLoaded ? totalCurrent.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €' : '...'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>P/L</div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: allLoaded ? (pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)') : 'var(--text-tertiary)',
            }}
          >
            {allLoaded ? `${pnl >= 0 ? '+' : ''}${pnl.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)` : '...'}
          </div>
        </div>
      </div>

      {/* Positions List */}
      <div style={{ overflowY: 'auto', maxHeight: 'calc(70vh - 140px)' }}>
        {positions.map((p) => {
          const invested = p.quantity * p.avgPrice;
          const current = p.quantity * (p.currentPrice ?? p.avgPrice);
          const linePnl = current - invested;
          const linePnlPct = invested > 0 ? (linePnl / invested) * 100 : 0;
          const hasPrice = p.currentPrice !== null;

          return (
            <div
              key={p.ticker}
              style={{
                padding: '10px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'flex', gap: 8, marginTop: 2 }}>
                  <span className="mono">{p.ticker}</span>
                  <span>×{p.quantity}</span>
                  <span>PRU {p.avgPrice.toFixed(3)} €</span>
                </div>
              </div>

              <div style={{ textAlign: 'right', minWidth: 90 }}>
                {p.loading ? (
                  <div className="loading-spinner" style={{ width: 14, height: 14, marginLeft: 'auto' }} />
                ) : hasPrice ? (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {current.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: linePnl >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)',
                      }}
                    >
                      {linePnl >= 0 ? '+' : ''}{linePnl.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                      <span style={{ marginLeft: 4, opacity: 0.8 }}>
                        ({linePnlPct >= 0 ? '+' : ''}{linePnlPct.toFixed(1)}%)
                      </span>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
          Achat : 31/07/2026 • PEA-PME
        </div>
        {lastRefresh && (
          <div style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
            MAJ : {new Date(lastRefresh).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}

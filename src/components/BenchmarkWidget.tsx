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
    avgPrice: 4.9647,
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

  const [isEditing, setIsEditing] = useState(false);

  if (!visible) return null;

  const totalInvested = positions.reduce((s, p) => s + p.quantity * p.avgPrice, 0);
  const totalCurrent = positions.reduce((s, p) => s + p.quantity * (p.currentPrice ?? p.avgPrice), 0);
  const allLoaded = positions.every((p) => p.currentPrice !== null);
  const pnl = totalCurrent - totalInvested;
  const pnlPct = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

  const formatMoney = (amount: number) =>
    amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 380,
        maxHeight: '75vh',
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
          <button
            onClick={() => setIsEditing((prev) => !prev)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              padding: 0,
            }}
            title={isEditing ? 'Valider les modifications' : 'Modifier les PRU et quantités'}
          >
            {isEditing ? '💾' : '✏️'}
          </button>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
              ÉTALON BOURSOBANK
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
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
              fontSize: 16,
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
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 18,
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
          padding: '12px 16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10,
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(0,0,0,0.25)',
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Investi</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatMoney(totalInvested)} €
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Valeur</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: allLoaded ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            {allLoaded ? formatMoney(totalCurrent) + ' €' : '...'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>P/L</div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: allLoaded ? (pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)') : 'var(--text-secondary)',
            }}
          >
            {allLoaded ? `${pnl >= 0 ? '+' : ''}${formatMoney(pnl)} € (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)` : '...'}
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
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8, marginTop: 3, alignItems: 'center' }}>
                  <span className="mono" style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{p.ticker}</span>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>Qté:</span>
                      <input
                        type="number"
                        value={p.quantity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setPositions(positions.map((pos) => (pos.ticker === p.ticker ? { ...pos, quantity: val } : pos)));
                        }}
                        style={{ width: 50, fontSize: 'var(--text-xs)', padding: '2px 4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-medium)', borderRadius: 4, color: 'var(--text-primary)' }}
                      />
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>PRU:</span>
                      <input
                        type="number"
                        step="0.001"
                        value={p.avgPrice}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setPositions(positions.map((pos) => (pos.ticker === p.ticker ? { ...pos, avgPrice: val } : pos)));
                        }}
                        style={{ width: 60, fontSize: 'var(--text-xs)', padding: '2px 4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-medium)', borderRadius: 4, color: 'var(--text-primary)' }}
                      />
                    </div>
                  ) : (
                    <>
                      <span>×{p.quantity}</span>
                      <span>PRU {p.avgPrice.toFixed(3)} €</span>
                    </>
                  )}
                </div>
              </div>

              {/* Price & PnL */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: hasPrice ? 'var(--text-primary)' : 'var(--text-secondary)' }} className="mono">
                  {hasPrice ? `${(p.currentPrice! * p.quantity).toFixed(2)} €` : 'Chargement...'}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: hasPrice
                      ? linePnl >= 0
                        ? 'var(--accent-green)'
                        : 'var(--accent-rose)'
                      : 'var(--text-secondary)',
                  }}
                >
                  {hasPrice
                    ? `${linePnl >= 0 ? '+' : ''}${formatMoney(linePnl)} € (${linePnlPct >= 0 ? '+' : ''}${linePnlPct.toFixed(1)}%)`
                    : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Achat : 31/07/2026 • PEA-PME Boursobank (PRU frais inclus)
        </div>
        {lastRefresh && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 500 }}>
            MAJ : {new Date(lastRefresh).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';

interface PositionCoreInputsSectionProps {
  envelope: Position['envelope'];
  assetType: Position['assetType'];
  currency?: Position['currency'];
  ticker: string;
  onTickerChange: (ticker: string) => void;
  name: string;
  onNameChange: (name: string) => void;
  quantityInput: string;
  onQuantityChange: (val: string) => void;
  avgPriceInput: string;
  onAvgPriceChange: (val: string) => void;
  currentPriceInput: string;
  onCurrentPriceChange: (val: string) => void;
}

export default function PositionCoreInputsSection({
  envelope,
  assetType,
  currency = 'EUR',
  ticker,
  onTickerChange,
  name,
  onNameChange,
  quantityInput,
  onQuantityChange,
  avgPriceInput,
  onAvgPriceChange,
  currentPriceInput,
  onCurrentPriceChange,
}: PositionCoreInputsSectionProps) {
  const isCrypto = envelope === 'CRYPTO' || assetType === 'CRYPTO';
  const currSymbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';

  return (
    <>
      {/* Row 1: Ticker + Name */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Ticker Officiel *</label>
          <input
            className="input mono"
            value={ticker}
            onChange={(e) => onTickerChange(e.target.value.toUpperCase())}
            placeholder="CW8.PA, PUST.PA, MSFT..."
            required
            id="input-ticker"
          />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label className="form-label">Nom Complet *</label>
          <input
            className="input"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Amundi PEA Global MSCI ACWI..."
            required
            id="input-name"
          />
        </div>
      </div>

      {/* Row 3: Quantity + Avg Price + Current Price */}
      <div className="form-row" style={{ marginTop: 16, marginBottom: 16 }}>
        <div className="form-group" style={{ flex: 1.2 }}>
          <label className="form-label">
            Quantité {isCrypto ? '(Tokens / Fractions)' : assetType === 'STOCK' ? '(Actions)' : '(Parts)'} *
          </label>

          {/* Quick fraction chips for Crypto positions */}
          {isCrypto && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 2 }}>Fractions rapides :</span>
              {['0.001', '0.005', '0.01', '0.05', '0.1', '0.5', '1'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onQuantityChange(val)}
                  style={{
                    padding: '2px 6px',
                    fontSize: 10.5,
                    borderRadius: 4,
                    border: '1px solid var(--border-subtle)',
                    background: quantityInput === val ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-tertiary)',
                    color: quantityInput === val ? 'var(--accent-amber)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {val}
                </button>
              ))}
            </div>
          )}

          <input
            className="input mono"
            type="text"
            inputMode="decimal"
            value={quantityInput}
            onChange={(e) => onQuantityChange(e.target.value)}
            placeholder={isCrypto ? 'ex: 0.001' : 'ex: 10'}
            id="input-quantity"
          />
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">PRU d&apos;Achat ({currSymbol})</label>
          <input
            className="input mono"
            type="text"
            inputMode="decimal"
            value={avgPriceInput}
            onChange={(e) => onAvgPriceChange(e.target.value)}
            placeholder="0.00"
            id="input-avg-price"
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
            Prix de revient unitaire moyen.
          </span>
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Prix actuel ({currSymbol})</label>
          <input
            className="input mono"
            type="text"
            inputMode="decimal"
            value={currentPriceInput}
            onChange={(e) => onCurrentPriceChange(e.target.value)}
            placeholder="Auto-refresh"
            id="input-current-price"
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
            Cotation marché en direct.
          </span>
        </div>
      </div>
    </>
  );
}

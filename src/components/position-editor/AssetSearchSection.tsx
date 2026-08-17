'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';
import { ASSET_REGISTRY, type RegisteredAsset } from '@/data/assetRegistry';
import { AssetSearchDropdown } from './AssetSearchDropdown';
import { AssetSearchFeedback } from './AssetSearchFeedback';

interface AssetSearchSectionProps {
  envelope: Position['envelope'];
  currentTicker: string;
  tickerSearchInput: string;
  onSearchInputChange: (query: string) => void;
  onClearSearch: () => void;
  searchResults: RegisteredAsset[];
  showDropdown: boolean;
  onCloseDropdown: () => void;
  onSelectRegisteredAsset: (asset: RegisteredAsset) => void;
  onSelectTickerManual: (ticker: string) => void;
  onVerifyManualTicker: () => void;
  isVerifyingTicker: boolean;
  isSearchingLive: boolean;
  verifiedQuoteText: string | null;
  didYouMeanAsset: RegisteredAsset | null;
  tickerError: string | null;
}

export default function AssetSearchSection({
  envelope,
  currentTicker,
  tickerSearchInput,
  onSearchInputChange,
  onClearSearch,
  searchResults,
  showDropdown,
  onCloseDropdown,
  onSelectRegisteredAsset,
  onSelectTickerManual,
  onVerifyManualTicker,
  isVerifyingTicker,
  isSearchingLive,
  verifiedQuoteText,
  didYouMeanAsset,
  tickerError,
}: AssetSearchSectionProps) {
  const isCrypto = envelope === 'CRYPTO';

  const popularChips = isCrypto
    ? [
        { label: '₿ Bitcoin (BTC)', ticker: 'BTC-EUR' },
        { label: 'Ξ Ethereum (ETH)', ticker: 'ETH-EUR' },
        { label: '◎ Solana (SOL)', ticker: 'SOL-EUR' },
        { label: '🟡 Binance Coin (BNB)', ticker: 'BNB-EUR' },
        { label: '✕ Ripple (XRP)', ticker: 'XRP-EUR' },
        { label: '₳ Cardano (ADA)', ticker: 'ADA-EUR' },
        { label: '🔺 Avalanche (AVAX)', ticker: 'AVAX-EUR' },
      ]
    : [
        { label: 'CW8 (MSCI World)', ticker: 'CW8.PA' },
        { label: 'PUST (Nasdaq-100)', ticker: 'PUST.PA' },
        { label: 'GPEA (MSCI ACWI)', ticker: 'GPEA.PA' },
        { label: 'LVMH', ticker: 'MC.PA' },
        { label: 'Air Liquide', ticker: 'AI.PA' },
        { label: 'Kalray (PEA-PME)', ticker: 'ALKAL.PA' },
        { label: 'Microsoft', ticker: 'MSFT' },
        { label: 'NVIDIA', ticker: 'NVDA' },
        { label: 'Bitcoin (BTC)', ticker: 'BTC-EUR' },
      ];

  return (
    <div className="form-group" style={{ position: 'relative', marginBottom: 20 }}>
      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>🔍</span> Recherche &amp; Autocomplétion d&apos;Actif (Nom, Ticker, Code ISIN) *
        </span>
        {(isVerifyingTicker || isSearchingLive) && (
          <span style={{ fontSize: 12, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="loading-spinner" style={{ width: 12, height: 12 }} />
            {isVerifyingTicker ? 'Vérification du cours en direct...' : 'Recherche de l\'actif...'}
          </span>
        )}
      </label>

      {/* Quick popular chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 2 }}>Populaires :</span>
        {popularChips.map((chip) => (
          <button
            key={chip.ticker}
            type="button"
            onClick={() => {
              const match = ASSET_REGISTRY.find((a) => a.ticker === chip.ticker);
              if (match) {
                onSelectRegisteredAsset(match);
              } else {
                onSelectTickerManual(chip.ticker);
                onVerifyManualTicker();
              }
            }}
            className="badge"
            style={{
              cursor: 'pointer',
              fontSize: 11,
              padding: '3px 8px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-cyan)';
              e.currentTarget.style.color = 'var(--accent-cyan)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Main Search Input + Verification Button */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            className="input"
            value={tickerSearchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) onCloseDropdown();
            }}
            placeholder="Tapez un Nom (ex: LVMH, Amundi World), Ticker (ex: CW8, PUST, MSFT, BTC) ou code ISIN (ex: FR0010315770)..."
            id="input-asset-search"
            style={{ width: '100%', paddingRight: tickerSearchInput ? 32 : 12 }}
          />
          {tickerSearchInput && (
            <button
              type="button"
              onClick={onClearSearch}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 14,
              }}
              aria-label="Effacer la recherche"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onVerifyManualTicker}
          disabled={isVerifyingTicker || (!currentTicker && !tickerSearchInput)}
          style={{ whiteSpace: 'nowrap', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          id="btn-verify-ticker"
        >
          {isVerifyingTicker ? (
            <>
              <span className="loading-spinner" style={{ width: 12, height: 12 }} />
              <span>Vérification...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>Vérifier cours direct</span>
            </>
          )}
        </button>
      </div>

      {/* Dropdown Suggestions */}
      <AssetSearchDropdown
        searchResults={searchResults}
        showDropdown={showDropdown}
        onCloseDropdown={onCloseDropdown}
        onSelectRegisteredAsset={onSelectRegisteredAsset}
      />

      {/* Status Feedback / Verified Badge / Error Card / Suggestion */}
      <AssetSearchFeedback
        verifiedQuoteText={verifiedQuoteText}
        didYouMeanAsset={didYouMeanAsset}
        tickerError={tickerError}
        onSelectRegisteredAsset={onSelectRegisteredAsset}
      />
    </div>
  );
}

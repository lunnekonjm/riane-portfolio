'use client';

import React from 'react';
import type { RegisteredAsset } from '@/data/assetRegistry';

interface AssetSearchFeedbackProps {
  verifiedQuoteText: string | null;
  didYouMeanAsset: RegisteredAsset | null;
  tickerError: string | null;
  onSelectRegisteredAsset: (asset: RegisteredAsset) => void;
}

export function AssetSearchFeedback({
  verifiedQuoteText,
  didYouMeanAsset,
  tickerError,
  onSelectRegisteredAsset,
}: AssetSearchFeedbackProps) {
  return (
    <>
      {/* Status Feedback / Verified Badge */}
      {verifiedQuoteText && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--accent-emerald)',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>✓</span>
          <span style={{ fontWeight: 600 }}>{verifiedQuoteText}</span>
        </div>
      )}

      {/* Did you mean suggestion */}
      {didYouMeanAsset && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--accent-cyan)',
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
            marginTop: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div>
            <strong>💡 Actif officiel détecté :</strong> {didYouMeanAsset.name} ({didYouMeanAsset.ticker}) — {didYouMeanAsset.exchange}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onSelectRegisteredAsset(didYouMeanAsset)}
            style={{ fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap' }}
          >
            Sélectionner cet actif
          </button>
        </div>
      )}

      {/* Ticker error message */}
      {tickerError && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--accent-rose)',
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>⚠️</span>
          <span style={{ fontWeight: 600 }}>{tickerError}</span>
        </div>
      )}
    </>
  );
}

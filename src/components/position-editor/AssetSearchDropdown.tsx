'use client';

import React from 'react';
import type { RegisteredAsset } from '@/data/assetRegistry';

interface AssetSearchDropdownProps {
  searchResults: RegisteredAsset[];
  showDropdown: boolean;
  onCloseDropdown: () => void;
  onSelectRegisteredAsset: (asset: RegisteredAsset) => void;
}

export function AssetSearchDropdown({
  searchResults,
  showDropdown,
  onCloseDropdown,
  onSelectRegisteredAsset,
}: AssetSearchDropdownProps) {
  if (!showDropdown || searchResults.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        zIndex: 200,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        maxHeight: 260,
        overflowY: 'auto',
        marginTop: 6,
      }}
    >
      <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>{searchResults.length} actif{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''} (Cliquez pour autocompléter)</span>
        <button
          type="button"
          onClick={onCloseDropdown}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11 }}
        >
          Fermer ✕
        </button>
      </div>
      {searchResults.map((asset) => (
        <div
          key={`${asset.ticker}-${asset.isin || ''}`}
          onClick={() => onSelectRegisteredAsset(asset)}
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong style={{ color: 'var(--accent-cyan)', fontSize: 14 }} className="mono">{asset.ticker}</strong>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{asset.name}</span>
            </div>
            {asset.isin && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }} className="mono">
                ISIN: {asset.isin}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className="badge badge-purple" style={{ fontSize: 10 }}>{asset.assetType}</span>
            <span className="badge badge-cyan" style={{ fontSize: 10 }}>{asset.envelope}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{asset.exchange}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

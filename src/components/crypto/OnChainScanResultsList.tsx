'use client';

import React from 'react';
import type { DiscoveredCryptoAsset } from '@/services/cryptoOnChainReader';

interface OnChainScanResultsListProps {
  scanning: boolean;
  hasScanned: boolean;
  scanResults: DiscoveredCryptoAsset[];
  toggleSelectAsset: (id: string) => void;
  toggleSelectAll: (selectAll: boolean) => void;
  showZeroValued: boolean;
  setShowZeroValued: (val: boolean) => void;
}

export function OnChainScanResultsList({
  scanning,
  hasScanned,
  scanResults,
  toggleSelectAsset,
  toggleSelectAll,
  showZeroValued,
  setShowZeroValued,
}: OnChainScanResultsListProps) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        minHeight: 180,
        maxHeight: 340,
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        padding: 12,
        background: 'var(--bg-tertiary)',
      }}
    >
      {scanning ? (
        <div style={{ textAlign: 'center', padding: '36px 12px' }}>
          <div className="loading-spinner" style={{ width: 32, height: 32, margin: '0 auto 12px auto' }} />
          <strong style={{ display: 'block', fontSize: 14, color: 'var(--text-primary)' }}>
            Interrogation des RPCs blockchain et valorisation en direct...
          </strong>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Scan d&apos;Ethereum, BNB Chain, Polygon, Solana, Bitcoin et jetons associés.
          </span>
        </div>
      ) : hasScanned && scanResults.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>🔍</span>
          <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: 14, marginBottom: 6 }}>
            Aucun solde actif détecté sur la blockchain pour cette adresse
          </strong>
          <p style={{ fontSize: 12, lineHeight: 1.5, maxWidth: 440, margin: '0 auto 14px auto', color: 'var(--text-secondary)' }}>
            Vérifiez que l&apos;adresse publique est exacte et contient des fonds sur Bitcoin, Ethereum, Solana, Polygon ou BSC.
          </p>

          <div
            style={{
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: 8,
              padding: '10px 14px',
              textAlign: 'left',
              fontSize: 12,
              margin: '0 auto 16px auto',
              maxWidth: 480,
            }}
          >
            <strong style={{ color: 'var(--accent-cyan)', display: 'block', marginBottom: 4 }}>
              💡 Cas particulier : Revolut X, Binance ou Exchange Centralisé (CEX)
            </strong>
            <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4, display: 'block' }}>
              Les « Adresses de dépôt » générées par Revolut X ou Binance sont des adresses d&apos;acheminement temporaires. Leur solde on-chain est généralement de <strong>0</strong> car les fonds sont mutualisés sur l&apos;exchange.
            </span>
          </div>
        </div>
      ) : !hasScanned ? (
        <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>💡</span>
          <span style={{ fontSize: 13 }}>
            Collez votre adresse publique ci-dessus pour récupérer automatiquement vos actifs on-chain et choisir lesquels ajouter à votre portefeuille.
          </span>
        </div>
      ) : (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
              paddingBottom: 6,
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
              {scanResults.length} actif{scanResults.length > 1 ? 's' : ''} trouvé{scanResults.length > 1 ? 's' : ''} on-chain
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, padding: '2px 8px' }}
                onClick={() => toggleSelectAll(true)}
              >
                Tout cocher
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, padding: '2px 8px' }}
                onClick={() => toggleSelectAll(false)}
              >
                Tout décocher
              </button>
            </div>
          </div>

          {(() => {
            const pricedAssets = scanResults.filter((a) => (a.valueEUR || 0) > 0.01 || a.priceEUR > 0);
            const unpricedAssets = scanResults.filter((a) => (a.valueEUR || 0) <= 0.01 && a.priceEUR === 0);

            const renderAssetItem = (asset: DiscoveredCryptoAsset) => (
              <div
                key={asset.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: asset.selected ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-secondary)',
                  border: `1px solid ${asset.selected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => toggleSelectAsset(asset.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={asset.selected}
                    onChange={() => toggleSelectAsset(asset.id)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: 'pointer', width: 16, height: 16 }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16 }}>{asset.chainIcon || '🪙'}</span>
                      <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{asset.name}</strong>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 600 }}>
                        {asset.symbol}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {asset.chainLabel}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <strong className="mono" style={{ fontSize: 14, color: 'var(--text-primary)', display: 'block' }}>
                    {asset.balance.toLocaleString('fr-FR', { maximumFractionDigits: 6 })} {asset.symbol}
                  </strong>
                  <span className="mono" style={{ fontSize: 11, color: asset.valueEUR > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)', fontWeight: 600 }}>
                    ≈ {(asset.valueEUR || asset.balance * asset.priceEUR).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              </div>
            );

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pricedAssets.map(renderAssetItem)}

                {unpricedAssets.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setShowZeroValued(!showZeroValued)}
                      style={{
                        width: '100%',
                        fontSize: 12,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '6px 12px',
                        border: '1px dashed var(--border-subtle)',
                      }}
                    >
                      <span>{showZeroValued ? '▼ Masquer' : '▶ Afficher'} {unpricedAssets.length} tokens secondaires & NFTs sans cotation (0,00 €)</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{unpricedAssets.filter((a) => a.selected).length} cochés</span>
                    </button>

                    {showZeroValued && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                        {unpricedAssets.map(renderAssetItem)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

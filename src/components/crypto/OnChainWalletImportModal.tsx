'use client';

import React, { useState } from 'react';
import type { Position, CryptoWalletEntry } from '@/types/portfolio';
import { cleanWalletProviderName, sanitizeCryptoWallets } from '@/utils/cryptoWalletEngine';
import type { DiscoveredCryptoAsset } from '@/services/cryptoOnChainReader';

interface OnChainWalletImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportAssets: (assetsToImport: Position[]) => void;
  existingPositions: Position[];
}

export default function OnChainWalletImportModal({
  isOpen,
  onClose,
  onImportAssets,
  existingPositions,
}: OnChainWalletImportModalProps) {
  const [address, setAddress] = useState('');
  const [walletLabel, setWalletLabel] = useState('🛡️ Trust Wallet');
  const [customLabel, setCustomLabel] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<DiscoveredCryptoAsset[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [showZeroValued, setShowZeroValued] = useState(false);

  if (!isOpen) return null;

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setError('Veuillez saisir une adresse publique blockchain.');
      return;
    }

    setError(null);
    setScanning(true);
    setHasScanned(false);

    try {
      const activeLabel = walletLabel === 'custom' ? customLabel.trim() || 'Wallet Externe' : walletLabel;
      const res = await fetch('/api/integrations/crypto-onchain/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.trim(),
          institution: activeLabel,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Impossible de synchroniser cette adresse blockchain.');
        setScanResults([]);
      } else {
        setScanResults(data.assets || []);
        setHasScanned(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur réseau lors de la synchronisation.');
    } finally {
      setScanning(false);
    }
  };

  const toggleSelectAsset = (id: string) => {
    setScanResults((prev) =>
      prev.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a))
    );
  };

  const toggleSelectAll = (selectAll: boolean) => {
    setScanResults((prev) => prev.map((a) => ({ ...a, selected: selectAll })));
  };

  const updateAssetPriceOrBalance = (id: string, updates: Partial<DiscoveredCryptoAsset>) => {
    setScanResults((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates, valueEUR: (updates.balance ?? a.balance) * (updates.priceEUR ?? a.priceEUR) } : a))
    );
  };

  const selectedCount = scanResults.filter((a) => a.selected).length;
  const totalSelectedValueEUR = scanResults
    .filter((a) => a.selected)
    .reduce((sum, a) => sum + (a.valueEUR || a.balance * a.priceEUR), 0);

  const handleConfirmImport = () => {
    const rawLabel = walletLabel === 'custom' ? customLabel.trim() || 'Wallet Externe' : walletLabel;
    const activeLabel = cleanWalletProviderName(rawLabel);
    const assetsToImport: Position[] = [];

    const selectedAssets = scanResults.filter((a) => a.selected && a.balance > 0);

    selectedAssets.forEach((asset) => {
      // Check if this crypto already exists in the portfolio
      const existing = existingPositions.find(
        (p) =>
          (p.assetType === 'CRYPTO' || p.envelope === 'CRYPTO') &&
          (p.ticker.toUpperCase() === asset.ticker.toUpperCase() ||
            p.name.toLowerCase() === asset.name.toLowerCase())
      );

      const newWalletEntry: CryptoWalletEntry = {
        id: `wallet-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        walletName: `${activeLabel} (${asset.chain})`,
        walletType: activeLabel.toLowerCase().includes('ledger') || activeLabel.toLowerCase().includes('cold') ? 'COLD_WALLET' : 'HOT_WALLET',
        institution: activeLabel,
        publicAddress: address.trim(),
        quantity: asset.balance,
        avgPrice: asset.priceEUR,
        purchaseDate: new Date().toISOString().split('T')[0],
        network: asset.chain,
        feesEUR: 0,
      };

      if (existing) {
        // Merge into existing position safely without duplicate addition
        const existingWallets = existing.cryptoWallets ? [...existing.cryptoWallets] : [];
        const cleanAddress = address.trim().toLowerCase();
        const assetChain = (asset.chain || '').trim().toUpperCase();

        // Check if an entry for this public address or this specific wallet already exists
        const matchIndex = existingWallets.findIndex((w) => {
          const wAddr = (w.publicAddress || '').trim().toLowerCase();
          const wNet = (w.network || '').trim().toUpperCase();
          const wInst = cleanWalletProviderName(w.institution || w.walletName).toLowerCase();

          if (wAddr && cleanAddress && wAddr === cleanAddress) {
            return !wNet || !assetChain || wNet === assetChain;
          }
          return wInst === activeLabel.toLowerCase() && (!wNet || !assetChain || wNet === assetChain);
        });

        let rawMerged: CryptoWalletEntry[];
        if (matchIndex >= 0) {
          // UPDATE the balance of this specific existing wallet entry (Garde-fou anti-doublon)
          rawMerged = existingWallets.map((w, idx) =>
            idx === matchIndex
              ? {
                  ...w,
                  publicAddress: address.trim(),
                  quantity: asset.balance,
                  avgPrice: w.avgPrice && w.avgPrice > 0 ? w.avgPrice : asset.priceEUR,
                  network: asset.chain || w.network,
                  institution: activeLabel,
                  walletName: `${activeLabel} (${asset.chain || w.network || 'EVM'})`,
                  lastSyncedAt: Date.now(),
                }
              : w
          );
        } else if (existingWallets.length === 0) {
          // First on-chain wallet attached to this position
          rawMerged = [newWalletEntry];
        } else {
          // Distinct new wallet
          rawMerged = [...existingWallets, newWalletEntry];
        }

        const mergedWallets = sanitizeCryptoWallets(rawMerged);
        const newTotalQty = mergedWallets.reduce((sum, w) => sum + w.quantity, 0);
        const totalInvested = mergedWallets.reduce((sum, w) => sum + w.quantity * (w.avgPrice ?? asset.priceEUR ?? 0), 0);
        const newAvgPrice = newTotalQty > 0 ? totalInvested / newTotalQty : (existing.avgPrice || asset.priceEUR);

        assetsToImport.push({
          ...existing,
          quantity: newTotalQty,
          avgPrice: newAvgPrice,
          currentPrice: asset.priceEUR,
          institutionName: activeLabel,
          cryptoWallets: mergedWallets,
          updatedAt: Date.now(),
        });
      } else {
        // Create new position
        const newPos: Position = {
          id: `crypto-${asset.ticker.toLowerCase()}-${Date.now()}`,
          ticker: asset.ticker,
          name: asset.name,
          envelope: 'CRYPTO',
          assetType: 'CRYPTO',
          currency: 'EUR',
          quantity: asset.balance,
          avgPrice: asset.priceEUR,
          currentPrice: asset.priceEUR,
          institutionName: activeLabel,
          cryptoWallets: [newWalletEntry],
          themes: ['crypto', asset.chain ? asset.chain.toLowerCase() : 'web3'],
          updatedAt: Date.now(),
        };
        assetsToImport.push(newPos);
      }
    });

    onImportAssets(assetsToImport);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 24,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-accent)',
          borderRadius: 14,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🔗</span>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Importer une Adresse Blockchain (Watch-Only)
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Récupération sécurisée en lecture seule de vos soldes on-chain (EVM, Bitcoin, Solana).
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ fontSize: 16, padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleScan} style={{ marginBottom: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Portefeuille / Application source
              </label>
              <select
                className="input"
                value={walletLabel}
                onChange={(e) => setWalletLabel(e.target.value)}
                style={{ width: '100%', fontSize: 13 }}
              >
                <option value="Trust Wallet">🛡️ Trust Wallet</option>
                <option value="Revolut X">⚡ Revolut X</option>
                <option value="Ledger">🔒 Ledger Cold Storage</option>
                <option value="MetaMask">🦊 MetaMask</option>
                <option value="Phantom">👻 Phantom Wallet (Solana)</option>
                <option value="custom">Autre / Personnalisé</option>
              </select>
            </div>

            {walletLabel === 'custom' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Nom personnalisé du wallet
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: Trezor Model T, Safe..."
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  style={{ width: '100%', fontSize: 13 }}
                />
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Adresse publique blockchain (Watch-Only)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="input mono"
                placeholder="Ex: 0x71C... ou bc1q... ou 7Yg..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ flex: 1, fontSize: 13 }}
                disabled={scanning}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={scanning || !address.trim()}
                style={{ fontSize: 13, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {scanning ? '⏳ Scan on-chain...' : '🔍 Scanner'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: 12 }}>
              ⚠️ {error}
            </div>
          )}
        </form>

        {/* Results Area */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 180, maxHeight: 340, border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 12, background: 'var(--bg-tertiary)' }}>
          {scanning ? (
            <div style={{ textAlign: 'center', padding: '36px 12px' }}>
              <div className="loading-spinner" style={{ width: 32, height: 32, margin: '0 auto 12px auto' }} />
              <strong style={{ display: 'block', fontSize: 14, color: 'var(--text-primary)' }}>
                Interrogation des RPCs blockchain et valorisation en direct...
              </strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Scan d'Ethereum, BNB Chain, Polygon, Solana, Bitcoin et jetons associés.
              </span>
            </div>
          ) : hasScanned && scanResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>🔍</span>
              <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: 14, marginBottom: 6 }}>
                Aucun solde actif détecté sur la blockchain pour cette adresse
              </strong>
              <p style={{ fontSize: 12, lineHeight: 1.5, maxWidth: 440, margin: '0 auto 14px auto', color: 'var(--text-secondary)' }}>
                Vérifiez que l'adresse publique est exacte et contient des fonds sur Bitcoin, Ethereum, Solana, Polygon ou BSC.
              </p>

              <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: 8, padding: '10px 14px', textAlign: 'left', fontSize: 12, margin: '0 auto 16px auto', maxWidth: 480 }}>
                <strong style={{ color: 'var(--accent-cyan)', display: 'block', marginBottom: 4 }}>
                  💡 Cas particulier : Revolut X, Binance ou Exchange Centralisé (CEX)
                </strong>
                <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4, display: 'block' }}>
                  Les « Adresses de dépôt » générées par Revolut X ou Binance sont des adresses d'acheminement temporaires. Leur solde on-chain est généralement de <strong>0</strong> car les fonds sont mutualisés sur l'exchange.
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border-subtle)' }}>
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
                          style={{ width: '100%', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '6px 12px', border: '1px dashed var(--border-subtle)' }}
                        >
                          <span>{showZeroValued ? '▼ Masquer' : '▶ Afficher'} {unpricedAssets.length} tokens secondaires & NFTs sans cotation (0,00 €)</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{unpricedAssets.filter(a => a.selected).length} cochés</span>
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

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
          <div>
            {hasScanned && scanResults.length > 0 && (
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Sélection : <strong style={{ color: 'var(--accent-cyan)' }}>{selectedCount} actif{selectedCount > 1 ? 's' : ''}</strong> (Total : <strong className="mono" style={{ color: 'var(--accent-emerald)' }}>{totalSelectedValueEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>)
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ fontSize: 13 }}>
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={selectedCount === 0}
              onClick={handleConfirmImport}
              style={{ fontSize: 13, padding: '8px 18px' }}
            >
              📥 Importer ({selectedCount}) dans le Portefeuille Crypto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

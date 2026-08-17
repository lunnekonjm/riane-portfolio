'use client';

import { useState } from 'react';
import type { Position, CryptoWalletEntry } from '@/types/portfolio';
import { cleanWalletProviderName, sanitizeCryptoWallets } from '@/utils/cryptoWalletEngine';
import type { DiscoveredCryptoAsset } from '@/services/cryptoOnChainReader';

export interface UseOnChainWalletImportStateParams {
  onImportAssets: (assetsToImport: Position[]) => void;
  onClose: () => void;
  existingPositions: Position[];
}

export function useOnChainWalletImportState({
  onImportAssets,
  onClose,
  existingPositions,
}: UseOnChainWalletImportStateParams) {
  const [address, setAddress] = useState('');
  const [walletLabel, setWalletLabel] = useState('🛡️ Trust Wallet');
  const [customLabel, setCustomLabel] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<DiscoveredCryptoAsset[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [showZeroValued, setShowZeroValued] = useState(false);
  const [scanWarning, setScanWarning] = useState<string | null>(null);

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
        setScanWarning(data.warning || null);
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
        const existingWallets = existing.cryptoWallets ? [...existing.cryptoWallets] : [];
        const cleanAddress = address.trim().toLowerCase();
        const assetChain = (asset.chain || '').trim().toUpperCase();

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
          rawMerged = [newWalletEntry];
        } else {
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

  return {
    address,
    setAddress,
    walletLabel,
    setWalletLabel,
    customLabel,
    setCustomLabel,
    scanning,
    error,
    scanResults,
    hasScanned,
    showZeroValued,
    setShowZeroValued,
    scanWarning,
    handleScan,
    toggleSelectAsset,
    toggleSelectAll,
    selectedCount,
    totalSelectedValueEUR,
    handleConfirmImport,
  };
}

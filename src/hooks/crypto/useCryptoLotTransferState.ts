'use client';

import { useState } from 'react';
import type { Position } from '@/types/portfolio';
import { transferBetweenCryptoWallets } from '@/utils/cryptoWalletEngine';

interface UseCryptoLotTransferStateProps {
  position: Position;
  onSave: (pos: Position) => void;
  onClose: () => void;
}

export function useCryptoLotTransferState({ position, onSave, onClose }: UseCryptoLotTransferStateProps) {
  // Form State for TRANSFER
  const [fromWallet, setFromWallet] = useState<string>(() => {
    return position.cryptoWallets && position.cryptoWallets.length > 0 ? position.cryptoWallets[0].walletName : 'Revolut X';
  });
  const [toWallet, setToWallet] = useState<string>('Trust Wallet');
  const [transferQtyInput, setTransferQtyInput] = useState<string>('');
  const [transferGasFeesInput, setTransferGasFeesInput] = useState<string>('0');

  // Form State for ON-CHAIN SYNC
  const [syncAddressInput, setSyncAddressInput] = useState<string>(() => {
    const tw = position.cryptoWallets?.find((w) => w.walletName.toLowerCase().includes('trust'));
    return tw?.publicAddress || '';
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Submit TRANSFER
  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(transferQtyInput) || 0;
    const gas = parseFloat(transferGasFeesInput) || 0;
    if (qty <= 0) return;

    const updated = transferBetweenCryptoWallets(
      position,
      fromWallet,
      toWallet,
      qty,
      gas
    );

    onSave(updated);
    onClose();
  };

  // Sync On-Chain Balance
  const handleSyncOnChain = async () => {
    if (!syncAddressInput.trim()) return;
    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const res = await fetch('/api/integrations/crypto-onchain/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: syncAddressInput.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setSyncMessage({
          type: 'success',
          text: `✓ Solde on-chain vérifié : ${data.balance.toFixed(6)} ${data.symbol} (${data.chain})`,
        });

        const currentWallets = position.cryptoWallets ? [...position.cryptoWallets] : [];
        let tw = currentWallets.find((w) => w.walletName.toLowerCase().includes('trust'));
        if (tw) {
          tw.quantity = data.balance;
          tw.publicAddress = syncAddressInput.trim();
          tw.lastSyncedAt = Date.now();
        } else {
          currentWallets.push({
            id: `wallet-tw-${Date.now()}`,
            walletName: 'Trust Wallet',
            quantity: data.balance,
            avgPrice: position.avgPrice,
            publicAddress: syncAddressInput.trim(),
            lastSyncedAt: Date.now(),
          });
        }

        const newTotalQty = currentWallets.reduce((sum, w) => sum + w.quantity, 0);

        const updated: Position = {
          ...position,
          quantity: newTotalQty,
          cryptoWallets: currentWallets,
          updatedAt: Date.now(),
        };

        onSave(updated);
      } else {
        setSyncMessage({
          type: 'error',
          text: data.error || 'Impossible de lire le solde on-chain.',
        });
      }
    } catch {
      setSyncMessage({
        type: 'error',
        text: 'Erreur de connexion RPC.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    fromWallet,
    setFromWallet,
    toWallet,
    setToWallet,
    transferQtyInput,
    setTransferQtyInput,
    transferGasFeesInput,
    setTransferGasFeesInput,
    syncAddressInput,
    setSyncAddressInput,
    isSyncing,
    syncMessage,
    handleTransfer,
    handleSyncOnChain,
  };
}

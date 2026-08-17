'use client';

import { useState, useMemo } from 'react';
import type { Position } from '@/types/portfolio';
import { calculateWeightedPRU, addLotToCryptoPosition } from '@/utils/cryptoWalletEngine';

interface UseCryptoLotBuyStateProps {
  position: Position;
  onSave: (pos: Position) => void;
  onClose: () => void;
}

export function useCryptoLotBuyState({ position, onSave, onClose }: UseCryptoLotBuyStateProps) {
  const [targetWallet, setTargetWallet] = useState<string>(() => {
    if (position.cryptoWallets && position.cryptoWallets.length > 0) {
      return position.cryptoWallets[0].walletName;
    }
    return position.institutionName || 'Revolut X';
  });
  const [customWalletName, setCustomWalletName] = useState<string>('');
  const [quantityInput, setQuantityInput] = useState<string>('');
  const [priceInput, setPriceInput] = useState<string>(() => {
    return position.currentPrice ? String(position.currentPrice) : position.avgPrice ? String(position.avgPrice) : '';
  });
  const [totalCostInput, setTotalCostInput] = useState<string>('');
  const [feesInput, setFeesInput] = useState<string>('0');
  const [notesInput, setNotesInput] = useState<string>('');

  const effectiveWalletName = targetWallet === 'Autre' ? (customWalletName.trim() || 'Autre') : targetWallet;
  const addedQty = parseFloat(quantityInput) || 0;
  const unitPrice = parseFloat(priceInput) || 0;
  const addedFees = parseFloat(feesInput) || 0;
  const currentTotalFees = position.totalFeesEUR || 0;

  const liveMath = useMemo(() => {
    if (addedQty <= 0) return null;
    return calculateWeightedPRU(
      position.quantity,
      position.avgPrice,
      addedQty,
      unitPrice,
      addedFees,
      currentTotalFees
    );
  }, [position.quantity, position.avgPrice, addedQty, unitPrice, addedFees, currentTotalFees]);

  const handleQuantityChange = (val: string) => {
    setQuantityInput(val);
    const q = parseFloat(val) || 0;
    const p = parseFloat(priceInput) || 0;
    if (q > 0 && p > 0) {
      setTotalCostInput((q * p).toFixed(2));
    }
  };

  const handlePriceChange = (val: string) => {
    setPriceInput(val);
    const p = parseFloat(val) || 0;
    const q = parseFloat(quantityInput) || 0;
    if (q > 0 && p > 0) {
      setTotalCostInput((q * p).toFixed(2));
    }
  };

  const handleTotalCostChange = (val: string) => {
    setTotalCostInput(val);
    const tot = parseFloat(val) || 0;
    const q = parseFloat(quantityInput) || 0;
    if (tot > 0 && q > 0) {
      setPriceInput((tot / q).toFixed(4));
    }
  };

  const handleAddLot = (e: React.FormEvent) => {
    e.preventDefault();
    if (addedQty <= 0) return;

    const updated = addLotToCryptoPosition(
      position,
      {
        quantity: addedQty,
        purchasePrice: unitPrice,
        feesEUR: addedFees,
        walletName: effectiveWalletName,
        notes: notesInput.trim() || undefined,
      }
    );

    onSave(updated);
    onClose();
  };

  return {
    targetWallet,
    setTargetWallet,
    customWalletName,
    setCustomWalletName,
    quantityInput,
    priceInput,
    totalCostInput,
    feesInput,
    setFeesInput,
    notesInput,
    setNotesInput,
    effectiveWalletName,
    addedQty,
    unitPrice,
    addedFees,
    liveMath,
    handleQuantityChange,
    handlePriceChange,
    handleTotalCostChange,
    handleAddLot,
  };
}

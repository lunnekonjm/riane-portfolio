'use client';

import { useState } from 'react';
import type { Position } from '@/types/portfolio';
import { calculateCryptoTaxAndNet } from '@/utils/cryptoWalletEngine';
import { useCryptoLotBuyState } from './crypto/useCryptoLotBuyState';
import { useCryptoLotTransferState } from './crypto/useCryptoLotTransferState';
import { useCryptoLotPruState } from './crypto/useCryptoLotPruState';

export interface UseCryptoLotModalStateParams {
  position: Position;
  onSave: (updatedPosition: Position) => void;
  onClose: () => void;
}

export function useCryptoLotModalState({
  position,
  onSave,
  onClose,
}: UseCryptoLotModalStateParams) {
  const [activeMode, setActiveMode] = useState<'BUY' | 'TRANSFER' | 'SYNC_ONCHAIN' | 'ADJUST_PRU'>('BUY');

  const buyState = useCryptoLotBuyState({ position, onSave, onClose });
  const transferState = useCryptoLotTransferState({ position, onSave, onClose });
  const pruState = useCryptoLotPruState({ position, onSave, onClose });

  const curPrice = position.currentPrice || position.avgPrice;
  const grossVal = position.quantity * curPrice;
  const totalCost = position.quantity * position.avgPrice + (position.totalFeesEUR || 0);
  const taxMetrics = calculateCryptoTaxAndNet(grossVal, totalCost);

  return {
    activeMode,
    setActiveMode,
    ...pruState,
    ...buyState,
    ...transferState,
    grossVal,
    taxMetrics,
  };
}

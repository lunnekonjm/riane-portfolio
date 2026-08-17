'use client';

import { useState } from 'react';
import type { Position } from '@/types/portfolio';

interface UseCryptoLotPruStateProps {
  position: Position;
  onSave: (pos: Position) => void;
  onClose: () => void;
}

export function useCryptoLotPruState({ position, onSave, onClose }: UseCryptoLotPruStateProps) {
  const [pruModeInput, setPruModeInput] = useState<string>(() =>
    position.avgPrice ? String(position.avgPrice) : String(position.currentPrice || '')
  );
  const [totalInvestedInput, setTotalInvestedInput] = useState<string>(() =>
    position.quantity > 0 ? (position.quantity * (position.avgPrice || position.currentPrice || 0)).toFixed(2) : ''
  );

  const handleTotalInvestedChange = (val: string) => {
    setTotalInvestedInput(val);
    const total = parseFloat(val) || 0;
    if (position.quantity > 0 && total > 0) {
      setPruModeInput((total / position.quantity).toFixed(4));
    }
  };

  const handlePruDirectChange = (val: string) => {
    setPruModeInput(val);
    const p = parseFloat(val) || 0;
    if (position.quantity > 0 && p > 0) {
      setTotalInvestedInput((position.quantity * p).toFixed(2));
    }
  };

  const handleApplyPRUAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const newAvgPrice = parseFloat(pruModeInput) || 0;
    if (newAvgPrice <= 0) return;

    const updated: Position = {
      ...position,
      avgPrice: newAvgPrice,
      updatedAt: Date.now(),
    };

    onSave(updated);
    onClose();
  };

  const handleSetPointZero = () => {
    const currentP = position.currentPrice || position.avgPrice || 1;
    const updated: Position = {
      ...position,
      avgPrice: currentP,
      updatedAt: Date.now(),
    };
    onSave(updated);
    onClose();
  };

  return {
    pruModeInput,
    totalInvestedInput,
    handleTotalInvestedChange,
    handlePruDirectChange,
    handleApplyPRUAdjustment,
    handleSetPointZero,
  };
}

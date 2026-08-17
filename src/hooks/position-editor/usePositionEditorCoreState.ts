'use client';

import { useState, useMemo } from 'react';
import type { Position } from '@/types/portfolio';
import { generatePositionId } from '@/utils/positionFormThemes';

interface UsePositionEditorCoreStateProps {
  position?: Position;
  initialEnvelope: Position['envelope'];
  existingPositions: Position[];
}

export function usePositionEditorCoreState({
  position,
  initialEnvelope = 'PEA',
  existingPositions = [],
}: UsePositionEditorCoreStateProps) {
  const isNew = !position;
  const [allowDuplicateLine, setAllowDuplicateLine] = useState(false);

  const [form, setForm] = useState<Position>(() => {
    if (position) return { ...position };

    let defaultAssetType: Position['assetType'] = 'ETF';
    if (initialEnvelope === 'CRYPTO') defaultAssetType = 'CRYPTO';
    else if (initialEnvelope === 'LIVRET' || initialEnvelope === 'PER') defaultAssetType = 'SAVINGS';
    else if (initialEnvelope === 'ASSURANCE_VIE') defaultAssetType = 'BOND';
    else if (initialEnvelope === 'PEE') defaultAssetType = 'FUND';
    else if (initialEnvelope === 'IMMOBILIER') defaultAssetType = 'REAL_ESTATE';

    return {
      id: generatePositionId(),
      ticker: '',
      name: '',
      envelope: initialEnvelope,
      assetType: defaultAssetType,
      quantity: 0,
      avgPrice: 0,
      currentPrice: 0,
      currency: 'EUR',
      themes: ['global-core'],
      targetWeight: 0.1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  const [quantityInput, setQuantityInput] = useState<string>(() => {
    if (!position || position.quantity === 0 || position.quantity === undefined) return '';
    if (position.quantity < 1) return position.quantity.toFixed(8).replace(/\.?0+$/, '');
    return String(position.quantity);
  });

  const [avgPriceInput, setAvgPriceInput] = useState<string>(() => {
    if (!position || position.avgPrice === 0 || position.avgPrice === undefined) return '';
    if (position.avgPrice < 1) return position.avgPrice.toFixed(6).replace(/\.?0+$/, '');
    return String(position.avgPrice);
  });

  const [currentPriceInput, setCurrentPriceInput] = useState<string>(() => {
    if (!position || position.currentPrice === 0 || position.currentPrice === undefined) return '';
    if (position.currentPrice < 1) return position.currentPrice.toFixed(6).replace(/\.?0+$/, '');
    return String(position.currentPrice);
  });

  const duplicatePosition = useMemo(() => {
    if (allowDuplicateLine) return null;
    const currentTicker = form.ticker.trim().toUpperCase();
    const currentName = form.name.trim().toLowerCase();
    if (!currentTicker && !currentName) return null;

    return (
      existingPositions.find((p) => {
        if (position && p.id === position.id) return false;
        if (currentTicker && p.ticker.toUpperCase() === currentTicker) return true;
        if (currentName && p.name.toLowerCase() === currentName) return true;
        return false;
      }) || null
    );
  }, [form.ticker, form.name, existingPositions, position, allowDuplicateLine]);

  const parsedQty = parseFloat(quantityInput.replace(',', '.')) || (form.quantity || 0);
  const parsedPrice = parseFloat(avgPriceInput.replace(',', '.')) || (form.avgPrice || form.currentPrice || (duplicatePosition ? duplicatePosition.avgPrice : 0));

  const reinforcementCalc = useMemo(() => {
    if (!duplicatePosition || parsedQty <= 0) return null;
    const oldQty = duplicatePosition.quantity || 0;
    const oldPru = duplicatePosition.avgPrice || 0;
    const newTotalQty = oldQty + parsedQty;
    const newWeightedPRU = newTotalQty > 0 ? (oldQty * oldPru + parsedQty * parsedPrice) / newTotalQty : oldPru;
    return {
      oldQty,
      oldPru,
      addedQty: parsedQty,
      buyPrice: parsedPrice,
      newTotalQty,
      newWeightedPRU,
    };
  }, [duplicatePosition, parsedQty, parsedPrice]);

  const handleChange = (field: keyof Position, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleInstitutionChange = (inst: string) => {
    setForm((prev) => {
      let updatedWallets = prev.cryptoWallets ? [...prev.cryptoWallets] : undefined;
      if (updatedWallets && updatedWallets.length > 0) {
        updatedWallets = updatedWallets.map((w) => ({
          ...w,
          institution: inst,
          walletName: inst,
        }));
      } else if (inst) {
        updatedWallets = [{
          id: `w-${Date.now()}`,
          walletName: inst,
          institution: inst,
          quantity: prev.quantity || 0,
        }];
      }
      return {
        ...prev,
        institutionName: inst,
        cryptoWallets: updatedWallets,
      };
    });
  };

  const handleQuantityChange = (val: string) => {
    setQuantityInput(val);
    const normalized = val.replace(',', '.').trim();
    if (normalized === '' || normalized === '.' || normalized === '-') {
      setForm((prev) => ({ ...prev, quantity: 0 }));
    } else {
      const num = parseFloat(normalized);
      if (!isNaN(num) && num >= 0) {
        setForm((prev) => ({ ...prev, quantity: num }));
      }
    }
  };

  const handleAvgPriceChange = (val: string) => {
    setAvgPriceInput(val);
    const normalized = val.replace(',', '.').trim();
    if (normalized === '' || normalized === '.' || normalized === '-') {
      setForm((prev) => ({ ...prev, avgPrice: 0 }));
    } else {
      const num = parseFloat(normalized);
      if (!isNaN(num) && num >= 0) {
        setForm((prev) => ({ ...prev, avgPrice: num }));
      }
    }
  };

  const handleCurrentPriceChange = (val: string) => {
    setCurrentPriceInput(val);
    const normalized = val.replace(',', '.').trim();
    if (normalized === '' || normalized === '.' || normalized === '-') {
      setForm((prev) => ({ ...prev, currentPrice: undefined }));
    } else {
      const num = parseFloat(normalized);
      if (!isNaN(num) && num >= 0) {
        setForm((prev) => ({ ...prev, currentPrice: num }));
      }
    }
  };

  const handleNumberChange = (field: keyof Position, value: string) => {
    const normalized = value.replace(',', '.').trim();
    const num = normalized === '' ? 0 : parseFloat(normalized);
    if (!isNaN(num)) {
      handleChange(field, num);
    }
  };

  const handleOptionalNumber = (field: keyof Position, value: string) => {
    const normalized = value.replace(',', '.').trim();
    if (normalized === '') {
      handleChange(field, undefined);
    } else {
      const num = parseFloat(normalized);
      if (!isNaN(num)) handleChange(field, num);
    }
  };

  const handleEnvelopeChange = (newEnv: Position['envelope']) => {
    const isSav = newEnv === 'LIVRET' || newEnv === 'ASSURANCE_VIE' || newEnv === 'PER' || newEnv === 'PEE' || newEnv === 'IMMOBILIER';
    let defaultAssetType = form.assetType;
    if (isSav) {
      if (newEnv === 'LIVRET') defaultAssetType = 'SAVINGS';
      else if (newEnv === 'ASSURANCE_VIE') defaultAssetType = 'BOND';
      else if (newEnv === 'PER') defaultAssetType = 'SAVINGS';
      else if (newEnv === 'PEE') defaultAssetType = 'FUND';
      else if (newEnv === 'IMMOBILIER') defaultAssetType = 'REAL_ESTATE';
    } else {
      if (['SAVINGS', 'BOND', 'REAL_ESTATE'].includes(defaultAssetType)) {
        defaultAssetType = 'ETF';
      }
    }
    setForm((prev) => ({
      ...prev,
      envelope: newEnv,
      assetType: defaultAssetType,
    }));
  };

  return {
    form,
    setForm,
    isNew,
    allowDuplicateLine,
    setAllowDuplicateLine,
    quantityInput,
    setQuantityInput,
    avgPriceInput,
    setAvgPriceInput,
    currentPriceInput,
    setCurrentPriceInput,
    duplicatePosition,
    reinforcementCalc,
    handleChange,
    handleInstitutionChange,
    handleQuantityChange,
    handleAvgPriceChange,
    handleCurrentPriceChange,
    handleNumberChange,
    handleOptionalNumber,
    handleEnvelopeChange,
  };
}

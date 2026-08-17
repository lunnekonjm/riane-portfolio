'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';
import { ENVELOPE_OPTIONS, ASSET_TYPE_OPTIONS } from '@/types/positionEditorOptions';
import { getActiveDCATranche } from '@/utils/dcaHistoryHelper';
import { isCryptoAsset } from '@/utils/positionFormThemes';
import { usePositionEditorCoreState } from './position-editor/usePositionEditorCoreState';
import { usePositionEditorSearch } from './position-editor/usePositionEditorSearch';
import { usePositionEditorDcaState } from './position-editor/usePositionEditorDcaState';

export interface UsePositionEditorFormProps {
  position?: Position;
  initialEnvelope?: Position['envelope'];
  existingPositions?: Position[];
  onSave: (position: Position) => void;
  onClose: () => void;
}

export function usePositionEditorForm({
  position,
  initialEnvelope = 'PEA',
  existingPositions = [],
  onSave,
  onClose,
}: UsePositionEditorFormProps) {
  const isSavingsTabContext =
    initialEnvelope === 'LIVRET' ||
    initialEnvelope === 'ASSURANCE_VIE' ||
    initialEnvelope === 'PER' ||
    initialEnvelope === 'PEE' ||
    initialEnvelope === 'IMMOBILIER';

  const core = usePositionEditorCoreState({
    position,
    initialEnvelope,
    existingPositions,
  });

  const isSavingsEnvelope =
    core.form.envelope === 'LIVRET' ||
    core.form.envelope === 'ASSURANCE_VIE' ||
    core.form.envelope === 'PER' ||
    core.form.envelope === 'PEE' ||
    core.form.envelope === 'IMMOBILIER';

  const search = usePositionEditorSearch({
    position,
    initialEnvelope,
    form: core.form,
    setForm: core.setForm,
    setCurrentPriceInput: core.setCurrentPriceInput,
    setAvgPriceInput: core.setAvgPriceInput,
  });

  const dca = usePositionEditorDcaState({
    position,
    form: core.form,
    setForm: core.setForm,
    setQuantityInput: core.setQuantityInput,
    setAvgPriceInput: core.setAvgPriceInput,
    isSavingsEnvelope,
  });

  const handleSwitchToExisting = (existingPos: Position) => {
    core.setForm({ ...existingPos });
    core.setQuantityInput(existingPos.quantity < 1 ? existingPos.quantity.toFixed(8).replace(/\.?0+$/, '') : String(existingPos.quantity));
    core.setAvgPriceInput(existingPos.avgPrice < 1 ? existingPos.avgPrice.toFixed(6).replace(/\.?0+$/, '') : String(existingPos.avgPrice));
    core.setCurrentPriceInput(existingPos.currentPrice ? (existingPos.currentPrice < 1 ? existingPos.currentPrice.toFixed(6).replace(/\.?0+$/, '') : String(existingPos.currentPrice)) : '');
    search.setTickerSearchInput(`${existingPos.name} (${existingPos.ticker})`);
    search.setVerifiedQuoteText(`✓ Position existante chargée (${existingPos.quantity} parts à ${existingPos.avgPrice} ${existingPos.currency})`);
    core.setAllowDuplicateLine(true);
  };

  const handleApplyReinforcement = () => {
    if (!core.duplicatePosition || !core.reinforcementCalc) return;
    const updated: Position = {
      ...core.duplicatePosition,
      quantity: core.reinforcementCalc.newTotalQty,
      avgPrice: core.reinforcementCalc.newWeightedPRU,
      currentPrice: core.form.currentPrice || core.duplicatePosition.currentPrice,
      updatedAt: Date.now(),
    };
    onSave(updated);
    onClose();
  };

  const availableEnvelopeOptions = ENVELOPE_OPTIONS.filter((opt) => {
    if (isSavingsTabContext) {
      return ['LIVRET', 'ASSURANCE_VIE', 'PER', 'PEE', 'IMMOBILIER'].includes(opt.value);
    } else {
      return ['PEA', 'PEA-PME', 'CTO', 'CRYPTO', 'SPECULATIVE', 'OPPORTUNISTIC'].includes(opt.value);
    }
  });

  const availableAssetTypeOptions = ASSET_TYPE_OPTIONS.filter((opt) => {
    if (isSavingsEnvelope) {
      return ['SAVINGS', 'BOND', 'FUND', 'REAL_ESTATE'].includes(opt.value);
    }
    return ['ETF', 'STOCK', 'FUND', 'CRYPTO', 'CASH'].includes(opt.value);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalTicker = core.form.ticker.trim();
    let finalName = core.form.name.trim();

    if (isSavingsEnvelope) {
      if (!finalName) {
        const envLabel = ENVELOPE_OPTIONS.find((o) => o.value === core.form.envelope)?.label || core.form.envelope;
        finalName = envLabel;
      }
      if (!finalTicker) {
        finalTicker = `${core.form.envelope}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
      }
    }

    if (!isSavingsEnvelope) {
      if (!finalTicker || !finalName) {
        search.setTickerError('❌ Veuillez renseigner un ticker officiel et un nom d\'actif reconnus.');
        return;
      }
    }

    if (!finalTicker || !finalName) return;

    const finalQuantity = isSavingsEnvelope ? 1 : (typeof core.form.quantity === 'number' && !isNaN(core.form.quantity) ? core.form.quantity : 0);
    const finalAvgPrice = typeof core.form.avgPrice === 'number' && !isNaN(core.form.avgPrice) ? core.form.avgPrice : 0;
    const finalCurrentPrice = isSavingsEnvelope ? finalAvgPrice : (core.form.currentPrice || finalAvgPrice);

    const cost = finalQuantity * finalAvgPrice;
    if (core.form.envelope === 'PEA' && cost > 150000) {
      if (!confirm(`⚠️ Attention : Les versements sur cette position (${cost.toLocaleString('fr-FR')} €) dépassent le plafond légal individuel du PEA (150 000 €).\nVoulez-vous quand même enregistrer ?`)) {
        return;
      }
    }
    if (core.form.envelope === 'PEA-PME' && cost > 225000) {
      if (!confirm(`⚠️ Attention : Les versements sur cette position (${cost.toLocaleString('fr-FR')} €) dépassent le plafond légal cumulé PEA + PEA-PME (225 000 € max au total).\nVoulez-vous quand même enregistrer ?`)) {
        return;
      }
    }

    let finalMonthlyDCA = core.form.monthlyDCA;
    let finalAnnualBudget = core.form.annualBudget;
    let finalDcaStartDate = dca.dcaStartDate;

    if (dca.isMultiTierDCA && dca.dcaHistory.length > 0) {
      const active = getActiveDCATranche(dca.dcaHistory);
      if (active) {
        finalMonthlyDCA = active.amount;
      }
      const sortedTranches = [...dca.dcaHistory].sort((a, b) => a.startDate.localeCompare(b.startDate));
      if (sortedTranches.length > 0) {
        finalDcaStartDate = sortedTranches[0].startDate;
      }
    } else {
      if (core.form.dcaFrequency === 'annual') {
        finalAnnualBudget = core.form.monthlyDCA;
        finalMonthlyDCA = undefined;
      } else if (core.form.dcaFrequency === 'semestrial' && core.form.monthlyDCA) {
        finalMonthlyDCA = core.form.monthlyDCA / 6;
        finalAnnualBudget = undefined;
      } else if (core.form.dcaFrequency === 'quarterly' && core.form.monthlyDCA) {
        finalMonthlyDCA = core.form.monthlyDCA / 3;
        finalAnnualBudget = undefined;
      } else {
        finalAnnualBudget = undefined;
      }
    }

    const hasActiveDCA = (finalMonthlyDCA !== undefined && finalMonthlyDCA > 0) || (finalAnnualBudget !== undefined && finalAnnualBudget > 0) || (dca.isMultiTierDCA && dca.dcaHistory.length > 0);
    const isCrypto = isCryptoAsset(finalTicker, finalName) || core.form.assetType === 'CRYPTO' || core.form.envelope === 'CRYPTO' || initialEnvelope === 'CRYPTO';
    const finalEnvelope = isCrypto ? 'CRYPTO' : core.form.envelope;
    const finalAssetType = isCrypto ? 'CRYPTO' : core.form.assetType;

    onSave({
      ...core.form,
      ticker: finalTicker,
      name: finalName,
      envelope: finalEnvelope,
      assetType: finalAssetType,
      quantity: finalQuantity,
      avgPrice: finalAvgPrice,
      currentPrice: finalCurrentPrice,
      monthlyDCA: finalMonthlyDCA,
      annualBudget: finalAnnualBudget,
      dcaStartDate: hasActiveDCA ? finalDcaStartDate : undefined,
      dcaHistory: dca.isMultiTierDCA && dca.dcaHistory.length > 0 ? dca.dcaHistory : undefined,
      initialDepositDate: isSavingsEnvelope ? dca.initialDepositDate : undefined,
      depositsHistory: dca.depositsHistory.length > 0 ? dca.depositsHistory : undefined,
      updatedAt: Date.now(),
    });
  };

  const totalValue = core.form.quantity * (core.form.currentPrice || core.form.avgPrice);

  return {
    ...core,
    ...search,
    ...dca,
    handleSwitchToExisting,
    handleApplyReinforcement,
    availableEnvelopeOptions,
    availableAssetTypeOptions,
    isSavingsEnvelope,
    handleSubmit,
    totalValue,
  };
}

'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';
import CustomSelect from '@/components/CustomSelect';

interface EnvelopeAssetTypeBarProps {
  envelope: Position['envelope'];
  availableEnvelopeOptions: { label: string; value: string }[];
  onEnvelopeChange: (env: Position['envelope']) => void;
  assetType: Position['assetType'];
  availableAssetTypeOptions: { label: string; value: string }[];
  onAssetTypeChange: (at: Position['assetType']) => void;
  currency?: Position['currency'];
  currencyOptions: { label: string; value: string }[];
  onCurrencyChange: (curr: Position['currency']) => void;
}

export default function EnvelopeAssetTypeBar({
  envelope,
  availableEnvelopeOptions,
  onEnvelopeChange,
  assetType,
  availableAssetTypeOptions,
  onAssetTypeChange,
  currency = 'EUR',
  currencyOptions,
  onCurrencyChange,
}: EnvelopeAssetTypeBarProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
      <div className="form-group">
        <label className="form-label">Enveloppe</label>
        <CustomSelect
          value={envelope}
          options={availableEnvelopeOptions}
          onChange={(val) => onEnvelopeChange(val as Position['envelope'])}
          id="select-envelope"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Type d&apos;actif</label>
        <CustomSelect
          value={assetType}
          options={availableAssetTypeOptions}
          onChange={(val) => onAssetTypeChange(val as Position['assetType'])}
          id="select-asset-type"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Devise</label>
        <CustomSelect
          value={currency}
          options={currencyOptions}
          onChange={(val) => onCurrencyChange(val as Position['currency'])}
          id="select-currency"
        />
      </div>
    </div>
  );
}

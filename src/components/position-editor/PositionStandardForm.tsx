'use client';

import React from 'react';
import type { Position, SavingsDeposit, DCATranche } from '@/types/portfolio';
import type { RegisteredAsset } from '@/data/assetRegistry';
import type { DCASimulationResult } from '@/engines/dcaSimulation';
import AssetSearchSection from './AssetSearchSection';
import DuplicateGuardAlert from './DuplicateGuardAlert';
import PositionCoreInputsSection from './PositionCoreInputsSection';
import PlatformBrokerSection from './PlatformBrokerSection';
import { PositionValuationCard } from './PositionValuationCard';
import DcaSimulationSection from './DcaSimulationSection';
import SavingsDepositsSection from './SavingsDepositsSection';
import TargetWeightsThemesSection from './TargetWeightsThemesSection';

interface PositionStandardFormProps {
  form: Position;
  setForm: React.Dispatch<React.SetStateAction<Position>>;
  handleChange: (field: keyof Position, value: any) => void;
  // Search & Ticker
  tickerSearchInput: string;
  setTickerSearchInput: (v: string) => void;
  searchResults: RegisteredAsset[];
  setSearchResults: (r: RegisteredAsset[]) => void;
  showDropdown: boolean;
  setShowDropdown: (s: boolean) => void;
  isVerifyingTicker: boolean;
  isSearchingLive: boolean;
  verifiedQuoteText: string | null;
  setVerifiedQuoteText: (v: string | null) => void;
  didYouMeanAsset: RegisteredAsset | null;
  setDidYouMeanAsset: (a: RegisteredAsset | null) => void;
  tickerError: string | null;
  setTickerError: (e: string | null) => void;
  handleSelectRegisteredAsset: (asset: RegisteredAsset) => void;
  handleSearchInputChange: (value: string) => void;
  handleVerifyManualTicker: () => void;
  // Duplicate Guard
  duplicatePosition: Position | null;
  reinforcementCalc: any;
  handleSwitchToExisting: (existingPos: Position) => void;
  handleApplyReinforcement: () => void;
  setAllowDuplicateLine: (allow: boolean) => void;
  // Core Inputs
  quantityInput: string;
  handleQuantityChange: (val: string) => void;
  avgPriceInput: string;
  handleAvgPriceChange: (val: string) => void;
  currentPriceInput: string;
  handleCurrentPriceChange: (val: string) => void;
  handleInstitutionChange: (inst: string) => void;
  totalValue: number;
  // DCA Simulation
  simMode: 'DCA_FIXED' | 'ONE_SHOT' | 'MULTI_TIER';
  setSimMode: (m: 'DCA_FIXED' | 'ONE_SHOT' | 'MULTI_TIER') => void;
  oneShotAmount: number;
  setOneShotAmount: (a: number) => void;
  oneShotDate: string;
  setOneShotDate: (d: string) => void;
  dcaHistory: DCATranche[];
  setDcaHistory: React.Dispatch<React.SetStateAction<DCATranche[]>>;
  dcaStartDate: string;
  setDcaStartDate: (d: string) => void;
  isMultiTierDCA: boolean;
  setIsMultiTierDCA: (m: boolean) => void;
  handleAddTranche: () => void;
  isCalculatingDCA: boolean;
  handleRunDCASimulation: () => void;
  isFutureDca: boolean;
  dcaResult: DCASimulationResult | null;
  showDCAHistory: boolean;
  setShowDCAHistory: (s: boolean) => void;
  handleApplyDCAResult: () => void;
  // Deposits History
  depositsHistory: SavingsDeposit[];
  setDepositsHistory: React.Dispatch<React.SetStateAction<SavingsDeposit[]>>;
}

export function PositionStandardForm(props: PositionStandardFormProps) {
  const {
    form,
    setForm,
    handleChange,
    tickerSearchInput,
    setTickerSearchInput,
    searchResults,
    setSearchResults,
    showDropdown,
    setShowDropdown,
    isVerifyingTicker,
    isSearchingLive,
    verifiedQuoteText,
    setVerifiedQuoteText,
    didYouMeanAsset,
    setDidYouMeanAsset,
    tickerError,
    setTickerError,
    handleSelectRegisteredAsset,
    handleSearchInputChange,
    handleVerifyManualTicker,
    duplicatePosition,
    reinforcementCalc,
    handleSwitchToExisting,
    handleApplyReinforcement,
    setAllowDuplicateLine,
    quantityInput,
    handleQuantityChange,
    avgPriceInput,
    handleAvgPriceChange,
    currentPriceInput,
    handleCurrentPriceChange,
    handleInstitutionChange,
    totalValue,
    simMode,
    setSimMode,
    oneShotAmount,
    setOneShotAmount,
    oneShotDate,
    setOneShotDate,
    dcaHistory,
    setDcaHistory,
    dcaStartDate,
    setDcaStartDate,
    isMultiTierDCA,
    setIsMultiTierDCA,
    handleAddTranche,
    isCalculatingDCA,
    handleRunDCASimulation,
    isFutureDca,
    dcaResult,
    showDCAHistory,
    setShowDCAHistory,
    handleApplyDCAResult,
    depositsHistory,
    setDepositsHistory,
  } = props;

  return (
    <>
      {/* Autocomplete Search & Ticker Verification Bar */}
      <AssetSearchSection
        envelope={form.envelope}
        currentTicker={form.ticker}
        tickerSearchInput={tickerSearchInput}
        onSearchInputChange={handleSearchInputChange}
        onClearSearch={() => {
          setTickerSearchInput('');
          setSearchResults([]);
          setShowDropdown(false);
          setVerifiedQuoteText(null);
          setTickerError(null);
          setDidYouMeanAsset(null);
        }}
        searchResults={searchResults}
        showDropdown={showDropdown}
        onCloseDropdown={() => setShowDropdown(false)}
        onSelectRegisteredAsset={handleSelectRegisteredAsset}
        onSelectTickerManual={(t) => handleChange('ticker', t)}
        onVerifyManualTicker={handleVerifyManualTicker}
        isVerifyingTicker={isVerifyingTicker}
        isSearchingLive={isSearchingLive}
        verifiedQuoteText={verifiedQuoteText}
        didYouMeanAsset={didYouMeanAsset}
        tickerError={tickerError}
      />

      {/* 🛡️ Garde-Fou Anti-Doublon & Anti-Addition */}
      {duplicatePosition && (
        <DuplicateGuardAlert
          duplicatePosition={duplicatePosition}
          reinforcementCalc={reinforcementCalc}
          onSwitchToExisting={handleSwitchToExisting}
          onApplyReinforcement={handleApplyReinforcement}
          onAllowDuplicateLine={setAllowDuplicateLine}
        />
      )}

      {/* Row 1 & 3: Ticker, Name, Quantity, Avg Price, Current Price */}
      <PositionCoreInputsSection
        envelope={form.envelope}
        assetType={form.assetType}
        currency={form.currency}
        ticker={form.ticker}
        onTickerChange={(t) => handleChange('ticker', t)}
        name={form.name}
        onNameChange={(n) => handleChange('name', n)}
        quantityInput={quantityInput}
        onQuantityChange={handleQuantityChange}
        avgPriceInput={avgPriceInput}
        onAvgPriceChange={handleAvgPriceChange}
        currentPriceInput={currentPriceInput}
        onCurrentPriceChange={handleCurrentPriceChange}
      />

      {/* Broker / Courtier / Platform Section */}
      <PlatformBrokerSection
        envelope={form.envelope}
        assetType={form.assetType}
        institutionName={form.institutionName}
        onInstitutionChange={handleInstitutionChange}
        cryptoWallets={form.cryptoWallets}
        totalFeesEUR={form.totalFeesEUR}
        onFeesChange={(fees) => handleChange('totalFeesEUR', fees)}
        quantity={form.quantity}
        avgPrice={form.avgPrice}
        currentPrice={form.currentPrice}
      />

      {/* Dynamic real-time calculation breakdown */}
      <PositionValuationCard
        envelope={form.envelope}
        currency={form.currency}
        quantity={form.quantity}
        avgPrice={form.avgPrice}
        currentPrice={form.currentPrice}
        totalFeesEUR={form.totalFeesEUR}
        totalValue={totalValue}
      />

      {/* Row 2.5: Auto-Calculateur DCA & One-Shot (Lump Sum) */}
      <DcaSimulationSection
        envelope={form.envelope}
        currency={form.currency}
        ticker={form.ticker}
        currentPrice={form.currentPrice}
        avgPrice={form.avgPrice}
        quantity={form.quantity}
        monthlyDCA={form.monthlyDCA}
        annualBudget={form.annualBudget}
        dcaFrequency={form.dcaFrequency}
        dcaDepositDay={form.dcaDepositDay}
        dcaDepositMonth={form.dcaDepositMonth}
        onFieldChange={handleChange}
        simMode={simMode}
        setSimMode={setSimMode}
        oneShotAmount={oneShotAmount}
        setOneShotAmount={setOneShotAmount}
        oneShotDate={oneShotDate}
        setOneShotDate={setOneShotDate}
        dcaHistory={dcaHistory}
        setDcaHistory={setDcaHistory}
        dcaStartDate={dcaStartDate}
        setDcaStartDate={setDcaStartDate}
        isMultiTierDCA={isMultiTierDCA}
        setIsMultiTierDCA={setIsMultiTierDCA}
        onAddTranche={handleAddTranche}
        isCalculatingDCA={isCalculatingDCA}
        onRunDCASimulation={handleRunDCASimulation}
        isFutureDca={isFutureDca}
        dcaResult={dcaResult}
        showDCAHistory={showDCAHistory}
        setShowDCAHistory={setShowDCAHistory}
        onApplyDCAResult={handleApplyDCAResult}
      />

      {/* Section: Apports Personnels & Versements Ponctuels Exceptionnels */}
      <SavingsDepositsSection
        depositsHistory={depositsHistory}
        onDepositsHistoryChange={setDepositsHistory}
        currency={form.currency}
      />

      {/* Row 5: Weights & Themes */}
      <TargetWeightsThemesSection
        targetWeight={form.targetWeight}
        onTargetWeightChange={(w) => handleChange('targetWeight', w)}
        maxWeight={form.maxWeight}
        onMaxWeightChange={(w) => handleChange('maxWeight', w)}
        themes={form.themes}
        onThemesChange={(themes) => setForm((prev) => ({ ...prev, themes }))}
      />
    </>
  );
}

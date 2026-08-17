'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';
import { useCryptoLotModalState } from '@/hooks/useCryptoLotModalState';
import { CryptoLotBuyTab } from './tabs/CryptoLotBuyTab';
import { CryptoLotTransferTab } from './tabs/CryptoLotTransferTab';
import { CryptoLotSyncTab } from './tabs/CryptoLotSyncTab';
import { CryptoLotAdjustPruTab } from './tabs/CryptoLotAdjustPruTab';

interface CryptoLotModalProps {
  position: Position;
  onSave: (updatedPosition: Position) => void;
  onClose: () => void;
}

export default function CryptoLotModal({
  position,
  onSave,
  onClose,
}: CryptoLotModalProps) {
  const {
    activeMode,
    setActiveMode,
    pruModeInput,
    totalInvestedInput,
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
    handleTotalInvestedChange,
    handlePruDirectChange,
    handleApplyPRUAdjustment,
    handleSetPointZero,
    addedQty,
    unitPrice,
    liveMath,
    handleQuantityChange,
    handlePriceChange,
    handleTotalCostChange,
    handleAddLot,
    handleTransfer,
    handleSyncOnChain,
    grossVal,
    taxMetrics,
  } = useCryptoLotModalState({ position, onSave, onClose });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 640, width: '94vw', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🪙</span>
            <div>
              <h2 style={{ fontSize: 18, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
                Gestion Lots &amp; Wallets : {position.name} ({position.ticker})
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                Cumul automatique de solde, recalcul du PRU moyen net de frais et synchronisation on-chain.
              </p>
            </div>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        {/* Current State Summary Pill */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 8,
            padding: '10px 12px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 16,
          }}
        >
          <div>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Solde Actuel</span>
            <strong className="mono" style={{ fontSize: 13, color: 'var(--text-primary)' }}>
              {position.quantity < 1 ? position.quantity.toFixed(6) : position.quantity.toLocaleString('fr-FR')} {position.ticker}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>PRU Actuel</span>
            <strong className="mono" style={{ fontSize: 13, color: 'var(--accent-amber)' }}>
              {position.avgPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} €
            </strong>
          </div>
          <div>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Valeur Brute</span>
            <strong className="mono" style={{ fontSize: 13, color: 'var(--text-primary)' }}>
              {grossVal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Net Retirable (PFU 30%)</span>
            <strong className="mono" style={{ fontSize: 13, color: 'var(--accent-emerald)' }}>
              {taxMetrics.netWithdrawalEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </strong>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
          <button
            type="button"
            className={`btn ${activeMode === 'BUY' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 12.5, padding: '6px 14px', fontWeight: 700 }}
            onClick={() => setActiveMode('BUY')}
          >
            ➕ Ajouter un Achat / Lot
          </button>
          <button
            type="button"
            className={`btn ${activeMode === 'TRANSFER' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 12.5, padding: '6px 14px', fontWeight: 700 }}
            onClick={() => setActiveMode('TRANSFER')}
          >
            🔄 Transférer de Wallet
          </button>
          <button
            type="button"
            className={`btn ${activeMode === 'SYNC_ONCHAIN' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 12.5, padding: '6px 14px', fontWeight: 700 }}
            onClick={() => setActiveMode('SYNC_ONCHAIN')}
          >
            🛡️ Sync Trust Wallet (On-Chain)
          </button>
          <button
            type="button"
            className={`btn ${activeMode === 'ADJUST_PRU' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 12.5, padding: '6px 14px', fontWeight: 700 }}
            onClick={() => setActiveMode('ADJUST_PRU')}
          >
            🎯 Calibrer le PRU / Point Zéro
          </button>
        </div>

        {/* ═══ MODE 1 : BUY / ADD LOT ═══ */}
        {activeMode === 'BUY' && (
          <CryptoLotBuyTab
            position={position}
            targetWallet={targetWallet}
            setTargetWallet={setTargetWallet}
            customWalletName={customWalletName}
            setCustomWalletName={setCustomWalletName}
            quantityInput={quantityInput}
            handleQuantityChange={handleQuantityChange}
            priceInput={priceInput}
            handlePriceChange={handlePriceChange}
            totalCostInput={totalCostInput}
            handleTotalCostChange={handleTotalCostChange}
            feesInput={feesInput}
            setFeesInput={setFeesInput}
            notesInput={notesInput}
            setNotesInput={setNotesInput}
            liveMath={liveMath}
            addedQty={addedQty}
            unitPrice={unitPrice}
            handleAddLot={handleAddLot}
            onClose={onClose}
          />
        )}

        {/* ═══ MODE 2 : TRANSFER ═══ */}
        {activeMode === 'TRANSFER' && (
          <CryptoLotTransferTab
            position={position}
            fromWallet={fromWallet}
            setFromWallet={setFromWallet}
            toWallet={toWallet}
            setToWallet={setToWallet}
            transferQtyInput={transferQtyInput}
            setTransferQtyInput={setTransferQtyInput}
            transferGasFeesInput={transferGasFeesInput}
            setTransferGasFeesInput={setTransferGasFeesInput}
            handleTransfer={handleTransfer}
            onClose={onClose}
          />
        )}

        {/* ═══ MODE 3 : SYNC ON-CHAIN ═══ */}
        {activeMode === 'SYNC_ONCHAIN' && (
          <CryptoLotSyncTab
            syncAddressInput={syncAddressInput}
            setSyncAddressInput={setSyncAddressInput}
            isSyncing={isSyncing}
            syncMessage={syncMessage}
            handleSyncOnChain={handleSyncOnChain}
            onClose={onClose}
          />
        )}

        {/* ═══ MODE 4 : ADJUST / CALIBRATE PRU ═══ */}
        {activeMode === 'ADJUST_PRU' && (
          <CryptoLotAdjustPruTab
            position={position}
            totalInvestedInput={totalInvestedInput}
            handleTotalInvestedChange={handleTotalInvestedChange}
            pruModeInput={pruModeInput}
            handlePruDirectChange={handlePruDirectChange}
            handleSetPointZero={handleSetPointZero}
            handleApplyPRUAdjustment={handleApplyPRUAdjustment}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import type { Position, CryptoWalletPocket } from '@/types/portfolio';
import {
  calculateWeightedPRU,
  calculateCryptoTaxAndNet,
  addLotToCryptoPosition,
  transferBetweenCryptoWallets,
} from '@/utils/cryptoWalletEngine';

interface CryptoLotModalProps {
  position: Position;
  onSave: (updatedPosition: Position) => void;
  onClose: () => void;
}

const PRESET_WALLETS = [
  { name: 'Trust Wallet', icon: '🛡️', type: 'Non-Custodial / On-Chain' },
  { name: 'Revolut X', icon: '⚡', type: 'Exchange / DCA / Trading' },
  { name: 'Ledger', icon: '🔒', type: 'Cold Storage' },
  { name: 'Binance', icon: '🟡', type: 'Exchange' },
  { name: 'Phantom', icon: '🟣', type: 'Solana Wallet' },
  { name: 'Kraken', icon: '🐙', type: 'Exchange' },
  { name: 'Coinbase', icon: '🔵', type: 'Exchange' },
];

export default function CryptoLotModal({
  position,
  onSave,
  onClose,
}: CryptoLotModalProps) {
  const [activeMode, setActiveMode] = useState<'BUY' | 'TRANSFER' | 'SYNC_ONCHAIN' | 'ADJUST_PRU'>('BUY');
  const [pruModeInput, setPruModeInput] = useState<string>(() => position.avgPrice ? String(position.avgPrice) : String(position.currentPrice || ''));
  const [totalInvestedInput, setTotalInvestedInput] = useState<string>(() => position.quantity > 0 ? (position.quantity * (position.avgPrice || position.currentPrice || 0)).toFixed(2) : '');

  // Form State for BUY / ADD LOT
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

  // PRU Calibration Handlers
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

  // Math Calculations for BUY Mode
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

  // Handle unit price vs total cost synchronization
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
    const total = parseFloat(val) || 0;
    const q = parseFloat(quantityInput) || 0;
    if (q > 0 && total > 0) {
      setPriceInput((total / q).toFixed(4));
    }
  };

  // Submit BUY / ADD LOT
  const handleAddLot = (e: React.FormEvent) => {
    e.preventDefault();
    if (addedQty <= 0) return;

    const updated = addLotToCryptoPosition(position, {
      walletName: effectiveWalletName,
      quantity: addedQty,
      purchasePrice: unitPrice,
      feesEUR: addedFees,
      notes: notesInput.trim() || undefined,
    });

    onSave(updated);
    onClose();
  };

  // Submit TRANSFER
  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(transferQtyInput) || 0;
    const gas = parseFloat(transferGasFeesInput) || 0;
    if (qty <= 0) return;

    try {
      const updated = transferBetweenCryptoWallets(
        position,
        fromWallet,
        toWallet,
        qty,
        gas,
        notesInput.trim() || undefined
      );
      onSave(updated);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du transfert');
    }
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

        // Mettre à jour la poche Trust Wallet
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

        // Recalculer la quantité totale consolidée
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

  // Current taxes & net withdrawal calculation
  const curPrice = position.currentPrice || position.avgPrice;
  const grossVal = position.quantity * curPrice;
  const totalCost = position.quantity * position.avgPrice + currentTotalFees;
  const taxMetrics = calculateCryptoTaxAndNet(grossVal, totalCost);

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
          <form onSubmit={handleAddLot}>
            {/* Wallet Selector Chips */}
            <div style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>
                Poche / Wallet de destination *
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {PRESET_WALLETS.map((w) => (
                  <button
                    key={w.name}
                    type="button"
                    onClick={() => setTargetWallet(w.name)}
                    style={{
                      padding: '5px 10px',
                      fontSize: 12,
                      borderRadius: 6,
                      border: targetWallet === w.name ? '1.5px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
                      background: targetWallet === w.name ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)',
                      color: targetWallet === w.name ? 'var(--accent-amber)' : 'var(--text-secondary)',
                      fontWeight: targetWallet === w.name ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {w.icon} {w.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setTargetWallet('Autre')}
                  style={{
                    padding: '5px 10px',
                    fontSize: 12,
                    borderRadius: 6,
                    border: targetWallet === 'Autre' ? '1.5px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
                    background: targetWallet === 'Autre' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)',
                    color: targetWallet === 'Autre' ? 'var(--accent-amber)' : 'var(--text-secondary)',
                    fontWeight: targetWallet === 'Autre' ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  🌐 Autre...
                </button>
              </div>

              {targetWallet === 'Autre' && (
                <input
                  type="text"
                  className="input"
                  style={{ marginTop: 8, fontSize: 12.5 }}
                  placeholder="Nom du wallet (ex: Safe, Bitget, Exodus...)"
                  value={customWalletName}
                  onChange={(e) => setCustomWalletName(e.target.value)}
                  required
                />
              )}
            </div>

            {/* Inputs Grid : Quantity, Price, Total, Fees */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>
                  Quantité Achetée *
                </label>
                <input
                  className="input mono"
                  type="text"
                  inputMode="decimal"
                  placeholder="ex: 0.05"
                  value={quantityInput}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>
                  Prix d&apos;Achat Unitaire (€) *
                </label>
                <input
                  className="input mono"
                  type="text"
                  inputMode="decimal"
                  placeholder="ex: 55000"
                  value={priceInput}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>
                  Montant Total Payé (€)
                </label>
                <input
                  className="input mono"
                  type="text"
                  inputMode="decimal"
                  placeholder="ex: 2750"
                  value={totalCostInput}
                  onChange={(e) => handleTotalCostChange(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>
                  Frais / Gas Fees (€)
                </label>
                <input
                  className="input mono"
                  type="text"
                  inputMode="decimal"
                  placeholder="ex: 1.50"
                  value={feesInput}
                  onChange={(e) => setFeesInput(e.target.value)}
                />
              </div>
            </div>

            {/* Live PRU and Total Calculation Preview */}
            {liveMath && (
              <div
                style={{
                  padding: '12px 14px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>⚡</span>
                  <strong style={{ fontSize: 12.5, color: 'var(--accent-amber)' }}>
                    Recalcul automatique en temps réel (Zéro calcul mental) :
                  </strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Nouveau Solde Global :</span>
                    <div className="mono" style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {liveMath.newQuantity < 1 ? liveMath.newQuantity.toFixed(6) : liveMath.newQuantity.toLocaleString('fr-FR')} {position.ticker}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Nouveau PRU Moyen Pondéré :</span>
                    <div className="mono" style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--accent-cyan)' }}>
                      {liveMath.newAvgPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} €
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Frais Totaux Cumulés :</span>
                    <div className="mono" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {liveMath.newTotalFeesEUR.toFixed(2)} €
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontSize: 11.5 }}>
                Notes / Mémo (optionnel)
              </label>
              <input
                type="text"
                className="input"
                placeholder="ex: DCA hebdo Revolut X, Achat dip..."
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  borderColor: '#f59e0b',
                  color: '#000',
                  fontWeight: 800,
                }}
                disabled={addedQty <= 0 || unitPrice <= 0}
              >
                ✅ Valider et Ajouter au Solde
              </button>
            </div>
          </form>
        )}

        {/* ═══ MODE 2 : TRANSFER ═══ */}
        {activeMode === 'TRANSFER' && (
          <form onSubmit={handleTransfer}>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Déplacez des fonds d&apos;une plateforme à une autre (ex: de <strong>Revolut X</strong> vers <strong>Trust Wallet</strong>) en déduisant les frais de gaz réseau sans fausser votre PRU global.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Depuis le Wallet (Source)</label>
                <select
                  className="input"
                  value={fromWallet}
                  onChange={(e) => setFromWallet(e.target.value)}
                >
                  {(position.cryptoWallets || [{ walletName: 'Revolut X', quantity: position.quantity }]).map((w) => (
                    <option key={w.walletName} value={w.walletName}>
                      {w.walletName} ({w.quantity} {position.ticker})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Vers le Wallet (Destination)</label>
                <select
                  className="input"
                  value={toWallet}
                  onChange={(e) => setToWallet(e.target.value)}
                >
                  {PRESET_WALLETS.map((w) => (
                    <option key={w.name} value={w.name}>
                      {w.icon} {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Quantité Transférée *</label>
                <input
                  className="input mono"
                  type="text"
                  inputMode="decimal"
                  placeholder="ex: 0.05"
                  value={transferQtyInput}
                  onChange={(e) => setTransferQtyInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Gas Fees / Frais de Réseau (€)</label>
                <input
                  className="input mono"
                  type="text"
                  inputMode="decimal"
                  placeholder="ex: 2.00"
                  value={transferGasFeesInput}
                  onChange={(e) => setTransferGasFeesInput(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ fontWeight: 800 }}
                disabled={!parseFloat(transferQtyInput)}
              >
                🔄 Exécuter le Transfert
              </button>
            </div>
          </form>
        )}

        {/* ═══ MODE 4 : ADJUST / CALIBRATE PRU ═══ */}
        {activeMode === 'ADJUST_PRU' && (
          <div>
            {/* Pedagogical info banner with radical honesty */}
            <div
              style={{
                padding: '12px 14px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>💡</span>
                <strong style={{ fontSize: 13, color: 'var(--accent-cyan)' }}>
                  Comprendre le PRU &amp; la Blockchain
                </strong>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px 0', lineHeight: 1.5 }}>
                La blockchain enregistre les transferts de jetons et leurs dates, mais <strong>ne connaît pas</strong> le prix en Euros payé sur vos exchanges passés (Binance, Kraken, etc.) avant le transfert vers Trust Wallet.
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Choisissez l&apos;une des deux méthodes simples ci-dessous pour calibrer votre gain/perte avec précision.
              </p>
            </div>

            {/* Option A : Point Zéro (Nouveau Départ) */}
            <div
              style={{
                padding: 14,
                background: 'var(--bg-secondary)',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <strong style={{ fontSize: 13, color: 'var(--text-primary)', display: 'block' }}>
                    Option 1 : Nouveau Départ (Point Zéro / 0% P&amp;L)
                  </strong>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Fixe le PRU au cours de marché actuel ({position.currentPrice ? position.currentPrice.toLocaleString('fr-FR') : position.avgPrice.toLocaleString('fr-FR')} €). Vous mesurerez vos gains/pertes à partir d&apos;aujourd&apos;hui.
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    fontSize: 12,
                    padding: '7px 14px',
                    fontWeight: 700,
                    borderColor: 'var(--accent-amber)',
                    color: 'var(--accent-amber)',
                  }}
                  onClick={handleSetPointZero}
                >
                  ⚡ Définir Point Zéro (0% P&amp;L)
                </button>
              </div>
            </div>

            {/* Option B : Saisie par Montant Total Investi ou PRU */}
            <form onSubmit={handleApplyPRUAdjustment}>
              <div
                style={{
                  padding: 14,
                  background: 'var(--bg-secondary)',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  marginBottom: 16,
                }}
              >
                <strong style={{ fontSize: 13, color: 'var(--text-primary)', display: 'block', marginBottom: 10 }}>
                  Option 2 : Calibrage par Montant Total Investi (€)
                </strong>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>
                      Montant Total Investi Estimé (€) *
                    </label>
                    <input
                      className="input mono"
                      type="text"
                      inputMode="decimal"
                      placeholder="ex: 2000.00"
                      value={totalInvestedInput}
                      onChange={(e) => handleTotalInvestedChange(e.target.value)}
                    />
                    <small style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, display: 'block' }}>
                      Budget cumulé dépensé pour acquérir vos {position.quantity.toFixed(4)} {position.ticker}
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>
                      PRU Moyen Résultant (€ / unité) *
                    </label>
                    <input
                      className="input mono"
                      type="text"
                      inputMode="decimal"
                      placeholder="ex: 520.00"
                      value={pruModeInput}
                      onChange={(e) => handlePruDirectChange(e.target.value)}
                      required
                    />
                    <small style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, display: 'block' }}>
                      Prix d&apos;achat unitaire moyen de revient
                    </small>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                  <button type="button" className="btn btn-secondary" onClick={onClose}>
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ fontWeight: 800 }}
                    disabled={!parseFloat(pruModeInput)}
                  >
                    ✓ Enregistrer le Nouveau PRU
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ═══ MODE 3 : SYNC ON-CHAIN ═══ */}
        {activeMode === 'SYNC_ONCHAIN' && (
          <div>
            <div
              style={{
                padding: '12px 14px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 8,
                marginBottom: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>🛡️</span>
                <strong style={{ fontSize: 13, color: 'var(--accent-emerald)' }}>
                  Connexion 100% Sécurisée &amp; Lecture Seule (Watch-Only)
                </strong>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                Renseignez simplement l&apos;adresse publique de votre Trust Wallet (ex : <code>0x...</code> ou adresse Solana/Bitcoin). L&apos;application interroge la blockchain en direct sans jamais demander de clé privée ni de seed phrase.
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>
                Adresse Publique Trust Wallet *
              </label>
              <input
                className="input mono"
                type="text"
                placeholder="0x71C... ou bc1... ou Sol..."
                value={syncAddressInput}
                onChange={(e) => setSyncAddressInput(e.target.value)}
              />
            </div>

            {syncMessage && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  marginBottom: 14,
                  fontSize: 12.5,
                  fontWeight: 600,
                  background: syncMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: syncMessage.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  border: `1px solid ${syncMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                }}
              >
                {syncMessage.text}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Fermer
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderColor: '#10b981',
                  color: '#fff',
                  fontWeight: 800,
                }}
                onClick={handleSyncOnChain}
                disabled={isSyncing || !syncAddressInput.trim()}
              >
                {isSyncing ? <span className="loading-spinner" /> : '🔄 Synchroniser le Solde On-Chain'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';

const PRESET_WALLETS = [
  { name: 'Trust Wallet', icon: '🛡️', type: 'Non-Custodial / On-Chain' },
  { name: 'Revolut X', icon: '⚡', type: 'Exchange / DCA / Trading' },
  { name: 'Ledger', icon: '🔒', type: 'Cold Storage' },
  { name: 'Binance', icon: '🟡', type: 'Exchange' },
  { name: 'Phantom', icon: '🟣', type: 'Solana Wallet' },
  { name: 'Kraken', icon: '🐙', type: 'Exchange' },
  { name: 'Coinbase', icon: '🔵', type: 'Exchange' },
];

interface CryptoLotTransferTabProps {
  position: Position;
  fromWallet: string;
  setFromWallet: (w: string) => void;
  toWallet: string;
  setToWallet: (w: string) => void;
  transferQtyInput: string;
  setTransferQtyInput: (val: string) => void;
  transferGasFeesInput: string;
  setTransferGasFeesInput: (val: string) => void;
  handleTransfer: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function CryptoLotTransferTab({
  position,
  fromWallet,
  setFromWallet,
  toWallet,
  setToWallet,
  transferQtyInput,
  setTransferQtyInput,
  transferGasFeesInput,
  setTransferGasFeesInput,
  handleTransfer,
  onClose,
}: CryptoLotTransferTabProps) {
  return (
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
  );
}

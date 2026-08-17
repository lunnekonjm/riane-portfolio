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

interface CryptoLotBuyTabProps {
  position: Position;
  targetWallet: string;
  setTargetWallet: (w: string) => void;
  customWalletName: string;
  setCustomWalletName: (w: string) => void;
  quantityInput: string;
  handleQuantityChange: (val: string) => void;
  priceInput: string;
  handlePriceChange: (val: string) => void;
  totalCostInput: string;
  handleTotalCostChange: (val: string) => void;
  feesInput: string;
  setFeesInput: (val: string) => void;
  notesInput: string;
  setNotesInput: (val: string) => void;
  liveMath: any;
  addedQty: number;
  unitPrice: number;
  handleAddLot: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function CryptoLotBuyTab({
  position,
  targetWallet,
  setTargetWallet,
  customWalletName,
  setCustomWalletName,
  quantityInput,
  handleQuantityChange,
  priceInput,
  handlePriceChange,
  totalCostInput,
  handleTotalCostChange,
  feesInput,
  setFeesInput,
  notesInput,
  setNotesInput,
  liveMath,
  addedQty,
  unitPrice,
  handleAddLot,
  onClose,
}: CryptoLotBuyTabProps) {
  return (
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
            placeholder="ex: 55000.00"
            value={priceInput}
            onChange={(e) => handlePriceChange(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11.5 }}>
            Montant Total Achat (€)
          </label>
          <input
            className="input mono"
            type="text"
            inputMode="decimal"
            placeholder="ex: 2750.00"
            value={totalCostInput}
            onChange={(e) => handleTotalCostChange(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11.5 }}>
            Frais de Transaction (€)
          </label>
          <input
            className="input mono"
            type="text"
            inputMode="decimal"
            placeholder="ex: 2.50"
            value={feesInput}
            onChange={(e) => setFeesInput(e.target.value)}
          />
        </div>
      </div>

      {/* Live Math Calculation Preview */}
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
  );
}

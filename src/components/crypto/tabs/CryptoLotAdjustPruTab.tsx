'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';

interface CryptoLotAdjustPruTabProps {
  position: Position;
  totalInvestedInput: string;
  handleTotalInvestedChange: (val: string) => void;
  pruModeInput: string;
  handlePruDirectChange: (val: string) => void;
  handleSetPointZero: () => void;
  handleApplyPRUAdjustment: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function CryptoLotAdjustPruTab({
  position,
  totalInvestedInput,
  handleTotalInvestedChange,
  pruModeInput,
  handlePruDirectChange,
  handleSetPointZero,
  handleApplyPRUAdjustment,
  onClose,
}: CryptoLotAdjustPruTabProps) {
  return (
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
  );
}

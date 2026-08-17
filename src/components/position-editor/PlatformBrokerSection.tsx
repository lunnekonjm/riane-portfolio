'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';

interface PlatformBrokerSectionProps {
  envelope: Position['envelope'];
  assetType: Position['assetType'];
  institutionName?: string;
  onInstitutionChange: (inst: string) => void;
  cryptoWallets?: Position['cryptoWallets'];
  totalFeesEUR?: number;
  onFeesChange: (fees: number) => void;
  quantity?: number;
  avgPrice?: number;
  currentPrice?: number;
}

export default function PlatformBrokerSection({
  envelope,
  assetType,
  institutionName = '',
  onInstitutionChange,
  cryptoWallets,
  totalFeesEUR = 0,
  onFeesChange,
  quantity = 0,
  avgPrice = 0,
  currentPrice = 0,
}: PlatformBrokerSectionProps) {
  const isCrypto = envelope === 'CRYPTO' || assetType === 'CRYPTO';
  const isBourse = envelope === 'PEA' || envelope === 'PEA-PME' || envelope === 'CTO' || assetType === 'STOCK' || assetType === 'ETF';

  if (!isCrypto && !isBourse) return null;

  return (
    <>
      {/* Broker / Courtier Section for Bourse (PEA, PEA-PME, CTO) */}
      {isBourse && !isCrypto && (
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(6, 182, 212, 0.06)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>🏦</span> Courtier / Teneur de Compte ({envelope}) :
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Badge d'établissement</span>
          </div>

          {/* Broker Quick Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {[
              { label: '🧭 BoursoBank', value: 'BoursoBank' },
              { label: '📱 Trade Republic', value: 'Trade Republic' },
              { label: '📊 Interactive Brokers', value: 'Interactive Brokers' },
              { label: '🍀 Fortuneo', value: 'Fortuneo' },
              { label: '🌐 DEGIRO', value: 'DEGIRO' },
              { label: '⚡ Revolut', value: 'Revolut' },
              { label: '🏛️ Amundi ESR', value: 'Amundi' },
            ].map((inst) => {
              const isSelected = (institutionName || '').toLowerCase() === inst.value.toLowerCase();
              return (
                <button
                  key={inst.value}
                  type="button"
                  onClick={() => onInstitutionChange(inst.value)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    borderRadius: 6,
                    border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'rgba(6, 182, 212, 0.25)' : 'var(--bg-secondary)',
                    color: isSelected ? '#67e8f9' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.15s ease-in-out',
                    boxShadow: isSelected ? '0 0 10px rgba(6, 182, 212, 0.35)' : 'none',
                  }}
                >
                  {isSelected ? `✓ ${inst.label}` : inst.label}
                </button>
              );
            })}
          </div>

          {/* Custom Broker input */}
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>
              Courtier / Établissement personnalisé
            </label>
            <input
              className="input"
              type="text"
              value={institutionName || ''}
              onChange={(e) => onInstitutionChange(e.target.value)}
              placeholder="ex: BoursoBank, Trade Republic, Interactive Brokers, Fortuneo..."
              style={{ fontSize: 12, padding: '6px 10px' }}
            />
          </div>
        </div>
      )}

      {/* Crypto Platform / Wallet of Detention */}
      {isCrypto && (
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>🪙</span> Plateforme / Wallet de Détention :
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Multi-wallets &amp; Frais de réseau</span>
          </div>

          {/* Institution Quick Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {[
              { label: '⚡ Revolut X', value: 'Revolut X' },
              { label: '🛡️ Trust Wallet', value: 'Trust Wallet' },
              { label: '🔒 Ledger (Cold Storage)', value: 'Ledger' },
              { label: '🟣 Phantom', value: 'Phantom' },
              { label: '🦊 MetaMask', value: 'MetaMask' },
              { label: '🟡 Binance', value: 'Binance' },
              { label: '🐙 Kraken', value: 'Kraken' },
              { label: '🔵 Coinbase', value: 'Coinbase' },
              { label: '🟢 OKX', value: 'OKX' },
              { label: '🟠 Bybit', value: 'Bybit' },
            ].map((inst) => {
              const isSelected =
                (institutionName || '').toLowerCase() === inst.value.toLowerCase() ||
                (cryptoWallets?.[0]?.institution || '').toLowerCase() === inst.value.toLowerCase() ||
                (cryptoWallets?.[0]?.walletName || '').toLowerCase() === inst.value.toLowerCase();
              return (
                <button
                  key={inst.value}
                  type="button"
                  onClick={() => onInstitutionChange(inst.value)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    borderRadius: 6,
                    border: isSelected ? '2px solid #f59e0b' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'rgba(245, 158, 11, 0.25)' : 'var(--bg-secondary)',
                    color: isSelected ? '#fbbf24' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.15s ease-in-out',
                    boxShadow: isSelected ? '0 0 10px rgba(245, 158, 11, 0.35)' : 'none',
                  }}
                >
                  {isSelected ? `✓ ${inst.label}` : inst.label}
                </button>
              );
            })}
          </div>

          {/* Editable custom input for platform */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>
              Établissement / Plateforme sélectionnée
            </label>
            <input
              className="input"
              type="text"
              value={institutionName || ''}
              onChange={(e) => onInstitutionChange(e.target.value)}
              placeholder="ex: Revolut X, Binance, Ledger, Trust Wallet, Kraken..."
              style={{ fontSize: 12, padding: '6px 10px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
                Frais totaux / Gaz (€)
              </label>
              <input
                className="input mono"
                type="number"
                step="0.1"
                min="0"
                style={{ fontSize: 12, padding: '4px 8px' }}
                value={totalFeesEUR || ''}
                onChange={(e) => onFeesChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00 €"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
                Flat Tax PFU 30% estimée
              </label>
              <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-rose)', paddingTop: 5 }}>
                {(() => {
                  const cost = quantity * avgPrice + totalFeesEUR;
                  const val = quantity * (currentPrice || avgPrice);
                  const gain = val - cost;
                  if (gain > 305) {
                    return `-${(gain * 0.3).toFixed(2)} € (30%)`;
                  }
                  return '0.00 € (Exonéré)';
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

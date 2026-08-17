'use client';

import React from 'react';

interface CryptoTableToolbarProps {
  cryptoPositionsCount: number;
  refreshingPrices: boolean;
  onRefreshPrices?: () => void;
  onOpenOnChainImportModal: () => void;
  onAddCryptoPosition: () => void;
  totalCryptoValEUR: number;
  totalCryptoFeesEUR: number;
  totalCryptoPLEUR: number;
  totalCryptoPLPct: number;
  totalCryptoMonthlyDCA: number;
  globalTaxMetrics: any;
  cryptoWeightInWealth: number;
  walletFilterTabs: { id: string; label: string }[];
  selectedWalletFilter: string;
  setSelectedWalletFilter: (filter: string) => void;
}

export function CryptoTableToolbar({
  cryptoPositionsCount,
  refreshingPrices,
  onRefreshPrices,
  onOpenOnChainImportModal,
  onAddCryptoPosition,
  totalCryptoValEUR,
  totalCryptoFeesEUR,
  totalCryptoPLEUR,
  totalCryptoPLPct,
  totalCryptoMonthlyDCA,
  globalTaxMetrics,
  cryptoWeightInWealth,
  walletFilterTabs,
  selectedWalletFilter,
  setSelectedWalletFilter,
}: CryptoTableToolbarProps) {
  return (
    <>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
          marginBottom: 18,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 14,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 24 }}>🪙</span>
            <h3 style={{ fontSize: 18, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
              Portefeuille Crypto-Actifs ({cryptoPositionsCount})
            </h3>
            <span className="badge badge-cyan" style={{ fontSize: 12, padding: '4px 10px', fontWeight: 600 }}>
              Marché Live 24/7
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
            Suivi des cryptomonnaies, wallets on-chain (Trust Wallet, Revolut X, Ledger), valorisation temps réel et fiscalité Flat Tax (30%).
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {onRefreshPrices && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onRefreshPrices}
              disabled={refreshingPrices}
              style={{ fontSize: 13, padding: '8px 14px' }}
              title="Actualiser les cours crypto 24/7 et resynchroniser les soldes des adresses on-chain"
              id="refresh-crypto-prices-btn"
            >
              {refreshingPrices ? <span className="loading-spinner" /> : '🪙'} Actualiser Cryptos
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenOnChainImportModal}
            style={{ fontSize: 13, padding: '8px 14px' }}
            data-tooltip="Coller une adresse publique (EVM, BTC, SOL) pour importer automatiquement vos actifs"
          >
            🔗 Importer Wallet On-Chain
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onAddCryptoPosition}
            style={{ fontSize: 13, padding: '8px 14px' }}
            id="btn-add-crypto"
          >
            ➕ Ajouter un Crypto-Actif
          </button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 18 }}>
        <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px' }}>
            Valeur Crypto Totale
          </span>
          <strong className="mono" style={{ fontSize: 20, color: 'var(--accent-cyan)', fontWeight: 800, marginTop: 4, display: 'block' }}>
            {totalCryptoValEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </strong>
        </div>

        <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px' }}>
            Plus-Value Latente Totale
          </span>
          <strong className="mono" style={{ fontSize: 20, color: totalCryptoPLEUR >= 0 ? 'var(--accent-emerald)' : '#f87171', fontWeight: 800, marginTop: 4, display: 'block' }}>
            {totalCryptoPLEUR >= 0 ? '+' : ''}{totalCryptoPLEUR.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € ({totalCryptoPLEUR >= 0 ? '+' : ''}{totalCryptoPLPct.toFixed(1)}%)
          </strong>
        </div>

        <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px' }}>
            Investissement Mensuel (DCA)
          </span>
          <strong className="mono" style={{ fontSize: 20, color: 'var(--accent-amber)', fontWeight: 800, marginTop: 4, display: 'block' }}>
            +{totalCryptoMonthlyDCA.toLocaleString('fr-FR')} € /mois
          </strong>
        </div>
      </div>

      {/* Subtle Fiscal & Multi-Wallet Info Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          padding: '8px 14px',
          borderRadius: 8,
          background: 'rgba(6, 182, 212, 0.05)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          marginBottom: 14,
          fontSize: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            🏛️ <strong>Fiscalité PFU (Art. 150 VH bis CGI)</strong> :{' '}
            {globalTaxMetrics?.isTaxExempt ? (
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>Exonéré (&lt; 305 €/an de cession fiat)</span>
            ) : (
              <span style={{ color: '#f87171', fontWeight: 700 }}>
                -{(globalTaxMetrics?.taxEUR || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} PFU (30%)
              </span>
            )}
          </span>
          {totalCryptoFeesEUR > 0 && (
            <span style={{ color: 'var(--text-tertiary)' }}>
              • Frais/gaz déductibles : <strong>{totalCryptoFeesEUR.toFixed(2)} €</strong>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Part du patrimoine :</span>
          <strong className="mono" style={{ color: cryptoWeightInWealth > 10 ? 'var(--accent-amber)' : 'var(--accent-cyan)' }}>
            {cryptoWeightInWealth.toFixed(2)}%
          </strong>
          {cryptoWeightInWealth > 10 && (
            <span className="badge badge-amber" style={{ fontSize: 10, padding: '2px 6px' }}>
              &gt; 10% (Prudence)
            </span>
          )}
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, padding: '0 4px' }}>
        {walletFilterTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`btn ${selectedWalletFilter === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 'var(--text-xs)', padding: '4px 10px', borderRadius: 20 }}
            onClick={() => setSelectedWalletFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </>
  );
}

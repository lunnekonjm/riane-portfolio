'use client';

import React, { useState, useMemo } from 'react';
import type { Position } from '@/types/portfolio';
import AssetLogo from './AssetLogo';
import { getActiveDCATranche } from '@/utils/dcaHistoryHelper';
import { calculateCryptoTaxAndNet, cleanWalletProviderName } from '@/utils/cryptoWalletEngine';
import CryptoLotModal from './crypto/CryptoLotModal';
import OnChainWalletImportModal from './crypto/OnChainWalletImportModal';

interface CryptoPortfolioTableProps {
  positions: Position[];
  fxRates: Record<string, number>;
  totalNetWorthEUR?: number;
  refreshingPrices: boolean;
  onRefreshPrices: () => void;
  onEditPosition: (pos: Position) => void;
  onDeletePosition: (id: string) => void;
  onAddCryptoPosition: () => void;
  onSavePosition?: (pos: Position) => void;
}

export default function CryptoPortfolioTable({
  positions,
  fxRates,
  totalNetWorthEUR = 0,
  refreshingPrices,
  onRefreshPrices,
  onEditPosition,
  onDeletePosition,
  onAddCryptoPosition,
  onSavePosition,
}: CryptoPortfolioTableProps) {
  const [selectedWalletFilter, setSelectedWalletFilter] = useState<string>('ALL');
  const [selectedPositionForLot, setSelectedPositionForLot] = useState<Position | null>(null);
  const [showOnChainImportModal, setShowOnChainImportModal] = useState(false);

  // Filter positions to retain only Crypto assets
  const cryptoPositions = useMemo(() => {
    return positions.filter(
      (p) => p.assetType === 'CRYPTO' || p.envelope === 'CRYPTO'
    );
  }, [positions]);

  // Aggregate Metrics
  const totalCryptoValEUR = useMemo(() => {
    return cryptoPositions.reduce((sum, p) => {
      const pr = p.currentPrice || p.avgPrice;
      const rate = (fxRates as any)[p.currency] || 1.0;
      return sum + p.quantity * pr * rate;
    }, 0);
  }, [cryptoPositions, fxRates]);

  const totalCryptoCostEUR = useMemo(() => {
    return cryptoPositions.reduce((sum, p) => {
      const rate = (fxRates as any)[p.currency] || 1.0;
      const fees = p.totalFeesEUR || 0;
      return sum + p.quantity * p.avgPrice * rate + fees;
    }, 0);
  }, [cryptoPositions, fxRates]);

  const totalCryptoFeesEUR = useMemo(() => {
    return cryptoPositions.reduce((sum, p) => sum + (p.totalFeesEUR || 0), 0);
  }, [cryptoPositions]);

  const totalCryptoPLEUR = totalCryptoValEUR - totalCryptoCostEUR;
  const totalCryptoPLPct = totalCryptoCostEUR > 0 ? (totalCryptoPLEUR / totalCryptoCostEUR) * 100 : 0;

  // Fiscalité Globale PFU 30% (Article 150 VH bis du CGI)
  const globalTaxMetrics = useMemo(() => {
    return calculateCryptoTaxAndNet(totalCryptoValEUR, totalCryptoCostEUR);
  }, [totalCryptoValEUR, totalCryptoCostEUR]);

  const totalCryptoMonthlyDCA = useMemo(() => {
    return cryptoPositions.reduce((sum, p) => {
      const activeTranche = p.dcaHistory && p.dcaHistory.length > 0 ? getActiveDCATranche(p.dcaHistory) : null;
      const effective = activeTranche ? activeTranche.amount : (p.monthlyDCA || (p.annualBudget ? Math.round(p.annualBudget / 12) : 0));
      return sum + (effective || 0);
    }, 0);
  }, [cryptoPositions]);

  const cryptoWeightInWealth = totalNetWorthEUR > 0 ? (totalCryptoValEUR / totalNetWorthEUR) * 100 : 0;

  // Dynamic filter tabs based on wallets/institutions present
  const walletFilterTabs = useMemo(() => {
    const tabs = [
      { id: 'ALL', label: `🌐 Tout (${cryptoPositions.length})` },
    ];

    const walletCounts: Record<string, number> = {};
    cryptoPositions.forEach((p) => {
      const instSet = new Set<string>();
      if (p.cryptoWallets && p.cryptoWallets.length > 0) {
        p.cryptoWallets.forEach((w) => {
          const key = cleanWalletProviderName(w.institution || w.walletName);
          if (key) instSet.add(key);
        });
      } else if (p.institutionName) {
        const key = cleanWalletProviderName(p.institutionName);
        if (key) instSet.add(key);
      }
      instSet.forEach((key) => {
        walletCounts[key] = (walletCounts[key] || 0) + 1;
      });
    });

    Object.entries(walletCounts).forEach(([name, count]) => {
      const icon = name.toLowerCase().includes('trust') ? '🛡️' : name.toLowerCase().includes('revolut') ? '⚡' : name.toLowerCase().includes('ledger') || name.toLowerCase().includes('cold') ? '🔒' : '🪙';
      tabs.push({ id: name, label: `${icon} ${name} (${count})` });
    });

    return tabs;
  }, [cryptoPositions]);

  const filteredCryptoPositions = useMemo(() => {
    if (selectedWalletFilter === 'ALL') return cryptoPositions;
    const cleanFilter = cleanWalletProviderName(selectedWalletFilter).toLowerCase();
    return cryptoPositions.filter((p) => {
      if (p.cryptoWallets?.some((w) => cleanWalletProviderName(w.institution || w.walletName).toLowerCase() === cleanFilter)) return true;
      if (p.institutionName && cleanWalletProviderName(p.institutionName).toLowerCase() === cleanFilter) return true;
      return false;
    });
  }, [cryptoPositions, selectedWalletFilter]);

  const handleLotSaved = (updated: Position) => {
    if (onSavePosition) {
      onSavePosition(updated);
    } else {
      onEditPosition(updated);
    }
    setSelectedPositionForLot(null);
  };

  const handleBatchImport = (importedAssets: Position[]) => {
    importedAssets.forEach((asset) => {
      if (onSavePosition) {
        onSavePosition(asset);
      } else {
        onEditPosition(asset);
      }
    });
  };

  if (cryptoPositions.length === 0) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', marginBottom: 28, border: '1px dashed var(--border-accent)' }}>
        <h3 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8, fontWeight: 700 }}>
          🪙 Portefeuille Crypto-Actifs &amp; Multi-Wallets
        </h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 18, maxWidth: 540, margin: '0 auto 18px auto' }}>
          Aucun crypto-actif dans votre portefeuille pour le moment. Suivez vos cryptomonnaies (Bitcoin, Ethereum, Solana, Altcoins), synchronisez vos adresses on-chain (Trust Wallet, Ledger, MetaMask) et suivez votre fiscalité PFU 30%.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowOnChainImportModal(true)}
            style={{ fontSize: 13, padding: '8px 16px' }}
          >
            🔗 Importer une adresse blockchain
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onAddCryptoPosition}
            style={{ fontSize: 13, padding: '8px 16px' }}
            id="btn-add-crypto"
          >
            ➕ Ajouter mon premier crypto-actif
          </button>
        </div>

        {/* Modal On-Chain Import */}
        <OnChainWalletImportModal
          isOpen={showOnChainImportModal}
          onClose={() => setShowOnChainImportModal(false)}
          onImportAssets={handleBatchImport}
          existingPositions={positions}
        />
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 28, padding: 18 }}>
      {/* Header Banner - Strictly matching Bourse & Épargne style */}
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
              Portefeuille Crypto-Actifs ({cryptoPositions.length})
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
            onClick={() => setShowOnChainImportModal(true)}
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

      {/* KPI Cards Bar - Strictly matching Bourse & Épargne 3-card grid */}
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

      {/* Filter Tabs Bar (Strictly identical to Bourse and Épargne tables) */}
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

      {/* Table with Touch Responsive Scrolling and Shared portfolio-table Design */}
      <div className="table-responsive" style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', borderRadius: 'var(--radius-md)' }}>
        <table className="portfolio-table">
          <thead>
            <tr>
              <th><span data-tooltip="Nom complet du crypto-actif, ticker et wallets détenteurs">Actif</span></th>
              <th><span data-tooltip="Enveloppe fiscale (CRYPTO / Déclaratif 2086)">Enveloppe</span></th>
              <th><span data-tooltip="Cours en temps réel 24/7 et Prix de Revient Unitaire moyen (PRU)">Prix / Rendement</span></th>
              <th><span data-tooltip="Valeur totale détenue et solde en jetons">Valeur / Solde</span></th>
              <th><span data-tooltip="Plus ou Moins-value latente totale et nette après PFU 30%">Gains &amp; Performance</span></th>
              <th><span data-tooltip="Budget mensuel programmé d'accumulation DCA">DCA</span></th>
              <th><span data-tooltip="Poids de la crypto dans votre patrimoine total comparé au seuil max de 10%">Plafond &amp; Risque</span></th>
              <th style={{ width: 90, textAlign: 'center' }}><span data-tooltip="Actions : Gérer les lots par wallet, Éditer, Supprimer">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {filteredCryptoPositions.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-secondary)' }}>
                  🔍 Aucun crypto-actif ne correspond au filtre sélectionné.
                </td>
              </tr>
            ) : (
              filteredCryptoPositions.map((pos) => {
                const price = pos.currentPrice || pos.avgPrice;
                const value = pos.quantity * price;
                const cost = (pos.quantity * pos.avgPrice) + (pos.totalFeesEUR || 0);
                const pl = value - cost;
                const plPct = cost > 0 ? (pl / cost) * 100 : 0;
                const assetWeightPct = totalNetWorthEUR > 0 ? (value / totalNetWorthEUR) * 100 : 0;

                const activeCryptoTranche = pos.dcaHistory && pos.dcaHistory.length > 0
                  ? getActiveDCATranche(pos.dcaHistory)
                  : null;
                const effectiveMonthlyDCA = activeCryptoTranche ? activeCryptoTranche.amount : (pos.monthlyDCA || (pos.annualBudget ? Math.round(pos.annualBudget / 12) : 0));
                const hasActiveDCA = Boolean((effectiveMonthlyDCA && effectiveMonthlyDCA > 0) || (pos.dcaHistory && pos.dcaHistory.length > 0));

                const walletBadges = (() => {
                  const seen = new Set<string>();
                  const list: string[] = [];
                  if (pos.cryptoWallets && pos.cryptoWallets.length > 0) {
                    pos.cryptoWallets.forEach((w) => {
                      const raw = cleanWalletProviderName(w.institution || w.walletName);
                      if (raw && !seen.has(raw.toLowerCase())) {
                        seen.add(raw.toLowerCase());
                        list.push(raw);
                      }
                    });
                  } else if (pos.institutionName) {
                    const raw = cleanWalletProviderName(pos.institutionName);
                    if (raw) list.push(raw);
                  }
                  return list;
                })();

                return (
                  <tr key={pos.id} style={{ cursor: 'pointer' }} onClick={() => onEditPosition(pos)}>
                    <td style={{ minWidth: 180, maxWidth: 280 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AssetLogo
                          ticker={pos.ticker}
                          name={pos.name}
                          envelope="CRYPTO"
                          institutionName={pos.institutionName}
                          size={32}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <strong
                            style={{
                              display: 'block',
                              fontSize: 13,
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={pos.name}
                          >
                            {pos.name}
                          </strong>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                            <span className="mono" style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 600 }}>
                              🏷️ {pos.ticker}
                            </span>
                            {walletBadges.map((badge, idx) => {
                              const icon = badge.toLowerCase().includes('trust') ? '🛡️' : badge.toLowerCase().includes('revolut') ? '⚡' : badge.toLowerCase().includes('ledger') ? '🔒' : '🪙';
                              return (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: 10,
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    background: 'rgba(245, 158, 11, 0.12)',
                                    color: 'var(--accent-amber)',
                                    border: '1px solid rgba(245, 158, 11, 0.25)',
                                    fontWeight: 600,
                                  }}
                                >
                                  {icon} {badge}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="envelope-tag crypto" style={{ fontSize: 11, padding: '2px 7px' }}>
                        CRYPTO
                      </span>
                    </td>

                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>
                          {price > 0 ? `${price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: price < 1 ? 4 : 2 })} €` : '—'}
                        </strong>
                        <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                          Live
                        </span>
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', marginTop: 1 }}>
                        PRU {pos.avgPrice > 0 ? `${pos.avgPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: pos.avgPrice < 1 ? 4 : 2 })} €` : '—'}
                      </span>
                    </td>

                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                      <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: 14, fontWeight: 800 }}>
                        {value > 0 ? `${value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}` : '—'}
                      </strong>
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                        {pos.quantity.toLocaleString('fr-FR', { maximumFractionDigits: 8 })} {pos.ticker.replace('-EUR', '').replace('-USD', '')}
                      </span>
                    </td>

                    <td style={{ whiteSpace: 'nowrap' }}>
                      {cost > 0 ? (
                        <div
                          className={`stat-change ${pl >= 0 ? 'positive' : 'negative'}`}
                          style={{
                            display: 'inline-flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            padding: '3px 8px',
                            borderRadius: 6,
                            whiteSpace: 'nowrap',
                            lineHeight: 1.2,
                          }}
                          title={`Plus/Moins-value brute : ${pl >= 0 ? '+' : ''}${pl.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
                        >
                          <div style={{ fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <span>{pl >= 0 ? '↑' : '↓'}</span>
                            <span>{pl >= 0 ? '+' : ''}{plPct.toFixed(1)}%</span>
                          </div>
                          <div style={{ fontSize: 10, opacity: 0.95, fontWeight: 600, marginTop: 1 }}>
                            ({pl >= 0 ? '+' : ''}{pl.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €)
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    <td className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                      {hasActiveDCA ? (
                        <div>
                          <span style={{ color: 'var(--accent-amber)', fontWeight: 700, fontSize: 13 }}>
                            +{effectiveMonthlyDCA.toLocaleString('fr-FR')} €/m
                          </span>
                          {activeCryptoTranche?.startDate && (
                            <span style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', fontFamily: 'var(--font-sans)' }}>
                              depuis {activeCryptoTranche.startDate}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    <td style={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 44, height: 5, borderRadius: 3, background: 'var(--border-subtle)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, (assetWeightPct / 10) * 100)}%`,
                              height: '100%',
                              background: assetWeightPct > 10 ? '#ef4444' : 'var(--accent-emerald)',
                              borderRadius: 3,
                            }}
                          />
                        </div>
                        <div>
                          <strong className="mono" style={{ fontSize: 11, color: 'var(--text-primary)', display: 'block' }}>
                            {assetWeightPct.toFixed(1)}% <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>/ 10% max</span>
                          </strong>
                          <span style={{ fontSize: 9, color: assetWeightPct > 10 ? '#f87171' : 'var(--accent-emerald)', fontWeight: 600 }}>
                            {assetWeightPct > 10 ? '⚠️ Élevé' : '✔ OK'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td onClick={(e) => e.stopPropagation()} style={{ width: 90, textAlign: 'center' }}>
                      <div className="row-actions" style={{ justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="row-action-btn"
                          onClick={() => setSelectedPositionForLot(pos)}
                          data-tooltip="Gérer les poches &amp; wallets (Revolut X, Trust Wallet, Ledger)"
                          style={{ fontSize: 12, padding: '3px 6px', fontWeight: 700, color: 'var(--accent-amber)' }}
                        >
                          + Lot
                        </button>
                        <button
                          type="button"
                          className="row-action-btn"
                          onClick={() => onEditPosition(pos)}
                          data-tooltip="Éditer la position crypto (Quantité, PRU, DCA)"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="row-action-btn danger"
                          onClick={() => {
                            if (confirm(`Supprimer la crypto ${pos.name} (${pos.ticker}) ?`)) {
                              onDeletePosition(pos.id);
                            }
                          }}
                          data-tooltip="Supprimer cette ligne du portefeuille"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Lot Manager for Multi-Wallets */}
      {selectedPositionForLot && (
        <CryptoLotModal
          position={selectedPositionForLot}
          onClose={() => setSelectedPositionForLot(null)}
          onSave={handleLotSaved}
        />
      )}

      {/* Modal On-Chain Import */}
      <OnChainWalletImportModal
        isOpen={showOnChainImportModal}
        onClose={() => setShowOnChainImportModal(false)}
        onImportAssets={handleBatchImport}
        existingPositions={positions}
      />
    </div>
  );
}

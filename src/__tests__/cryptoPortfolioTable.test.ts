import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import CryptoPortfolioTable from '../components/CryptoPortfolioTable';
import { Position } from '../types';

describe('CryptoPortfolioTable Component', () => {
  const mockPositions: Position[] = [
    {
      id: 'crypto-btc',
      ticker: 'BTC-EUR',
      name: 'Bitcoin',
      envelope: 'CRYPTO',
      assetType: 'CRYPTO',
      currency: 'EUR',
      quantity: 0.25,
      avgPrice: 55000,
      currentPrice: 85000,
      updatedAt: Date.now(),
      themes: ['crypto', 'digital-gold'],
    },
    {
      id: 'crypto-eth',
      ticker: 'ETH-EUR',
      name: 'Ethereum',
      envelope: 'CRYPTO',
      assetType: 'CRYPTO',
      currency: 'EUR',
      quantity: 2.5,
      avgPrice: 2800,
      currentPrice: 3200,
      updatedAt: Date.now(),
      themes: ['crypto', 'smart-contracts'],
    },
    {
      id: 'market-cw8',
      ticker: 'CW8.PA',
      name: 'Amundi MSCI World',
      envelope: 'PEA',
      assetType: 'ETF',
      currency: 'EUR',
      quantity: 100,
      avgPrice: 450,
      currentPrice: 520,
      updatedAt: Date.now(),
      themes: ['world-core'],
    },
  ];

  it('renders crypto positions with live prices, values, and total crypto net worth', () => {
    const html = renderToString(
      React.createElement(CryptoPortfolioTable, {
        positions: mockPositions,
        fxRates: { EUR: 1, USD: 1.08, GBP: 0.85 },
        totalNetWorthEUR: 100000,
        refreshingPrices: false,
        onRefreshPrices: () => {},
        onEditPosition: () => {},
        onDeletePosition: () => {},
        onAddCryptoPosition: () => {},
      })
    );

    expect(html).toContain('Portefeuille Crypto-Actifs');
    expect(html).toContain('Bitcoin');
    expect(html).toContain('Ethereum');
    // Market PEA positions should not appear in the crypto table
    expect(html).not.toContain('Amundi MSCI World');
    expect(html).toContain('Marché Live 24/7');
    expect(html).toContain('BTC-EUR');
    expect(html).toContain('ETH-EUR');
  });

  it('renders clean empty state when no crypto positions exist', () => {
    const html = renderToString(
      React.createElement(CryptoPortfolioTable, {
        positions: [mockPositions[2]], // Only PEA
        fxRates: { EUR: 1, USD: 1.08 },
        totalNetWorthEUR: 52000,
        refreshingPrices: false,
        onRefreshPrices: () => {},
        onEditPosition: () => {},
        onDeletePosition: () => {},
        onAddCryptoPosition: () => {},
      })
    );

    expect(html).toContain('Portefeuille Crypto-Actifs');
    expect(html).toContain('Aucun crypto-actif dans votre portefeuille pour le moment');
    expect(html).toContain('Ajouter mon premier crypto-actif');
  });
});

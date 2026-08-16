import { describe, it, expect } from 'vitest';
import { searchAssets, isCryptoAsset, ASSET_REGISTRY } from '../data/assetRegistry';

describe('Asset Registry & ISIN Search Engine', () => {
  it('should find CW8 MSCI World by its official ISIN FR0010315770', () => {
    const results = searchAssets('FR0010315770');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].ticker).toBe('CW8.PA');
    expect(results[0].envelope).toBe('PEA');
  });

  it('should find Amundi PEA Nasdaq-100 by ISIN FR0013412269 and by ticker PUST', () => {
    const isinResults = searchAssets('FR0013412269');
    expect(isinResults.some((a) => a.ticker === 'PUST.PA')).toBe(true);

    const tickerResults = searchAssets('pust');
    expect(tickerResults.some((a) => a.ticker === 'PUST.PA')).toBe(true);
  });

  it('should find LVMH by name, partial query and ISIN FR0000121014', () => {
    const nameResults = searchAssets('lvmh');
    expect(nameResults.some((a) => a.ticker === 'MC.PA')).toBe(true);

    const isinResults = searchAssets('FR0000121014');
    expect(isinResults.some((a) => a.ticker === 'MC.PA')).toBe(true);
  });

  it('should find PEA-PME eligible stocks (Kalray, MEMSCAP, VusionGroup)', () => {
    const kalrayResults = searchAssets('kalray');
    expect(kalrayResults.length).toBeGreaterThan(0);
    expect(kalrayResults[0].envelope).toBe('PEA-PME');
    expect(kalrayResults[0].ticker).toBe('ALKAL.PA');
  });

  it('should find US equities by ticker or company name', () => {
    const msftResults = searchAssets('microsoft');
    expect(msftResults.some((a) => a.ticker === 'MSFT')).toBe(true);

    const nvdaResults = searchAssets('nvidia');
    expect(nvdaResults.some((a) => a.ticker === 'NVDA')).toBe(true);
  });

  it('should find crypto assets (Bitcoin, Ethereum, Solana) with CRYPTO envelope', () => {
    const btcResults = searchAssets('bitcoin');
    expect(btcResults.some((a) => a.ticker === 'BTC-EUR' && a.envelope === 'CRYPTO' && a.assetType === 'CRYPTO')).toBe(true);

    const ethResults = searchAssets('ethereum');
    expect(ethResults.some((a) => a.ticker === 'ETH-EUR' && a.envelope === 'CRYPTO' && a.assetType === 'CRYPTO')).toBe(true);
  });

  it('should identify crypto assets correctly with isCryptoAsset', () => {
    expect(isCryptoAsset('BTC-EUR')).toBe(true);
    expect(isCryptoAsset('ETH-USD')).toBe(true);
    expect(isCryptoAsset('SOL')).toBe(true);
    expect(isCryptoAsset('bitcoin')).toBe(true);
    expect(isCryptoAsset('XRP')).toBe(true);
    expect(isCryptoAsset('DOT')).toBe(true);
    expect(isCryptoAsset('CW8.PA')).toBe(false);
    expect(isCryptoAsset('MSFT')).toBe(false);
  });

  it('should handle empty or whitespace query gracefully', () => {
    expect(searchAssets('')).toEqual([]);
    expect(searchAssets('   ')).toEqual([]);
  });
});

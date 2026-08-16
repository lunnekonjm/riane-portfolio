import { scanWalletAllAssets } from '../services/cryptoOnChainReader';

describe('TRON Network & BSC VELO Token Scanning', () => {
  it('should scan TRON wallet and detect native TRX balance', async () => {
    const tronAddress = 'TDkD9rJj6VHDtvpGC3pdZfS7ap1LvVLfZ6';
    const scan = await scanWalletAllAssets(tronAddress, 'Trust Wallet');

    expect(scan.success).toBe(true);
    expect(scan.detectedType).toBe('TRON');
    expect(scan.assets.length).toBeGreaterThanOrEqual(1);

    const trx = scan.assets.find((a) => a.symbol === 'TRX');
    expect(trx).toBeDefined();
    if (trx) {
      expect(trx.balance).toBeCloseTo(18.879, 2);
      expect(trx.chain).toBe('TRON');
      expect(trx.valueEUR).toBeGreaterThan(1);
    }
  });

  it('should scan EVM wallet and detect Velo Protocol (VELO) on BSC', async () => {
    const evmAddress = '0xcd95f9c7b2b0362ef88d2f372482F62a233beC87';
    const scan = await scanWalletAllAssets(evmAddress, 'Trust Wallet');

    expect(scan.success).toBe(true);
    expect(scan.detectedType).toBe('EVM');

    const velo = scan.assets.find((a) => a.symbol === 'VELO' || a.name.includes('Velo'));
    expect(velo).toBeDefined();
    if (velo) {
      expect(velo.balance).toBeCloseTo(602.84, 1);
      expect(velo.chain).toBe('BSC');
    }
  });
});

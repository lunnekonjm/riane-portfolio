import { scanWalletAllAssets } from '../services/cryptoOnChainReader';

describe('EVM Dynamic Token Scanning & Dimitra (DMTR) Detection', () => {
  it('should scan EVM wallet and detect Dimitra (DMTR) and BNB correctly', async () => {
    const address = '0xcd95f9c7b2b0362ef88d2f372482F62a233beC87';
    const scan = await scanWalletAllAssets(address, 'Trust Wallet');

    expect(scan.success).toBe(true);
    expect(scan.detectedType).toBe('EVM');
    expect(scan.assets.length).toBeGreaterThanOrEqual(2);

    const dmtr = scan.assets.find((a) => a.symbol === 'DMTR' || a.ticker === 'DMTR-EUR');
    expect(dmtr).toBeDefined();
    if (dmtr) {
      expect(dmtr.balance).toBeCloseTo(28600.05, 1);
      expect(dmtr.chain).toBe('ETH');
      expect(dmtr.name).toBe('Dimitra');
      expect(dmtr.valueEUR).toBeGreaterThan(50);
    }

    const bnb = scan.assets.find((a) => a.symbol === 'BNB');
    expect(bnb).toBeDefined();
    if (bnb) {
      expect(bnb.balance).toBeGreaterThan(1);
    }
  });
});

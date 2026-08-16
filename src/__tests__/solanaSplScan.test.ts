import { scanWalletAllAssets } from '../services/cryptoOnChainReader';

describe('Solana SPL Token Scanning & GST Detection', () => {
  it('should scan Solana wallet and detect both native SOL and SPL tokens like GST', async () => {
    // User public address on Solana
    const address = 'Aj7U1L96Ekf4XRNJcAzSX6yMP7kKvkCuErvTRPQDmA2w';
    const scan = await scanWalletAllAssets(address, 'Phantom Wallet');

    expect(scan.success).toBe(true);
    expect(scan.detectedType).toBe('SOLANA');
    expect(scan.assets.length).toBeGreaterThanOrEqual(1);

    const gstAsset = scan.assets.find((a) => a.symbol === 'GST' || a.ticker === 'GST-EUR');
    expect(gstAsset).toBeDefined();
    if (gstAsset) {
      expect(gstAsset.balance).toBeGreaterThan(0);
      expect(gstAsset.chain).toBe('SOLANA');
      expect(gstAsset.name).toContain('Green Satoshi Token');
      expect(gstAsset.contractAddress).toBe('AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB');
    }
  });
});

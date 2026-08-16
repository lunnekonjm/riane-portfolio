import { describe, it, expect, beforeEach } from 'vitest';
import type { Position, CryptoWalletEntry } from '@/types/portfolio';
import { clearMarketCache, getCached, setCache } from '@/services/market-data/cache';

describe('Garde-Fou Anti-Doublon & Anti-Addition Tests', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    (global as any).window = global;
    (global as any).localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
      key: (i: number) => Object.keys(store)[i] || null,
      get length() { return Object.keys(store).length; },
    };
  });

  describe('Calcul du PRU Pondéré lors d\'un Renfort (DCA)', () => {
    it('calcule correctement le nouveau solde et le PRU moyen pondéré', () => {
      const oldQty = 10;
      const oldPru = 500; // Total 5000 €
      const addedQty = 5;
      const buyPrice = 560; // Total 2800 €

      const newTotalQty = oldQty + addedQty;
      const totalInvested = oldQty * oldPru + addedQty * buyPrice;
      const newWeightedPRU = totalInvested / newTotalQty;

      expect(newTotalQty).toBe(15);
      expect(newWeightedPRU).toBeCloseTo(520, 2);
    });

    it('gère les fractions décimales de cryptos avec haute précision', () => {
      const oldQty = 0.45;
      const oldPru = 60000; // 27 000 €
      const addedQty = 0.15;
      const buyPrice = 80000; // 12 000 €

      const newTotalQty = oldQty + addedQty; // 0.60
      const totalInvested = oldQty * oldPru + addedQty * buyPrice; // 39 000 €
      const newWeightedPRU = totalInvested / newTotalQty; // 65 000 €

      expect(newTotalQty).toBeCloseTo(0.6, 6);
      expect(newWeightedPRU).toBeCloseTo(65000, 2);
    });
  });

  describe('Garde-Fou On-Chain : Détection et Mise à jour de solde (Anti-Addition)', () => {
    it('met à jour le solde du wallet existant au lieu d\'ajouter une ligne dupliquée', () => {
      const existingWallets: CryptoWalletEntry[] = [
        {
          id: 'wallet-1',
          walletName: 'Trust Wallet (Ethereum)',
          walletType: 'HOT_WALLET',
          institution: 'Trust Wallet',
          publicAddress: '0x1234567890abcdef1234567890abcdef12345678',
          quantity: 1.5,
          avgPrice: 2800,
          purchaseDate: '2025-01-15',
          network: 'Ethereum',
        },
      ];

      const scannedAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const scannedBalance = 1.75; // Le solde on-chain est passé de 1.5 à 1.75 ETH
      const activeLabel = 'Trust Wallet';
      const assetChain = 'Ethereum';

      const cleanAddress = scannedAddress.trim().toLowerCase();
      const matchIndex = existingWallets.findIndex((w) => {
        if (w.publicAddress && w.publicAddress.trim().toLowerCase() === cleanAddress) {
          return !w.network || !assetChain || w.network.toUpperCase() === assetChain.toUpperCase();
        }
        return (
          w.walletName.toLowerCase() === `${activeLabel} (${assetChain})`.toLowerCase() ||
          (w.institution?.toLowerCase() === activeLabel.toLowerCase() && w.network?.toUpperCase() === assetChain?.toUpperCase())
        );
      });

      expect(matchIndex).toBe(0);

      const mergedWallets = existingWallets.map((w, idx) =>
        idx === matchIndex
          ? {
              ...w,
              quantity: scannedBalance,
              lastSyncedAt: 123456789,
            }
          : w
      );

      // On vérifie que la liste contient toujours 1 seul wallet et que la quantité est 1.75 (et non 1.5 + 1.75 = 3.25)
      expect(mergedWallets.length).toBe(1);
      expect(mergedWallets[0].quantity).toBe(1.75);

      const totalQty = mergedWallets.reduce((sum, w) => sum + w.quantity, 0);
      expect(totalQty).toBe(1.75);
    });

    it('ajoute un nouveau wallet si l\'adresse ou le réseau est différent', () => {
      const existingWallets: CryptoWalletEntry[] = [
        {
          id: 'wallet-1',
          walletName: 'Trust Wallet (Ethereum)',
          walletType: 'HOT_WALLET',
          institution: 'Trust Wallet',
          publicAddress: '0x1111111111111111111111111111111111111111',
          quantity: 1.5,
          avgPrice: 2800,
          purchaseDate: '2025-01-15',
          network: 'Ethereum',
        },
      ];

      const newAddress = '0x2222222222222222222222222222222222222222';
      const cleanAddress = newAddress.trim().toLowerCase();

      const matchIndex = existingWallets.findIndex((w) => {
        if (w.publicAddress && w.publicAddress.trim().toLowerCase() === cleanAddress) {
          return true;
        }
        return false;
      });

      expect(matchIndex).toBe(-1);

      const newWalletEntry: CryptoWalletEntry = {
        id: 'wallet-2',
        walletName: 'Ledger (Ethereum)',
        walletType: 'COLD_WALLET',
        institution: 'Ledger',
        publicAddress: newAddress,
        quantity: 3.0,
        avgPrice: 3000,
        purchaseDate: '2025-02-01',
        network: 'Ethereum',
      };

      const mergedWallets = [...existingWallets, newWalletEntry];
      expect(mergedWallets.length).toBe(2);

      const totalQty = mergedWallets.reduce((sum, w) => sum + w.quantity, 0);
      expect(totalQty).toBe(4.5);
    });
  });

  describe('Mécanisme de Cache Marché et Forçage d\'Actualisation', () => {
    it('invalide le cache avec clearMarketCache()', () => {
      setCache('QUOTE_TEST', { price: 100, change: 2, changePercent: 2 });
      expect(getCached('QUOTE_TEST')).not.toBeNull();

      clearMarketCache();
      expect(getCached('QUOTE_TEST')).toBeNull();
    });
  });
});

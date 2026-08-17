/**
 * Service de lecture des soldes blockchain en mode Lecture Seule (Watch-Only)
 * Compatible avec les adresses publiques Trust Wallet, Ledger, Metamask, Phantom, etc.
 * 100% sécurisé : zéro clé privée, zéro signature, requêtes directes sur RPCs publics.
 */

import type { DiscoveredCryptoAsset, OnChainScanResult } from './crypto/cryptoConstants';
import { SOLANA_SPL_MAP, COMMON_TOKEN_CONTRACTS } from './crypto/cryptoConstants';
import { isBitcoinAddress, scanBitcoinWallet } from './crypto/chainScanners/bitcoinScanner';
import { isTronAddress, scanTronWallet } from './crypto/chainScanners/tronScanner';
import { isSolanaAddress, scanSolanaWallet } from './crypto/chainScanners/solanaScanner';
import { isEvmAddress, scanEvmWallet } from './crypto/chainScanners/evmScanner';

export type { DiscoveredCryptoAsset, OnChainScanResult };

/**
 * Scan complet multi-actifs pour une adresse (EVM, Solana, TRON, ou Bitcoin)
 */
export async function scanWalletAllAssets(
  rawAddress: string,
  _preferredInstitution = 'Trust Wallet'
): Promise<OnChainScanResult> {
  const address = rawAddress.trim();

  if (!address) {
    return {
      success: false,
      address,
      detectedType: 'UNKNOWN',
      assets: [],
      totalValueEUR: 0,
      error: 'Veuillez saisir une adresse blockchain valide.',
    };
  }

  // Vérification si l'adresse est un smart contract / mint connu plutôt qu'un wallet
  let isTokenContract = false;
  let contractWarning: string | undefined = undefined;

  if (SOLANA_SPL_MAP[address] || COMMON_TOKEN_CONTRACTS.some(c => c.address.toLowerCase() === address.toLowerCase())) {
    const matchedToken =
      SOLANA_SPL_MAP[address]?.name ||
      COMMON_TOKEN_CONTRACTS.find(c => c.address.toLowerCase() === address.toLowerCase())?.name ||
      'Token';
    isTokenContract = true;
    contractWarning = `Attention : Cette adresse correspond au Smart Contract officiel du token « ${matchedToken} » (le contrat du projet), et non à votre adresse de portefeuille personnel. Les fonds affichés appartiennent au contrat du projet.`;
  }

  // 1. Détection BITCOIN (1..., 3..., bc1...)
  if (isBitcoinAddress(address)) {
    return scanBitcoinWallet(address);
  }

  // 2. Détection TRON (T...)
  if (isTronAddress(address)) {
    return scanTronWallet(address);
  }

  // 3. Détection SOLANA (Base58)
  if (isSolanaAddress(address)) {
    return scanSolanaWallet(address, isTokenContract, contractWarning);
  }

  // 4. Détection EVM (0x...) - Multi-Chain Scanning
  if (isEvmAddress(address)) {
    return scanEvmWallet(address);
  }

  return {
    success: false,
    address,
    detectedType: 'UNKNOWN',
    assets: [],
    totalValueEUR: 0,
    error: "Format d'adresse non reconnu. Formats supportés : EVM (0x...), Bitcoin (1..., 3..., bc1...), Solana ou TRON (T...).",
  };
}

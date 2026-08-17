import type { Position, CryptoWalletPocket } from '@/types/portfolio';

/**
 * Détecte le type d'adresse publique (EVM / Ethereum / BSC, Solana, Bitcoin)
 */
export function detectCryptoAddressType(address: string): 'EVM' | 'SOLANA' | 'BITCOIN' | 'UNKNOWN' {
  const clean = address.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(clean)) return 'EVM';
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(clean)) return 'SOLANA';
  if (/^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(clean)) return 'BITCOIN';
  return 'UNKNOWN';
}

/**
 * Nettoie le nom d'un portefeuille en retirant les émojis initiaux pour éviter les doublons de labels.
 */
export function cleanWalletProviderName(rawName?: string): string {
  if (!rawName) return 'Wallet';
  // Retire les emojis en début de chaîne et espaces superflus
  const cleaned = rawName.replace(/^[\p{Extended_Pictographic}\p{Emoji}\p{M}\s]+/gu, '').trim();
  return cleaned || rawName.trim() || 'Wallet';
}

/**
 * Assainit et déduplique la liste des sous-wallets d'une position crypto.
 * Fusionne les entrées dupliquées (même adresse publique et réseau, ou même nom de wallet).
 */
export function sanitizeCryptoWallets(wallets?: CryptoWalletPocket[]): CryptoWalletPocket[] {
  if (!wallets || wallets.length === 0) return [];
  const uniqueMap = new Map<string, CryptoWalletPocket>();

  wallets.forEach((w) => {
    const cleanAddr = (w.publicAddress || '').trim().toLowerCase();
    const cleanProvider = cleanWalletProviderName(w.institution || w.walletName);
    const cleanNet = (w.network || '').trim().toUpperCase();

    // Clé unique : si adresse dispo -> adresse + réseau, sinon nom propre + réseau
    const key = cleanAddr ? `${cleanAddr}:${cleanNet}` : `${cleanProvider.toLowerCase()}:${cleanNet}`;

    const normalizedWallet: CryptoWalletPocket = {
      ...w,
      walletName: w.walletName ? cleanWalletProviderName(w.walletName) : cleanProvider,
      institution: cleanProvider,
    };

    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, normalizedWallet);
    } else {
      const existing = uniqueMap.get(key)!;
      uniqueMap.set(key, {
        ...existing,
        quantity: w.quantity > 0 ? w.quantity : existing.quantity,
        avgPrice: (w.avgPrice && w.avgPrice > 0) ? w.avgPrice : existing.avgPrice,
        feesPaidEUR: Math.max(w.feesPaidEUR || 0, existing.feesPaidEUR || 0),
        lastSyncedAt: Math.max(w.lastSyncedAt || 0, existing.lastSyncedAt || 0),
        publicAddress: w.publicAddress || existing.publicAddress,
        network: w.network || existing.network,
        institution: cleanProvider,
      });
    }
  });

  return Array.from(uniqueMap.values());
}

/**
 * Assainit une position crypto en éliminant les sous-wallets dupliqués
 * et en réalignant sa quantité consolidée sans multiplier les soldes.
 */
export function sanitizeCryptoPosition(pos: Position): Position {
  if (pos.envelope !== 'CRYPTO' && pos.assetType !== 'CRYPTO') return pos;

  if (pos.cryptoWallets && pos.cryptoWallets.length > 0) {
    const cleanedWallets = sanitizeCryptoWallets(pos.cryptoWallets);
    const totalWalletQty = cleanedWallets.reduce((sum, w) => sum + (w.quantity || 0), 0);
    return {
      ...pos,
      cryptoWallets: cleanedWallets,
      quantity: totalWalletQty > 0 ? totalWalletQty : pos.quantity,
      institutionName: pos.institutionName ? cleanWalletProviderName(pos.institutionName) : pos.institutionName,
    };
  }

  return {
    ...pos,
    institutionName: pos.institutionName ? cleanWalletProviderName(pos.institutionName) : pos.institutionName,
  };
}

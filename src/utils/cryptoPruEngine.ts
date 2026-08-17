import type { Position, CryptoWalletPocket, CryptoLotTransaction } from '@/types/portfolio';

/**
 * Calcule le nouveau PRU moyen pondéré après un achat ou ajout de lot,
 * en incluant rigoureusement les frais de courtage et les gas fees.
 * 
 * Formule financière :
 * Coût Total Existant = (Quantité Existante * Ancien PRU) + Frais Existants
 * Coût du Nouveau Lot = (Quantité Achetée * Prix d'Achat) + Nouveaux Frais
 * Nouveau PRU = (Coût Total Existant + Coût du Nouveau Lot) / (Quantité Totale)
 */
export function calculateWeightedPRU(
  currentQuantity: number,
  currentAvgPrice: number,
  addedQuantity: number,
  purchasePrice: number,
  addedFeesEUR: number = 0,
  currentFeesEUR: number = 0
): { newQuantity: number; newAvgPrice: number; newTotalFeesEUR: number } {
  const safeCurrentQty = Math.max(0, currentQuantity || 0);
  const safeCurrentAvgPrice = Math.max(0, currentAvgPrice || 0);
  const safeAddedQty = Math.max(0, addedQuantity || 0);
  const safePurchasePrice = Math.max(0, purchasePrice || 0);
  const safeAddedFees = Math.max(0, addedFeesEUR || 0);
  const safeCurrentFees = Math.max(0, currentFeesEUR || 0);

  const newQuantity = safeCurrentQty + safeAddedQty;
  const newTotalFeesEUR = safeCurrentFees + safeAddedFees;

  if (newQuantity <= 0) {
    return {
      newQuantity: 0,
      newAvgPrice: safePurchasePrice || safeCurrentAvgPrice,
      newTotalFeesEUR,
    };
  }

  // Coût total incluant les frais
  const currentTotalCost = safeCurrentQty * safeCurrentAvgPrice;
  const newLotCost = safeAddedQty * safePurchasePrice + safeAddedFees;
  const totalCost = currentTotalCost + newLotCost;

  const newAvgPrice = totalCost / newQuantity;

  return {
    newQuantity,
    newAvgPrice,
    newTotalFeesEUR,
  };
}

/**
 * Ajoute un lot / achat à une position crypto, met à jour ou crée la poche (wallet)
 * associée, et recalcule automatiquement les soldes et le PRU global sans calcul mental.
 */
export function addLotToCryptoPosition(
  position: Position,
  lot: {
    walletName: string;
    quantity: number;
    purchasePrice: number;
    feesEUR?: number;
    date?: string;
    notes?: string;
    publicAddress?: string;
  }
): Position {
  const feesEUR = lot.feesEUR || 0;
  const date = lot.date || new Date().toISOString().split('T')[0];

  const currentWallets = position.cryptoWallets ? [...position.cryptoWallets] : [];
  
  // Si aucun wallet n'existait, initialiser avec la quantité existante attribuée à l'institution existante ou Trust Wallet
  if (currentWallets.length === 0 && position.quantity > 0) {
    currentWallets.push({
      id: `wallet-init-${Date.now()}`,
      walletName: position.institutionName || 'Trust Wallet',
      quantity: position.quantity,
      avgPrice: position.avgPrice,
      feesPaidEUR: position.totalFeesEUR || 0,
    });
  }

  // Trouver ou créer la poche du wallet ciblé
  let targetWallet = currentWallets.find((w) => w.walletName.toLowerCase() === lot.walletName.toLowerCase());
  if (targetWallet) {
    const walletMath = calculateWeightedPRU(
      targetWallet.quantity,
      targetWallet.avgPrice || position.avgPrice,
      lot.quantity,
      lot.purchasePrice,
      feesEUR,
      targetWallet.feesPaidEUR || 0
    );
    targetWallet.quantity = walletMath.newQuantity;
    targetWallet.avgPrice = walletMath.newAvgPrice;
    targetWallet.feesPaidEUR = walletMath.newTotalFeesEUR;
    if (lot.publicAddress) targetWallet.publicAddress = lot.publicAddress;
  } else {
    const newWallet: CryptoWalletPocket = {
      id: `wallet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      walletName: lot.walletName,
      quantity: lot.quantity,
      avgPrice: lot.purchasePrice + (lot.quantity > 0 ? feesEUR / lot.quantity : 0),
      feesPaidEUR: feesEUR,
      publicAddress: lot.publicAddress,
    };
    currentWallets.push(newWallet);
  }

  // Recalculer le total consolidé de la position
  const globalMath = calculateWeightedPRU(
    position.quantity,
    position.avgPrice,
    lot.quantity,
    lot.purchasePrice,
    feesEUR,
    position.totalFeesEUR || 0
  );

  // Enregistrer le lot dans l'historique
  const newLotRecord: CryptoLotTransaction = {
    id: `lot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    date,
    type: 'BUY',
    walletName: lot.walletName,
    quantity: lot.quantity,
    pricePerUnit: lot.purchasePrice,
    totalCostEUR: lot.quantity * lot.purchasePrice + feesEUR,
    feesEUR,
    notes: lot.notes,
  };

  const existingLots = position.cryptoLots ? [...position.cryptoLots] : [];

  return {
    ...position,
    quantity: globalMath.newQuantity,
    avgPrice: globalMath.newAvgPrice,
    totalFeesEUR: globalMath.newTotalFeesEUR,
    cryptoWallets: currentWallets,
    cryptoLots: [newLotRecord, ...existingLots],
    updatedAt: Date.now(),
  };
}

/**
 * Transfère des jetons d'une poche à une autre (ex: Revolut X -> Trust Wallet)
 * en déduisant les gas fees / frais de réseau du solde ou en les comptabilisant.
 */
export function transferBetweenCryptoWallets(
  position: Position,
  fromWalletName: string,
  toWalletName: string,
  quantityToTransfer: number,
  gasFeesEUR: number = 0,
  notes?: string
): Position {
  if (quantityToTransfer <= 0) return position;

  const currentWallets = position.cryptoWallets ? [...position.cryptoWallets] : [];
  const fromWallet = currentWallets.find((w) => w.walletName.toLowerCase() === fromWalletName.toLowerCase());
  let toWallet = currentWallets.find((w) => w.walletName.toLowerCase() === toWalletName.toLowerCase());

  if (!fromWallet || fromWallet.quantity < quantityToTransfer) {
    throw new Error(`Solde insuffisant sur ${fromWalletName} (${fromWallet?.quantity || 0} disponibles pour ${quantityToTransfer} demandés)`);
  }

  fromWallet.quantity -= quantityToTransfer;

  if (!toWallet) {
    toWallet = {
      id: `wallet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      walletName: toWalletName,
      quantity: quantityToTransfer,
      avgPrice: fromWallet.avgPrice || position.avgPrice,
      feesPaidEUR: gasFeesEUR,
    };
    currentWallets.push(toWallet);
  } else {
    toWallet.quantity += quantityToTransfer;
    toWallet.feesPaidEUR = (toWallet.feesPaidEUR || 0) + gasFeesEUR;
  }

  const newTotalFees = (position.totalFeesEUR || 0) + gasFeesEUR;

  const transferRecord: CryptoLotTransaction = {
    id: `transfer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    date: new Date().toISOString().split('T')[0],
    type: 'TRANSFER',
    walletName: fromWalletName,
    toWalletName,
    quantity: quantityToTransfer,
    pricePerUnit: position.avgPrice,
    totalCostEUR: gasFeesEUR,
    feesEUR: gasFeesEUR,
    notes: notes || `Transfert de ${fromWalletName} vers ${toWalletName}`,
  };

  const existingLots = position.cryptoLots ? [...position.cryptoLots] : [];

  return {
    ...position,
    totalFeesEUR: newTotalFees,
    cryptoWallets: currentWallets,
    cryptoLots: [transferRecord, ...existingLots],
    updatedAt: Date.now(),
  };
}

/**
 * Calcule le PRU moyen unitaire à partir du montant total investi en Euros.
 */
export function calibratePRUFromTotalInvested(
  totalQuantity: number,
  totalInvestedEUR: number
): { avgPrice: number; totalCostEUR: number } {
  const safeQty = Math.max(0, totalQuantity || 0);
  const safeInvested = Math.max(0, totalInvestedEUR || 0);
  if (safeQty <= 0) return { avgPrice: 0, totalCostEUR: 0 };
  return {
    avgPrice: safeInvested / safeQty,
    totalCostEUR: safeInvested,
  };
}

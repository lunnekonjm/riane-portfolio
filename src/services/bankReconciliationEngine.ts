/**
 * Moteur de Rapprochement Bancaire (Théorie vs Réalité Factuelle)
 * Analyse les transactions BoursoBank du mois écoulé pour extraire :
 * 1. Le salaire net réellement encaissé (crédit employeur)
 * 2. Les virements d'investissement/épargne réellement exécutés (PEA, Tontine, Tampon, Livret A, CTO)
 */

export * from './reconciliation/transactionClassifier';
export * from './reconciliation/reconciliationDraftBuilder';
export * from './reconciliation/truelayerTransactionFetcher';

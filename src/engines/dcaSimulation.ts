/**
 * Moteur de calcul DCA automatique (Dollar Cost Averaging)
 * Conforme aux règles du PEA (passages en actions/parts entières uniquement)
 * Récupère les VRAIES données historiques maximales de marché (Yahoo Finance MAX)
 */

export * from './dca/dcaPriceMapCalculator';
export * from './dca/dcaHistorySimulator';

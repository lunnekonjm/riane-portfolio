/**
 * Market data provider — facade avec Yahoo Finance (gratuit) en priorité
 * Fallback avec liens de grounding et citations vérifiables en direct.
 */

export * from './tickerNormalizer';
export * from './marketDataProvider';
export * from './newsProvider';
export * from './fxProvider';
export { searchYahooFinance } from './yahooFinance';

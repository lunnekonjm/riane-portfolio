import type { Position } from '@/types/portfolio';

export const ENVELOPE_OPTIONS: { value: Position['envelope']; label: string; icon: string; isSavings: boolean }[] = [
  { value: 'PEA', label: 'PEA (Plan d\'Épargne en Actions)', icon: '📈', isSavings: false },
  { value: 'PEA-PME', label: 'PEA-PME', icon: '🟣', isSavings: false },
  { value: 'CTO', label: 'CTO (Compte-Titres Ordinaire)', icon: '🟢', isSavings: false },
  { value: 'CRYPTO', label: 'Portefeuille Crypto-Actifs', icon: '🪙', isSavings: false },
  { value: 'LIVRET', label: 'Livret & Épargne (Livret A, LDDS, Cash)', icon: '🛡️', isSavings: true },
  { value: 'ASSURANCE_VIE', label: 'Assurance-Vie', icon: '📜', isSavings: true },
  { value: 'PER', label: 'PER (Plan Épargne Retraite)', icon: '🏛️', isSavings: true },
  { value: 'PEE', label: 'PEE / PERCO (Épargne Salariale)', icon: '🏢', isSavings: true },
  { value: 'IMMOBILIER', label: 'Immobilier & SCPI', icon: '🧱', isSavings: true },
  { value: 'SPECULATIVE', label: 'Spéculatif & Opportuniste', icon: '🚀', isSavings: false },
  { value: 'OPPORTUNISTIC', label: 'Réserve Opportuniste', icon: '⚖️', isSavings: false },
];

export const ASSET_TYPE_OPTIONS: { value: Position['assetType']; label: string; icon: string }[] = [
  { value: 'ETF', label: 'ETF / Tracker', icon: '📊' },
  { value: 'STOCK', label: 'Action Directe', icon: '🏢' },
  { value: 'FUND', label: 'Fonds / OPCVM', icon: '📦' },
  { value: 'BOND', label: 'Obligation / Fonds Euro', icon: '📜' },
  { value: 'SAVINGS', label: 'Épargne / Livret / Cash', icon: '🛡️' },
  { value: 'REAL_ESTATE', label: 'Immobilier / SCPI', icon: '🧱' },
  { value: 'CRYPTO', label: 'Crypto-Actif', icon: '🪙' },
  { value: 'CASH', label: 'Liquidités', icon: '💶' },
];

export const CURRENCY_OPTIONS: { value: Position['currency']; label: string; icon: string }[] = [
  { value: 'EUR', label: 'EUR (€)', icon: '💶' },
  { value: 'USD', label: 'USD ($)', icon: '💵' },
  { value: 'GBP', label: 'GBP (£)', icon: '💷' },
  { value: 'CHF', label: 'CHF (CHF)', icon: '🇨🇭' },
];

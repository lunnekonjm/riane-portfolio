import type { RuleCategoryItem } from '@/types/auraRules';
import type { TemporaryExpenseItem } from '@/engines/bankingAnalyzerEngine';

export const DEFAULT_SAVINGS: RuleCategoryItem[] = [
  { id: 'sav-1', name: 'Cible PEA', amount: 35.0, isPercentage: true, isLocked: true, categoryType: 'SAVINGS', iconType: 'chart', iconBgColor: '#06b6d4', note: 'DCA ETF MSCI World / S&P 500' },
  { id: 'sav-2', name: 'Livret A', amount: 7.0, isPercentage: true, isLocked: true, categoryType: 'SAVINGS', iconType: 'shield', iconBgColor: '#3b82f6', note: 'Sas de précaution liquide' },
];

export const DEFAULT_FIXED: RuleCategoryItem[] = [
  { id: 'fix-1', name: 'Loyer', amount: 677, isPercentage: false, isLocked: true, categoryType: 'FIXED', iconType: 'home', iconBgColor: '#f43f5e', note: 'CDC Habitat' },
  { id: 'fix-2', name: 'Abonnement', amount: 41, isPercentage: false, isLocked: true, categoryType: 'FIXED', iconType: 'video', iconBgColor: '#f43f5e', note: 'Free / Telecom / Streaming' },
  { id: 'fix-3', name: 'Tontine', amount: 300, isPercentage: false, isLocked: true, categoryType: 'FIXED', iconType: 'people', iconBgColor: '#8b5cf6', note: 'Cotisation d\'épargne solidaire' },
  { id: 'fix-4', name: 'Soutien', amount: 231, isPercentage: false, isLocked: true, categoryType: 'FIXED', iconType: 'heart', iconBgColor: '#f43f5e', note: 'Sendwave / Soutien familial' },
];

export const DEFAULT_DAILY: RuleCategoryItem[] = [
  { id: 'day-1', name: 'Revolut', amount: 15.0, isPercentage: true, isLocked: true, categoryType: 'DAILY', iconType: 'card', iconBgColor: '#06b6d4', note: 'Courses & Dépenses courantes' },
];

export const DEFAULT_TEMP_EXPENSES: TemporaryExpenseItem[] = [
  { id: 'temp-1', label: 'Cotisation Tontine', monthlyAmount: 300, durationMonths: 10, startPeriod: '2026-09' },
  { id: 'temp-2', label: 'Caution / Travaux', monthlyAmount: 150, durationMonths: 4, startPeriod: '2026-10' },
];

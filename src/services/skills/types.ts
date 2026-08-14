/**
 * Types & Interfaces pour le Système de Skills Financiers Agentiques
 */

import type { Position } from '@/types/portfolio';

export interface SkillExecutionContext {
  positions: Position[];
  totalPortfolioValueEUR?: number;
  userMonthlyIncomeEUR?: number;
  userMonthlyCapacityEUR?: number;
  parameters?: Record<string, any>;
}

export interface SkillActionSuggestion {
  type: 'DCA_TRANCHE' | 'LUMP_SUM_DEPOSIT' | 'REBALANCE_ARBITRAGE' | 'RISK_ALERT' | 'TAX_OPTIMIZATION';
  title: string;
  description: string;
  ticker?: string;
  envelope?: string;
  amountEUR?: number;
  confidenceScore: number; // 0 à 1
  impactSummary: string;
}

export interface SkillResult {
  skillName: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  summary: string;
  details: Record<string, any>;
  suggestions: SkillActionSuggestion[];
  governanceScore?: number; // 0 à 100
  generatedAt: number;
}

export interface FinancialSkill {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  execute: (context: SkillExecutionContext) => Promise<SkillResult> | SkillResult;
}

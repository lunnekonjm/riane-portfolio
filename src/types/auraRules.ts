export interface RuleCategoryItem {
  id: string;
  name: string;
  amount: number;
  isPercentage: boolean;
  isLocked: boolean;
  categoryType: 'FIXED' | 'SAVINGS' | 'DAILY';
  iconType: string;
  iconBgColor: string;
  note?: string;
}

export interface BudgetAuditLogEntry {
  id: string;
  timestamp: number;
  categoryName: string;
  pillar: string;
  actionLabel: string;
  actionType: string;
  previousAmount?: number | null;
  previousIsPercentage?: boolean | null;
  newAmount?: number | null;
  newIsPercentage?: boolean | null;
  effectiveDeltaEuro: number;
  note?: string;
}

export type AuraModalType =
  | 'AUDIT_HISTORY'
  | 'FORECAST_MATRIX'
  | 'ARBITRAGE'
  | 'EDIT_BALANCE'
  | 'EDIT_BUFFER_MULT'
  | 'ADD_TEMP_EXPENSE'
  | 'EDIT_TEMP_EXPENSE'
  | 'FLOW_TRANSACTIONS'
  | 'EDIT_CATEGORY'
  | 'GLOBAL_RESET';

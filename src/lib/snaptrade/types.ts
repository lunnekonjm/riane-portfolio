export interface SnapTradeAccountBalance {
  currency: string;
  cash: number;
  buyingPower?: number;
  totalEquity?: number;
}

export interface SnapTradeHolding {
  id: string;
  symbol: string;
  name: string;
  currency: string;
  units: number;
  price: number;
  marketValue: number;
  averagePurchasePrice?: number;
  totalGainLoss?: number;
  totalGainLossPercentage?: number;
  accountId: string;
  accountName?: string;
  brokerageName?: string;
}

export interface SnapTradeAccountSummary {
  id: string;
  name: string;
  numberMasked: string;
  type: string;
  institutionName: string;
  currency: string;
  balances: SnapTradeAccountBalance[];
  holdings: SnapTradeHolding[];
  totalValueEUR: number;
  totalCashEUR: number;
  totalHoldingsEUR: number;
  syncStatus: 'synced' | 'pending_first_sync' | 'error';
  errorMessage?: string;
}

export interface SnapTradeAuthorizationStatus {
  id: string;
  brokerageName: string;
  brokerageSlug: string;
  status: 'active' | 'degraded' | 'disabled';
  dataFreshnessMode: string;
  createdDate: string;
  updatedDate: string;
  logoUrl?: string;
}

export interface SnapTradeSyncResult {
  online: boolean;
  timestamp: string;
  authorizations: SnapTradeAuthorizationStatus[];
  accounts: SnapTradeAccountSummary[];
  totalCashEUR: number;
  totalInvestedEUR: number;
  totalPortfolioEUR: number;
  partialErrors: string[];
}

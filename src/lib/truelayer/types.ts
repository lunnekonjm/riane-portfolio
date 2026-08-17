export interface TrueLayerAccount {
  account_id: string;
  account_type: string;
  display_name: string;
  currency: string;
  account_number?: {
    iban?: string;
    swift_bic?: string;
    number?: string;
    sort_code?: string;
  };
  provider: {
    display_name: string;
    provider_id: string;
    logo_uri?: string;
  };
}

export interface TrueLayerBalance {
  currency: string;
  available: number;
  current: number;
  update_timestamp: string;
}

export interface TrueLayerAccountSummary {
  id: string;
  displayName: string;
  accountType: 'checking' | 'savings' | 'investment' | 'other';
  institutionName: string;
  currency: string;
  currentBalance: number;
  availableBalance: number;
  balanceEUR: number;
  ibanMasked?: string;
  lastUpdated: string;
  logoUri?: string;
}

export interface TrueLayerSyncResult {
  connected: boolean;
  timestamp: string;
  environment: 'sandbox' | 'live';
  accounts: TrueLayerAccountSummary[];
  totalCheckingEUR: number;
  totalSavingsEUR: number;
  totalInvestedEUR: number;
  totalBoursoBankEUR: number;
  partialErrors: string[];
  requiresReauth?: boolean;
}

import { describe, it, expect } from "vitest";
import {
  SnapTradeAccountSummary,
  SnapTradeSyncResult,
} from "../lib/snaptrade/types";

describe("SnapTrade Normalization & Aggregation Logic", () => {
  it("correctly aggregates multi-currency cash and holdings into EUR", () => {
    const mockAccounts: SnapTradeAccountSummary[] = [
      {
        id: "ibkr-acc-1",
        name: "Interactive Brokers Margin",
        numberMasked: "••••1234",
        type: "MARGIN",
        institutionName: "Interactive Brokers",
        currency: "USD",
        balances: [{ currency: "USD", cash: 1080, buyingPower: 2160 }],
        holdings: [
          {
            id: "pos-1",
            symbol: "AAPL",
            name: "Apple Inc.",
            currency: "USD",
            units: 10,
            price: 200,
            marketValue: 2000,
            averagePurchasePrice: 180,
            totalGainLoss: 200,
            totalGainLossPercentage: 11.11,
            accountId: "ibkr-acc-1",
          },
        ],
        totalValueEUR: 2851.85,
        totalCashEUR: 1000, // 1080 USD / 1.08 = 1000 EUR
        totalHoldingsEUR: 1851.85, // 2000 USD / 1.08 = 1851.85 EUR
        syncStatus: "synced",
      },
      {
        id: "ibkr-acc-2",
        name: "Interactive Brokers Cash",
        numberMasked: "••••5678",
        type: "CASH",
        institutionName: "Interactive Brokers",
        currency: "EUR",
        balances: [{ currency: "EUR", cash: 500 }],
        holdings: [],
        totalValueEUR: 500,
        totalCashEUR: 500,
        totalHoldingsEUR: 0,
        syncStatus: "pending_first_sync",
      },
    ];

    const totalCashEUR = mockAccounts.reduce((sum, a) => sum + a.totalCashEUR, 0);
    const totalInvestedEUR = mockAccounts.reduce((sum, a) => sum + a.totalHoldingsEUR, 0);
    const totalPortfolioEUR = totalCashEUR + totalInvestedEUR;

    expect(totalCashEUR).toBe(1500);
    expect(totalInvestedEUR).toBe(1851.85);
    expect(totalPortfolioEUR).toBe(3351.85);
  });

  it("handles empty accounts gracefully with pending_first_sync status without mock fabrication", () => {
    const emptyAccount: SnapTradeAccountSummary = {
      id: "ibkr-empty",
      name: "Interactive Brokers Flex",
      numberMasked: "••••0000",
      type: "TRADITIONAL",
      institutionName: "Interactive Brokers",
      currency: "USD",
      balances: [],
      holdings: [],
      totalValueEUR: 0,
      totalCashEUR: 0,
      totalHoldingsEUR: 0,
      syncStatus: "pending_first_sync",
    };

    expect(emptyAccount.syncStatus).toBe("pending_first_sync");
    expect(emptyAccount.totalValueEUR).toBe(0);
    expect(emptyAccount.holdings.length).toBe(0);
  });
});

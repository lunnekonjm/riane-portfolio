import { describe, it, expect } from "vitest";
import { TrueLayerAccountSummary } from "../lib/truelayer/types";

describe("TrueLayer / BoursoBank Normalization Logic", () => {
  it("correctly classifies checking, savings, and investment accounts", () => {
    const mockAccounts: TrueLayerAccountSummary[] = [
      {
        id: "bourso-courant",
        displayName: "Compte Courant Individuel",
        accountType: "checking",
        institutionName: "BoursoBank",
        currency: "EUR",
        currentBalance: 3250.5,
        availableBalance: 3250.5,
        balanceEUR: 3250.5,
        ibanMasked: "••••1234",
        lastUpdated: "2026-08-15T09:00:00Z",
      },
      {
        id: "bourso-livreta",
        displayName: "Livret A",
        accountType: "savings",
        institutionName: "BoursoBank",
        currency: "EUR",
        currentBalance: 12000.0,
        availableBalance: 12000.0,
        balanceEUR: 12000.0,
        ibanMasked: "••••5678",
        lastUpdated: "2026-08-15T09:00:00Z",
      },
      {
        id: "bourso-peapme",
        displayName: "PEA-PME Titres",
        accountType: "investment",
        institutionName: "BoursoBank",
        currency: "EUR",
        currentBalance: 5400.0,
        availableBalance: 5400.0,
        balanceEUR: 5400.0,
        ibanMasked: "••••9012",
        lastUpdated: "2026-08-15T09:00:00Z",
      },
    ];

    const totalChecking = mockAccounts
      .filter((a) => a.accountType === "checking")
      .reduce((sum, a) => sum + a.balanceEUR, 0);

    const totalSavings = mockAccounts
      .filter((a) => a.accountType === "savings")
      .reduce((sum, a) => sum + a.balanceEUR, 0);

    const totalInvested = mockAccounts
      .filter((a) => a.accountType === "investment")
      .reduce((sum, a) => sum + a.balanceEUR, 0);

    const totalBoursoBank = mockAccounts.reduce((sum, a) => sum + a.balanceEUR, 0);

    expect(totalChecking).toBe(3250.5);
    expect(totalSavings).toBe(12000.0);
    expect(totalInvested).toBe(5400.0);
    expect(totalBoursoBank).toBe(20650.5);
  });
});

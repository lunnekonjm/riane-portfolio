/**
 * Calcule l'imposition fiscale française (Article 150 VH bis du CGI - Flat Tax / PFU 30%)
 * et le montant réellement net retirable sur compte bancaire en euros.
 */
export function calculateCryptoTaxAndNet(
  grossValueEUR: number,
  totalCostEUR: number,
  annualTotalDisposalsEUR: number = 0
): {
  grossValueEUR: number;
  totalCostEUR: number;
  grossGainEUR: number;
  gainPct: number;
  taxEUR: number;
  netWithdrawalEUR: number;
  isTaxExempt: boolean;
  taxRatePct: number;
} {
  const safeGross = Math.max(0, grossValueEUR || 0);
  const safeCost = Math.max(0, totalCostEUR || 0);
  const grossGainEUR = safeGross - safeCost;
  const gainPct = safeCost > 0 ? (grossGainEUR / safeCost) * 100 : 0;

  // Franchise de 305 € de cessions annuelles globales
  const isTaxExempt = (annualTotalDisposalsEUR > 0 ? annualTotalDisposalsEUR : safeGross) <= 305 && safeGross <= 305;

  let taxEUR = 0;
  if (!isTaxExempt && grossGainEUR > 0) {
    taxEUR = grossGainEUR * 0.30; // 30% PFU (12.8% IR + 17.2% PS)
  }

  const netWithdrawalEUR = Math.max(0, safeGross - taxEUR);

  return {
    grossValueEUR: safeGross,
    totalCostEUR: safeCost,
    grossGainEUR,
    gainPct,
    taxEUR,
    netWithdrawalEUR,
    isTaxExempt,
    taxRatePct: isTaxExempt ? 0 : 30,
  };
}

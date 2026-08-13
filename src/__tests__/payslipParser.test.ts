import { describe, it, expect } from 'vitest';

describe('payslipParser & Financial Regex extraction', () => {
  // Test regex pattern extraction logic for French payslips (bulletins de paie)
  const mockPayslipText = `
    BULLETIN DE PAIE - JUIN 2026
    SALAIRE BRUT : 4 500,00 €
    TOTAL COTISATIONS SALARIALES : 980,50 €
    NET IMPOSABLE : 3 750,00 €
    IMPOT SUR LE REVENU PRELEVE A LA SOURCE (PAS) : 281,25 € (Taux : 7.5%)
    NET A PAYER AVANT IMPOT SUR LE REVENU : 3 519,50 €
    NET PAYE EN EUROS : 3 238,25 €
  `;

  it('extracts net a payer, net imposable and PAS correctly with regex patterns', () => {
    // Net payé en euros (Net à payer final après impôt)
    const netPayeMatch = mockPayslipText.match(/NET\s+PAY[EÉ]\s+(?:EN\s+EUROS)?\s*[:]\s*([\d\s]+[.,]\d{2})/i);
    expect(netPayeMatch).not.toBeNull();
    const netPaye = parseFloat(netPayeMatch![1].replace(/\s/g, '').replace(',', '.'));
    expect(netPaye).toBe(3238.25);

    // Net imposable
    const netImpMatch = mockPayslipText.match(/NET\s+IMPOSABLE\s*[:]\s*([\d\s]+[.,]\d{2})/i);
    expect(netImpMatch).not.toBeNull();
    const netImp = parseFloat(netImpMatch![1].replace(/\s/g, '').replace(',', '.'));
    expect(netImp).toBe(3750.00);

    // Prélèvement à la source (PAS)
    const pasMatch = mockPayslipText.match(/SOURCE\s*\(PAS\)\s*[:]\s*([\d\s]+[.,]\d{2})/i);
    expect(pasMatch).not.toBeNull();
    const pas = parseFloat(pasMatch![1].replace(/\s/g, '').replace(',', '.'));
    expect(pas).toBe(281.25);
  });
});

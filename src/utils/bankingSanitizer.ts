export interface TemporaryExpenseItem {
  id: string;
  label: string;
  monthlyAmount: number;
  startPeriod: string; // YYYY-MM
  durationMonths: number;
  category?: string;
}

export function computeEndPeriod(startPeriod: string, durationMonths: number): string {
  try {
    const parts = startPeriod.split('-');
    if (parts.length < 2) return startPeriod;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const totalMonths = month - 1 + durationMonths - 1;
    const endYear = year + Math.floor(totalMonths / 12);
    const endMonth = (totalMonths % 12) + 1;
    return `${endYear}-${String(endMonth).padStart(2, '0')}`;
  } catch {
    return startPeriod;
  }
}

export function isExpenseActiveForPeriod(expense: TemporaryExpenseItem, period: string): boolean {
  const end = computeEndPeriod(expense.startPeriod, expense.durationMonths);
  return period >= expense.startPeriod && period <= end;
}

export function cleanFrenchMerchantName(raw?: string | null): string {
  let name = (raw || '').toUpperCase();
  name = name.replace(/^(PRLV\s+SEPA|VIR\s+SEPA|PRLV|VIR|CB|PAIEMENT|FACTURE|RETRAIT|CARTE)\s*(\d{2}\/\d{2})?\s*/i, '');
  name = name.replace(/^(DU|LE|POUR)\s+\d{2}\/\d{2}(\/\d{2,4})?\s*/i, '');
  name = name.replace(/,\s*(CACP|RUM|REF|EMETTEUR|ID|CONTRAT|FACTURE|TIERS|DOSSIER|\d{4,}).*$/i, '');
  name = name.replace(/\b(CACP|RUM|REF|EMETTEUR|ID|NOT|CONTRAT|FACTURE|DOSSIER|TIERS)\s*[:.\s]\s*\S+.*$/i, '');
  name = name.replace(/\b\d{2}\/\d{2}(\/\d{2,4})?/g, '');
  name = name.replace(/[-_/]/g, ' ');
  name = name.replace(/\s+/g, ' ').trim();

  if (name.includes('CDC HABITAT')) return 'CDC Habitat (Loyer)';
  if (name.includes('TURREL')) return 'Turrel Baptiste';
  if (name.includes('SENDWAVE')) return 'Sendwave (Soutien familial)';
  if (name.includes('BOUYGUES')) return 'Bouygues Telecom';
  if (name.includes('REVOLUT')) return 'Revolut';
  if (name.includes('PEA')) return 'Bourse PEA';
  if (name.includes('LIVRET')) return 'Livret A';
  if (!name) return "Prélèvement Récurrent";
  return name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

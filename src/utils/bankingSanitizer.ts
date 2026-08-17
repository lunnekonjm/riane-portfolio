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
  if (!raw) return 'Prélèvement Récurrent';
  const orig = String(raw).trim();
  const upper = orig.toUpperCase();

  // 1. High-fidelity specific financial / recurring flows
  if (
    upper.includes('EPARGNE COMMUNE') ||
    upper.includes('PARTICIPATION EPARGNE') ||
    upper.includes('TONTINE') ||
    upper.includes('CISSE ATOUMANE') ||
    (upper.includes('NEGEM') && upper.includes('EPARGNE'))
  ) {
    return 'Tontine (Épargne collective)';
  }
  if (upper.includes('CDC HABITAT') || upper.includes('CDC-HABITAT') || upper.includes('LOYER CDC')) {
    return 'CDC Habitat (Loyer)';
  }
  if (upper.includes('BPCE') && (upper.includes('HABITAT') || upper.includes('ASSUR') || upper.includes('IARD'))) {
    return 'BPCE Assurances (Habitation)';
  }
  if (upper.includes('PACIFICA')) {
    return 'Pacifica Assurances';
  }
  if (upper.includes('TOTALENERGIES') || upper.includes('TOTAL ENERGIES') || upper.includes('EDF') || upper.includes('ENGIE') || upper.includes('ENI')) {
    return 'TotalEnergies (Électricité & Gaz)';
  }
  if (upper.includes('TURREL')) {
    return 'Turrel Baptiste';
  }
  if (upper.includes('SENDWAVE') || upper.includes('WAVE') || upper.includes('REMITLY') || upper.includes('TAP TAP SEND') || upper.includes('SOUTIEN FAMILLE')) {
    return 'Sendwave (Soutien familial)';
  }
  if (upper.includes('BOUYGUES') || upper.includes('BBOX')) {
    if (upper.includes('06') || upper.includes('MOBILE')) return 'Bouygues Telecom (Mobile)';
    if (upper.includes('09') || upper.includes('BBOX') || upper.includes('WIFI') || upper.includes('WI-FI') || upper.includes('FIBRE')) {
      return 'Bouygues Telecom (Bbox Wi-Fi)';
    }
    return 'Bouygues Telecom';
  }
  if (upper.includes('NETFLIX')) return 'Netflix';
  if (upper.includes('SPOTIFY')) return 'Spotify';
  if (upper.includes('APPLE.COM') || upper.includes('ICLOUD') || upper.includes('ITUNES')) return 'Apple (iCloud / Services)';
  if (upper.includes('AMAZON PRIME') || upper.includes('PRIME VIDEO')) return 'Amazon Prime';
  if (upper.includes('CANAL')) return 'Canal+';
  if (upper.includes('PEA') || upper.includes('DCA ETF') || upper.includes('BOURSE')) {
    return 'Bourse PEA';
  }
  if (upper.includes('LIVRET A') || upper.includes('LIVRET')) {
    return 'Livret A';
  }
  if (upper.includes('REVOLUT') || upper.includes('REV*')) {
    return 'Revolut';
  }
  if (upper.includes('DENTISTE') || upper.includes('CLINIQUE DENTAIRE') || upper.includes('CENTRE DENTAIRE')) {
    return 'Clinique Dentaire (Santé)';
  }
  if (upper.includes('KLARNA') || upper.includes('ALMA') || upper.includes('FLOA')) {
    return 'Klarna (Paiement 3x)';
  }
  if (upper.includes('NAVIGO') || upper.includes('RATP') || upper.includes('SNCF') || upper.includes('IDFM')) {
    return 'Transports (Navigo / SNCF)';
  }
  if (upper.includes('UBER EATS') || upper.includes('DELIVEROO')) {
    return 'Uber Eats / Deliveroo';
  }
  if (upper.includes('SALAIRE') || upper.includes('VIR EMPLOYEUR') || upper.includes('REMUNERATION')) {
    return 'Salaire Net';
  }
  if (upper.includes('DGFIP') || upper.includes('IMPOT')) {
    return 'Impôts (DGFIP)';
  }

  // 2. General intelligent cleaner
  let name = upper;
  name = name.replace(/^(PRLV\s+SEPA|VIR\s+SEPA|VIR\s+INST|PRLV|VIR|CB|PAIEMENT\s+PAR\s+CARTE|PAIEMENT|FACTURE\s+CARTE|FACTURE|RETRAIT|COTIS|ACHAT\s+CB|CARTE)\s*(\d{2}\/\d{2})?\s*/gi, '');
  name = name.replace(/^(DU|LE|POUR)\s+\d{2}\/\d{2}(\/\d{2,4})?\s*/gi, '');
  name = name.replace(/,\s*(M\s+OU\s+MME|MR\s+OU\s+MME|MONSIEUR|MADAME|M\.|MME|MR|TIERS|EMETTEUR|BENEFICIAIRE).*$/gi, '');
  name = name.replace(/\b(M\s+OU\s+MME|MR\s+OU\s+MME)\b.*$/gi, '');
  name = name.replace(/,\s*(CACP|RUM|REF|EMETTEUR|ID|CONTRAT|FACTURE|TIERS|DOSSIER|\d{4,}).*$/gi, '');
  name = name.replace(/\b(CACP|RUM|REF|EMETTEUR|ID|NOT|CONTRAT|FACTURE|DOSSIER|TIERS)\s*[:.\s]\s*\S+.*$/gi, '');
  name = name.replace(/\b\d{2}\/\d{2}(\/\d{2,4})?/g, '');
  name = name.replace(/\b[A-Z0-9]{12,}\b/g, '');
  name = name.replace(/[-_/]/g, ' ');
  name = name.replace(/\s+/g, ' ').trim();
  name = name.replace(/^[-,\s.]+|[-,\s.]+$/g, '').trim();

  if (!name) return 'Prélèvement Récurrent';

  return name
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

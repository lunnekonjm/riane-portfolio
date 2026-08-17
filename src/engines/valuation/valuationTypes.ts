export type ValuationSignalType = 'Favorable' | 'Neutre' | 'Défavorable' | 'Vigilance' | 'Non calculable';
export type AlignmentType = 'CONCORDANCE_HAUSSIERE' | 'CONCORDANCE_PRUDENTE' | 'MODELE_PLUS_OFFENSIF' | 'MODELE_PLUS_PRUDENT' | 'NEUTRE';

export interface ValuationEngineResult {
  applicable: boolean;
  metricType: 'eps' | 'revenue' | 'netIncome';
  currentPrice: number;
  // Métriques de valorisation (P/E ou P/S)
  ratioName: string; // 'P/E' ou 'P/S'
  currentRatio: number;
  avgRatio: number;
  stdevRatio: number;
  gapPct: number; // % d'écart du ratio vs sa moyenne (+ = plus cher, - = moins cher)
  zScore: number;
  signal: ValuationSignalType;
  signalClass: 'good' | 'warn' | 'bad' | 'muted';
  confidence: 'high' | 'mid' | 'low';
  confidenceLabel: string;
  nPoints: number;
  // Repères de prix calculés
  fairValue: number; // Valeur de référence historique
  lowerZone: number; // Borne d'achat favorable (moyenne - 1σ)
  upperZone: number; // Borne de vigilance / surévaluation (moyenne + 1σ)
  priceZonePosition: 'SOUS_FAVORABLE' | 'DANS_FOURCHETTE' | 'AU_DESSUS_VIGILANCE';
  priceZoneLabel: string;
  // Statistiques de croissance
  growthMetricLabel: string;
  growthTotalPct: number | null;
  growthCagrPct: number | null;
  priceTotalPct: number | null;
  priceCagrPct: number | null;
  pegOrPsg: number | null; // PEG (P/E ÷ CAGR) ou PSG (P/S ÷ Revenue Growth)
  // Confrontation Consensus Analystes
  analystMean: number;
  analystHigh: number;
  analystLow: number;
  analystUpsidePct: number; // (Mean - Current) / Current * 100
  analystRating: string;
  analystCount: number;
  alignment: AlignmentType;
  alignmentLabel: string;
  alignmentClass: 'good' | 'warn' | 'bad' | 'muted';
  // Explications institutionnelles
  methodExplanation: string;
  reason?: string;
}

export function firstLastValid(arr: (number | null)[]): { fi: number; li: number } {
  let fi = -1;
  let li = -1;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== null && arr[i] !== undefined) {
      if (fi === -1) fi = i;
      li = i;
    }
  }
  return { fi, li };
}

export function extractYearNum(label: string): number {
  return parseInt(String(label).replace(/\D/g, ''), 10) || 2026;
}

export function computeSeriesStats(
  years: string[],
  arr?: (number | null)[]
): { total: number | null; cagr: number | null } {
  if (!arr || arr.length === 0) return { total: null, cagr: null };
  const { fi, li } = firstLastValid(arr);
  if (fi === -1 || li === -1 || fi === li) return { total: null, cagr: null };

  const start = arr[fi]!;
  const end = arr[li]!;
  const span = Math.max(1, extractYearNum(years[li]) - extractYearNum(years[fi]));

  let total: number | null = null;
  let cagr: number | null = null;

  if (start > 0) {
    total = ((end - start) / Math.abs(start)) * 100;
    if (end > 0) {
      cagr = (Math.pow(end / start, 1 / span) - 1) * 100;
    }
  } else if (start < 0 && end !== null) {
    total = ((end - start) / Math.abs(start)) * 100;
  }

  return { total, cagr };
}

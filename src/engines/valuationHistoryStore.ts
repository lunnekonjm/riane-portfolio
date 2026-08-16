/**
 * GESTIONNAIRE DE MÉMOIRE PERSISTANTE TEMPORELLE — VALUATION SNAPSHOT STORE
 * Enregistre et restitue les instantanés d'analyse (Date, Cours, Signal, Écart %, Consensus)
 * Permet de suivre l'évolution des signaux dans le temps :
 * Ex: "Il y a 3 semaines : Neutre à 580$ (+5%) ➔ Aujourd'hui : Favorable à 520$ (-12%)"
 */

import { ValuationSignalType } from './valuationEngine';

export interface ValuationSnapshot {
  id: string;
  timestamp: number;
  dateLabel: string;
  stockKey: string;
  ticker: string;
  name: string;
  price: number;
  currency: string;
  metricType: 'eps' | 'revenue' | 'netIncome';
  ratioName: string;
  ratioValue: number;
  signal: ValuationSignalType;
  gapPct: number;
  zScore: number;
  analystTarget: number;
  analystUpside: number;
  notes?: string;
  source?: 'auto_recalc' | 'manual_save' | 'system_baseline';
}

const STORAGE_KEY = 'riane_valuation_history_snapshots_v1';

// Instantanés de base de référence (points de comparaison il y a 3 semaines)
const BASELINE_HISTORICAL_SNAPSHOTS: ValuationSnapshot[] = [
  {
    id: 'snap_msft_3w_ago',
    timestamp: Date.now() - 21 * 24 * 3600 * 1000,
    dateLabel: '26/07/2026 (Il y a 3 sem.)',
    stockKey: 'msft',
    ticker: 'MSFT',
    name: 'Microsoft',
    price: 445.00,
    currency: '$',
    metricType: 'eps',
    ratioName: 'P/E',
    ratioValue: 31.6,
    signal: 'Neutre',
    gapPct: 1.0,
    zScore: 0.05,
    analystTarget: 495.0,
    analystUpside: 11.2,
    source: 'system_baseline',
    notes: 'Avant léger repli estival des méga-caps tech.',
  },
  {
    id: 'snap_googl_3w_ago',
    timestamp: Date.now() - 21 * 24 * 3600 * 1000,
    dateLabel: '26/07/2026 (Il y a 3 sem.)',
    stockKey: 'googl',
    ticker: 'GOOGL',
    name: 'Alphabet (Google)',
    price: 188.00,
    currency: '$',
    metricType: 'eps',
    ratioName: 'P/E',
    ratioValue: 24.1,
    signal: 'Neutre',
    gapPct: -5.0,
    zScore: -0.32,
    analystTarget: 205.0,
    analystUpside: 9.0,
    source: 'system_baseline',
    notes: 'Stabilité après publication des résultats Cloud & Search.',
  },
  {
    id: 'snap_meta_3w_ago',
    timestamp: Date.now() - 21 * 24 * 3600 * 1000,
    dateLabel: '26/07/2026 (Il y a 3 sem.)',
    stockKey: 'meta',
    ticker: 'META',
    name: 'Meta Platforms',
    price: 605.00,
    currency: '$',
    metricType: 'eps',
    ratioName: 'P/E',
    ratioValue: 26.2,
    signal: 'Neutre',
    gapPct: 7.0,
    zScore: 0.38,
    analystTarget: 640.0,
    analystUpside: 5.8,
    source: 'system_baseline',
    notes: 'Point haut avant publication des dépenses d\'infrastructure IA.',
  },
  {
    id: 'snap_now_3w_ago',
    timestamp: Date.now() - 21 * 24 * 3600 * 1000,
    dateLabel: '26/07/2026 (Il y a 3 sem.)',
    stockKey: 'now',
    ticker: 'NOW',
    name: 'ServiceNow',
    price: 920.00,
    currency: '$',
    metricType: 'eps',
    ratioName: 'P/E',
    ratioValue: 56.4,
    signal: 'Neutre',
    gapPct: 6.2,
    zScore: 0.31,
    analystTarget: 980.0,
    analystUpside: 6.5,
    source: 'system_baseline',
    notes: 'Consolidation sur les sommets historiques SaaS.',
  },
  {
    id: 'snap_cohr_3w_ago',
    timestamp: Date.now() - 21 * 24 * 3600 * 1000,
    dateLabel: '26/07/2026 (Il y a 3 sem.)',
    stockKey: 'cohr',
    ticker: 'COHR',
    name: 'Coherent Corp.',
    price: 92.00,
    currency: '$',
    metricType: 'eps',
    ratioName: 'P/E',
    ratioValue: 33.8,
    signal: 'Neutre',
    gapPct: 9.5,
    zScore: 0.44,
    analystTarget: 102.0,
    analystUpside: 10.9,
    source: 'system_baseline',
    notes: 'Sommet d\'engouement optique IA au-dessus du consensus.',
  },
  {
    id: 'snap_oklo_3w_ago',
    timestamp: Date.now() - 21 * 24 * 3600 * 1000,
    dateLabel: '26/07/2026 (Il y a 3 sem.)',
    stockKey: 'oklo',
    ticker: 'OKLO',
    name: 'Oklo Inc.',
    price: 28.50,
    currency: '$',
    metricType: 'revenue',
    ratioName: 'P/S',
    ratioValue: 48.0,
    signal: 'Vigilance',
    gapPct: 65.0,
    zScore: 2.1,
    analystTarget: 26.0,
    analystUpside: -8.8,
    source: 'system_baseline',
    notes: 'Valorisation très tendue post-partenariat data centers nucléaires.',
  },
  {
    id: 'snap_rklb_3w_ago',
    timestamp: Date.now() - 21 * 24 * 3600 * 1000,
    dateLabel: '26/07/2026 (Il y a 3 sem.)',
    stockKey: 'rklb',
    ticker: 'RKLB',
    name: 'Rocket Lab USA',
    price: 21.50,
    currency: '$',
    metricType: 'revenue',
    ratioName: 'P/S',
    ratioValue: 24.2,
    signal: 'Neutre',
    gapPct: 17.0,
    zScore: 0.62,
    analystTarget: 22.5,
    analystUpside: 4.7,
    source: 'system_baseline',
    notes: 'Avant validation du tir Electron de fin juillet.',
  },
  {
    id: 'snap_asts_3w_ago',
    timestamp: Date.now() - 21 * 24 * 3600 * 1000,
    dateLabel: '26/07/2026 (Il y a 3 sem.)',
    stockKey: 'asts',
    ticker: 'ASTS',
    name: 'AST SpaceMobile',
    price: 26.00,
    currency: '$',
    metricType: 'revenue',
    ratioName: 'P/S',
    ratioValue: 62.0,
    signal: 'Vigilance',
    gapPct: 72.0,
    zScore: 2.3,
    analystTarget: 28.0,
    analystUpside: 7.7,
    source: 'system_baseline',
    notes: 'Spéculation soutenue avant le déploiement BlueBird.',
  },
  {
    id: 'snap_poet_3w_ago',
    timestamp: Date.now() - 21 * 24 * 3600 * 1000,
    dateLabel: '26/07/2026 (Il y a 3 sem.)',
    stockKey: 'poet',
    ticker: 'POET',
    name: 'POET Technologies',
    price: 4.80,
    currency: '$',
    metricType: 'revenue',
    ratioName: 'P/S',
    ratioValue: 35.0,
    signal: 'Vigilance',
    gapPct: 58.0,
    zScore: 1.9,
    analystTarget: 5.5,
    analystUpside: 14.6,
    source: 'system_baseline',
    notes: 'Volatilité élevée sur les annonces de modules optiques.',
  },
  {
    id: 'snap_2crsi_3w_ago',
    timestamp: Date.now() - 21 * 24 * 3600 * 1000,
    dateLabel: '26/07/2026 (Il y a 3 sem.)',
    stockKey: '2crsi',
    ticker: '2CRSI.PA',
    name: '2CRSI',
    price: 4.85,
    currency: '€',
    metricType: 'revenue',
    ratioName: 'P/S',
    ratioValue: 0.65,
    signal: 'Neutre',
    gapPct: -6.0,
    zScore: -0.25,
    analystTarget: 6.80,
    analystUpside: 40.2,
    source: 'system_baseline',
    notes: 'Carnet de commandes serveurs IA en forte hausse.',
  },
  {
    id: 'snap_rib_3w_ago',
    timestamp: Date.now() - 21 * 24 * 3600 * 1000,
    dateLabel: '26/07/2026 (Il y a 3 sem.)',
    stockKey: 'rib',
    ticker: 'RIB.PA',
    name: 'Riber',
    price: 3.40,
    currency: '€',
    metricType: 'eps',
    ratioName: 'P/E',
    ratioValue: 14.5,
    signal: 'Neutre',
    gapPct: -6.0,
    zScore: -0.35,
    analystTarget: 4.20,
    analystUpside: 23.5,
    source: 'system_baseline',
    notes: 'Point de référence avant publication semestrielle.',
  },
  {
    id: 'snap_alkal_3w_ago',
    timestamp: Date.now() - 21 * 24 * 3600 * 1000,
    dateLabel: '26/07/2026 (Il y a 3 sem.)',
    stockKey: 'alkal',
    ticker: 'ALKAL.PA',
    name: 'Kalray',
    price: 2.10,
    currency: '€',
    metricType: 'revenue',
    ratioName: 'P/S',
    ratioValue: 3.1,
    signal: 'Favorable',
    gapPct: -14.0,
    zScore: -0.65,
    analystTarget: 3.20,
    analystUpside: 52.4,
    source: 'system_baseline',
    notes: 'Décote marquée sur les processeurs DPU/accélération.',
  },
  {
    id: 'snap_ovh_3w_ago',
    timestamp: Date.now() - 21 * 24 * 3600 * 1000,
    dateLabel: '26/07/2026 (Il y a 3 sem.)',
    stockKey: 'ovh',
    ticker: 'OVH.PA',
    name: 'OVHcloud',
    price: 8.40,
    currency: '€',
    metricType: 'revenue',
    ratioName: 'P/S',
    ratioValue: 1.55,
    signal: 'Favorable',
    gapPct: -23.0,
    zScore: -0.95,
    analystTarget: 11.50,
    analystUpside: 36.9,
    source: 'system_baseline',
    notes: 'Décote persistante sur le Cloud européen.',
  },
];

export function getStoredSnapshots(stockKey?: string): ValuationSnapshot[] {
  if (typeof window === 'undefined') return BASELINE_HISTORICAL_SNAPSHOTS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list: ValuationSnapshot[] = [];
    if (raw) {
      list = JSON.parse(raw);
    } else {
      // Initialize with baseline
      list = [...BASELINE_HISTORICAL_SNAPSHOTS];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    if (stockKey) {
      return list
        .filter((s) => s.stockKey.toLowerCase() === stockKey.toLowerCase())
        .sort((a, b) => b.timestamp - a.timestamp);
    }

    return list.sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    console.error('[ValuationHistoryStore] Erreur lecture snapshots:', err);
    return stockKey
      ? BASELINE_HISTORICAL_SNAPSHOTS.filter((s) => s.stockKey === stockKey)
      : BASELINE_HISTORICAL_SNAPSHOTS;
  }
}

export function saveValuationSnapshot(
  data: Omit<ValuationSnapshot, 'id' | 'timestamp' | 'dateLabel'>
): ValuationSnapshot {
  const now = new Date();
  const dateLabel = `${now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

  const newSnap: ValuationSnapshot = {
    ...data,
    id: `snap_${data.stockKey}_${Date.now()}`,
    timestamp: Date.now(),
    dateLabel,
  };

  if (typeof window !== 'undefined') {
    try {
      const all = getStoredSnapshots();
      // Ne pas dupliquer si déjà enregistré il y a moins de 10 minutes pour le même ticker
      const filtered = all.filter(
        (s) => !(s.stockKey === data.stockKey && Math.abs(s.timestamp - newSnap.timestamp) < 600000)
      );
      filtered.unshift(newSnap);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (err) {
      console.error('[ValuationHistoryStore] Erreur sauvegarde snapshot:', err);
    }
  }

  return newSnap;
}

export function getTemporalEvolutionDelta(stockKey: string): {
  previous?: ValuationSnapshot;
  latest?: ValuationSnapshot;
  daysDiff: number;
  priceDiffPct: number;
  signalEvolution: string;
  gapEvolution: string;
  summaryBadge: string;
} | null {
  const snaps = getStoredSnapshots(stockKey);
  if (snaps.length < 1) return null;

  const latest = snaps[0];
  const previous = snaps.length > 1 ? snaps[1] : undefined;

  if (!previous) {
    return {
      latest,
      daysDiff: 0,
      priceDiffPct: 0,
      signalEvolution: `Signal initial : ${latest.signal}`,
      gapEvolution: `Écart initial : ${latest.gapPct >= 0 ? '+' : ''}${latest.gapPct.toFixed(0)}%`,
      summaryBadge: '1er Instantané',
    };
  }

  const daysDiff = Math.max(1, Math.round((latest.timestamp - previous.timestamp) / (24 * 3600 * 1000)));
  const priceDiffPct = ((latest.price - previous.price) / previous.price) * 100;

  let signalEvolution = '';
  if (previous.signal === latest.signal) {
    signalEvolution = `Signal maintenu (${latest.signal})`;
  } else {
    signalEvolution = `Signal passé de ${previous.signal} à ${latest.signal}`;
  }

  const gapDiff = latest.gapPct - previous.gapPct;
  const gapEvolution = `Écart vs moyenne passé de ${previous.gapPct >= 0 ? '+' : ''}${previous.gapPct.toFixed(0)}% à ${latest.gapPct >= 0 ? '+' : ''}${latest.gapPct.toFixed(0)}% (${gapDiff >= 0 ? '+' : ''}${gapDiff.toFixed(0)} pts)`;

  let summaryBadge = '';
  if (latest.signal === 'Favorable' && previous.signal !== 'Favorable') {
    summaryBadge = '🟢 Amélioration en Favorable';
  } else if (latest.signal === 'Défavorable' || latest.signal === 'Vigilance') {
    summaryBadge = '🔴 Vigilance renforcée';
  } else if (priceDiffPct < -10) {
    summaryBadge = `📉 Repli cours ${priceDiffPct.toFixed(1)}%`;
  } else if (priceDiffPct > 10) {
    summaryBadge = `📈 Hausse cours +${priceDiffPct.toFixed(1)}%`;
  } else {
    summaryBadge = `Stabilité (${daysDiff}j)`;
  }

  return {
    previous,
    latest,
    daysDiff,
    priceDiffPct,
    signalEvolution,
    gapEvolution,
    summaryBadge,
  };
}

export function deleteStoredSnapshot(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const all = getStoredSnapshots().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('[ValuationHistoryStore] Erreur suppression:', err);
  }
}

export function clearAllSnapshots(stockKey?: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (!stockKey) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(BASELINE_HISTORICAL_SNAPSHOTS));
    } else {
      const remaining = getStoredSnapshots().filter((s) => s.stockKey !== stockKey);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    }
  } catch (err) {
    console.error('[ValuationHistoryStore] Erreur purge:', err);
  }
}

export function exportSnapshotsCSV(): string {
  const list = getStoredSnapshots();
  const headers = ['Date', 'Ticker', 'Nom', 'Cours', 'Devise', 'Métrique', 'Ratio', 'Signal', 'Écart %', 'Score z', 'Objectif Analystes', 'Potentiel %', 'Notes'];
  const rows = list.map((s) => [
    `"${s.dateLabel}"`,
    `"${s.ticker}"`,
    `"${s.name}"`,
    s.price,
    `"${s.currency}"`,
    `"${s.metricType}"`,
    s.ratioValue.toFixed(2),
    `"${s.signal}"`,
    s.gapPct.toFixed(1),
    s.zScore.toFixed(2),
    s.analystTarget.toFixed(2),
    s.analystUpside.toFixed(1),
    `"${(s.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
}

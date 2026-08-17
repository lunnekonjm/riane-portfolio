import { ValuationSignalType } from '../valuationEngine';
import { BASELINE_HISTORICAL_SNAPSHOTS } from '@/data/valuation/baselineSnapshots';

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

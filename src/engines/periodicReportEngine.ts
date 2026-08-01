/**
 * Moteur de Rapports Périodiques — Appelle le serveur API /api/generate-report
 * 100% DYNAMIQUE · ZERO DYNAMIQUE EN DUR · REAL LIVE RSS ARTICLES & REAL TIMESTAMPS
 */

import type { Position, PortfolioConfig } from '@/types/portfolio';

export type ReportPeriod = 'monthly' | 'quarterly' | 'semestrial' | 'annual';

export interface PeriodicReportOptions {
  period: ReportPeriod;
  periodLabel: string;
  adjustInflation: boolean;
  cumulativeInflationFactor: number;
  inflationRate: number;
  yearsElapsed: number;
}

export async function generatePeriodicReport(
  positions: Position[],
  config: PortfolioConfig | null,
  fxRates: Record<string, number>,
  options: PeriodicReportOptions
): Promise<string> {
  try {
    const res = await fetch('/api/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        positions,
        config,
        fxRates,
        ...options,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error || 'Erreur du serveur d\'audit IA');
    }

    const data = await res.json();
    return data.reportMarkdown;
  } catch (err: any) {
    console.error('[periodicReportEngine] API Error, fallback to client dynamic generation:', err);
    throw err;
  }
}

/**
 * Route Cron — Revue périodique proactive
 * GET /api/cron/periodic-review
 *
 * Appelée automatiquement par Vercel Cron (voir vercel.json, exécution quotidienne).
 * Détermine si un ou plusieurs rapports (mensuel / trimestriel / 4 mois / annuel)
 * sont dus aujourd'hui, génère chacun via la même logique que le bouton manuel
 * (/api/generate-report), les enregistre dans Firestore, et envoie un email
 * récapitulatif via Resend.
 *
 * Sécurité : nécessite l'en-tête Authorization: Bearer ${CRON_SECRET}, envoyé
 * automatiquement par Vercel Cron lorsque CRON_SECRET est configuré.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/services/firebase/admin';
import { sendPeriodicReportEmail } from '@/services/email/resend';
import type { ReportPeriod } from '@/engines/periodicReportEngine';
import type { Position, PortfolioConfig } from '@/types/portfolio';

export const runtime = 'nodejs';
export const maxDuration = 120;

function periodsDueToday(date: Date): { period: ReportPeriod; label: string }[] {
  const due: { period: ReportPeriod; label: string }[] = [];
  const day = date.getDate();
  const dayOfWeek = date.getDay(); // 0 (Sun) - 6 (Sat)
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();

  // Weekly report: every Friday (5)
  if (dayOfWeek === 5) {
    const weekNumber = Math.ceil(day / 7);
    due.push({ period: 'weekly', label: `Semaine ${weekNumber} - ${date.toLocaleDateString('fr-FR', { month: 'long' })}` });
  }

  if (day !== 1) return due; // Toutes les revues plus longues se déclenchent le 1er du mois

  const monthLabel = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  due.push({ period: 'monthly', label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1) });

  if ([1, 4, 7, 10].includes(month)) {
    const q = Math.floor((month - 1) / 3) + 1;
    due.push({ period: 'quarterly', label: `Q${q} ${year}` });
  }

  if ([1, 5, 9].includes(month)) {
    const p = month === 1 ? 1 : month === 5 ? 2 : 3;
    due.push({ period: 'quadrimestrial', label: `P${p} ${year}` });
  }

  if (month === 1) {
    due.push({ period: 'annual', label: `Exercice ${year - 1}` });
  }

  return due;
}

async function fetchFxRatesServer(): Promise<Record<string, number>> {
  try {
    const { getFxRates } = await import('@/services/market-data/provider');
    return await getFxRates();
  } catch {
    return { EUR: 1.0, USD: 0.92, GBP: 1.18, CHF: 1.04 };
  }
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  }

  const ownerUid = process.env.OWNER_UID;
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerUid || !ownerEmail) {
    return NextResponse.json({ error: 'OWNER_UID / OWNER_EMAIL non configurés' }, { status: 500 });
  }

  const today = new Date();
  const due = periodsDueToday(today);

  if (due.length === 0) {
    return NextResponse.json({ message: 'Aucune revue due aujourd\'hui', date: today.toISOString() });
  }

  try {
    const db = getAdminDb();

    const [positionsSnap, configSnap] = await Promise.all([
      db.collection('users').doc(ownerUid).collection('portfolio').orderBy('envelope').get(),
      db.collection('users').doc(ownerUid).collection('config').doc('portfolio').get(),
    ]);

    const positions = positionsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Position[];
    const config = (configSnap.exists ? configSnap.data() : null) as PortfolioConfig | null;

    if (positions.length === 0) {
      return NextResponse.json({ error: 'Aucune position trouvée pour OWNER_UID' }, { status: 404 });
    }

    const fxRates = await fetchFxRatesServer();

    const baseUrl =
      process.env.APP_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const results: { period: ReportPeriod; ok: boolean; error?: string }[] = [];

    for (const { period, label } of due) {
      try {
        const res = await fetch(`${baseUrl}/api/generate-report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            positions,
            config,
            fxRates,
            period,
            periodLabel: label,
            adjustInflation: false,
            cumulativeInflationFactor: 1,
            inflationRate: 0.02,
            yearsElapsed: 0,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          results.push({ period, ok: false, error: err?.error || `HTTP ${res.status}` });
          continue;
        }

        const { reportMarkdown } = await res.json();

        // Enregistrement dans l'historique Firestore (visible dans l'onglet Rapports)
        const reportId = `${period}-${today.toISOString().slice(0, 10)}`;
        await db
          .collection('users')
          .doc(ownerUid)
          .collection('reports')
          .doc(reportId)
          .set({
            id: reportId,
            period,
            title: label,
            dateStr: label,
            timestamp: Date.now(),
            content: reportMarkdown,
            generatedBy: 'cron',
          });

        // Email récapitulatif
        const periodEmoji = { weekly: '🗓️', monthly: '📅', quarterly: '📊', quadrimestrial: '📈', semestrial: '🌓', annual: '🏆' }[period];
        await sendPeriodicReportEmail({
          toEmail: ownerEmail,
          subject: `${periodEmoji} RIANE Portfolio — Revue ${label} disponible`,
          reportMarkdown,
          dashboardUrl: `${baseUrl}/?view=reports`,
        });

        results.push({ period, ok: true });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        results.push({ period, ok: false, error: message });
      }
    }

    return NextResponse.json({ date: today.toISOString(), due: due.map((d) => d.period), results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    console.error('[cron/periodic-review] error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

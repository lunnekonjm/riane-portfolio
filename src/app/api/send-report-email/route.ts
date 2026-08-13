import { NextRequest, NextResponse } from 'next/server';
import { sendPeriodicReportEmail } from '@/services/email/resend';

export async function POST(request: NextRequest) {
  let targetEmail = process.env.OWNER_EMAIL;
  let reportMarkdown = '';
  let periodLabel = 'Rapport IA';

  try {
    const body = await request.json().catch(() => ({}));
    if (body?.email) {
      targetEmail = body.email;
    }
    if (body?.reportMarkdown) {
      reportMarkdown = body.reportMarkdown;
    }
    if (body?.periodLabel) {
      periodLabel = body.periodLabel;
    }
  } catch {}

  if (!targetEmail) {
    return NextResponse.json(
      { error: 'Aucune adresse email spécifiée pour l\'envoi.' },
      { status: 400 }
    );
  }

  if (!reportMarkdown) {
    return NextResponse.json(
      { error: 'Aucun contenu de rapport à envoyer.' },
      { status: 400 }
    );
  }

  const baseUrl =
    process.env.APP_BASE_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://riane-portfolio-one.vercel.app'
      : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'));

  // Deep-link to open directly in the reports tab
  const deepLinkUrl = `${baseUrl}/?view=reports`;

  try {
    const res = await sendPeriodicReportEmail({
      toEmail: targetEmail,
      subject: `📰 RIANE Portfolio — Audit ${periodLabel}`,
      reportMarkdown,
      dashboardUrl: deepLinkUrl,
    });

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Rapport envoyé avec succès à ${targetEmail}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

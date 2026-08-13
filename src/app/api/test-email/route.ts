import { NextRequest, NextResponse } from 'next/server';
import { sendPeriodicReportEmail } from '@/services/email/resend';

export async function POST(request: NextRequest) {
  let targetEmail = process.env.OWNER_EMAIL;

  try {
    const body = await request.json().catch(() => ({}));
    if (body?.email) {
      targetEmail = body.email;
    }
  } catch {}

  if (!targetEmail) {
    return NextResponse.json(
      { error: 'Aucune adresse email trouvée. Veuillez vous connecter ou renseigner OWNER_EMAIL.' },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return NextResponse.json(
      {
        error:
          'Clés Resend non configurées : RESEND_API_KEY et RESEND_FROM_EMAIL doivent être ajoutées dans vos variables d\'environnement Vercel (ou .env.local).',
      },
      { status: 500 }
    );
  }

  const baseUrl =
    process.env.APP_BASE_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://riane-portfolio-one.vercel.app'
      : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'));

  const markdownContent = `
# 🧪 Audit de Test IA

Ceci est un test automatisé généré pour vérifier le bon fonctionnement du nouveau template HTML moderne de **RIANE Portfolio**.

> 💡 **Tout fonctionne correctement.** L'intégration avec Resend est opérationnelle.

### 📊 Aperçu des Marchés (Données Fictives)
| Indice / Actif | Variation Jour | Statut |
|---|---|---|
| **S&P 500** | +1.24% | ✅ Hausse |
| **CAC 40** | -0.42% | ⚠️ Repli |
| **Bitcoin** | +3.10% | 🚀 Fort |

---

> ℹ️ Ce message de test peut être supprimé en toute sécurité.
`;

  try {
    const res = await sendPeriodicReportEmail({
      toEmail: targetEmail,
      subject: '🧪 RIANE Portfolio — Email de test d\'intégration',
      reportMarkdown: markdownContent,
      dashboardUrl: baseUrl,
    });

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Email de test envoyé avec succès à ${targetEmail}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

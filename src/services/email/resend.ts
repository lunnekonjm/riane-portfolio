/**
 * Service Email — Resend
 * Envoie le rapport périodique généré par l'IA à l'utilisateur, en HTML moderne.
 * Nécessite RESEND_API_KEY, RESEND_FROM_EMAIL, OWNER_EMAIL.
 */

import { Resend } from 'resend';

function markdownToModernHtml(markdown: string): string {
  // Parsing minimal pour générer un rendu HTML structuré et moderne (Dark Theme)
  let html = markdown
    // Remplacer les séparateurs
    .replace(/^---$/gim, '<hr style="border:none;border-top:1px solid #333;margin:24px 0;" />')
    // Les alertes / blocs citations
    .replace(/^> 💡 (.*$)/gim, '<div style="background-color:#1a2332;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:4px;color:#93c5fd;margin:16px 0;"><strong>💡 Stratégie :</strong> $1</div>')
    .replace(/^> 🎈 (.*$)/gim, '<div style="background-color:#2a1c15;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;color:#fcd34d;margin:16px 0;"><strong>🎈 Inflation :</strong> $1</div>')
    .replace(/^> ℹ️ (.*$)/gim, '<div style="background-color:#1e1e1e;border-left:4px solid #6b7280;padding:12px 16px;border-radius:4px;color:#d1d5db;margin:16px 0;">ℹ️ $1</div>')
    .replace(/^> 📊 (.*$)/gim, '<div style="background-color:#13201a;border-left:4px solid #10b981;padding:12px 16px;border-radius:4px;color:#6ee7b7;margin:16px 0;">📊 $1</div>')
    // Titres
    .replace(/^### (.*$)/gim, '<h3 style="color:#f3f4f6;font-size:18px;margin-top:24px;margin-bottom:12px;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="color:#ffffff;font-size:22px;border-bottom:1px solid #333;padding-bottom:8px;margin-top:32px;margin-bottom:16px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="color:#ffffff;font-size:26px;margin-bottom:8px;text-align:center;">$1</h1>')
    // Tableaux Markdown basiques vers HTML
    .replace(/(\|.*?\|)\n/g, (match) => {
      if (match.includes('---')) return ''; // ignore separator line
      const cells = match.split('|').filter(c => c.trim() !== '');
      if (match.includes('Actif') || match.includes('Indicateur')) {
        return `<tr>${cells.map(c => `<th style="padding:10px;text-align:left;background:#1a1a1a;border-bottom:2px solid #333;color:#9ca3af;font-size:13px;text-transform:uppercase;">${c.trim()}</th>`).join('')}</tr>`;
      }
      return `<tr>${cells.map(c => `<td style="padding:10px;border-bottom:1px solid #333;color:#e5e7eb;font-size:14px;">${c.trim()}</td>`).join('')}</tr>`;
    })
    // Enveloppement des TRs dans une Table (simple regex logic)
    .replace(/(<tr>[\s\S]*?<\/tr>)/gim, (match) => {
      // Pour éviter d'envelopper chaque TR dans sa propre table, on triche un peu.
      // Une implémentation regex complète est complexe, on laisse le client mail tolérer les TR adjacents ou on remplace globalement.
      return match;
    })
    // Styliser le gras et le code
    .replace(/\*\*(.*?)\*\*/gim, '<strong style="color:#ffffff;">$1</strong>')
    .replace(/`(.*?)`/gim, '<code style="background:#2d2d2d;color:#10b981;padding:2px 6px;border-radius:4px;font-size:12px;">$1</code>')
    // Listes
    .replace(/^- (.*$)/gim, '<li style="margin-bottom:8px;">$1</li>')
    .replace(/^(1\.|2\.|3\.|4\.) (.*$)/gim, '<li style="margin-bottom:12px;font-weight:bold;">$1 $2</li>')
    .replace(/\n\n/gim, '<br/>')
    // Clean up
    .replace(/(<br\/>)+/gim, '<br/>');

  // Envelopper les TRs contigus dans un tableau
  html = html.replace(/(<tr>[\s\S]*?<\/tr>)/g, '<table style="width:100%;border-collapse:collapse;margin:24px 0;background:#0d0d0d;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.3);">$1</table>');
  // Correction de la regex précédente pour bien grouper les tables
  const rows = html.match(/<tr>[\s\S]*?<\/tr>/g);
  if (rows) {
     // Simplification : on retire les balises <table> globales erronées pour reconstruire correctement
     html = html.replace(/<table.*?>|<\/table>/g, '');
     let inTable = false;
     let finalHtml = '';
     const lines = html.split(/<tr>/);
     finalHtml += lines[0];
     for (let i = 1; i < lines.length; i++) {
        if (!inTable) {
           finalHtml += '<table style="width:100%;border-collapse:collapse;margin:24px 0;background:#111;border-radius:8px;overflow:hidden;border:1px solid #333;"><tr>';
           inTable = true;
        } else {
           finalHtml += '<tr>';
        }
        
        const endIdx = lines[i].indexOf('</tr>');
        finalHtml += lines[i].substring(0, endIdx + 5);
        
        // S'il y a du texte après le </tr> qui n'est pas juste un saut de ligne
        const rest = lines[i].substring(endIdx + 5).trim();
        if (rest && !rest.startsWith('<br')) {
           finalHtml += '</table>' + lines[i].substring(endIdx + 5);
           inTable = false;
        } else {
           finalHtml += lines[i].substring(endIdx + 5);
        }
     }
     if (inTable) finalHtml += '</table>';
     html = finalHtml;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="background-color:#000000;margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#a3a3a3;line-height:1.6;">
  <div style="max-width:700px;margin:0 auto;background-color:#0a0a0a;border:1px solid #222;border-radius:12px;overflow:hidden;">
    
    <!-- HEADER -->
    <div style="background:linear-gradient(to right, #111827, #064e3b);padding:32px 24px;text-align:center;border-bottom:1px solid #222;">
      <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:-0.5px;">RIANE Portfolio</h1>
      <p style="color:#10b981;margin:8px 0 0 0;font-size:14px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Rapport d'Audit IA</p>
    </div>

    <!-- CONTENT -->
    <div style="padding:32px 24px;background-color:#0a0a0a;">
      ${html}
    </div>

  </div>
</body>
</html>
  `;
}

export async function sendPeriodicReportEmail(params: {
  toEmail: string;
  subject: string;
  reportMarkdown: string;
  dashboardUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return { success: false, error: 'RESEND_API_KEY ou RESEND_FROM_EMAIL manquant côté serveur.' };
  }

  try {
    const resend = new Resend(apiKey);
    let html = markdownToModernHtml(params.reportMarkdown);
    
    if (params.dashboardUrl) {
      const cta = `
      <!-- FOOTER & CTA -->
      <div style="padding:24px;text-align:center;background-color:#111;border-top:1px solid #222;">
        <a href="${params.dashboardUrl}" style="display:inline-block;background-color:#ffffff;color:#000000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;margin-bottom:16px;">
          Ouvrir le Tableau de Bord
        </a>
        <p style="margin:0;font-size:12px;color:#666;">
          Ce rapport est généré de manière sécurisée par l'IA de votre instance RIANE. 
          Ne partagez pas ces informations financières.
        </p>
      </div>
      `;
      // Insert before closing body
      html = html.replace('</body>', `${cta}</body>`);
    }

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: params.toEmail,
      subject: params.subject,
      html: html,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return { success: false, error: message };
  }
}

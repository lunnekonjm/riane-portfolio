/**
 * Service Email — Resend
 * Envoie le rapport périodique généré par l'IA à l'utilisateur, en HTML moderne.
 * Nécessite RESEND_API_KEY, RESEND_FROM_EMAIL, OWNER_EMAIL.
 */

import { Resend } from 'resend';
import { marked, Renderer } from 'marked';

function markdownToModernHtml(markdown: string): string {
  const renderer = new Renderer();

  // Headings
  renderer.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    if (depth === 1) {
      return `<h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:28px 0 14px 0;padding-bottom:8px;border-bottom:1px solid #334155;letter-spacing:-0.3px;">${text}</h1>`;
    }
    if (depth === 2) {
      return `<h2 style="color:#38bdf8;font-size:18px;font-weight:700;margin:24px 0 10px 0;letter-spacing:-0.2px;">${text}</h2>`;
    }
    if (depth === 3) {
      return `<h3 style="color:#a78bfa;font-size:15px;font-weight:700;margin:18px 0 8px 0;">${text}</h3>`;
    }
    return `<h4 style="color:#f1f5f9;font-size:14px;font-weight:700;margin:14px 0 6px 0;">${text}</h4>`;
  };

  // Paragraph
  renderer.paragraph = function ({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<p style="color:#cbd5e1;font-size:14px;line-height:1.65;margin:10px 0;">${text}</p>`;
  };

  // Blockquote / Strategy alerts
  renderer.blockquote = function ({ tokens }) {
    const text = this.parser.parse(tokens);
    let borderColor = '#06b6d4';
    let bg = '#0f172a';
    if (text.includes('💡')) {
      borderColor = '#38bdf8';
      bg = '#0c2135';
    } else if (text.includes('🎈') || text.includes('Inflation')) {
      borderColor = '#f59e0b';
      bg = '#2a1a08';
    } else if (text.includes('🚨') || text.includes('Alerte')) {
      borderColor = '#f43f5e';
      bg = '#2a0c14';
    } else if (text.includes('📊') || text.includes('Bilan')) {
      borderColor = '#10b981';
      bg = '#06281e';
    }
    return `<div style="background:${bg};border-left:4px solid ${borderColor};padding:12px 16px;border-radius:6px;margin:16px 0;color:#e2e8f0;font-size:13px;line-height:1.6;">${text}</div>`;
  };

  // Links
  renderer.link = function ({ href, text }) {
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color:#38bdf8;text-decoration:none;font-weight:600;word-break:break-word;">${text}</a>`;
  };

  // Lists
  renderer.list = function ({ ordered, items }) {
    let body = '';
    for (const item of items) {
      body += this.listitem(item);
    }
    const tag = ordered ? 'ol' : 'ul';
    return `<${tag} style="margin:12px 0;padding-left:22px;color:#cbd5e1;">${body}</${tag}>`;
  };

  renderer.listitem = function ({ tokens }) {
    const text = this.parser.parse(tokens);
    return `<li style="margin-bottom:8px;font-size:14px;line-height:1.6;color:#cbd5e1;">${text}</li>`;
  };

  // Tables
  renderer.table = function ({ header, rows }) {
    let headerHtml = '';
    if (header && header.length > 0) {
      headerHtml = `<thead><tr>`;
      for (const cell of header) {
        headerHtml += `<th style="background:#1e293b;color:#94a3b8;padding:10px 12px;font-size:12px;font-weight:700;text-align:left;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #334155;word-break:break-word;">${this.parser.parseInline(cell.tokens)}</th>`;
      }
      headerHtml += `</tr></thead>`;
    }

    let bodyHtml = '<tbody>';
    for (const row of rows) {
      bodyHtml += `<tr>`;
      for (const cell of row) {
        bodyHtml += `<td style="padding:10px 12px;border-bottom:1px solid #1e293b;color:#e2e8f0;font-size:13px;line-height:1.5;vertical-align:top;word-break:break-word;">${this.parser.parseInline(cell.tokens)}</td>`;
      }
      bodyHtml += `</tr>`;
    }
    bodyHtml += '</tbody>';

    return `<div style="overflow-x:auto;margin:18px 0;"><table style="width:100%;border-collapse:collapse;background:#0f172a;border:1px solid #334155;border-radius:8px;overflow:hidden;table-layout:auto;">${headerHtml}${bodyHtml}</table></div>`;
  };

  // Strong & Emphasis
  renderer.strong = function ({ tokens }) {
    return `<strong style="color:#ffffff;font-weight:700;">${this.parser.parseInline(tokens)}</strong>`;
  };

  renderer.em = function ({ tokens }) {
    return `<em style="color:#94a3b8;font-style:italic;">${this.parser.parseInline(tokens)}</em>`;
  };

  // Code
  renderer.codespan = function ({ text }) {
    return `<code style="background:#1e293b;color:#34d399;padding:2px 6px;border-radius:4px;font-size:12px;font-family:Consolas,Monaco,monospace;">${text}</code>`;
  };

  renderer.hr = function () {
    return `<hr style="border:none;border-top:1px solid #334155;margin:24px 0;" />`;
  };

  const parsedContent = marked.parse(markdown, { renderer, gfm: true, breaks: true }) as string;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RIANE Portfolio</title>
</head>
<body style="background-color:#030712;margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#cbd5e1;line-height:1.6;-webkit-font-smoothing:antialiased;">
  <div style="max-width:720px;margin:0 auto;background-color:#0b0f19;border:1px solid #1f2937;border-radius:14px;overflow:hidden;box-shadow:0 12px 36px rgba(0,0,0,0.6);">
    
    <!-- HEADER -->
    <div style="background:linear-gradient(135deg, #0f172a 0%, #064e3b 100%);padding:28px 24px;text-align:center;border-bottom:1px solid #1f2937;">
      <div style="display:inline-block;width:40px;height:40px;line-height:40px;background:linear-gradient(135deg, #06b6d4, #10b981);border-radius:10px;color:#ffffff;font-size:22px;font-weight:800;margin-bottom:10px;">R</div>
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">RIANE Portfolio</h1>
      <p style="color:#34d399;margin:6px 0 0 0;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Audit &amp; Intelligence Financière Multi-Agents</p>
    </div>

    <!-- CONTENT -->
    <div style="padding:28px 24px;background-color:#0b0f19;">
      ${parsedContent}
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
      <div style="padding:28px 24px;text-align:center;background-color:#080c14;border-top:1px solid #1f2937;">
        <a href="${params.dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg, #06b6d4, #10b981);color:#000000;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:800;font-size:15px;margin-bottom:16px;box-shadow:0 4px 14px rgba(6, 182, 212, 0.4);">
          📊 Ouvrir l&apos;Audit dans l&apos;Application RIANE
        </a>
        <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">
          Ce rapport est généré de manière sécurisée par l&apos;IA de votre instance RIANE.<br/>
          Ne partagez pas ces informations financières confidentielles.
        </p>
      </div>
      `;
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

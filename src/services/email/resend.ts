/**
 * Service Email — Resend
 * Envoie le rapport périodique généré par l'IA à l'utilisateur, en HTML simple.
 * Nécessite RESEND_API_KEY, RESEND_FROM_EMAIL, OWNER_EMAIL.
 */

import { Resend } from 'resend';

function markdownToSimpleHtml(markdown: string): string {
  // Conversion volontairement minimale (pas de dépendance markdown lourde côté email) :
  // titres, gras, listes à puce, tableaux markdown -> HTML basique et lisible dans tout client mail.
  let html = markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/\n{2,}/gim, '</p><p>')
    .replace(/\n/gim, '<br/>');

  html = html.replace(/(<li>[\s\S]*?<\/li>)/gim, (match) => `<ul>${match}</ul>`);

  return `<div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 720px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">
    <p>${html}</p>
  </div>`;
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
    const html = markdownToSimpleHtml(params.reportMarkdown);
    const footer = params.dashboardUrl
      ? `<p style="margin-top:24px;padding-top:16px;border-top:1px solid #e1e0d9;font-size:13px;color:#666;">
           Rapport généré automatiquement par RIANE Portfolio.
           <a href="${params.dashboardUrl}">Ouvrir le tableau de bord</a>
         </p>`
      : '';

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: params.toEmail,
      subject: params.subject,
      html: html + footer,
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

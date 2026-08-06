/**
 * Gemini Smart Quota Rotator — RIANE Portfolio
 * Gère intelligemment la rotation des modèles en fonction des quotas (RPM / RPD) :
 * 1. Modèles Haute Capacité (15 RPM / 500 RPD) : gemini-3.5-flash-lite, gemini-3.1-flash-lite
 * 2. Modèles Standard (5 RPM / 20 RPD) : gemini-3.5-flash, gemini-3.6-flash, gemini-2.5-flash
 * 3. Modèles Backup Haute Fréquence (30 RPM / 14.4K RPD) : gemma-4-31b-it, gemma-4-26b-a4b-it
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { NewsItem } from '../market-data/types';

export interface GroundedNewsSummary {
  ticker: string;
  cleanName: string;
  summaryText: string;
  isGrounded: boolean;
  usedModel?: string;
}

// Ordre d'utilisation optimisé pour préserver les quotas stricts (20 RPD)
const MODEL_ROTATION_TIERS = [
  // TIER 1: Modèles Lite Haute Capacité (15 RPM / 500 RPD) — Priorité absolue
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',

  // TIER 2: Modèles Standard (5 RPM / 20 RPD) — Utilisés en rotation mesurée
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-2.5-flash',

  // TIER 3: Modèles Ouverts Haute Fréquence (30 RPM / 14.4K RPD) — Backup ultime
  'gemma-4-31b-it',
  'gemma-4-26b-a4b-it',
];

// Registre de temporisation pour éviter l'éclatement de requêtes (burst)
let lastRequestTime = 0;

async function enforcePacingDelay(minDelayMs: number = 300): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < minDelayMs) {
    await new Promise((resolve) => setTimeout(resolve, minDelayMs - elapsed));
  }
  lastRequestTime = Date.now();
}

export async function generateGroundedNewsSummary(
  ticker: string,
  cleanName: string,
  valEUR: number,
  weight: number,
  pnlEUR: number,
  pnlPct: number,
  articles: NewsItem[]
): Promise<GroundedNewsSummary | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const articlesContext = articles.length > 0
      ? articles.map((a) => `- ${a.source} (${a.publishedAt}) : ${a.title}`).join('\n')
      : 'Aucun article spécifique récent. Analyse basée sur la santé financière globale.';

    const prompt = `Tu es un Analyste Financier Institutionnel et Gérant de Portefeuille Senior.
Rédige une analyse financière approfondie pour la société "${cleanName}" (${ticker}).

Données de la position dans le portefeuille RIANE :
- Valorisation actuelle : ${Math.round(valEUR)} € (${weight.toFixed(1)}% du portefeuille)
- Performance Latente : ${pnlEUR >= 0 ? '+' : ''}${Math.round(pnlEUR)} € (${pnlPct.toFixed(1)}%)

Articles de presse réels recueillis en direct :
${articlesContext}

Consignes de rédaction strictes :
1. Rédige un paragraphe de synthèse financière d'expert de 3 à 4 phrases fluides et cohérentes analysant l'impact des actualités récentes, du secteur et des catalyseurs de marché sur le cours et les fondamentaux.
2. Ne fais AUCUNE liste à puces de titres d'articles (car les articles sont déjà détaillés dans un tableau dédié juste en dessous).
3. Termine par une phrase de conclusion sous la forme :
*Synthèse de la Gestion* : [Ta recommandation claire de gestion ou d'arbitrage].
4. Ne mets AUCUNE balise HTML (<a href...>) ni aucune URL brute dans le texte. Rédige avec rigueur en français.`;

    // Essayer les modèles dans l'ordre du Rotateur Intelligents
    for (const modelName of MODEL_ROTATION_TIERS) {
      try {
        await enforcePacingDelay(350); // Espace de 350ms entre requêtes pour éviter le dépassement de RPM

        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        if (text && text.trim().length > 40) {
          const cleanedText = text
            .replace(/<[^>]*>/g, '')
            .replace(/https?:\/\/\S+/gi, '')
            .replace(/Revue de la Presse.*?:/gi, '')
            .trim();

          return {
            ticker,
            cleanName,
            summaryText: cleanedText,
            isGrounded: true,
            usedModel: modelName,
          };
        }
      } catch (err: any) {
        // En cas d'erreur de quota (429 Exceeded), la boucle passe instantanément au modèle suivant dans les tiers
        console.warn(`[QuotaRotator] Modèle ${modelName} indisponible/saturé (${err?.status || '429'}). Bascule automatique...`);
      }
    }
  } catch (err: any) {
    console.warn('[QuotaRotator] Initialisation échouée:', err?.message || err);
  }

  return null;
}

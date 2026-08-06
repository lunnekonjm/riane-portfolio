/**
 * Gemini Smart Quota Rotator — RIANE Portfolio
 * Gère intelligemment la rotation des modèles selon les quotas Google AI Studio (RPM / RPD) :
 * 1. Modèles Lite Haute Capacité (15 RPM / 500 RPD) : gemini-3.5-flash-lite, gemini-3.1-flash-lite, gemini-2.5-flash-lite
 * 2. Modèles Standard (5 RPM / 20 RPD) : gemini-3.5-flash, gemini-3.6-flash, gemini-2.5-flash
 * 3. Modèles Gemma 4 Réserve Ultime (30 RPM / 14.4K RPD) : gemma-4-31b-it, gemma-4-26b-a4b-it
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

const MODEL_ROTATION_TIERS = [
  // TIER 1: Modèles Lite Haute Capacité (15 RPM / 500 RPD) — Performance & Rapidité
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',

  // TIER 2: Modèles Standard Flash (5 RPM / 20 RPD) — Qualité Supérieure
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-2.5-flash',

  // TIER 3: Modèles Gemma 4 Réserve Ultime (30 RPM / 14 400 RPD) — Inépuisable
  'gemma-4-31b-it',
  'gemma-4-26b-a4b-it'
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
2. Ne fais AUCUNE liste à puces de titres d'articles.
3. Termine par une phrase de conclusion sous la forme :
*Synthèse de la Gestion* : [Ta recommandation claire de gestion ou d'arbitrage].
4. Ne mets AUCUNE balise HTML ni aucune URL brute. Rédige avec rigueur en français.`;

    for (const modelName of MODEL_ROTATION_TIERS) {
      try {
        await enforcePacingDelay(300);

        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        if (text && text.trim().length > 40) {
          const cleanedText = text
            .replace(/<[^>]*>/g, '')
            .replace(/https?:\/\/\S+/gi, '')
            .trim();

          return {
            ticker,
            cleanName,
            summaryText: cleanedText,
            isGrounded: articles.length > 0,
            usedModel: modelName,
          };
        }
      } catch (err) {
        console.warn(`[RIANE AI Rotator] Le modèle ${modelName} a échoué, passage au suivant.`, err);
      }
    }
  } catch (globalErr) {
    console.error('[RIANE AI Rotator] Échec global de la génération de la synthèse', globalErr);
  }

  return null;
}

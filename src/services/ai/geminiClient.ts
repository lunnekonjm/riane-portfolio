/**
 * Gemini AI Client — RIANE Portfolio
 * Génère une analyse financière approfondie et une synthèse de gestion pour chaque position.
 * Élimine toute liste à puces redondante avec le tableau des sources.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { NewsItem } from '../market-data/types';

export interface GroundedNewsSummary {
  ticker: string;
  cleanName: string;
  summaryText: string;
  isGrounded: boolean;
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
    
    // Modèles avec quotas actifs (gemini-3.6-flash, gemini-3.5-flash)
    const activeModels = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-pro', 'gemini-flash-latest'];
    
    const articlesContext = articles.length > 0
      ? articles.map((a) => `- ${a.source} (${a.publishedAt}) : ${a.title}`).join('\n')
      : 'Aucun article spécifique récent. Analyse basée sur la santé financière globale.';

    for (const modelName of activeModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
        });

        const prompt = `Tu es un Analyste Financier Institutionnel et Gérant de Portefeuille Senior.
Rédige une analyse financière approfondie pour la société "${cleanName}" (${ticker}).

Données de la position dans le portefeuille RIANE :
- Valorisation actuelle : ${Math.round(valEUR)} € (${weight.toFixed(1)}% du portefeuille)
- Performance Latente : ${pnlEUR >= 0 ? '+' : ''}${Math.round(pnlEUR)} € (${pnlPct.toFixed(1)}%)

Articles de presse réels recueillis en direct :
${articlesContext}

Consignes de rédaction strictes :
1. Rédige un paragraphe de synthèse financière d'expert de 4 à 5 phrases fluides et cohérentes analysant l'impact des actualités récentes, du secteur et des catalyseurs de marché sur le cours et les fondamentaux.
2. Ne fais AUCUNE liste à puces de titres d'articles (car les articles sont déjà détaillés dans un tableau dédié juste en dessous).
3. Termine par une phrase de conclusion sous la forme :
*Synthèse de la Gestion* : [Ta recommandation claire de gestion ou d'arbitrage].
4. Ne mets AUCUNE balise HTML (<a href...>) ni aucune URL brute dans le texte. Rédige avec rigueur en français.`;

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
          };
        }
      } catch (err: any) {
        console.warn(`[GeminiClient] Generation failed for model ${modelName}:`, err?.message || err);
      }
    }
  } catch (err: any) {
    console.warn('[GeminiClient] Initialization failed:', err?.message || err);
  }

  return null;
}

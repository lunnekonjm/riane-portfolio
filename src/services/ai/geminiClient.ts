/**
 * Gemini AI Client — RIANE Portfolio
 * Utilise les modèles actifs gemini-3.6-flash et gemini-3.5-flash avec la clé utilisateur
 * pour générer une VRAIE synthèse d'analyse financière et de gestion institutionnelle.
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

        const prompt = `Tu es un Analyste Financier Institutionnel et Gérant de Portefeuille Senior (BlackRock / Amundi).
Rédige une analyse financière approfondie et une synthèse de gestion pour la société "${cleanName}" (${ticker}).

Données de la position dans le portefeuille RIANE :
- Valorisation actuelle : ${Math.round(valEUR)} € (${weight.toFixed(1)}% du portefeuille)
- Performance Latente : ${pnlEUR >= 0 ? '+' : ''}${Math.round(pnlEUR)} € (${pnlPct.toFixed(1)}%)

Articles de presse réels recueillis en direct sur la société :
${articlesContext}

Consignes strictes :
1. Rédige un paragraphe de synthèse financière d'expert de 3 à 4 phrases résumant la situation opérationnelle, la tendance du secteur et le sentiment de marché.
2. Si des articles sont présents, récapitule les faits sous la forme :
• **[Média]** ([Date]) : « **[Titre]** »
3. Termine obligatoirement par une phrase de conclusion sous la forme :
*Synthèse de la Gestion* : [Ta recommandation claire d'arbitrage ou de conservation].
4. Ne mets AUCUNE balise HTML (<a href...>) ni aucune URL brute. Rédige avec rigueur en français.`;

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

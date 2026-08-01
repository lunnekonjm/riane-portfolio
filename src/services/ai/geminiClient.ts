/**
 * Gemini AI Client with Google Search Grounding — RIANE Portfolio
 * Génère une synthèse d'actualité et d'analyse financière ancrée en direct sur Google Search
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

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
  pnlPct: number
): Promise<GroundedNewsSummary | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test native models with Google Search grounding tool
    const modelNames = ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];
    
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          tools: [{ googleSearch: {} }] as any,
        });

        const prompt = `Tu es un Analyste Financier Institutionnel et Gérant de Portefeuille.
Fais une analyse récente et vérifiée sur la société "${cleanName}" (${ticker}).

Données de la position actuelle :
- Valorisation : ${Math.round(valEUR)} € (${weight.toFixed(1)}% du portefeuille)
- Performance Latente : ${pnlEUR >= 0 ? '+' : ''}${Math.round(pnlEUR)} € (${pnlPct.toFixed(1)}%)

Consignes strictes :
1. Recherche sur Google en direct les actualités récentes, résultats financiers, contrats ou recommandations d'analystes sur ${cleanName}.
2. Rédige 3 à 4 puces concises sous le format :
• **[Nom de la Source ou Journal]** : « **[Titre ou Fait Marquant]** » — *[Explication synthétique]*
3. Termine par une phrase de conclusion sous le format :
*Synthèse de la Gestion* : [Ta conclusion sur l'impact opérationnel et boursier].
4. Ne mets AUCUNE balise HTML (<a href...>) ni URL brute dans le texte. Résume le fond avec rigueur en français.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        if (text && text.trim().length > 40) {
          // Clean any stray raw URL or HTML artifacts
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
        console.warn(`[GeminiClient] Grounding attempt failed for ${modelName}:`, err?.message || err);
      }
    }
  } catch (err: any) {
    console.warn('[GeminiClient] Initialization failed:', err?.message || err);
  }

  return null;
}

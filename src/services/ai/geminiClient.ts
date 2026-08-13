/**
 * Gemini Smart Quota Rotator & Institutional Financial Engine — RIANE Portfolio
 * Gère intelligemment la rotation des modèles avec support de Gemini 3.7 Flash :
 * 1. TIER 1 (Flagship & High Speed Reasoning) : gemini-3.7-flash, gemini-3.7-flash-thinking
 * 2. TIER 2 (High Capacity Lite Quota - 15 RPM / 500 RPD) : gemini-3.5-flash-lite, gemini-3.1-flash-lite, gemini-2.5-flash-lite
 * 3. TIER 3 (Standard Balanced) : gemini-3.6-flash, gemini-3.5-flash, gemini-2.5-flash
 * 4. TIER 4 (Open Backup - 30 RPM / 14.4K RPD) : gemma-4-31b-it, gemma-4-26b-a4b-it
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { NewsItem } from '../market-data/types';

export interface GroundedNewsSummary {
  ticker: string;
  cleanName: string;
  summaryText: string;
  sentiment?: 'FAVORABLE' | 'NEUTRE' | 'VIGILANCE' | 'DEFENSE';
  radarCategory?: 'PILIER_CONVICTION' | 'SOUS_SURVEILLANCE' | 'SIGNAL_ARBITRAGE';
  catalysts?: string[];
  recommendation?: string;
  isGrounded: boolean;
  usedModel?: string;
}

// Ordre d'utilisation optimisé avec Gemini 3.7 Flash en tête
const MODEL_ROTATION_TIERS = [
  // TIER 1 : Modèles de pointe ultra-rapides & raisonnement
  'gemini-3.7-flash',
  'gemini-3.7-flash-thinking',

  // TIER 2 : Modèles Lite Haute Capacité (15 RPM / 500 RPD)
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',

  // TIER 3 : Modèles Standard de secours
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash',

  // TIER 4 : Modèles Ouverts Haute Fréquence (Backup ultime)
  'gemma-4-31b-it',
  'gemma-4-26b-a4b-it',
];

// Temporisation pour éviter tout dépassement de quota (pacing)
let lastRequestTime = 0;

async function enforcePacingDelay(minDelayMs: number = 250): Promise<void> {
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
  articles: NewsItem[],
  periodLabel: string = 'Trimestre'
): Promise<GroundedNewsSummary | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const articlesContext =
      articles.length > 0
        ? articles
            .slice(0, 5)
            .map((a) => `- [${a.source} (${a.publishedAt})] : ${a.title}`)
            .join('\n')
        : 'Aucune dépêche récente spécifique. Analyse basée sur la santé financière globale et le positionnement sectoriel.';

    const prompt = `Tu es Directeur de la Gestion de Portefeuille et Analyste Senior dans un cabinet institutionnel de gestion privée.
Tu rédiges une note d'analyse financière ultra-percutante, dense et proactive pour le client sur la position "${cleanName}" (${ticker}) au sein de son portefeuille.

Données de la position (${periodLabel}) :
- Valorisation actuelle : ${Math.round(valEUR).toLocaleString('fr-FR')} € (${weight.toFixed(1)}% du portefeuille total)
- Performance Latente : ${pnlEUR >= 0 ? '+' : ''}${Math.round(pnlEUR).toLocaleString('fr-FR')} € (${pnlPct.toFixed(1)}%)

Dépêches et faits de presse réels recueillis :
${articlesContext}

CONSIGNES STRICTES DE RÉDACTION INSTITUTIONNELLE (ZÉRO TEXTE CREUX) :
1. Chaque phrase doit apporter une valeur financière immédiate au client (pas de généralités comme "cette position présente un profil sain...").
2. Adopte un ton direct, lucide et professionnel.
3. Structure impérativement ta réponse sous ce format Markdown précis :

**Climat & Sentiment** : [Choisis UNIQUEMENT l'un de ces trois : 🟢 Favorable | 🟡 Neutre & Attentiste | 🔴 Vigilance Accrue]
**Classification Stratégique** : [Choisis UNIQUEMENT l'un de ces trois : 🟢 Pilier de Conviction | 🟡 Ligne sous Surveillance | 🔴 Piste d'Arbitrage / Allègement]
**Faits Marquants & Catalyseurs (${periodLabel})** :
- [Point 1 : Catalyseur économique, résultat ou dynamique sectorielle récente]
- [Point 2 : Risque, concurrence, valorisation ou élément microéconomique à surveiller]
**Recommandation de Gestion** : [1 à 2 phrases directes précisant l'attitude exacte à adopter : continuer les achats DCA, maintenir la position sans renforcer, ou envisager un arbitrage].

Ne mets AUCUNE URL brute ni balise HTML. Rédige en français irréprochable.`;

    for (const modelName of MODEL_ROTATION_TIERS) {
      try {
        await enforcePacingDelay(250);

        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        if (text && text.trim().length > 30) {
          const cleanedText = text
            .replace(/<[^>]*>/g, '')
            .replace(/https?:\/\/\S+/gi, '')
            .trim();

          // Extract Sentiment badge
          let sentiment: GroundedNewsSummary['sentiment'] = 'NEUTRE';
          if (cleanedText.includes('🟢 Favorable') || cleanedText.includes('Favorable')) {
            sentiment = 'FAVORABLE';
          } else if (cleanedText.includes('🔴 Vigilance') || cleanedText.includes('Vigilance')) {
            sentiment = 'VIGILANCE';
          }

          // Extract Radar Category
          let radarCategory: GroundedNewsSummary['radarCategory'] = 'SOUS_SURVEILLANCE';
          if (cleanedText.includes('Pilier de Conviction') || cleanedText.includes('🟢 Pilier')) {
            radarCategory = 'PILIER_CONVICTION';
          } else if (cleanedText.includes("Piste d'Arbitrage") || cleanedText.includes('🔴 Piste')) {
            radarCategory = 'SIGNAL_ARBITRAGE';
          }

          return {
            ticker,
            cleanName,
            summaryText: cleanedText,
            sentiment,
            radarCategory,
            isGrounded: true,
            usedModel: modelName,
          };
        }
      } catch (tierErr) {
        console.warn(`[Gemini Rotator] Échec sur ${modelName} pour ${ticker}, passage au modèle suivant...`, tierErr);
      }
    }

    return null;
  } catch (error) {
    console.error('[Gemini Rotator Critical Error]:', error);
    return null;
  }
}

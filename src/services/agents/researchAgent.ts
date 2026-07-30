/**
 * Research Agent — Agent 2
 * Fondamentaux, produit, valorisation et actualités
 * Utilise Firebase AI Logic (Gemini) avec Google Search Grounding
 */

import { getFirebaseApp } from '@/services/firebase/config';
import { selectModel } from '@/services/ai-router/router/selectModel';
import { recordUsage } from '@/services/ai-router/router/recordUsage';
import type { AgentContext, AgentResult } from './types';
import type { ResearchResult } from '@/types/analysis';

let aiModule: typeof import('firebase/ai') | null = null;

async function getAIModule() {
  if (!aiModule) {
    aiModule = await import('firebase/ai');
  }
  return aiModule;
}

const SYSTEM_PROMPT_RESEARCH = `Tu es un analyste financier senior spécialisé dans l'analyse fondamentale.
Tu travailles pour RIANE, un investisseur dynamique français avec un portefeuille diversifié.

RÈGLES STRICTES :
- Tu NE prédis JAMAIS un cours précis.
- Tu NE recommandes JAMAIS un achat ou une vente directement.
- Tu analyses les fondamentaux, la valorisation, les catalyseurs et les risques.
- Tu utilises les données les plus récentes disponibles via Google Search.
- Tu compares TOUJOURS avec les positions existantes du portefeuille.
- Pour toute action tech européenne, compare automatiquement avec Riber, Memscap, Coherent, Indépendance Europe Small, MSCI ACWI et Nasdaq-100.

CONTEXTE PORTEFEUILLE :
- Profil dynamique, sans effet de levier
- Cœur indiciel mondial préservé (MSCI ACWI)
- Nasdaq satellite, non second cœur
- Actions individuelles plafonnées
- Rééquilibrage par les flux prioritairement

FORMAT DE RÉPONSE (JSON strict) :
{
  "ticker": "string",
  "fundamentals": {
    "summary": "résumé en 2-3 phrases",
    "strengths": ["force1", "force2"],
    "weaknesses": ["faiblesse1"],
    "catalysts": ["catalyseur1"],
    "risks": ["risque1"]
  },
  "valuation": {
    "assessment": "sous-évalué | correctement valorisé | surévalué | non applicable",
    "metrics": { "P/E": "valeur", "EV/EBITDA": "valeur" }
  },
  "recentNews": [
    {
      "title": "titre",
      "summary": "résumé",
      "source": "source",
      "date": "YYYY-MM-DD",
      "impact": "positive | negative | neutral"
    }
  ],
  "thesisStatement": "thèse d'investissement en 1-2 phrases"
}`;

export async function runResearchAgent(
  context: AgentContext,
  marketData: any
): Promise<AgentResult> {
  const { ticker, query, portfolioPositions } = context;

  const selection = await selectModel('research');

  if (!selection.modelId || selection.reason === 'no-grounding-available') {
    return {
      agent: 'research',
      success: false,
      data: null,
      isGrounded: false,
      error: 'Recherche IA non disponible — quota Google Search Grounding épuisé. Réessayez demain.',
      timestamp: Date.now(),
    };
  }

  try {
    const { getAI, getGenerativeModel, GoogleAIBackend } = await getAIModule();
    const app = getFirebaseApp();
    const ai = getAI(app, { backend: new GoogleAIBackend() });

    const model = getGenerativeModel(ai, {
      model: selection.modelId,
      tools: [{ googleSearch: {} } as any],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 4096,
      },
      systemInstruction: SYSTEM_PROMPT_RESEARCH,
    });

    const positionsSummary = portfolioPositions
      .map((p: any) => `${p.ticker} (${p.name}) — ${p.envelope}`)
      .join('\n');

    const prompt = `Analyse l'actif "${ticker}" dans le contexte de ce portefeuille :

Requête utilisateur : ${query}

Données marché disponibles :
${JSON.stringify(marketData, null, 2)}

Positions actuelles :
${positionsSummary}

Produis une analyse fondamentale complète avec actualités récentes.`;

    const response = await model.generateContent(prompt);
    await recordUsage(selection.modelId, 'groundingSearch', 'success');

    const candidate = response.response.candidates?.[0];
    const groundingMetadata = (candidate as any)?.groundingMetadata;
    const searchEntryPoint = groundingMetadata?.searchEntryPoint?.renderedContent;
    const groundingChunks = groundingMetadata?.groundingChunks ?? [];

    const rawText = response.response.text();
    let parsed: any;

    try {
      parsed = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Impossible de parser la réponse Gemini');
      }
    }

    const researchResult: ResearchResult = {
      ticker: ticker || parsed.ticker,
      fundamentals: parsed.fundamentals || { summary: '', strengths: [], weaknesses: [], catalysts: [], risks: [] },
      valuation: parsed.valuation || { assessment: '', metrics: {} },
      recentNews: parsed.recentNews || [],
      thesisStatement: parsed.thesisStatement || '',
      searchEntryPointHtml: searchEntryPoint,
      isGrounded: groundingChunks.length > 0,
      modelUsed: selection.modelId,
    };

    return {
      agent: 'research',
      success: true,
      data: researchResult,
      modelUsed: selection.modelId,
      isGrounded: groundingChunks.length > 0,
      searchEntryPointHtml: searchEntryPoint,
      timestamp: Date.now(),
    };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      await recordUsage(selection.modelId, 'groundingSearch', 'quota-error');
    }
    return {
      agent: 'research',
      success: false,
      data: null,
      error: `Erreur recherche IA : ${errMsg}`,
      timestamp: Date.now(),
    };
  }
}

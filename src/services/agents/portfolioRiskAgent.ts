/**
 * Portfolio & Risk Agent — Agent 3
 * Portefeuille, stress, liquidité, allocation et utilité marginale
 */

import { getFirebaseApp } from '@/services/firebase/config';
import { selectModel } from '@/services/ai-router/router/selectModel';
import { recordUsage } from '@/services/ai-router/router/recordUsage';
import type { AgentContext, AgentResult } from './types';
import { THEMES } from '@/data/themes';

let aiModule: typeof import('firebase/ai') | null = null;

async function getAIModule() {
  if (!aiModule) {
    aiModule = await import('firebase/ai');
  }
  return aiModule;
}

const SYSTEM_PROMPT_PORTFOLIO = `Tu es un gestionnaire de risque pour le portefeuille de RIANE.

MISSION :
1. Mesurer l'utilité marginale d'un actif candidat dans le portefeuille existant
2. Identifier les chevauchements thématiques
3. Vérifier l'enveloppe éligible (PEA, PEA-PME, CTO)
4. Comparer avec les positions existantes
5. Proposer 3 scénarios (optimiste, neutre, pessimiste) avec probabilités
6. Recommander une action parmi : surveiller, attendre, initier, remplacer, renforcer, réduire, éviter
7. Indiquer le poids proposé, la source de financement, les conditions et le niveau de confiance

RÈGLES :
- Profil dynamique, sans effet de levier
- Actions individuelles plafonnées
- Rééquilibrage par les flux en priorité
- Pas d'achat sur simple variation de cours
- Toute nouvelle ligne doit démontrer son utilité marginale

THÈMES TRANSVERSAUX À VÉRIFIER :
${THEMES.map((t) => `- ${t.label} (max ${(t.maxExposure * 100).toFixed(0)}%): ${t.tickers.join(', ')}`).join('\n')}

FORMAT JSON STRICT :
{
  "marginalUtility": { "score": 0.0-1.0, "explanation": "string" },
  "overlaps": [{ "existingPosition": "string", "overlapType": "string", "degree": 0.0-1.0 }],
  "envelopeCheck": { "eligible": true/false, "envelope": "PEA|PEA-PME|CTO", "constraints": ["string"] },
  "comparisonWithExisting": [{ "position": "string", "comparison": "string", "preference": "candidate|existing|neutral" }],
  "scenarios": [
    { "name": "Optimiste", "description": "string", "probability": "string", "impact": "string", "portfolioEffect": 0.05 },
    { "name": "Neutre", "description": "string", "probability": "string", "impact": "string", "portfolioEffect": 0.0 },
    { "name": "Pessimiste", "description": "string", "probability": "string", "impact": "string", "portfolioEffect": -0.05 }
  ],
  "proposedAction": "monitor|wait|initiate|replace|reinforce|reduce|avoid",
  "proposedWeight": 0.0-1.0,
  "fundingSource": "string",
  "conditions": ["string"],
  "confidence": "low|medium|high|very-high"
}`;

export async function runPortfolioRiskAgent(
  context: AgentContext,
  marketData: any,
  researchData: any
): Promise<AgentResult> {
  const { ticker, query, portfolioPositions, portfolioConfig } = context;

  const selection = await selectModel('portfolio-analysis');

  if (!selection.modelId) {
    return {
      agent: 'portfolio-risk',
      success: false,
      data: null,
      error: 'Aucun modèle IA disponible pour l\'analyse portefeuille.',
      timestamp: Date.now(),
    };
  }

  try {
    const { getAI, getGenerativeModel, GoogleAIBackend } = await getAIModule();
    const app = getFirebaseApp();
    const ai = getAI(app, { backend: new GoogleAIBackend() });

    const model = getGenerativeModel(ai, {
      model: selection.modelId,
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 4096,
      },
      systemInstruction: SYSTEM_PROMPT_PORTFOLIO,
    });

    const prompt = `Évalue l'utilité marginale de "${ticker}" dans ce portefeuille.

Requête : ${query}

Données marché :
${JSON.stringify(marketData, null, 2)}

Recherche fondamentale :
${JSON.stringify(researchData, null, 2)}

Positions actuelles :
${JSON.stringify(portfolioPositions, null, 2)}

Configuration portefeuille :
${JSON.stringify(portfolioConfig, null, 2)}

Produis l'évaluation complète avec 3 scénarios et une recommandation.`;

    const response = await model.generateContent(prompt);
    await recordUsage(selection.modelId, 'generation', 'success');

    const rawText = response.response.text();
    let parsed: any;

    try {
      parsed = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Impossible de parser la réponse portefeuille');
      }
    }

    return {
      agent: 'portfolio-risk',
      success: true,
      data: parsed,
      modelUsed: selection.modelId,
      timestamp: Date.now(),
    };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      await recordUsage(selection.modelId!, 'generation', 'quota-error');
    }
    return {
      agent: 'portfolio-risk',
      success: false,
      data: null,
      error: `Erreur analyse portefeuille : ${errMsg}`,
      timestamp: Date.now(),
    };
  }
}

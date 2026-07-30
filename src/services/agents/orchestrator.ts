/**
 * Reporting Orchestrator — Agent 5
 * Pipeline d'analyse : Data → Research → Portfolio & Risk → Critic → Synthèse
 * Interaction utilisateur, journal d'audit, mémoire
 */

import { getFirebaseApp } from '@/services/firebase/config';
import { selectModel } from '@/services/ai-router/router/selectModel';
import { recordUsage } from '@/services/ai-router/router/recordUsage';
import { runDataAgent } from './dataAgent';
import { runResearchAgent } from './researchAgent';
import { runPortfolioRiskAgent } from './portfolioRiskAgent';
import { runCriticAgent } from './criticAgent';
import { addAuditEntry, saveAnalysis } from '@/services/firebase/firestore';
import type { AgentContext, AgentResult } from './types';
import type { AnalysisResult, AnalysisRequest, AnalysisStatus } from '@/types/analysis';

let aiModule: typeof import('firebase/ai') | null = null;

async function getAIModule() {
  if (!aiModule) {
    aiModule = await import('firebase/ai');
  }
  return aiModule;
}

export type StatusCallback = (status: AnalysisStatus, message: string) => void;

/**
 * Extract ticker from user query using Gemini
 */
async function extractTicker(query: string): Promise<string | null> {
  const selection = await selectModel('synthesis');
  if (!selection.modelId) return null;

  try {
    const { getAI, getGenerativeModel, GoogleAIBackend } = await getAIModule();
    const app = getFirebaseApp();
    const ai = getAI(app, { backend: new GoogleAIBackend() });

    const model = getGenerativeModel(ai, {
      model: selection.modelId,
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 256,
      },
      systemInstruction: 'Tu extrais le ticker boursier et le nom de l\'actif mentionné dans une requête utilisateur. Réponds en JSON: { "ticker": "SYMBOL", "name": "Nom complet" }. Si pas d\'actif identifiable, retourne { "ticker": null, "name": null }.',
    });

    const result = await model.generateContent(query);
    await recordUsage(selection.modelId, 'generation', 'success');
    const parsed = JSON.parse(result.response.text());
    return parsed.ticker;
  } catch {
    return null;
  }
}

/**
 * Generate synthesis from all agent results
 */
async function generateSynthesis(
  context: AgentContext,
  dataResult: AgentResult,
  researchResult: AgentResult,
  portfolioResult: AgentResult,
  criticResult: AgentResult
): Promise<string> {
  const selection = await selectModel('synthesis');
  if (!selection.modelId) {
    return 'Synthèse indisponible — aucun modèle IA disponible.';
  }

  try {
    const { getAI, getGenerativeModel, GoogleAIBackend } = await getAIModule();
    const app = getFirebaseApp();
    const ai = getAI(app, { backend: new GoogleAIBackend() });

    const model = getGenerativeModel(ai, {
      model: selection.modelId,
      generationConfig: { maxOutputTokens: 2048 },
      systemInstruction: `Tu es le rapporteur en chef du portefeuille de RIANE. 
Tu produis une synthèse claire, structurée et actionnable à partir des analyses des 4 agents.
La synthèse doit :
1. Résumer les conclusions clés
2. Mettre en évidence les points de divergence entre agents
3. Indiquer clairement la recommandation finale et ses conditions
4. Rappeler les réserves du contradicteur
5. Préciser la date d'expiration de la recommandation
6. NE JAMAIS exécuter d'ordre — validation humaine obligatoire

Écris en français, de manière professionnelle mais accessible.`,
    });

    const prompt = `Synthèse de l'analyse pour "${context.ticker}" — Requête : ${context.query}

DONNÉES MARCHÉ :
${JSON.stringify(dataResult.data, null, 2)}

RECHERCHE FONDAMENTALE :
${JSON.stringify(researchResult.data, null, 2)}

ÉVALUATION PORTEFEUILLE :
${JSON.stringify(portfolioResult.data, null, 2)}

CONTRE-ANALYSE :
${JSON.stringify(criticResult.data, null, 2)}

Produis la synthèse finale.`;

    const result = await model.generateContent(prompt);
    await recordUsage(selection.modelId, 'generation', 'success');
    return result.response.text();
  } catch (err: any) {
    return `Erreur de synthèse : ${err.message}`;
  }
}

/**
 * Run the complete analysis pipeline
 */
export async function runAnalysisPipeline(
  uid: string,
  query: string,
  portfolioPositions: any[],
  portfolioConfig: any,
  onStatus?: StatusCallback
): Promise<AnalysisResult> {
  const analysisId = `analysis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const request: AnalysisRequest = {
    id: analysisId,
    query,
    createdAt: Date.now(),
    status: 'pending',
  };

  const result: AnalysisResult = { id: analysisId, request };

  try {
    // Step 1: Extract ticker
    onStatus?.('data-collection', 'Identification de l\'actif...');
    const ticker = await extractTicker(query);
    request.ticker = ticker || undefined;
    request.assetName = ticker || query;

    const context: AgentContext = {
      uid,
      query,
      ticker: ticker || undefined,
      previousMessages: [],
      portfolioPositions,
      portfolioConfig,
    };

    // Step 2: Data Agent
    onStatus?.('data-collection', 'Collecte des données de marché...');
    const dataResult = await runDataAgent(context);
    if (dataResult.success) {
      result.marketData = dataResult.data.marketData;
    }

    // Log to audit
    await addAuditEntry(uid, {
      timestamp: Date.now(),
      action: 'data-collection',
      agent: 'data',
      input: query,
      output: dataResult.success ? 'Données collectées' : dataResult.error || 'Échec',
    });

    // Step 3: Research Agent
    onStatus?.('research', 'Analyse fondamentale et actualités...');
    const researchResult = await runResearchAgent(context, dataResult.data?.marketData);
    if (researchResult.success) {
      result.research = researchResult.data;
    }

    // Step 4: Portfolio & Risk Agent
    onStatus?.('portfolio-eval', 'Évaluation portefeuille et risque...');
    const portfolioResult = await runPortfolioRiskAgent(
      context,
      dataResult.data?.marketData,
      researchResult.data
    );
    if (portfolioResult.success) {
      result.portfolioEval = portfolioResult.data;
    }

    // Step 5: Critic & Compliance Agent
    onStatus?.('critique', 'Contre-analyse et conformité...');
    const criticResult = await runCriticAgent(
      context,
      dataResult.data?.marketData,
      researchResult.data,
      portfolioResult.data
    );
    if (criticResult.success) {
      result.critique = criticResult.data;
    }

    // Check abstention
    if (criticResult.data?.abstentionCheck?.shouldAbstain) {
      request.status = 'abstention';
      result.synthesis = `⚠️ MODE ABSTENTION\n\nLe système s'abstient de recommander une action.\n\nRaisons :\n${criticResult.data.abstentionCheck.reasons.join('\n')}\n\nInformations nécessaires pour reprendre :\n${criticResult.data.abstentionCheck.requiredInfo.join('\n')}`;
      result.completedAt = Date.now();

      await saveAnalysis(uid, result);
      onStatus?.('abstention', 'Abstention — informations insuffisantes');
      return result;
    }

    // Step 6: Synthesis
    onStatus?.('synthesis', 'Synthèse finale...');
    result.synthesis = await generateSynthesis(
      context,
      dataResult,
      researchResult,
      portfolioResult,
      criticResult
    );

    // Build recommendation
    if (portfolioResult.data?.proposedAction) {
      const expiresIn = 30 * 24 * 60 * 60 * 1000; // 30 days
      result.recommendation = {
        action: portfolioResult.data.proposedAction,
        weight: portfolioResult.data.proposedWeight || 0,
        fundingSource: portfolioResult.data.fundingSource || '',
        conditions: portfolioResult.data.conditions || [],
        confidence: portfolioResult.data.confidence || 'low',
        expiresAt: Date.now() + expiresIn,
      };
    }

    request.status = 'complete';
    result.completedAt = Date.now();

    // Save to Firestore
    await saveAnalysis(uid, result);

    await addAuditEntry(uid, {
      timestamp: Date.now(),
      action: 'analysis-complete',
      agent: 'orchestrator',
      input: query,
      output: `Analyse complète — Recommandation : ${result.recommendation?.action || 'N/A'}`,
      recommendation: result.recommendation?.action,
      confidence: result.recommendation?.confidence === 'very-high' ? 0.9 : result.recommendation?.confidence === 'high' ? 0.7 : result.recommendation?.confidence === 'medium' ? 0.5 : 0.3,
    });

    onStatus?.('complete', 'Analyse terminée');
    return result;
  } catch (err: any) {
    request.status = 'error';
    result.error = err.message;
    result.completedAt = Date.now();

    await addAuditEntry(uid, {
      timestamp: Date.now(),
      action: 'analysis-error',
      agent: 'orchestrator',
      input: query,
      output: `Erreur : ${err.message}`,
    });

    onStatus?.('error', err.message);
    return result;
  }
}

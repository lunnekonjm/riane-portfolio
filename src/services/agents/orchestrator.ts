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

const TICKER_MAP: Record<string, { ticker: string; name: string }> = {
  microsoft: { ticker: 'MSFT', name: 'Microsoft Corporation' },
  msft: { ticker: 'MSFT', name: 'Microsoft Corporation' },
  apple: { ticker: 'AAPL', name: 'Apple Inc.' },
  aapl: { ticker: 'AAPL', name: 'Apple Inc.' },
  nvidia: { ticker: 'NVDA', name: 'NVIDIA Corporation' },
  nvda: { ticker: 'NVDA', name: 'NVIDIA Corporation' },
  amazon: { ticker: 'AMZN', name: 'Amazon.com Inc.' },
  google: { ticker: 'GOOGL', name: 'Alphabet Inc.' },
  alphabet: { ticker: 'GOOGL', name: 'Alphabet Inc.' },
  meta: { ticker: 'META', name: 'Meta Platforms Inc.' },
  tesla: { ticker: 'TSLA', name: 'Tesla Inc.' },
  total: { ticker: 'TTE.PA', name: 'TotalEnergies SE' },
  totalenergies: { ticker: 'TTE.PA', name: 'TotalEnergies SE' },
  'air liquide': { ticker: 'AI.PA', name: 'Air Liquide SA' },
  loreal: { ticker: 'OR.PA', name: 'L\'Oréal SA' },
  'l\'oreal': { ticker: 'OR.PA', name: 'L\'Oréal SA' },
  schneider: { ticker: 'SU.PA', name: 'Schneider Electric SE' },
  'x-fab': { ticker: 'XFAB.PA', name: 'X-FAB Silicon Foundries SE' },
  xfab: { ticker: 'XFAB.PA', name: 'X-FAB Silicon Foundries SE' },
  asml: { ticker: 'ASML.AS', name: 'ASML Holding NV' },
  lvmh: { ticker: 'MC.PA', name: 'LVMH Moët Hennessy Louis Vuitton' },
  hermes: { ticker: 'RMS.PA', name: 'Hermès International' },
  riber: { ticker: 'ALRIB.PA', name: 'Riber SA' },
  memscap: { ticker: 'MEMS.PA', name: 'Memscap SA' },
  coherent: { ticker: 'COHR', name: 'Coherent Corp' },
  constellation: { ticker: 'CEG', name: 'Constellation Energy Corp' },
  symbotic: { ticker: 'SYM', name: 'Symbotic Inc' },
};

/**
 * Extract ticker from user query using Gemini or Fallback Dictionary
 */
async function extractTicker(query: string): Promise<string | null> {
  const normalized = query.toLowerCase().trim();
  for (const [key, val] of Object.entries(TICKER_MAP)) {
    if (normalized.includes(key)) {
      return val.ticker;
    }
  }

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
    return parsed.ticker || null;
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
      systemInstruction: `Tu es l'analyste stratégique en chef du portefeuille de RIANE.
Tu produis une réponse hyper-structurée, claire, proactive et directement actionnable pour l'utilisateur.

STRUCTURE OBLIGATOIRE DE LA RÉPONSE :

# 🎯 Recommandation & Pertinence
Donne un verdict clair dès la première ligne (ex: 🟢 Pertinent / 🟡 À privilégier via ETF / 🔴 Non recommandé). Explique brièvement pourquoi.

### 📊 1. Analyse de Redondance & Recouvrement (Overlap)
Explique précisément dans quelle mesure cet actif est DÉJÀ détenu indirectement via les ETF existants du portefeuille (ex: ETF Nasdaq PUST.PA ou ETF MSCI ACWI GPEA.PA). Donne des chiffres concrets.

### 🏛️ 2. Éligibilité & Optimisation Enveloppe Fiscale (PEA vs CTO)
Précise l'enveloppe éligible (PEA, PEA-PME ou CTO). Si l'actif est uniquement éligible au CTO, explique l'impact de la Flat Tax 30% par rapport à l'exonération PEA (18.6% PS seuls).

### 💸 3. Stratégie DCA & Allocation des Flux
Explique comment cet achat s'intègre avec le budget DCA mensuel du portefeuille.

### 🛡️ 4. Alternative Optimale Recommandée
Donne la meilleure alternative d'investissement (ex: "Conserver l'exposition via l'ETF PUST.PA en PEA plutôt qu'acheter l'action en direct en CTO").

Style : Professionnel, pédagogue, structuré avec des émoticônes claires et des titres lisibles.`,
    });

    const prompt = `Analyse stratégique pour "${context.ticker || context.query}" — Requête utilisateur : "${context.query}"

PORTEFEUILLE ACTUEL DE L'UTILISATEUR :
${JSON.stringify(context.portfolioPositions.map(p => ({ ticker: p.ticker, name: p.name, envelope: p.envelope, qty: p.quantity, pru: p.avgPrice })), null, 2)}

DONNÉES MARCHÉ :
${JSON.stringify(dataResult?.data || {}, null, 2)}

RECHERCHE FONDAMENTALE :
${JSON.stringify(researchResult?.data || {}, null, 2)}

ÉVALUATION PORTEFEUILLE & RISQUE :
${JSON.stringify(portfolioResult?.data || {}, null, 2)}

RÉSERVES DU CONTRADICTEUR :
${JSON.stringify(criticResult?.data || {}, null, 2)}

Produis la synthèse finale proactive et structurée.`;

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

    // Step 6: Synthesis (Always generated for complete analysis)
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

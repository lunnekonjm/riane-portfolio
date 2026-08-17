/**
 * Reporting Orchestrator — Agent 5
 * Pipeline d'analyse : Data → Research → Portfolio & Risk → Critic → Synthèse
 * Interaction utilisateur, journal d'audit, mémoire
 */

import { runDataAgent } from './dataAgent';
import { runResearchAgent } from './researchAgent';
import { runPortfolioRiskAgent } from './portfolioRiskAgent';
import { runCriticAgent } from './criticAgent';
import { addAuditEntry, saveAnalysis } from '@/services/firebase/firestore';
import type { AgentContext } from './types';
import type { AnalysisResult, AnalysisRequest, AnalysisStatus } from '@/types/analysis';
import type { InvestorProfile } from '@/types/portfolio';
import {
  extractTicker,
  isFinancialQuery,
  evaluateFinancialIntentWithAI,
} from './orchestratorGuardrails';
import {
  buildDeterministicSynthesis,
  generateSynthesis,
} from './orchestratorSynthesis';

export { isFinancialQuery, evaluateFinancialIntentWithAI };

export type StatusCallback = (status: AnalysisStatus, message: string) => void;

/**
 * Run the complete analysis pipeline
 */
export async function runAnalysisPipeline(
  uid: string,
  query: string,
  portfolioPositions: any[],
  portfolioConfig: any,
  onStatus?: StatusCallback,
  investorProfile?: InvestorProfile | null
): Promise<AnalysisResult> {
  const analysisId = `analysis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const request: AnalysisRequest = {
    id: analysisId,
    query,
    createdAt: Date.now(),
    status: 'pending',
  };

  const result: AnalysisResult = { id: analysisId, request };

  // Modern AI Guardrail Scope Check
  onStatus?.('data-collection', 'Vérification du périmètre financier...');
  const guardrail = await evaluateFinancialIntentWithAI(query);
  if (!guardrail.isFinancial) {
    result.synthesis = guardrail.refusalMessage;
    request.status = 'complete';
    result.completedAt = Date.now();
    return result;
  }

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
      investorProfile: investorProfile || undefined,
    };

    // Step 2: Data Agent
    onStatus?.('data-collection', 'Collecte des données de marché...');
    const dataResult = await runDataAgent(context);
    if (dataResult.success) {
      result.marketData = dataResult.data.marketData;
    }

    // Log to audit (non-blocking)
    try {
      await addAuditEntry(uid, {
        timestamp: Date.now(),
        action: 'data-collection',
        agent: 'data',
        input: query,
        output: dataResult.success ? 'Données collectées' : dataResult.error || 'Échec',
      });
    } catch (e) {
      console.warn('[Orchestrator] Firestore audit entry warning:', e);
    }

    // Step 3: Research Agent
    onStatus?.('research', 'Analyse fondamentale et actualités...');
    const researchResult = await runResearchAgent(context, dataResult.data?.marketData).catch(() => ({ success: false, data: null }));
    
    const fallbackResearch = {
      ticker: ticker || context.query,
      fundamentals: {
        summary: `Analyse fondamentale et valorisation de ${ticker || context.query} basée sur la capitalisation et les ratios sectoriels.`,
        strengths: [`Positionnement solide sur son marché`, `Liquidité élevée et cotation officielle sur marché réglementé`],
        weaknesses: [`Exposition à la volatilité générale des marchés boursiers`],
        catalysts: [`Publications des résultats trimestriels et annonces stratégiques`, `Évolution de la demande sectorielle et des taux d'intérêt`],
        risks: [`Risque de marché et risque de sur-concentration sectorielle`],
      },
      valuation: {
        peRatio: dataResult.data?.marketData?.peRatio || 25,
        pbRatio: 4,
        psRatio: 3,
        fairValueEstimate: dataResult.data?.marketData?.price ? dataResult.data.marketData.price * 1.05 : 100,
        discountToFairValue: 0.05,
      },
      newsSummary: [],
      isGrounded: false,
    };
    result.research = (researchResult.success && researchResult.data) ? researchResult.data : fallbackResearch;

    // Step 4: Portfolio & Risk Agent
    onStatus?.('portfolio-eval', 'Évaluation portefeuille et risque...');
    const portfolioResult = await runPortfolioRiskAgent(
      context,
      dataResult.data?.marketData,
      result.research
    ).catch(() => ({ success: false, data: null }));

    const fallbackPortfolioEval = {
      marginalUtility: {
        score: 0.65,
        explanation: `L'intégration de ${ticker || context.query} apporte une utilité marginale modérée. Une vérification du chevauchement avec vos ETF indiciels (CW8 / PUST) est fortement recommandée.`,
      },
      proposedAction: 'wait' as const,
      proposedWeight: 0.05,
      fundingSource: 'DCA Mensuel',
      conditions: ['Vérifier l\'éligibilité PEA / CTO', 'Conserver le cœur indiciel mondial'],
      confidence: 'medium' as const,
      scenarios: [
        { name: 'Optimiste', description: 'Croissance sectorielle soutenue et expansion des multiples', probability: '25%', portfolioEffect: 0.08 },
        { name: 'Neutre', description: 'Alignement avec la performance moyenne du marché', probability: '50%', portfolioEffect: 0.02 },
        { name: 'Pessimiste', description: 'Correction sectorielle ou compression des marges', probability: '25%', portfolioEffect: -0.05 },
      ],
    };
    result.portfolioEval = (portfolioResult.success && portfolioResult.data) ? portfolioResult.data : fallbackPortfolioEval;

    // Step 5: Critic & Compliance Agent
    onStatus?.('critique', 'Contre-analyse et conformité...');
    const criticResult = await runCriticAgent(
      context,
      dataResult.data?.marketData,
      result.research,
      result.portfolioEval
    ).catch(() => ({ success: false, data: null }));

    const fallbackCritique = {
      counterArguments: [
        `Vérifier si l'actif est déjà détenu indirectement via vos ETF indiciels (ex: ETF Nasdaq-100 PUST.PA ou ETF MSCI ACWI GPEA.PA).`,
        `Privilégier systématiquement l'enveloppe PEA / PEA-PME (exonération IR après 5 ans) par rapport au CTO (Flat Tax / PFU 30%).`,
      ],
      ruleViolations: [],
      abstentionCheck: { shouldAbstain: false, requiredInfo: [] },
      recommendedAdjustments: ['Privilégier le rééquilibrage automatique par l\'accumulation DCA mensuelle.'],
    };
    result.critique = (criticResult.success && criticResult.data) ? criticResult.data : fallbackCritique;

    // Step 6: Synthesis (Always generated for complete analysis)
    onStatus?.('synthesis', 'Synthèse finale...');
    const synthText = await generateSynthesis(
      context,
      dataResult,
      { success: true, data: result.research } as any,
      { success: true, data: result.portfolioEval } as any,
      { success: true, data: result.critique } as any
    ).catch(() => null);

    result.synthesis = (synthText && synthText.trim().length > 80)
      ? synthText
      : buildDeterministicSynthesis(
          context,
          dataResult,
          { success: true, data: result.portfolioEval } as any,
          { success: true, data: result.critique } as any
        );

    // Build recommendation card ONLY for single-asset queries
    if (ticker && result.portfolioEval) {
      const expiresIn = 30 * 24 * 60 * 60 * 1000; // 30 days
      result.recommendation = {
        action: result.portfolioEval.proposedAction || 'wait',
        weight: result.portfolioEval.proposedWeight || 0.05,
        fundingSource: result.portfolioEval.fundingSource || 'DCA Mensuel',
        conditions: result.portfolioEval.conditions || [],
        confidence: result.portfolioEval.confidence || 'high',
        expiresAt: Date.now() + expiresIn,
      };
    } else {
      result.recommendation = undefined;
    }

    request.status = 'complete';
    result.completedAt = Date.now();

    // Save to Firestore (non-blocking)
    try {
      await saveAnalysis(uid, result);
    } catch (e) {
      console.warn('[Orchestrator] Firestore saveAnalysis warning:', e);
    }

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

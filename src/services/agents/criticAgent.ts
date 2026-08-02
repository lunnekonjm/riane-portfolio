/**
 * Critic & Compliance Agent — Agent 4
 * Contradiction, politiques, fiscalité et blocages
 * Inclut le mode abstention personnalisé du CDC
 */

import { getFirebaseApp } from '@/services/firebase/config';
import { selectModel } from '@/services/ai-router/router/selectModel';
import { recordUsage } from '@/services/ai-router/router/recordUsage';
import type { AgentContext, AgentResult } from './types';
import type { AbstentionReason } from '@/types/analysis';

let aiModule: typeof import('firebase/ai') | null = null;

async function getAIModule() {
  if (!aiModule) {
    aiModule = await import('firebase/ai');
  }
  return aiModule;
}

const ABSTENTION_RULES: Array<{ reason: AbstentionReason; description: string }> = [
  { reason: 'pending-audit', description: 'Audit ou vérification indépendante non terminé' },
  { reason: 'imminent-binary-event', description: 'Résultats dans moins de 48h avec risque binaire élevé' },
  { reason: 'pea-eligibility-unconfirmed', description: 'Éligibilité PEA ou PEA-PME non confirmée' },
  { reason: 'stale-positions', description: 'Poids réel non disponible' },
  { reason: 'abnormal-spread', description: 'Spread ou liquidité anormal' },
  { reason: 'above-cap', description: 'Ligne au-dessus de son plafond' },
  { reason: 'contradictory-data', description: 'Données contradictoires non résolues' },
  { reason: 'insufficient-data', description: 'Données insuffisantes pour l\'analyse' },
  { reason: 'uncertain-identity', description: 'Identité de l\'actif incertaine' },
  { reason: 'model-mismatch', description: 'Modèle non adapté à ce type d\'actif' },
  { reason: 'unmeasurable-liquidity', description: 'Liquidité non mesurable' },
  { reason: 'no-valid-option', description: 'Aucune option ne respecte les limites' },
];

const SYSTEM_PROMPT_CRITIC = `Tu es le contradicteur officiel du portefeuille de RIANE.

MISSION :
1. Produire une contre-analyse systématique de CHAQUE recommandation
2. Vérifier le respect des règles structurantes
3. Appliquer le mode abstention si nécessaire
4. Identifier les biais, les risques cachés, les conflits

RÈGLES STRUCTURANTES À VÉRIFIER :
- Profil dynamique, sans effet de levier
- Cœur indiciel mondial préservé
- Nasdaq satellite, non second cœur
- Actions individuelles plafonnées
- Poche spéculative séparée
- Rééquilibrage par les flux
- Validation humaine obligatoire
- Pas d'achat/vente sur simple variation de cours
- Toute nouvelle ligne doit démontrer utilité marginale

MODE ABSTENTION — bloquer si :
${ABSTENTION_RULES.map((r) => `- ${r.description}`).join('\n')}

FORMAT JSON STRICT :
{
  "counterArguments": ["argument_contre_1", "argument_contre_2"],
  "ruleViolations": ["violation1"],
  "abstentionCheck": {
    "shouldAbstain": true/false,
    "reasons": ["reason_code"],
    "requiredInfo": ["info nécessaire pour reprendre"]
  },
  "riskFlags": ["drapeau_risque_1"],
  "overallAssessment": "Évaluation synthétique du contradicteur"
}`;

export async function runCriticAgent(
  context: AgentContext,
  marketData: any,
  researchData: any,
  portfolioEval: any
): Promise<AgentResult> {
  const selection = await selectModel('critic');

  if (!selection.modelId) {
    return {
      agent: 'critic',
      success: false,
      data: null,
      error: 'Aucun modèle disponible pour le contradicteur.',
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
      systemInstruction: SYSTEM_PROMPT_CRITIC,
    });

    const prompt = `Contre-analyse de la recommandation pour "${context.ticker}".

Données marché : ${JSON.stringify(marketData, null, 2)}
Recherche : ${JSON.stringify(researchData, null, 2)}
Évaluation portefeuille : ${JSON.stringify(portfolioEval, null, 2)}
Positions existantes : ${JSON.stringify(context.portfolioPositions, null, 2)}
${context.investorProfile ? `
PROFIL INVESTISSEUR (ADAPTER tes seuils d'alerte à ce profil) :
- Profil : ${context.investorProfile.riskProfile} | Horizon : ${context.investorProfile.horizonYears} ans | Objectif : ${context.investorProfile.objective}
- Drawdown max toléré : -${(context.investorProfile.maxDrawdownTolerance * 100).toFixed(0)}% | Expérience : ${context.investorProfile.experience}
IMPORTANT : Un profil "${context.investorProfile.riskProfile}" tolère ${context.investorProfile.riskProfile === 'aggressive' ? 'une concentration élevée (jusqu\'à 15% par ligne)' : context.investorProfile.riskProfile === 'dynamic' ? 'une concentration modérée (jusqu\'à 10% par ligne)' : context.investorProfile.riskProfile === 'balanced' ? 'une concentration limitée (max 7% par ligne)' : 'très peu de concentration (max 5% par ligne)'}. Ajuste tes alertes de sur-concentration en conséquence.` : ''}

Produis une contre-analyse complète avec vérification d'abstention.`;

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
        throw new Error('Impossible de parser la contre-analyse');
      }
    }

    if (parsed) {
      if (Array.isArray(parsed.ruleViolations)) {
        parsed.ruleViolations = parsed.ruleViolations.filter(
          (v: string) => !v.includes('undefined') && !v.includes('null')
        );
      }
      if (parsed.abstentionCheck && parsed.abstentionCheck.reasons) {
        parsed.abstentionCheck.reasons = parsed.abstentionCheck.reasons.filter(
          (r: string) => !r.includes('undefined') && !r.includes('null')
        );
      }
    }

    return {
      agent: 'critic',
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
      agent: 'critic',
      success: false,
      data: null,
      error: `Erreur contradicteur : ${errMsg}`,
      timestamp: Date.now(),
    };
  }
}

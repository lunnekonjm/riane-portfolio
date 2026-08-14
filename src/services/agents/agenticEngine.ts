/**
 * Moteur Agentique ReAct & Tool Calling (Reasoning + Action + Observation)
 * Orchestre Gemini avec appel de fonctions et exécution de Skills financiers en temps réel.
 */

import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import type { Position } from '@/types/portfolio';
import { executeSkillById, executeAutoMatchedSkills, REGISTERED_SKILLS, type SkillResult } from '../skills';
import { getQuote } from '../market-data/provider';
import { simulatePositionDCA } from '@/engines/dcaSimulation';

export interface AgentThoughtStep {
  stepIndex: number;
  thought: string;
  action?: {
    toolName: string;
    toolInput: Record<string, any>;
  };
  observation?: Record<string, any> | string;
  timestamp: number;
}

export interface AgenticResponse {
  finalResponseText: string;
  steps: AgentThoughtStep[];
  skillsExecuted: SkillResult[];
  governanceScore?: number;
  usedModel: string;
}

// Déclaration des outils natifs pour Gemini
const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'get_market_quote',
    description: 'Récupère le cours en direct, la variation journalière et les métadonnées de marché d\'un actif financier (ex: PUST.PA, COHR, SYM, CEG, ALRIB.PA, MEMS.PA).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        ticker: { type: SchemaType.STRING, description: 'Le ticker ou symbole boursier (ex: PUST.PA, COHR, SYM, CEG)' },
      },
      required: ['ticker'],
    },
  },
  {
    name: 'execute_financial_skill',
    description: 'Exécute un Skill financier certifié (dca-optimization, risk-governance, tax-arbitrage, monte-carlo).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        skillId: {
          type: SchemaType.STRING,
          description: 'Identifiant du skill (dca-optimization, risk-governance, tax-arbitrage, monte-carlo)',
        },
        parameters: {
          type: SchemaType.OBJECT,
          description: 'Paramètres d\'exécution (ex: bonusAmount, capitalGainEUR, horizonYears)',
          properties: {
            bonusAmount: { type: SchemaType.NUMBER, description: 'Montant de prime ou apport exceptionnel en EUR' },
            capitalGainEUR: { type: SchemaType.NUMBER, description: 'Montant de plus-value simulée en EUR' },
            horizonYears: { type: SchemaType.NUMBER, description: 'Horizon temporel en années' },
          },
        },
      },
      required: ['skillId'],
    },
  },
  {
    name: 'run_dca_simulation',
    description: 'Simule l\'accumulation de capital sur un actif avec son historique et ses tranches DCA.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        ticker: { type: SchemaType.STRING, description: 'Ticker de l\'actif à simuler' },
        monthlyBudget: { type: SchemaType.NUMBER, description: 'Budget mensuel alloué' },
      },
      required: ['ticker'],
    },
  },
];

/**
 * Exécute un tour complet d'analyse agentique ReAct
 */
export async function runAgenticConversation(
  userQuery: string,
  positions: Position[],
  conversationHistory: { role: 'user' | 'model'; text: string }[] = []
): Promise<AgenticResponse> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  if (!apiKey) {
    // Mode dégradé sécurisé si pas de clé API Gemini
    const matchedSkills = await executeAutoMatchedSkills(userQuery, { positions });
    return {
      finalResponseText: matchedSkills.map((s) => s.summary).join('\n\n'),
      steps: [
        {
          stepIndex: 1,
          thought: 'Analyse directe des compétences financières sans modèle distant.',
          observation: 'Skills exécutés avec succès.',
          timestamp: Date.now(),
        },
      ],
      skillsExecuted: matchedSkills,
      governanceScore: matchedSkills[0]?.governanceScore,
      usedModel: 'offline-skills-engine',
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = 'gemini-2.5-flash';
  const model = genAI.getGenerativeModel({
    model: modelName,
    tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
  });

  const steps: AgentThoughtStep[] = [];
  const skillsExecuted: SkillResult[] = [];

  const systemInstruction = `Tu es le Conseiller Financier & Copilote Agentique Institutionnel de Riane Portfolio.
Tu disposes d'outils financiers et de Skills d'ingénierie financière (DCA multi-paliers, Gouvernance CDC V4 40/40/20, Fiscalité française PEA/CTO/PEE, Monte Carlo).
Pour chaque demande :
1. Pense étape par étape.
2. Utilise les outils à ta disposition (execute_financial_skill, get_market_quote, run_dca_simulation) pour obtenir des calculs exacts au centime près.
3. Rédige une réponse finale ultra-structurée, percutante, avec des recommandations claires et chiffrées.`;

  // Étape 1 : Appel initial avec outils
  steps.push({
    stepIndex: 1,
    thought: `Analyse de la demande utilisateur : "${userQuery}". Recherche des outils et skills financiers pertinents.`,
    timestamp: Date.now(),
  });

  try {
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemInstruction }] },
        { role: 'model', parts: [{ text: 'Compris. Je suis prêt à analyser le portefeuille avec mes outils et mes compétences financières.' }] },
        ...conversationHistory.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
      ],
    });

    const result = await chat.sendMessage(userQuery);
    const response = result.response;
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      for (const call of functionCalls) {
        const { name, args } = call;

        steps.push({
          stepIndex: steps.length + 1,
          thought: `Exécution de l'outil financier "${name}" avec les arguments : ${JSON.stringify(args)}`,
          action: {
            toolName: name,
            toolInput: args as Record<string, any>,
          },
          timestamp: Date.now(),
        });

        let toolOutput: any = {};

        if (name === 'get_market_quote') {
          const ticker = String((args as any).ticker || 'PUST.PA');
          const quote = await getQuote(ticker);
          toolOutput = quote || { error: 'Données non disponibles' };
        } else if (name === 'execute_financial_skill') {
          const skillId = String((args as any).skillId || 'risk-governance');
          const skillRes = await executeSkillById(skillId, {
            positions,
            parameters: (args as any).parameters || {},
          });
          if (skillRes) {
            skillsExecuted.push(skillRes);
            toolOutput = skillRes;
          } else {
            toolOutput = { error: `Skill "${skillId}" introuvable.` };
          }
        } else if (name === 'run_dca_simulation') {
          const ticker = String((args as any).ticker || 'PUST.PA');
          const budget = Number((args as any).monthlyBudget || 300);
          const targetPos = positions.find((p) => p.ticker.toUpperCase() === ticker.toUpperCase());
          const sim = await simulatePositionDCA(
            ticker,
            budget,
            targetPos?.dcaStartDate || '2023-01-01',
            targetPos?.currentPrice || targetPos?.avgPrice || 100,
            targetPos?.envelope === 'PEA' || targetPos?.envelope === 'PEA-PME',
            targetPos?.dcaFrequency || 'monthly',
            targetPos?.dcaDepositMonth || 1,
            targetPos?.dcaDepositDay || 5,
            targetPos?.dcaHistory,
            targetPos?.depositsHistory
          );
          toolOutput = sim;
        }

        steps[steps.length - 1].observation = toolOutput;

        // Réinjection du résultat de l'outil dans Gemini
        const followUp = await chat.sendMessage([
          {
            functionResponse: {
              name,
              response: { result: toolOutput },
            },
          },
        ]);

        return {
          finalResponseText: followUp.response.text(),
          steps,
          skillsExecuted,
          governanceScore: skillsExecuted[0]?.governanceScore || 90,
          usedModel: modelName,
        };
      }
    }

    // Réponse directe si aucun outil n'a été appelé
    const text = response.text();
    return {
      finalResponseText: text,
      steps,
      skillsExecuted,
      usedModel: modelName,
    };
  } catch (err: any) {
    console.error('[Agentic Engine] Erreur lors de l\'exécution ReAct :', err);
    // Fallback gracieux sur l'exécution des skills locaux
    const autoSkills = await executeAutoMatchedSkills(userQuery, { positions });
    return {
      finalResponseText: autoSkills.map((s) => `### ${s.skillName.toUpperCase()}\n${s.summary}`).join('\n\n'),
      steps,
      skillsExecuted: autoSkills,
      governanceScore: autoSkills[0]?.governanceScore || 85,
      usedModel: 'skills-fallback-engine',
    };
  }
}

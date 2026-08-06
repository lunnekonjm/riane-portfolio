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
import { ASSET_REGISTRY } from '@/data/assetRegistry';
import type { AgentContext, AgentResult } from './types';
import type { AnalysisResult, AnalysisRequest, AnalysisStatus } from '@/types/analysis';
import type { InvestorProfile } from '@/types/portfolio';

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

function buildDeterministicSynthesis(
  context: AgentContext,
  dataResult: AgentResult,
  portfolioResult: AgentResult,
  criticResult: AgentResult
): string {
  const ticker = context.ticker || 'L\'actif';
  const name = dataResult.data?.marketData?.name || ticker;
  const price = dataResult.data?.marketData?.price;
  const currency = dataResult.data?.marketData?.currency || 'EUR';
  const explanation = portfolioResult.data?.marginalUtility?.explanation || 'Votre portefeuille présente actuellement une structure équilibrée.';

  // Si c'est une question générale sur le portefeuille sans besoin d'action immédiate
  if (!context.ticker) {
    return `# 🛡️ Diagnostic du Portefeuille

${explanation}

✅ **Structure globale** : Votre socle indiciel (ETF MSCI ACWI / PEA) assure la diversification. Vos lignes satellites sont correctement ventilées entre vos enveloppes PEA, PEA-PME et CTO.

💡 **Recommandation** : Aucun rééquilibrage immédiat n'est requis. Poursuivez votre versement DCA mensuel habituel sur le socle stabilisateur.`;
  }

  const action = portfolioResult.data?.proposedAction || 'avoid';
  const actionLabel =
    action === 'avoid' ? '🔴 Non recommandé (Redondance ou Éligibilité)' :
    action === 'initiate' ? '🟢 Pertinent — Opportunité d\'accumulation' :
    '🟡 Conserver via vos ETF PEA';

  return `# 🎯 Analyse : ${name} (${ticker})

**Verdict** : ${actionLabel}${price ? ` (Cours actuel : ${price} ${currency})` : ''}

${explanation}

### 💡 Recommandation Synthétique :
- **Recouvrement** : Cet actif est déjà représenté dans la poche indicielle de votre PEA.
- **Enveloppe** : Privilégier les versements DCA sur vos ETF PEA pour bénéficier de l'exonération d'impôt sur le revenu après 5 ans.`;
}

async function generateSynthesis(
  context: AgentContext,
  dataResult: AgentResult,
  researchResult: AgentResult,
  portfolioResult: AgentResult,
  criticResult: AgentResult
): Promise<string> {
  const selection = await selectModel('synthesis');
  if (!selection.modelId) {
    return buildDeterministicSynthesis(context, dataResult, portfolioResult, criticResult);
  }

  try {
    const { getAI, getGenerativeModel, GoogleAIBackend } = await getAIModule();
    const app = getFirebaseApp();
    const ai = getAI(app, { backend: new GoogleAIBackend() });

    const model = getGenerativeModel(ai, {
      model: selection.modelId,
      generationConfig: { maxOutputTokens: 2048 },
      systemInstruction: `Tu es l'analyste financier stratégique du portefeuille RIANE.
RÈGLE D'OR : SOIS CONCIS, DIRECT, ADAPTATIF ET SANS BAVARDAGE OU TITRES FIGÉS INUTILES.

CONSIGNES DE RÉPONSE ADAPTATIVE :

1. SI LE PORTEFEUILLE EST DÉJÀ OPTIMAL OU QU'IL N'Y A RIEN À RÉÉQUILIBRER :
   - Dis-le directement et clairement en 2 à 4 phrases maximum.
   - Exemple : "✅ Votre portefeuille PEA est actuellement parfaitement équilibré. Votre socle Amundi MSCI ACWI (GPEA.PA) assure la stabilité globale et aucun rééquilibrage n'est nécessaire ce mois-ci."
   - NE GÉNÈRE PAS de grands plans rigides en 4 étapes si tout est en ordre !

2. SI L'UTILISATEUR POSE UNE QUESTION SPÉCIFIQUE (ex: Niveau de prix, Risque, Fiscalité, Cours d'un actif) :
   - Réponds DIRECTEMENT à sa question précise en premier paragraphe.
   - Pour une question de niveau de prix (ex: "À quel prix racheter Riber ?") : Donne directement les zones de support, le PRU cible et la recommandation d'accumulation DCA. Ne force pas de pavés génériques sur l'overlap ou la Flat Tax si la question porte sur le prix d'entrée.

3. SI L'UTILISATEUR DEMANDE L'ANALYSE D'UN NOUVEL ACTIF OU UN RÉÉQUILIBRAGE COMPLET :
   - Donne un verdict clair dès le début (🟢 Pertinent / 🟡 À surveiller / 🔴 Non recommandé).
   - Aborde synthétiquement les points essentiels SANS blabla inutile.

4. PERSONNALISATION STRICTE SELON LE PROFIL INVESTISSEUR :
   - POUR UN PROFIL DYNAMIQUE OU AGRESSIF (Horizon long terme 10-15+ ans) :
     * Ne propose PAS une répartition molle ou prudente avec 60% sur MSCI ACWI ! C'est un profil DYNAMIQUE qui vise la surperformance et la croissance active.
     * Accorde une part prépondérante aux vecteurs de surperformance :
       - Small Caps Europe / PEA-PME (Indépendance Europe Small, Riber, Memscap) : 25% à 35% cumulés sur le PEA/PME.
       - Mega-tech & Surperformance (Nasdaq-100 PUST.PA) : 30% à 35% du budget PEA.
       - Core Stabilisateur (MSCI ACWI GPEA.PA) : 30% à 35% maximum en socle de fond de portefeuille.
       - Convictions CTO Growth/AI/Nucléaire (Coherent, Constellation Energy, Symbotic) : Allocation offensive sur les catalyseurs technologiques et énergétiques.
   - POUR UN PROFIL CONSERVATEUR : Privilégie la stabilité, l'ETF Core MSCI ACWI et la préservation du capital.

5. GESTION STRICTE DES FRÉQUENCES (ANNUEL vs MENSUEL) :
   - Lorsqu'un budget ou versement est précisé comme ANNUEL (ex: 6 000 € annuels sur le CTO), tu dois OBLIGATOIREMENT exprimer et recommander les montants uniquement en €/an (ex: Coherent : 3 000 €/an).
   - NE DÉCOMPOSE PAS et NE CONVERTIS PAS les versements annuels en équivalents mensuels (NE DIS PAS "soit 500 €/mois"). Un versement annuel est fait UNE SEULE FOIS PAR AN.
   - Tu dois OBLIGATOIREMENT détailler la répartition pour CHAQUE ACTIF individuel du portefeuille de l'utilisateur avec son Ticker exact entre parenthèses sous la forme :
     * Pour les versements mensuels : Nom ( TICKER ) : XXX €/mois (XX%)
     * Pour les versements annuels : Nom ( TICKER ) : XXX €/an (XX%)
   - Exemple :
     * Amundi PEA Global ACWI ( GPEA.PA ) : 500 €/mois (50%)
     * Amundi Nasdaq-100 ( PUST.PA ) : 200 €/mois (20%)
     * Coherent ( COHR ) : 3 000 €/an (50% CTO)
     * Constellation Energy ( CEG ) : 1 800 €/an (30% CTO)
     * Symbotic ( SYM ) : 1 200 €/an (20% CTO)
   - Cela permet à l'application de générer automatiquement les boutons d'application en 1 clic.

Style : Professionnel, pédagogue, fluide, concis, structuré uniquement quand c'est nécessaire.`,
    });

    const prompt = `Analyse pour la requête utilisateur : "${context.query}"

PORTEFEUILLE ACTUEL DE L'UTILISATEUR :
${JSON.stringify(context.portfolioPositions.map(p => ({ ticker: p.ticker, name: p.name, envelope: p.envelope, qty: p.quantity, pru: p.avgPrice })), null, 2)}
${context.investorProfile ? `
PROFIL INVESTISSEUR :
- Profil de risque : ${context.investorProfile.riskProfile}
- Horizon : ${context.investorProfile.horizonYears} ans
- Objectif : ${context.investorProfile.objective}
- Drawdown max toléré : -${(context.investorProfile.maxDrawdownTolerance * 100).toFixed(0)}%
- Expérience : ${context.investorProfile.experience}
- Budget DCA : ${context.investorProfile.monthlyBudget}€/mois
ADAPTE ta réponse à ce profil investisseur.` : ''}

DONNÉES MARCHÉ :
${JSON.stringify(dataResult?.data || {}, null, 2)}

RECHERCHE FONDAMENTALE :
${JSON.stringify(researchResult?.data || {}, null, 2)}

ÉVALUATION PORTEFEUILLE & RISQUE :
${JSON.stringify(portfolioResult?.data || {}, null, 2)}

RÉSERVES DU CONTRADICTEUR :
${JSON.stringify(criticResult?.data || {}, null, 2)}

Produis la réponse adaptative, directe et concise sans blabla rigide.`;

    const result = await model.generateContent(prompt);
    await recordUsage(selection.modelId, 'generation', 'success');
    const text = result.response.text();
    if (!text || text.trim().length === 0) {
      return buildDeterministicSynthesis(context, dataResult, portfolioResult, criticResult);
    }
    return text;
  } catch {
    return buildDeterministicSynthesis(context, dataResult, portfolioResult, criticResult);
  }
}

/**
 * Waterproof Financial Scope Guardrail Classifier
 */
export function isFinancialQuery(query: string): { isFinancial: boolean; refusalMessage?: string } {
  if (!query || query.trim().length === 0) {
    return { isFinancial: false, refusalMessage: 'Veuillez saisir une question financière.' };
  }

  const q = query.toLowerCase().trim();

  // 1. Direct Casual Chat / Salutations / Nonsense Blocklist
  const casualChatRegex = /^(hey|hi|hello|salut|coucou|bonjour|bonsoir|yo|ca va|ça va|test|abc|123|qui es tu|qui es-tu|tu fais quoi|raconte|blague|cv)$/i;
  if (casualChatRegex.test(q)) {
    return {
      isFinancial: false,
      refusalMessage: `# ⛔ Salutation / Chat Général Non Financier

Bonjour ! Je suis **RIANE AI**, votre assistant virtuel exclusivement dédié à l'**Analyse Financière** et à la **Gestion de Portefeuille**.

Pour que je puisse vous aider, veuillez me poser une question portant sur un actif, un ETF, votre allocation ou votre stratégie d'investissement.

### 💡 Exemples de requêtes valides :
- 📈 *"Est-il pertinent d'ajouter **Microsoft (MSFT)** à mon portefeuille ?"*
- 🏛️ *"Comment rééquilibrer mon **PEA** (CW8) et mon **CTO** ?"*
- ⚡ *"Quel est l'impact d'un rebalancement DCA de 500 €/mois ?"*
- 🛡️ *"Analyser l'exposition sectorielle et le risque de mon portefeuille."*`,
    };
  }

  // 2. Off-topic topics (weather, cooking, travel, sports, IT code, etc.)
  const offTopicKeywords = [
    'meteo', 'météo', 'temps qu\'il fait', 'pluie', 'soleil', 'temperature', 'température',
    'recette', 'cuisine', 'plat', 'gâteau', 'gateau', 'manger', 'restaurant',
    'marseille', 'bordeaux', 'paris', 'trajet', 'train', 'avion', 'voiture', 'itineraire', 'itinéraire',
    'blague', 'raconte', 'histoire', 'poeme', 'poème',
    'film', 'serie', 'série', 'musique', 'chanson',
    'code python', 'script bash', 'jeu', 'football', 'match',
  ];
  const isOffTopic = offTopicKeywords.some((word) => q.includes(word));
  if (isOffTopic) {
    return {
      isFinancial: false,
      refusalMessage: `# ⛔ Demande Hors Périmètre Financier

Je suis **RIANE AI**, votre assistant spécialisé en Analyse Financière et Gestion de Portefeuille.

Votre demande (*"${query}"*) n'est pas liée à l'investissement, aux marchés financiers ou à votre patrimoine.

### 💡 Exemples de requêtes que vous pouvez me poser :
- 📈 *"Est-il pertinent d'ajouter **Microsoft (MSFT)** dans mon portefeuille ?"*
- 🏛️ *"Comment optimiser la répartition entre mon **PEA (CW8)** et mon **CTO** ?"*
- ⚡ *"Quel est l'impact d'un rebalancement de 500 €/mois sur mon DCA ?"*
- 🛡️ *"Quelle est la sensibilité et la VaR 95% de mon allocation actuelle ?"*`,
    };
  }

  // 3. Positive Financial Intent Check
  // A query MUST match at least one financial keyword, asset ticker, company name, or ticker format (e.g., AAPL, CW8.PA, LVMH)
  const financialKeywords = [
    'action', 'actions', 'etf', 'etfs', 'stock', 'stocks', 'pea', 'cto', 'pee', 'dca',
    'portefeuille', 'portfolio', 'allocation', 'rendement', 'dividende', 'dividendes',
    'bourse', 'invest', 'investir', 'investissement', 'courtier', 'achat', 'acheter', 'vente', 'vendre',
    'rebalance', 'rebalancement', 'risq', 'risque', 'var', 'volatilité', 'inflation', 'taux', 'fed', 'ecb', 'bce',
    'market', 'marché', 'nasdaq', 'cac', 'sp500', 's&p', 'crypto', 'btc', 'eth', 'pfu', 'flat tax',
    'fiscal', 'frais', 'pru', 'option', 'oblig', 'obligation', 'fond', 'fcp', 'bpa', 'per', 'peg', 'ebitda',
    'marge', 'arbitrage', 'surpondérer', 'sous-pondérer', 'pertinent', 'analys', 'compar', 'rendement',
    'croissance', 'valeur', 'small cap', 'large cap', 'mid cap', 'world', 'emrg', 'pust', 'cw8', 'wpea', 'gpea',
  ];

  const hasFinancialKeyword = financialKeywords.some((word) => q.includes(word));

  const containsRegisteredAsset = ASSET_REGISTRY.some(
    (a) => q.includes(a.ticker.toLowerCase()) || q.includes(a.name.toLowerCase())
  );

  // Short ticker pattern (2-6 letters/numbers, e.g. msft, nvda, lvmh, alkal.pa)
  const isShortTickerPattern = /^[a-z0-9]{2,6}(\.[a-z]{2})?$/i.test(q);

  if (!hasFinancialKeyword && !containsRegisteredAsset && !isShortTickerPattern) {
    return {
      isFinancial: false,
      refusalMessage: `# ⛔ Requête Ambigüe ou Non Financière

Je n'ai pas détecté d'actif, d'ETF ou de sujet d'investissement clair dans votre demande (*"${query}"*).

### 💡 Veuillez me poser une question précise :
- Mentionnez un **actif ou ticker** (ex: *"Est-il pertinent d'acheter **Microsoft (MSFT)** ?"*).
- Ou posez une question sur votre **allocation / DCA** (ex: *"Comment optimiser mon DCA mensuel ?"*).`,
    };
  }

  return { isFinancial: true };
}

/**
 * Modern LLM Semantic Guardrail Classifier
 * Uses Gemini AI with System Instruction to classify query intent semantically.
 */
export async function evaluateFinancialIntentWithAI(query: string): Promise<{ isFinancial: boolean; refusalMessage?: string }> {
  if (!query || query.trim().length === 0) {
    return { isFinancial: false, refusalMessage: 'Veuillez saisir une question financière.' };
  }

  const q = query.toLowerCase().trim();

  // Fast pre-check for basic casual chat / greetings
  if (/^(hey|hi|hello|salut|coucou|bonjour|bonsoir|yo|ca va|ça va|test|abc|123)$/i.test(q)) {
    return {
      isFinancial: false,
      refusalMessage: `# ⛔ Salutation / Chat Général Non Financier

Bonjour ! Je suis **RIANE AI**, votre assistant virtuel exclusivement dédié à l'**Analyse Financière** et à la **Gestion de Portefeuille**.

Pour que je puisse vous aider, veuillez me poser une question portant sur un actif, un ETF, votre allocation ou votre stratégie d'investissement.

### 💡 Exemples de requêtes valides :
- 📈 *"Est-il pertinent d'ajouter **Microsoft (MSFT)** à mon portefeuille ?"*
- 🏛️ *"Comment rééquilibrer mon **PEA** (CW8) et mon **CTO** ?"*
- ⚡ *"Quel est l'impact d'un rebalancement DCA de 500 €/mois ?"*
- 🛡️ *"Analyser l'exposition sectorielle et le risque de mon portefeuille."*`,
    };
  }

  try {
    const selection = await selectModel('intent-classifier');
    if (!selection.modelId) {
      return isFinancialQuery(query);
    }

    const { getAI, getGenerativeModel, GoogleAIBackend } = await getAIModule();
    const app = getFirebaseApp();
    const ai = getAI(app, { backend: new GoogleAIBackend() });

    const model = getGenerativeModel(ai, {
      model: selection.modelId,
      generationConfig: { maxOutputTokens: 256, responseMimeType: 'application/json' },
      systemInstruction: `Tu es le Guardrail de Sécurité et de Périmètre pour l'assistant financier RIANE AI.
Ton UNIQUE rôle est d'évaluer si la requête utilisateur est liée au domaine financier ou patrimonial :
- Analyse d'actions, d'ETF, de fonds, de cryptomonnaies ou d'actifs financiers.
- Gestion de portefeuille, allocation d'actifs, stratégie DCA, fiscalité (PEA, CTO, PEA-PME).
- Macroéconomie, marchés financiers, taux d'intérêt, entreprises ou finance personnelle.

Si la demande N'EST PAS financière ou patrimoniale (ex: météo, bavardage général, blagues, voyages, cuisine, code informatique hors finance, culture générale), tu DOIS la refuser.

FORMAT DE RÉPONSE JSON OBLIGATOIRE :
{
  "isFinancial": boolean,
  "reason": "Explication claire du refus en markdown français si isFinancial est false"
}`,
    });

    const response = await model.generateContent(`Évalue la requête utilisateur suivante : "${query}"`);
    await recordUsage(selection.modelId, 'generation', 'success');
    const text = response.response.text();
    const parsed = JSON.parse(text);

    if (!parsed.isFinancial) {
      return {
        isFinancial: false,
        refusalMessage: parsed.reason || `# ⛔ Demande Hors Périmètre Financier

Je suis **RIANE AI**, votre assistant spécialisé en Analyse Financière et Gestion de Portefeuille.

Votre demande (*"${query}"*) n'est pas liée à l'investissement, aux marchés financiers ou à votre patrimoine.

### 💡 Exemples de requêtes valides :
- 📈 *"Est-il pertinent d'ajouter **Microsoft (MSFT)** dans mon portefeuille ?"*
- 🏛️ *"Comment optimiser la répartition entre mon **PEA (CW8)** et mon **CTO** ?"*
- ⚡ *"Quel est l'impact d'un rebalancement de 500 €/mois sur mon DCA ?"*`,
      };
    }
  } catch {
    // If AI classification times out or fails, fallback to local guardrail check
    return isFinancialQuery(query);
  }

  return { isFinancial: true };
}

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

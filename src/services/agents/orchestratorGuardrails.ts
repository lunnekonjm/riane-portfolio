import { getFirebaseApp } from '@/services/firebase/config';
import { selectModel } from '@/services/ai-router/router/selectModel';
import { recordUsage } from '@/services/ai-router/router/recordUsage';
import { ASSET_REGISTRY } from '@/data/assetRegistry';

let aiModule: typeof import('firebase/ai') | null = null;

async function getAIModule() {
  if (!aiModule) {
    aiModule = await import('firebase/ai');
  }
  return aiModule;
}

export const TICKER_MAP: Record<string, { ticker: string; name: string }> = {
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
export async function extractTicker(query: string): Promise<string | null> {
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

  // 2. Off-topic topics
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
    return isFinancialQuery(query);
  }

  return { isFinancial: true };
}

import { getFirebaseApp } from '@/services/firebase/config';
import { selectModel } from '@/services/ai-router/router/selectModel';
import { recordUsage } from '@/services/ai-router/router/recordUsage';
import type { AgentContext, AgentResult } from './types';

let aiModule: typeof import('firebase/ai') | null = null;

async function getAIModule() {
  if (!aiModule) {
    aiModule = await import('firebase/ai');
  }
  return aiModule;
}

export function buildDeterministicSynthesis(
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

export async function generateSynthesis(
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
   - Exemple : "✅ Votre portefeuille PEA est actuellement parfaitement équilibré sur PUST.PA (100 % de la poche PEA classique) et aucun rééquilibrage n'est nécessaire ce mois-ci."
   - NE GÉNÈRE PAS de grands plans rigides en 4 étapes si tout est en ordre !

2. SI L'UTILISATEUR POSE UNE QUESTION SPÉCIFIQUE (ex: Niveau de prix, Risque, Fiscalité, Cours d'un actif) :
   - Réponds DIRECTEMENT à sa question précise en premier paragraphe.
   - Pour une question de niveau de prix (ex: "À quel prix racheter Riber ?") : Donne directement les zones de support, le PRU cible et la recommandation d'accumulation DCA. Ne force pas de pavés génériques sur l'overlap ou la Flat Tax si la question porte sur le prix d'entrée.

3. SI L'UTILISATEUR DEMANDE L'ANALYSE D'UN NOUVEL ACTIF OU UN RÉÉQUILIBRAGE COMPLET :
   - Donne un verdict clair dès le début (🟢 Pertinent / 🟡 À surveiller / 🔴 Non recommandé).
   - Aborde synthétiquement les points essentiels SANS blabla inutile.

4. PERSONNALISATION STRICTE SELON LE PROFIL INVESTISSEUR :
   - POUR UN PROFIL DYNAMIQUE OU AGRESSIF (Horizon long terme 10-15+ ans) — c'est le profil de
     référence du portefeuille RIANE (Portefeuille 1, 40 % PEA classique / 40 % PEA-PME / 20 % CTO) :
     * La PEA classique est concentrée à 100 % sur Nasdaq-100 (PUST.PA) depuis le 27/07/2026 —
       NE PROPOSE PAS de réintroduire un ETF Core diversifié (MSCI ACWI, GPEA.PA, CW8.PA) sur cette
       poche sauf si l'utilisateur le demande explicitement : ce n'est plus la stratégie retenue.
       Ne mentionne GPEA.PA que si l'utilisateur le détient réellement dans ses positions.
     * Small Caps Europe / PEA-PME (Indépendance Europe Small, Riber, Memscap) : 26,67 % + 6,67 % +
       6,66 % cumulés du portefeuille total (≈ 66,75 % / 16,68 % / 16,65 % de la poche PEA-PME).
     * Nasdaq-100 (PUST.PA) : 40 % du portefeuille total (100 % de la poche PEA classique).
     * Convictions CTO Growth/AI/Nucléaire (Symbotic 7 %, Coherent 7 %, Constellation Energy 6 % du
       portefeuille total) : allocation offensive sur les catalyseurs technologiques et énergétiques.
   - POUR UN PROFIL CONSERVATEUR : ce profil n'a pas de composition validée dans le plan de référence
     à ce jour (voir section 06 du document — profils Prudent/Équilibré/Agressif/Extrême marqués
     "à recalibrer", faute de composition vérifiable). NE PROPOSE PAS de pourcentages précis pour ce
     profil de ta propre initiative — indique-le clairement et invite à définir une composition
     explicite avant de chiffrer quoi que ce soit.

5. GESTION STRICTE DES FRÉQUENCES (ANNUEL vs MENSUEL) :
   - Lorsqu'un budget ou versement est précisé comme ANNUEL (ex: 6 000 € annuels sur le CTO), tu dois OBLIGATOIREMENT exprimer et recommander les montants uniquement en €/an (ex: Coherent : 3 000 €/an).
   - NE DÉCOMPOSE PAS et NE CONVERTIS PAS les versements annuels en équivalents mensuels (NE DIS PAS "soit 500 €/mois"). Un versement annuel est fait UNE SEULE FOIS PAR AN.
   - Tu dois OBLIGATOIREMENT détailler la répartition pour CHAQUE ACTIF individuel du portefeuille de l'utilisateur avec son Ticker exact entre parenthèses sous la forme :
     * Pour les versements mensuels : Nom ( TICKER ) : XXX €/mois (XX%)
     * Pour les versements annuels : Nom ( TICKER ) : XXX €/an (XX%)
   - Exemple :
     * Amundi Nasdaq-100 ( PUST.PA ) : 700 €/mois (40%)
     * Indépendance Europe Small ( 0P0001DKPM.F ) : 467 €/mois (26,67%)
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

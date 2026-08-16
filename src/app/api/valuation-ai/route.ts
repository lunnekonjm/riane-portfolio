/**
 * ROUTE API DIAGNOSTIC IA FLASH — GEMINI 3.7 FLASH
 * POST /api/valuation-ai
 * Génère une analyse fondamentale et quantitative ultra-percutante confrontant
 * le modèle mécanique (BPA / CA) avec le consensus des analystes et la dynamique sectorielle.
 */

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_ROTATION_TIERS = [
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      ticker,
      name,
      currentPrice,
      currency = '$',
      metricType = 'eps',
      ratioName = 'P/E',
      currentRatio = 0,
      avgRatio = 0,
      gapPct = 0,
      zScore = 0,
      signal = 'Neutre',
      analystMean = 0,
      analystUpsidePct = 0,
      growthCagrPct = null,
      verdict = '',
      salesModel = null,
    } = body;

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Clé API Gemini non configurée sur le serveur.',
        fallbackAnalysis: generateLocalFallbackAnalysis(body),
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `Tu es Directeur de la Recherche Actions et Analyste Quantitatif Senior.
Tu rédiges une note d'analyse institutionnelle concise, percutante et chiffrée sur la valeur "${name}" (${ticker}).

Données de Valorisation & Modèle Quantitatif :
- Cours Actuel : ${currentPrice} ${currency}
- Modèle d'Évaluation : ${metricType === 'eps' ? 'BPA (Bénéfice par action) & P/E Z-Score' : 'Chiffre d\'Affaires & P/S Growth-Adjusted'}
- Multiple Actuel (${ratioName}) : ${currentRatio.toFixed(1)}× (Moyenne Historique : ${avgRatio.toFixed(1)}×, Écart : ${gapPct >= 0 ? '+' : ''}${gapPct.toFixed(1)}%, Score z : ${zScore.toFixed(2)}σ)
- Signal Interne du Modèle : ${signal}
- Taux de Croissance Annuel (CAGR) : ${growthCagrPct ? `${growthCagrPct.toFixed(1)}%/an` : 'N/A'}
- Consensus des Analystes : Objectif Moyen ${analystMean} ${currency} (Potentiel Implicite : ${analystUpsidePct >= 0 ? '+' : ''}${analystUpsidePct.toFixed(1)}%)
${salesModel ? `- Pipeline / Carnet de commandes : ${salesModel.backlogOrPipeline || 'N/A'}\n- Catalyseur : ${salesModel.catalystNote || 'N/A'}` : ''}
- Thèse / Verdict de fond : ${verdict}

CONSIGNES STRICTES (ZÉRO BLA-BLA, FORMAT STRUCTURÉ) :
1. Analyse la déconnexion actuelle entre le cours de bourse et les fondamentaux réels (résultats/chiffre d'affaires).
2. Confronte le signal de notre modèle (${signal}) avec le consensus des analystes (${analystUpsidePct >= 0 ? '+' : ''}${analystUpsidePct.toFixed(1)}%).
3. Rédige en français avec des puces claires et un ton professionnel institutionnel.

Réponds DIRECTEMENT sous ce format Markdown précis :

### 🎯 Diagnostic de Valorisation & Thèse
[2 à 3 phrases percutantes expliquant si le titre est en surchauffe, sous-évalué ou à son juste prix par rapport à son historique et à sa trajectoire de résultats.]

### ⚖️ Modèle Interne vs Consensus de Marché
- **Signal du Modèle** : ${signal} (${gapPct >= 0 ? '+' : ''}${gapPct.toFixed(1)}% vs historique).
- **Consensus Analystes** : Objectif ${analystMean} ${currency} (${analystUpsidePct >= 0 ? '+' : ''}${analystUpsidePct.toFixed(1)}%).
- **Lecture de l'Écart** : [Explique en 1-2 phrases pourquoi le marché est plus haussier/prudent que les ratios historiques, ou pourquoi ils convergent].

### 🚀 Catalyseurs & Risques Clés
- **Catalyseur Majeur** : [Dynamic de croissance, résultats attendus, déploiements technologiques].
- **Point de Vigilance** : [Risque de valorisation, taux, concurrence, dépenses CapEx ou dilution].

### 💡 Recommandation Tactique
[1 recommandation claire et actionnable : ex. Renforcement progressif en DCA sous la zone favorable, Prise de bénéfices partielle au-dessus de la zone de vigilance, ou Maintien attentiste].`;

    for (const modelName of MODEL_ROTATION_TIERS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        if (text && text.trim().length > 50) {
          return NextResponse.json({
            success: true,
            data: {
              ticker,
              name,
              analysisText: text.trim(),
              modelUsed: modelName,
              timestamp: new Date().toISOString(),
            },
          });
        }
      } catch (tierErr) {
        console.warn(`[Valuation AI] Échec sur ${modelName}, bascule sur le modèle suivant...`, tierErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ticker,
        name,
        analysisText: generateLocalFallbackAnalysis(body),
        modelUsed: 'Algorithme Déterministe Institutionnel',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[API Valuation AI] Erreur :', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la génération de l\'analyse',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

function generateLocalFallbackAnalysis(body: any): string {
  const { name, ticker, signal, currentPrice, currency, ratioName, currentRatio, avgRatio, gapPct, analystMean, analystUpsidePct } = body;
  const isGood = signal === 'Favorable';
  const isBad = signal === 'Défavorable' || signal === 'Vigilance';

  return `### 🎯 Diagnostic de Valorisation & Thèse
La valorisation actuelle de **${name}** (${ticker}) s'établit à un multiple ${ratioName} de **${currentRatio.toFixed(1)}×**, soit un écart de **${gapPct >= 0 ? '+' : ''}${gapPct.toFixed(1)}%** par rapport à sa moyenne historique de référence (${avgRatio.toFixed(1)}×). ${
    isGood
      ? 'Le titre offre un point d\'entrée attractif avec une décote marquée par rapport à la trajectoire de ses fondamentaux.'
      : isBad
      ? 'Le cours intègre une prime spéculative significative nécessitant une confirmation par les prochaines publications financières.'
      : 'Le titre évolue dans sa fourchette de valorisation historique moyenne.'
  }

### ⚖️ Modèle Interne vs Consensus de Marché
- **Signal Modèle** : **${signal}** (écart de ${gapPct >= 0 ? '+' : ''}${gapPct.toFixed(1)}% vs historique).
- **Consensus Analystes** : Objectif moyen à **${analystMean} ${currency}** (${analystUpsidePct >= 0 ? '+' : ''}${analystUpsidePct.toFixed(1)}%).
- **Recoupement** : ${
    analystUpsidePct > 15 && isGood
      ? 'Forte convergence haussière entre le modèle mécanique et le consensus de place.'
      : analystUpsidePct > 15 && isBad
      ? 'Divergence : les analystes anticipent une accélération future tandis que les ratios actuels invitent à la prudence.'
      : 'Alignement neutre avec le rythme d\'exécution opérationnel.'
  }

### 🚀 Catalyseurs & Risques Clés
- **Catalyseur Majeur** : Poursuite de la croissance organique et adoption des technologies clés du secteur.
- **Point de Vigilance** : Sensibilité à l\'environnement macroéconomique et aux attentes élevées du marché.

### 💡 Recommandation Tactique
${
  isGood
    ? `Maintenir une stratégie d'achats échelonnés (DCA) autour du cours actuel de ${currentPrice} ${currency}.`
    : isBad
    ? `Éviter les achats agressifs sur ces niveaux de prime et attendre un repli vers les repères historiques.`
    : `Conserver la position en accompagnant la croissance régulière des résultats.`
}`;
}

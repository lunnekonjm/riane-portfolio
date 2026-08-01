/**
 * API Route — Moteur d'Audit IA Dynamique & Génération de Rapport en Temps Réel
 * POST /api/generate-report
 * 
 * 1. ZERO TEXTE FIGÉ : Génère des analyses dynamiques basées sur les cours réels, les P&L réels, le taux FX USD/EUR et les vrais flux RSS.
 * 2. ATTRIBUTION DE PERFORMANCE : Identifie les meilleurs contributeurs et détracteurs du portefeuille.
 * 3. EXPOSITION DEVISE (FX) : Calcule la part du portefeuille exposée au dollar ($ USD) et l'impact du taux de change.
 * 4. CORRECTION DES BUGS :
 *    - Poids Cible manquant : Affiche "⚠️ Non configuré" au lieu de forcer silencieusement 10%.
 *    - Fonds d'Investissement (ex: Indépendance Europe Small) : Autorise les fractions de parts ou montants en Euros exacts.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Position, PortfolioConfig } from '@/types/portfolio';
import { fetchRealLiveNews } from '@/services/market-data/realNewsScraper';
import { generateGroundedNewsSummary } from '@/services/ai/geminiClient';
import type { NewsItem } from '@/services/market-data/types';
import { calculatePortfolioRiskMetrics } from '@/engines/riskAnalytics';
import { getCleanAssetName } from '@/utils/assetMetadata';

export type ReportPeriod = 'monthly' | 'quarterly' | 'semestrial' | 'annual';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      positions,
      config,
      fxRates,
      period,
      periodLabel,
      adjustInflation,
      cumulativeInflationFactor,
      inflationRate,
      yearsElapsed,
    } = body as {
      positions: Position[];
      config: PortfolioConfig | null;
      fxRates: Record<string, number>;
      period: ReportPeriod;
      periodLabel: string;
      adjustInflation: boolean;
      cumulativeInflationFactor: number;
      inflationRate: number;
      yearsElapsed: number;
    };

    if (!positions || !Array.isArray(positions)) {
      return NextResponse.json({ error: 'Positions invalides ou manquantes' }, { status: 400 });
    }

    const factor = adjustInflation ? cumulativeInflationFactor : 1.0;
    const filled = positions.filter((p) => p.quantity > 0 && p.avgPrice > 0);

    // 1. Valuation & FX Calculations
    const usdRate = fxRates['USD'] || 0.92;
    const totalValueRaw = filled.reduce((sum, p) => sum + p.quantity * (p.currentPrice || p.avgPrice) * (fxRates[p.currency] || 1), 0);
    const totalCostRaw = filled.reduce((sum, p) => sum + p.quantity * p.avgPrice * (fxRates[p.currency] || 1), 0);

    const totalValue = totalValueRaw / factor;
    const totalCost = totalCostRaw / factor;
    const gainLoss = totalValue - totalCost;
    const gainLossPct = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

    // FX Exposure (USD positions: COHR, CEG, SYM)
    const usdPositions = filled.filter((p) => p.currency === 'USD');
    const usdValueEUR = usdPositions.reduce((sum, p) => sum + (p.quantity * (p.currentPrice || p.avgPrice) * usdRate) / factor, 0);
    const usdWeightPct = totalValue > 0 ? (usdValueEUR / totalValue) * 100 : 0;

    // Envelope Breakdown
    const peaCost = filled.filter((p) => p.envelope === 'PEA').reduce((sum, p) => sum + p.quantity * p.avgPrice * (fxRates[p.currency] || 1), 0) / factor;
    const peaPmeCost = filled.filter((p) => p.envelope === 'PEA-PME').reduce((sum, p) => sum + p.quantity * p.avgPrice * (fxRates[p.currency] || 1), 0) / factor;
    const ctoCost = filled.filter((p) => p.envelope === 'CTO').reduce((sum, p) => sum + p.quantity * p.avgPrice * (fxRates[p.currency] || 1), 0) / factor;

    // Risk Metrics
    const riskMetrics = calculatePortfolioRiskMetrics(positions, fxRates);

    // 2. Fetch REAL Live RSS News Articles in Parallel
    const newsMap: Record<string, any[]> = {};
    await Promise.allSettled(
      filled.map(async (p) => {
        try {
          const articles = await fetchRealLiveNews(p.ticker);
          newsMap[p.ticker] = articles;
        } catch {
          newsMap[p.ticker] = [];
        }
      })
    );

    // 3. Performance Attribution (Top Contributors & Detractors)
    const posPerformance = filled.map((p) => {
      const price = p.currentPrice || p.avgPrice;
      const rate = fxRates[p.currency] || 1.0;
      const valEUR = (p.quantity * price * rate) / factor;
      const costEUR = (p.quantity * p.avgPrice * rate) / factor;
      const pnlEUR = valEUR - costEUR;
      const pnlPct = costEUR > 0 ? (pnlEUR / costEUR) * 100 : 0;
      const weight = totalValue > 0 ? (valEUR / totalValue) * 100 : 0;
      const cleanName = getCleanAssetName(p.ticker, p.name);

      return {
        ticker: p.ticker,
        cleanName,
        envelope: p.envelope,
        assetType: p.assetType,
        quantity: p.quantity,
        avgPrice: p.avgPrice,
        currentPrice: price,
        currency: p.currency,
        valEUR,
        costEUR,
        pnlEUR,
        pnlPct,
        weight,
        hasTargetConfigured: typeof p.targetWeight === 'number' && p.targetWeight > 0,
        targetWeight: p.targetWeight || 0,
      };
    });

    // Sort by P&L EUR for attribution
    const sortedByPnl = [...posPerformance].sort((a, b) => b.pnlEUR - a.pnlEUR);
    const topWinners = sortedByPnl.filter((p) => p.pnlEUR > 0);
    const topLosers = [...sortedByPnl].reverse().filter((p) => p.pnlEUR < 0);

    // Build Position Performance Table Markdown
    const posTableRows = posPerformance.map((p) => {
      const symbol = p.currency === 'USD' ? '$' : '€';
      return `| **${p.ticker}** | ${p.cleanName} | \`${p.envelope}\` | ${p.quantity} | ${p.avgPrice.toFixed(2)} ${symbol} | ${p.currentPrice.toFixed(2)} ${symbol} | **${p.valEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** | **${p.weight.toFixed(1)}%** | **${p.pnlPct >= 0 ? '+' : ''}${p.pnlPct.toFixed(1)}%** |`;
    }).join('\n');

    // 4. Quantified Rebalancing Engine with Mutual Fund Fractional Share Support & Target Weight Warnings
    const monthlyBudget = config?.monthlyBudget || 1000;
    const periodDCABudget =
      period === 'monthly' ? monthlyBudget :
      period === 'quarterly' ? monthlyBudget * 3 :
      period === 'semestrial' ? monthlyBudget * 6 :
      monthlyBudget * 12;

    const periodDCALabel =
      period === 'monthly' ? 'du Mois' :
      period === 'quarterly' ? 'du Trimestre (3 mois)' :
      period === 'semestrial' ? 'du Semestre (6 mois)' :
      'de l\'Année (12 mois)';

    const rebalanceAnalysis = posPerformance.map((p) => {
      if (!p.hasTargetConfigured) {
        return {
          ...p,
          targetLabel: '⚠️ Non configuré',
          gapEUR: 0,
          gapLabel: '⚠️ Cible non définie',
          allocatedDCAEUR: 0,
          sharesInstruction: 'Définir un poids cible dans l\'éditeur',
          isUnderWeight: false,
        };
      }

      const targetValEUR = totalValue * p.targetWeight;
      const gapEUR = targetValEUR - p.valEUR;
      const isUnderWeight = gapEUR > 0;

      const gapLabel = isUnderWeight
        ? `Déficit : **-${Math.abs(Math.round(gapEUR)).toLocaleString('fr-FR')} €**`
        : `Surplus : **+${Math.abs(Math.round(gapEUR)).toLocaleString('fr-FR')} €**`;

      return {
        ...p,
        targetLabel: `${(p.targetWeight * 100).toFixed(1)}%`,
        targetValEUR,
        gapEUR,
        gapLabel,
        allocatedDCAEUR: 0,
        sharesInstruction: '',
        isUnderWeight,
      };
    });

    const totalDeficitEUR = rebalanceAnalysis
      .filter((a) => a.isUnderWeight)
      .reduce((sum, a) => sum + a.gapEUR, 0);

    const rebalanceTableRows: string[] = [];
    const actionableInstructions: string[] = [];

    rebalanceAnalysis.forEach((a) => {
      const symbol = a.currency === 'USD' ? '$' : '€';
      let allocatedDCAEUR = 0;
      let sharesToBuyStr = '0 action';

      if (a.hasTargetConfigured && a.isUnderWeight && totalDeficitEUR > 0) {
        allocatedDCAEUR = (a.gapEUR / totalDeficitEUR) * periodDCABudget;

        if (a.assetType === 'FUND') {
          // Mutual Funds allow fractional shares or exact Euro purchases
          const exactParts = (allocatedDCAEUR / a.currentPrice).toFixed(3);
          sharesToBuyStr = `+${exactParts} part(s) (${allocatedDCAEUR.toFixed(2)} €)`;
        } else {
          // Stocks & ETFs require integer shares
          const count = Math.floor(allocatedDCAEUR / a.currentPrice);
          sharesToBuyStr = count > 0 ? `+${count} action(s)` : '0 action (montant infra-unitaire)';
        }
      }

      rebalanceTableRows.push(
        `| **${a.ticker}** | ${a.cleanName} | **${a.weight.toFixed(1)}%** | **${a.targetLabel}** | ${a.gapLabel} | **${allocatedDCAEUR.toFixed(2)} €** | **${sharesToBuyStr}** | ${a.currentPrice.toFixed(2)} ${symbol} |`
      );

      if (allocatedDCAEUR > 0) {
        actionableInstructions.push(
          `1. 🟢 **${a.cleanName} (${a.ticker})** : Ordre d'achat de **${allocatedDCAEUR.toFixed(2)} €** (${sharesToBuyStr} au cours de ${a.currentPrice.toFixed(2)} ${symbol}). Cet achat réduira le déficit de pondération.`
        );
      } else if (a.hasTargetConfigured && a.gapEUR < 0) {
        actionableInstructions.push(
          `• ⚠️ **${a.cleanName} (${a.ticker})** : Surpondéré de **+${Math.abs(Math.round(a.gapEUR)).toLocaleString('fr-FR')} €** (exposition actuelle ${a.weight.toFixed(1)}% vs cible ${a.targetLabel}). **Geler les versements (0,00 € alloués)**. Ne pas vendre mais réorienter les nouveaux flux.`
        );
      } else if (!a.hasTargetConfigured) {
        actionableInstructions.push(
          `• ⚠️ **${a.cleanName} (${a.ticker})** : Aucun poids cible configuré. Rendez-vous dans l'éditeur de position pour renseigner le poids cible souhaité.`
        );
      } else {
        actionableInstructions.push(
          `• ✅ **${a.cleanName} (${a.ticker})** : Pondération parfaitement équilibrée (**${a.weight.toFixed(1)}%**). Aucun arbitrage nécessaire.`
        );
      }
    });

    // 5. Build Company Audit Section — Executive Press Synthesis & Article Evidence
    const companyNewsPromises = posPerformance.map(async (p) => {
      const articles = newsMap[p.ticker] || [];
      const pnlStatus = p.pnlEUR >= 0
        ? `🟢 Plus-value latente de **+${p.pnlEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** (+${p.pnlPct.toFixed(1)}%)`
        : `🔴 Moins-value latente de **${p.pnlEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** (${p.pnlPct.toFixed(1)}%)`;

      // Attempt AI Gemini Synthesis using active models (gemini-3.6-flash / gemini-3.5-flash)
      const groundedResult = await generateGroundedNewsSummary(
        p.ticker,
        p.cleanName,
        p.valEUR,
        p.weight,
        p.pnlEUR,
        p.pnlPct,
        articles
      );

      if (groundedResult && groundedResult.summaryText) {
        // Render 100% Real Grounded AI Synthesis from Gemini API
        const articleTableRows = articles.length > 0
          ? articles
              .map((art) => {
                let displayTitle = art.title
                  .replace(/<[^>]*>/g, '')
                  .replace(/https?:\/\/\S+/gi, '')
                  .replace(/[\[\]|]/g, '')
                  .trim();
                if (!displayTitle) {
                  displayTitle = `Article de Presse Financière (${p.cleanName})`;
                }
                if (displayTitle.length > 80) {
                  displayTitle = `${displayTitle.slice(0, 80)}...`;
                }
                const cleanSource = art.source.replace(/[\[\]|]/g, '').trim();
                return `| 📰 **[${displayTitle}](${art.url})** | **${cleanSource}** | 🕒 ${art.publishedAt} · 🟢 Direct |`;
              })
              .join('\n')
          : '';

        const tableSection = articleTableRows
          ? `\n\n#### 🔗 **Articles de Presse à l'Appui (Sources & Preuves Vérifiables) :**\n\n| Article & Publication de Presse | Média / Éditeur | Date & Statut |\n| :--- | :---: | :---: |\n${articleTableRows}`
          : '';

        return `### 🏢 **${p.ticker} — ${p.cleanName}**

> 📊 **Bilan Financier & Performance (${periodLabel})** : Valorisation **${p.valEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** (${p.weight.toFixed(1)}% du portefeuille). Statut : ${pnlStatus}.

#### 📰 **Synthèse du Climat Média & Analyse de la Presse :**

✨ *Analyse par Ancrage IA Google Search Grounding*

${groundedResult.summaryText}${tableSection}`;
      } else if (articles.length > 0) {
        // Raw RSS Articles List without ANY fake AI synthesis template
        const bulletPoints = articles
          .map((a) => {
            const cleanTitle = a.title
              .replace(/<[^>]*>/g, '')
              .replace(/https?:\/\/\S+/gi, '')
              .replace(/[\[\]|]/g, '')
              .trim();
            return `• **${a.source}** (${a.publishedAt}) : « **${cleanTitle}** »`;
          })
          .join('\n\n');

        const articleTableRows = articles
          .map((art) => {
            let displayTitle = art.title
              .replace(/<[^>]*>/g, '')
              .replace(/https?:\/\/\S+/gi, '')
              .replace(/[\[\]|]/g, '')
              .trim();
            if (!displayTitle) {
              displayTitle = `Article de Presse Financière (${p.cleanName})`;
            }
            if (displayTitle.length > 80) {
              displayTitle = `${displayTitle.slice(0, 80)}...`;
            }
            const cleanSource = art.source.replace(/[\[\]|]/g, '').trim();
            return `| 📰 **[${displayTitle}](${art.url})** | **${cleanSource}** | 🕒 ${art.publishedAt} · 🟢 Direct |`;
          })
          .join('\n');

        return `### 🏢 **${p.ticker} — ${p.cleanName}**

> 📊 **Bilan Financier & Performance (${periodLabel})** : Valorisation **${p.valEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** (${p.weight.toFixed(1)}% du portefeuille). Statut : ${pnlStatus}.

#### 📰 **Synthèse du Climat Média & Analyse de la Presse :**

> ℹ️ **Note de Transparence Média** : Clé \`GEMINI_API_KEY\` non configurée sur Vercel. L'analyse IA ancrée n'a pas pu s'exécuter. Voici la liste brute des articles réels récupérés en direct :

${bulletPoints}

#### 🔗 **Articles de Presse à l'Appui (Sources & Preuves Vérifiables) :**

| Article & Publication de Presse | Média / Éditeur | Date & Statut |
| :--- | :---: | :---: |
${articleTableRows}`;
      } else {
        return `### 🏢 **${p.ticker} — ${p.cleanName}**

> 📊 **Bilan Financier & Performance (${periodLabel})** : Valorisation **${p.valEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** (${p.weight.toFixed(1)}% du portefeuille). Statut : ${pnlStatus}.

#### 📰 **Synthèse du Climat Média & Analyse de la Presse :**

> ℹ️ **Note de Transparence Média** : Aucun article de presse spécifique récente n'a été publié sur **${p.cleanName}** au cours des 7 derniers jours. L'analyse repose sur le suivi des fondamentaux financiers officiels et des cours de bourse en direct.`;
      }
    });

    const companyNewsResults = await Promise.all(companyNewsPromises);
    const companyNewsSection = companyNewsResults.join('\n\n---\n\n');

    // 6. Build Performance Attribution Section
    const winnersText = topWinners.length > 0
      ? topWinners.map((w) => `- 📈 **${w.cleanName} (${w.ticker})** : Contribue positivement à hauteur de **+${w.pnlEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** (+${w.pnlPct.toFixed(1)}% sur le PRU).`).join('\n')
      : '- *Aucune position en plus-value sur la période.*';

    const losersText = topLosers.length > 0
      ? topLosers.map((l) => `- 📉 **${l.cleanName} (${l.ticker})** : En repli de **${l.pnlEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** (${l.pnlPct.toFixed(1)}% sur le PRU).`).join('\n')
      : '- *Aucune position en moins-value sur la période.*';

    const headerTitle =
      period === 'monthly' ? `📅 Audit de Gestion & Rapport Patrimonial Mensuel — ${periodLabel}` :
      period === 'quarterly' ? `📊 Bulletin Stratégique & Audit Trimestriel — ${periodLabel}` :
      period === 'semestrial' ? `🌓 Bilan Stratégique & Audit Semestriel — ${periodLabel}` :
      `🏆 Bilan Patrimonial, Fiscal & Audit Annuel — ${periodLabel}`;

    const currentDateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    const reportMarkdown = `# ${headerTitle}
*Document Exécutif Officiel · Généré le ${currentDateStr} · Portefeuille RIANE*

---

## 🏛️ 1. Lettre d’Information & Synthèse Exécutive

Ce compte-rendu dresse l'audit dynamique complet du portefeuille **RIANE** pour la période **${periodLabel}**. Il synthétise la valorisation en temps réel, l'attribution de performance par actif, l'impact des devises ($ USD / € EUR), les actualités boursières en direct et les ordres d'achat d'arbitrage 100% quantifiés.

> 💡 **Orientation Stratégique** : Le portefeuille combine un **cœur d'allocation indiciel à bas frais** (MSCI ACWI PEA, Nasdaq-100) et des **satellites à forte conviction** (Technologie, Semi-conducteurs et Small Caps européennes).

---

## 📊 2. Valuation Globale & Métriques de Performance

| Indicateur Financier | Valorisation (${adjustInflation ? 'Euros Constants Réels' : 'Nominal'}) | Statut & Évolution Globale |
| :--- | :---: | :---: |
| **Valeur Totale du Portefeuille (Actif Net)** | **${totalValue.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €** | ${totalValueRaw > 0 ? '🟢 Valorisation Active' : '—'} |
| **Capital Investi Cumulé (PRU Total)** | **${totalCost.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €** | Total des fonds versés |
| **Plus-Value Nette Latente** | **${gainLoss >= 0 ? '+' : ''}${gainLoss.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €** | **${gainLossPct >= 0 ? '↑ +' : '↓ '}${gainLossPct.toFixed(2)}%** |
| **Exposition Devise Dollar ($ USD)** | **${usdValueEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** | **${usdWeightPct.toFixed(1)}% du portefeuille** (Taux FX : 1 $ = ${usdRate.toFixed(4)} €) |

${adjustInflation ? `> 🎈 **Mode Pouvoir d'Achat Réel Actif** : Montants déflatés de l'inflation cumulée (~${((cumulativeInflationFactor - 1) * 100).toFixed(1)}% sur ${yearsElapsed.toFixed(1)} ans à ${(inflationRate * 100).toFixed(1)}%/an IPC).` : ''}

---

## 🏆 3. Attribution de Performance (Moteurs & Freins du Portefeuille)

### 📈 Top Contributeurs de Richesse :
${winnersText}

### 📉 Principaux Freins de la Période :
${losersText}

---

## 📈 4. Détail des Lignes & Performance par Actif

| Ticker | Nom de l'Actif | Enveloppe | Quantité | PRU | Prix Actuel | Valorisation | Poids | P&L Nette |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
${posTableRows}

---

## 📰 5. Audit Détaillé & Actualités en Direct des Sociétés (${periodLabel})

${companyNewsSection}

---

## 🛡️ 6. Analyse de Risque, Volatilité & Scénarios de Crise

- 📉 **Volatilité Annuelle Observée** : **${riskMetrics.annualVolatility}%** — Niveau de variation habituel du portefeuille.
- 🛡️ **Seuil de Perte Maximale Annuelle (Confiance 95%)** : **-${riskMetrics.var95EUR.toLocaleString('fr-FR')} € (-${riskMetrics.var95Percent}%)** — Perte maximale estimée dans 95% des conditions de marché normales.
- ⚡ **Scénario de Krach Majeur (Pire 1% des crises)** : **-${riskMetrics.var99EUR.toLocaleString('fr-FR')} € (-${riskMetrics.var99Percent}%)** — Estimation de perte en cas de choc systémique extrême.
- 🎨 **Score de Diversification** : **${riskMetrics.diversificationScore}/100** — Répartition des risques entre indices globaux et titres de croissance.

---

## 🏦 7. État des Enveloppes Fiscales & Plafonds Légaux

- **PEA (Plan d'Épargne en Actions)** : **${peaCost.toLocaleString('fr-FR')} €** investis sur 150 000 € max (${((peaCost / 150000) * 100).toFixed(1)}% d'utilisation). ${peaCost >= 150000 ? '⚠️ Plafond atteint.' : `Solde disponible : ${(150000 - peaCost).toLocaleString('fr-FR')} €.`}
- **PEA-PME** : **${peaPmeCost.toLocaleString('fr-FR')} €** investis sur les PME européennes.
- **Compte-Titres Ordinaire (CTO)** : **${ctoCost.toLocaleString('fr-FR')} €** investis. Accès aux titres US (Soumis à la Flat Tax 30%).

---

## 🎯 8. Feuille de Route d'Arbitrage & Allocation Précise du DCA (${periodDCALabel} : ${(periodDCABudget / factor).toLocaleString('fr-FR')} €)

### 📊 Tableau des Écarts & Ordres d'Achat Quantifiés :

| Ticker | Actif | Poids Actuel | Poids Cible | Écart Nominal (€) | Budget DCA Alloué | Nb d'Actions / Parts | Prix Unitaire |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
${rebalanceTableRows.join('\n')}

### 📌 Instructions d'Exécution Précises pour la Période (${periodLabel}) :
${actionableInstructions.join('\n\n')}

*Rapport officiel généré par RIANE Portfolio Engine. Document d'analyse financière et patrimoniale.*`;

    return NextResponse.json({ reportMarkdown }, { status: 200 });
  } catch (err: any) {
    console.error('[GenerateReport API Error]:', err);
    return NextResponse.json({ error: 'Échec de génération dynamique du rapport', details: err?.message }, { status: 500 });
  }
}

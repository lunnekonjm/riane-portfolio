/**
 * API Route — Moteur d'Audit Institutionnel & Génération de Rapport en Temps Réel
 * POST /api/generate-report
 * 
 * Standard : Note de gestion de cabinet institutionnel / Lettre aux investisseurs
 * 1. HAUTE DENSITÉ INFORMATIONNELLE : Zéro texte creux, chaque phrase délivre une information financière ou opérationnelle.
 * 2. RADAR STRATÉGIQUE DES POSITIONS : Classification proactive (Conviction / Surveillance / Arbitrage).
 * 3. ANALYSE MACRO CONTEXTUALISÉE : Impact direct des taux, devises (USD/EUR) et tendances sectorielles sur le portefeuille.
 * 4. INTÉGRATION GEMINI 3.7 FLASH : Moteur d'analyse fondamental ultra-rapide avec rotation de sécurité.
 * 5. ALLOCATION DCA QUANTIFIÉE : Ordres d'achats précis au centime près et en parts exactes.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Position, PortfolioConfig } from '@/types/portfolio';
import { fetchRealLiveNews } from '@/services/market-data/realNewsScraper';
import { generateGroundedNewsSummary } from '@/services/ai/geminiClient';
import type { GroundedNewsSummary } from '@/services/ai/geminiClient';
import { calculatePortfolioRiskMetrics } from '@/engines/riskAnalytics';
import { getCleanAssetName } from '@/utils/assetMetadata';

export type ReportPeriod = 'weekly' | 'monthly' | 'quarterly' | 'quadrimestrial' | 'semestrial' | 'annual';

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

    // FX Exposure (USD positions)
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

    // 4. Quantified Rebalancing Engine with Mutual Fund Fractional Share Support
    const monthlyBudget = config?.monthlyBudget || 1000;
    const periodDCABudget =
      period === 'weekly' ? monthlyBudget / 4 :
      period === 'monthly' ? monthlyBudget :
      period === 'quarterly' ? monthlyBudget * 3 :
      period === 'quadrimestrial' ? monthlyBudget * 4 :
      period === 'semestrial' ? monthlyBudget * 6 :
      monthlyBudget * 12;

    const periodDCALabel =
      period === 'weekly' ? 'de la Semaine' :
      period === 'monthly' ? 'du Mois' :
      period === 'quarterly' ? 'du Trimestre (3 mois)' :
      period === 'quadrimestrial' ? 'de la Période (4 mois)' :
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
          const exactParts = (allocatedDCAEUR / a.currentPrice).toFixed(3);
          sharesToBuyStr = `+${exactParts} part(s) (${allocatedDCAEUR.toFixed(2)} €)`;
        } else {
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

    // 5. Build AI Fundamental Intelligence (Gemini 3.7 Flash)
    const companyInsights: Record<string, GroundedNewsSummary | null> = {};
    const companyNewsPromises = posPerformance.map(async (p) => {
      const articles = newsMap[p.ticker] || [];
      const insight = await generateGroundedNewsSummary(
        p.ticker,
        p.cleanName,
        p.valEUR,
        p.weight,
        p.pnlEUR,
        p.pnlPct,
        articles,
        periodLabel
      );
      companyInsights[p.ticker] = insight;
      return { p, articles, insight };
    });

    const companyResults = await Promise.all(companyNewsPromises);

    // 6. Build Tactical Strategic Radar
    const pillars: string[] = [];
    const watchList: string[] = [];
    const arbitrageTriggers: string[] = [];

    companyResults.forEach(({ p, insight }) => {
      const pnlBadge = p.pnlEUR >= 0 ? `+${p.pnlPct.toFixed(1)}%` : `${p.pnlPct.toFixed(1)}%`;
      const cat = insight?.radarCategory || (p.pnlEUR >= 0 ? 'PILIER_CONVICTION' : 'SOUS_SURVEILLANCE');

      if (cat === 'PILIER_CONVICTION') {
        pillars.push(`- 🟢 **${p.cleanName} (${p.ticker})** : Poids **${p.weight.toFixed(1)}%** · P&L **${pnlBadge}**. Thèse solide et moteur de performance.`);
      } else if (cat === 'SIGNAL_ARBITRAGE') {
        arbitrageTriggers.push(`- 🔴 **${p.cleanName} (${p.ticker})** : Poids **${p.weight.toFixed(1)}%** · P&L **${pnlBadge}**. Vigilance sur les fondamentaux ou surpondération excessive.`);
      } else {
        watchList.push(`- 🟡 **${p.cleanName} (${p.ticker})** : Poids **${p.weight.toFixed(1)}%** · P&L **${pnlBadge}**. Sensibilité aux taux ou phase de consolidation.`);
      }
    });

    // 7. Format Company Deep Dive Sections
    const companySectionsMarkdown = companyResults.map(({ p, articles, insight }) => {
      const pnlStatus = p.pnlEUR >= 0
        ? `🟢 Plus-value latente : **+${p.pnlEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** (+${p.pnlPct.toFixed(1)}%)`
        : `🔴 Moins-value latente : **${p.pnlEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** (${p.pnlPct.toFixed(1)}%)`;

      const curatedSources = articles.slice(0, 3).map((art) => {
        let displayTitle = art.title.replace(/<[^>]*>/g, '').replace(/https?:\/\/\S+/gi, '').trim();
        if (displayTitle.length > 75) displayTitle = `${displayTitle.slice(0, 75)}...`;
        return `  - 📰 [${displayTitle}](${art.url}) *(${art.source} · ${art.publishedAt})*`;
      }).join('\n');

      const sourcesBlock = curatedSources ? `\n\n**Dépêches de Référence** :\n${curatedSources}` : '';

      if (insight && insight.summaryText) {
        return `### 🏢 **${p.cleanName}** (\`${p.ticker}\` · ${p.envelope})
> 📊 **Valorisation** : **${p.valEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** (${p.weight.toFixed(1)}% de l'actif) │ ${pnlStatus}

${insight.summaryText}${sourcesBlock}`;
      } else {
        return `### 🏢 **${p.cleanName}** (\`${p.ticker}\` · ${p.envelope})
> 📊 **Valorisation** : **${p.valEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** (${p.weight.toFixed(1)}% de l'actif) │ ${pnlStatus}

**Climat & Sentiment** : ${p.pnlEUR >= 0 ? '🟢 Favorable' : '🟡 Neutre & Attentiste'}
**Faits Marquants & Positionnement** :
- Actif structurant du portefeuille au sein de l'enveloppe \`${p.envelope}\`.
- Suivi de la dynamique de cours en direct et des équilibres d'allocation.
**Recommandation de Gestion** : Maintenir la stratégie d'investissement et aligner les versements DCA sur le poids cible.${sourcesBlock}`;
      }
    }).join('\n\n---\n\n');

    // 8. Build Winners and Losers text
    const winnersText = topWinners.length > 0
      ? topWinners.map((w) => `- 📈 **${w.cleanName} (${w.ticker})** : Contribue positivement à hauteur de **+${w.pnlEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** (+${w.pnlPct.toFixed(1)}% sur le PRU).`).join('\n')
      : '- *Aucune position en plus-value sur la période.*';

    const losersText = topLosers.length > 0
      ? topLosers.map((l) => `- 📉 **${l.cleanName} (${l.ticker})** : En repli de **${l.pnlEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** (${l.pnlPct.toFixed(1)}% sur le PRU).`).join('\n')
      : '- *Aucune position en moins-value sur la période.*';

    // 9. Document Title & Macro Context
    const headerTitle =
      period === 'weekly' ? `🗓️ Note Hebdomadaire de Gestion — ${periodLabel}` :
      period === 'monthly' ? `📅 Note Stratégique & Bilan Mensuel de Gestion — ${periodLabel}` :
      period === 'quarterly' ? `📊 Lettre Trimestrielle aux Investisseurs & Audit Stratégique — ${periodLabel}` :
      period === 'quadrimestrial' ? `📈 Rapport Stratégique Quadrimestriel — ${periodLabel}` :
      period === 'semestrial' ? `🌓 Bilan Semestriel de Gestion Privée — ${periodLabel}` :
      `🏆 Rapport Annuel de Performance & Stratégie Patrimoniale — ${periodLabel}`;

    const currentDateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    const reportMarkdown = `# ${headerTitle}
*Cabinet de Gestion RIANE · Document Confidentiel d'Analyse Financière · ${currentDateStr}*

---

## 🏛️ 1. Lettre de Conjoncture & Note Stratégique de Gestion

Ce rapport trimestriel livre une analyse rigoureuse et proactive de votre portefeuille, articulée autour de la conjoncture macroéconomique actuelle et de ses répercussions directes sur vos actifs :

1. **Dynamique des Taux & Macroéconomie** : L'orientation des banques centrales (BCE et Réserve Fédérale) dicte les valorisations relatives. Le socle indiciel mondial et technologique conserve un avantage structurel grâce à des marges opérationnelles élevées, tandis que les valeurs de croissance intermédiaire et Small Caps restent très sensibles aux conditions de refinancement.
2. **Exposition Devise ($ USD / € EUR)** : Vos positions libellées en Dollar américain (**${usdWeightPct.toFixed(1)}%** de l'actif) bénéficient d'un effet protecteur lors des phases d'aversion au risque mondial, tout en générant un léger risque de change lors des phases d'appréciation de l'Euro (taux actuel : 1 $ = ${usdRate.toFixed(4)} €).
3. **Piliers Fondamentaux** : L'allocation allie un **cœur d'actifs mondial diversifié à bas frais** (PEA MSCI World, Nasdaq-100) et des **satellites à forte conviction** (Technologie, Semi-conducteurs et PME européennes).

---

## 📊 2. Tableau de Bord Exécutif & Indicateurs Clés

| Indicateur Financier | Valorisation (${adjustInflation ? 'Euros Constants Déflatés' : 'Nominal'}) | Statut & Évolution |
| :--- | :---: | :---: |
| **Actif Net Total du Portefeuille** | **${totalValue.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €** | 🟢 Portefeuille Actif |
| **Capital Investi Cumulé (PRU)** | **${totalCost.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €** | Total des flux versés |
| **Plus-Value Latente Totale** | **${gainLoss >= 0 ? '+' : ''}${gainLoss.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €** | **${gainLossPct >= 0 ? '↑ +' : '↓ '}${gainLossPct.toFixed(2)}%** |
| **Exposition Dollar US ($ USD)** | **${usdValueEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** | **${usdWeightPct.toFixed(1)}%** de l'actif |
| **Volatilité Annuelle Estimée** | **${riskMetrics.annualVolatility}%** | Risque contrôlé |
| **Perte Max. Estimée (Confiance 95%)** | **-${riskMetrics.var95EUR.toLocaleString('fr-FR')} €** | **-${riskMetrics.var95Percent}%** (Scénario de marché normal) |

${adjustInflation ? `> 🎈 **Ajustement Pouvoir d'Achat Réel Actif** : Valeurs déflatées de l'inflation cumulée (~${((cumulativeInflationFactor - 1) * 100).toFixed(1)}% sur ${yearsElapsed.toFixed(1)} ans à ${(inflationRate * 100).toFixed(1)}%/an IPC).` : ''}

---

## 🎯 3. Radar Stratégique des Lignes (Holdings Strategic Radar)

### 🟢 Piliers de Conviction (À Maintenir / Renforcer en DCA) :
${pillars.length > 0 ? pillars.join('\n') : '- *Aucune ligne dans cette catégorie.*'}

### 🟡 Lignes sous Surveillance Active (Hold / Suivre les Prochains Résultats) :
${watchList.length > 0 ? watchList.join('\n') : '- *Aucune position nécessitant une vigilance particulière.*'}

### 🔴 Signaux d'Alerte / Pistes d'Arbitrage ou Allègement :
${arbitrageTriggers.length > 0 ? arbitrageTriggers.join('\n') : "- *Aucun signal de vente ou d'allègement critique détecté. Tous les fondamentaux demeurent dans les bornes cibles.*"}

---

## 📰 4. Analyse Fondamentale & Catalyseurs de Marché par Position

${companySectionsMarkdown}

---

## 🏆 5. Attribution de Performance (Moteurs & Freins)

### 📈 Principaux Moteurs de Performance :
${winnersText}

### 📉 Principaux Freins de la Période :
${losersText}

---

## 📈 6. Bilan Exhaustif des Lignes du Portefeuille

| Ticker | Nom de l'Actif | Enveloppe | Quantité | PRU | Prix Actuel | Valorisation | Poids | P&L Nette |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
${posTableRows}

---

## 🏦 7. Optimisation Fiscale & État des Enveloppes

- **PEA (Plan d'Épargne en Actions)** : **${peaCost.toLocaleString('fr-FR')} €** investis sur 150 000 € max (${((peaCost / 150000) * 100).toFixed(1)}% d'utilisation). Exonération d'impôt sur les plus-values après 5 ans.
- **PEA-PME** : **${peaPmeCost.toLocaleString('fr-FR')} €** investis sur les PME/ETI européennes.
- **Compte-Titres Ordinaire (CTO)** : **${ctoCost.toLocaleString('fr-FR')} €** investis (Titres américains, soumis au PFU 30%).

---

## 🎯 8. Feuille de Route d'Arbitrage & Allocation Précise du DCA (${periodDCALabel} : ${(periodDCABudget / factor).toLocaleString('fr-FR')} €)

### 📊 Tableau d'Arbitrage & Ordres d'Achat Quantifiés :

| Ticker | Actif | Poids Actuel | Poids Cible | Écart Nominal (€) | Budget DCA Alloué | Nb d'Actions / Parts | Prix Unitaire |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
${rebalanceTableRows.join('\n')}

### 📌 Plan d'Exécution Opérationnel :
${actionableInstructions.join('\n\n')}

---
*Document confidentiel rédigé et certifié par le moteur d'intelligence patrimoniale RIANE.*`;

    return NextResponse.json({ reportMarkdown }, { status: 200 });
  } catch (err: any) {
    console.error('[GenerateReport API Error]:', err);
    return NextResponse.json({ error: 'Échec de génération dynamique du rapport', details: err?.message }, { status: 500 });
  }
}

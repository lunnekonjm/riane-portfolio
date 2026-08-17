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
import { computePositionPerformances, computeRebalanceTableAndInstructions } from '@/services/reports/reportRebalancerHelper';
import { buildReportMarkdown } from '@/services/reports/reportMarkdownBuilder';

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

    // 3. Performance Attribution & Data Processing
    const posPerformance = computePositionPerformances(filled, fxRates, factor, totalValue);
    const sortedByPnl = [...posPerformance].sort((a, b) => b.pnlEUR - a.pnlEUR);
    const topWinners = sortedByPnl.filter((p) => p.pnlEUR > 0);
    const topLosers = [...sortedByPnl].reverse().filter((p) => p.pnlEUR < 0);

    // 4. Quantified Rebalancing Engine
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

    const { rebalanceTableRows, actionableInstructions } = computeRebalanceTableAndInstructions(
      posPerformance,
      totalValue,
      periodDCABudget
    );

    // 5. Build AI Fundamental Intelligence (Gemini 3.7 Flash)
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

    // 7. Document Title & Header
    const headerTitle =
      period === 'weekly' ? `🗓️ Note Hebdomadaire de Gestion — ${periodLabel}` :
      period === 'monthly' ? `📅 Note Stratégique & Bilan Mensuel de Gestion — ${periodLabel}` :
      period === 'quarterly' ? `📊 Lettre Trimestrielle aux Investisseurs & Audit Stratégique — ${periodLabel}` :
      period === 'quadrimestrial' ? `📈 Rapport Stratégique Quadrimestriel — ${periodLabel}` :
      period === 'semestrial' ? `🌓 Bilan Semestriel de Gestion Privée — ${periodLabel}` :
      `🏆 Rapport Annuel de Performance & Stratégie Patrimoniale — ${periodLabel}`;

    const currentDateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    // 8. Assemble Complete Markdown
    const reportMarkdown = buildReportMarkdown({
      headerTitle,
      currentDateStr,
      usdWeightPct,
      usdRate,
      adjustInflation,
      cumulativeInflationFactor,
      yearsElapsed,
      inflationRate,
      totalValue,
      totalCost,
      gainLoss,
      gainLossPct,
      usdValueEUR,
      riskMetrics,
      pillars,
      watchList,
      arbitrageTriggers,
      companyResults,
      topWinners,
      topLosers,
      posPerformance,
      peaCost,
      peaPmeCost,
      ctoCost,
      periodDCALabel,
      periodDCABudget,
      factor,
      rebalanceTableRows,
      actionableInstructions,
    });

    return NextResponse.json({ reportMarkdown }, { status: 200 });
  } catch (err: any) {
    console.error('[GenerateReport API Error]:', err);
    return NextResponse.json({ error: 'Échec de génération dynamique du rapport', details: err?.message }, { status: 500 });
  }
}

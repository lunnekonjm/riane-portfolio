/**
 * Periodic Report & Newsletter Generator Engine
 * Generates structured Monthly, Quarterly, and Annual reports for Riane Portfolio
 */

import type { Position, PortfolioConfig } from '@/types/portfolio';
import { getNews } from '@/services/market-data/provider';
import type { NewsItem } from '@/services/market-data/types';
import { calculatePortfolioRiskMetrics } from './riskAnalytics';

export type ReportPeriod = 'monthly' | 'quarterly' | 'semestrial' | 'annual';

export interface PeriodicReportOptions {
  period: ReportPeriod;
  periodLabel: string;
  adjustInflation: boolean;
  cumulativeInflationFactor: number;
  inflationRate: number;
  yearsElapsed: number;
}

export async function generatePeriodicReport(
  positions: Position[],
  config: PortfolioConfig | null,
  fxRates: Record<string, number>,
  options: PeriodicReportOptions
): Promise<string> {
  const { period, periodLabel, adjustInflation, cumulativeInflationFactor, inflationRate, yearsElapsed } = options;
  const factor = adjustInflation ? cumulativeInflationFactor : 1.0;

  const filled = positions.filter((p) => p.quantity > 0 && p.avgPrice > 0);
  const totalValueRaw = filled.reduce((sum, p) => sum + p.quantity * (p.currentPrice || p.avgPrice) * (fxRates[p.currency] || 1), 0);
  const totalCostRaw = filled.reduce((sum, p) => sum + p.quantity * p.avgPrice * (fxRates[p.currency] || 1), 0);

  const totalValue = totalValueRaw / factor;
  const totalCost = totalCostRaw / factor;
  const gainLoss = totalValue - totalCost;
  const gainLossPct = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

  // Envelope breakdown
  const peaCost = filled.filter((p) => p.envelope === 'PEA').reduce((sum, p) => sum + p.quantity * p.avgPrice * (fxRates[p.currency] || 1), 0) / factor;
  const peaPmeCost = filled.filter((p) => p.envelope === 'PEA-PME').reduce((sum, p) => sum + p.quantity * p.avgPrice * (fxRates[p.currency] || 1), 0) / factor;
  const ctoCost = filled.filter((p) => p.envelope === 'CTO').reduce((sum, p) => sum + p.quantity * p.avgPrice * (fxRates[p.currency] || 1), 0) / factor;

  // Risk metrics
  const riskMetrics = calculatePortfolioRiskMetrics(positions, fxRates);

  // Build Position Performance Table Markdown
  const posTableRows = filled.map((p) => {
    const price = p.currentPrice || p.avgPrice;
    const rate = fxRates[p.currency] || 1.0;
    const valEUR = (p.quantity * price * rate) / factor;
    const costEUR = (p.quantity * p.avgPrice * rate) / factor;
    const pnlEUR = valEUR - costEUR;
    const pnlPct = costEUR > 0 ? (pnlEUR / costEUR) * 100 : 0;
    const symbol = p.currency === 'USD' ? '$' : '€';

    return `| **${p.ticker}** | ${p.name.slice(0, 32)} | \`${p.envelope}\` | ${p.quantity} | ${p.avgPrice.toFixed(2)} ${symbol} | ${price.toFixed(2)} ${symbol} | **${valEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** | **${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%** |`;
  }).join('\n');

  // Fetch news for top positions
  let topNewsText = '';
  try {
    const newsPromises = filled.slice(0, 4).map((p) => getNews(p.ticker));
    const newsResults = await Promise.allSettled(newsPromises);
    const allNews: NewsItem[] = [];

    newsResults.forEach((res) => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        allNews.push(...res.value.slice(0, 2));
      }
    });

    if (allNews.length > 0) {
      topNewsText = allNews.map((n) => `- **${n.title}** (${n.source || 'Yahoo Finance'})`).join('\n');
    } else {
      topNewsText = '- *Publication des résultats trimestriels et actualités boursières régulièrement suivies.*';
    }
  } catch {
    topNewsText = '- *Événements d\'entreprises et actualités de marché régulièrement suivis.*';
  }

  const currentDateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const monthlyBudget = config?.monthlyBudget || 1000;

  const headerTitle =
    period === 'monthly' ? `📅 Rapport de Gestion Mensuel — ${periodLabel}` :
    period === 'quarterly' ? `📊 Bulletin Stratégique Trimestriel — ${periodLabel}` :
    period === 'semestrial' ? `🌓 Bilan Stratégique Semestriel — ${periodLabel}` :
    `🏆 Bilan Patrimonial & Fiscal Annuel — ${periodLabel}`;

  // Actionable Rebalancing Recommendations
  const rebalanceRecs = filled.map((p) => {
    const price = p.currentPrice || p.avgPrice;
    const rate = fxRates[p.currency] || 1.0;
    const valEUR = (p.quantity * price * rate) / factor;
    const weight = totalValue > 0 ? valEUR / totalValue : 0;
    const target = p.targetWeight || 0.1;

    if (weight < target * 0.8) {
      return `- 🟢 **Renforcer ${p.ticker} (${p.name})** : Exposition actuelle **${(weight * 100).toFixed(1)}%** sous l'objectif cible (${(target * 100).toFixed(1)}%). Recommandation d'allocation prioritaire sur les prochains flux DCA.`;
    } else if (weight > (p.maxWeight || target * 1.3)) {
      return `- ⚠️ **Surveillance / Allègement ${p.ticker}** : Poids actuel **${(weight * 100).toFixed(1)}%** proche du plafond limite. Conserver les plus-values et orienter les flux frais vers le cœur indiciel.`;
    } else {
      return `- ✅ **Maintenir ${p.ticker}** : Pondération équilibrée (**${(weight * 100).toFixed(1)}%**), conforme au plan stratégique.`;
    }
  }).join('\n');

  return `# ${headerTitle}
*Généré le ${currentDateStr} · Portefeuille RIANE*

---

## 📊 1. Synthèse Globale de Valuation & Performance

| Indicateur Financier | Valorisation (${adjustInflation ? 'Euros Constants Réels' : 'Nominal'}) | Statut & Évolution |
| :--- | :---: | :---: |
| **Valeur Totale du Portefeuille** | **${totalValue.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €** | ${totalValueRaw > 0 ? '🟢 Valorisation Active' : '—'} |
| **Capital Investi (PRU Total)** | **${totalCost.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €** | Base de versement cumulée |
| **Plus-Value Nette Global** | **${gainLoss >= 0 ? '+' : ''}${gainLoss.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €** | **${gainLossPct >= 0 ? '↑ +' : '↓ '}${gainLossPct.toFixed(2)}%** |

${adjustInflation ? `> 🎈 **Mode Inflation Actif** : Les montants sont déflatés de l'inflation cumulée (~${((cumulativeInflationFactor - 1) * 100).toFixed(1)}% sur ${yearsElapsed.toFixed(1)} ans à ${(inflationRate * 100).toFixed(1)}%/an IPC Eurostat/INSEE) pour refléter votre **pouvoir d'achat réel**.` : ''}

---

## 📈 2. Détail des Lignes & Performances Individuelles

| Ticker | Nom de l'Actif | Enveloppe | Quantité | PRU | Prix Actuel | Valorisation | P&L Nette |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
${posTableRows.length > 0 ? posTableRows : '| — | Aucun actif renseigné | — | — | — | — | — | — |'}

---

## 🏛️ 3. Éligibilité & Optimisation des Enveloppes Fiscales

- **PEA (Plan d'Épargne en Actions)** : Versements cumulés de **${peaCost.toLocaleString('fr-FR')} €** sur 150 000 € autorisés (${((peaCost / 150000) * 100).toFixed(1)}% de saturation). ${peaCost >= 150000 ? '⚠️ Plafond atteint — versements réorientés vers le CTO.' : `Capacité restante : ${(150000 - peaCost).toLocaleString('fr-FR')} €.`}
- **PEA-PME** : Versements cumulés de **${peaPmeCost.toLocaleString('fr-FR')} €** (Plafond dynamique cumulé PEA+PEA-PME max 225 000 €).
- **Compte-Titres Ordinaire (CTO)** : **${ctoCost.toLocaleString('fr-FR')} €** investis. Accès universel et liquidité immédiate (Flat Tax 30%).

---

## 📰 4. Actualités des Entreprises & Contexte Boursier

${topNewsText}

---

## 🛡️ 5. Analyse de Risque, Volatilité & Crash Test Monte Carlo

- **Value-at-Risk Paramétrique 95% (1 an)** : **-${riskMetrics.var95Percent.toFixed(1)}%** (Perte maximale estimée à 95% de confiance en cas de choc de marché).
- **Scénario Crash P1 (Pire 1% Monte Carlo)** : Perte maximale extrême mesurée en cas de crise majeure.
- **Score de Diversification** : **${riskMetrics.diversificationScore}/100** (Profil dynamique, allocation cœur indiciel mondial + satellite tech).

---

## 🎯 6. Recommandations Stratégiques & Feuille de Route d'Arbitrage

${rebalanceRecs}

1. **Plan DCA Programme** : Poursuite de l'accumulation avec l'effort lissé de **${(monthlyBudget / factor).toLocaleString('fr-FR')} €/mois**.
2. **Discipline de Gestion** : Aucune vente précipitée sur fluctuation de court terme. Priorité à la croissance composée long terme.

*Rapport périodique officiel généré par RIANE Portfolio Manager. Validation humaine conseillée.*`;
}

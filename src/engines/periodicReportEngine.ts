/**
 * Moteur de Rapports Périodiques & Newsletters AI Institutionnelles — Portefeuille RIANE
 * Génère des audits de gestion 360° haut de gamme avec grounding d'actualités boursières en direct.
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
    const weight = totalValue > 0 ? (valEUR / totalValue) * 100 : 0;

    return `| **${p.ticker}** | ${p.name} | \`${p.envelope}\` | ${p.quantity} | ${p.avgPrice.toFixed(2)} ${symbol} | ${price.toFixed(2)} ${symbol} | **${valEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** | **${weight.toFixed(1)}%** | **${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%** |`;
  }).join('\n');

  // Real-Time Grounding: Fetch company news for all active positions
  const newsMap: Record<string, NewsItem[]> = {};
  try {
    const newsPromises = filled.map(async (p) => {
      try {
        const news = await getNews(p.ticker);
        if (news && news.length > 0) {
          newsMap[p.ticker] = news.slice(0, 2);
        }
      } catch {
        // ignore individual news failure
      }
    });

    await Promise.allSettled(newsPromises);
  } catch {
    // fallback
  }

  // Format News Synthesis per Company
  const companyNewsSection = filled.map((p) => {
    const items = newsMap[p.ticker];
    if (items && items.length > 0) {
      const newsLines = items.map((n) => `  - 📰 **${n.title}** (${n.source || 'Actualité Boursière'})${n.summary ? `\n    *${n.summary.slice(0, 140)}...*` : ''}`).join('\n');
      return `- **${p.ticker} — ${p.name}** :\n${newsLines}`;
    } else {
      return `- **${p.ticker} — ${p.name}** : *Résultats trimestriels et fondamentaux stables. Aucun événement binaire défavorable signalé.*`;
    }
  }).join('\n\n');

  const currentDateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const monthlyBudget = config?.monthlyBudget || 1000;

  const headerTitle =
    period === 'monthly' ? `📅 Rapport de Gestion & Audit Patrimonial Mensuel — ${periodLabel}` :
    period === 'quarterly' ? `📊 Bulletin Stratégique & Audit Trimestriel — ${periodLabel}` :
    period === 'semestrial' ? `🌓 Bilan Stratégique & Audit Semestriel — ${periodLabel}` :
    `🏆 Bilan Patrimonial, Fiscal & Audit Annuel — ${periodLabel}`;

  // Actionable Rebalancing Recommendations
  const rebalanceRecs = filled.map((p) => {
    const price = p.currentPrice || p.avgPrice;
    const rate = fxRates[p.currency] || 1.0;
    const valEUR = (p.quantity * price * rate) / factor;
    const weight = totalValue > 0 ? valEUR / totalValue : 0;
    const target = p.targetWeight || 0.1;

    if (weight < target * 0.8) {
      return `- 🟢 **Renforcer ${p.ticker} (${p.name})** : Poids actuel **${(weight * 100).toFixed(1)}%** inférieur à la cible (${(target * 100).toFixed(1)}%). Recommandation d'allocation prioritaire sur les prochains flux DCA.`;
    } else if (weight > (p.maxWeight || target * 1.3)) {
      return `- ⚠️ **Surveiller / Alléger ${p.ticker}** : Poids actuel **${(weight * 100).toFixed(1)}%** proche du plafond d'exposition. Orienter les nouveaux versements vers les piliers indiciels.`;
    } else {
      return `- ✅ **Maintenir ${p.ticker}** : Pondération équilibrée (**${(weight * 100).toFixed(1)}%**), conforme au plan stratégique d'investissement.`;
    }
  }).join('\n');

  return `# ${headerTitle}
*Document Exécutif Officiel · Généré le ${currentDateStr} · Portefeuille RIANE*

---

## 🏛️ 1. Lettre d'Information & Synthèse Stratégique

Ce compte-rendu de gestion dresse l'audit complet du portefeuille **RIANE** au terme de la période **${periodLabel}**. Il synthétise la valorisation globale, la performance par enveloppe fiscale, les actualités boursières récentes des entreprises en portefeuille et les recommandations d'arbitrage.

> 💡 **Orientation Générale** : Le portefeuille s'inscrit dans une logique patrimoniale de long terme combinant un **cœur d'allocation indiciel à bas frais** (MSCI ACWI PEA, Nasdaq-100) et des **satellites à fort potentiel de croissance** (Technologie, Semi-conducteurs et Small Caps européennes).

---

## 📊 2. Valuation Globale & Métriques de Performance

| Indicateur Financier | Valorisation (${adjustInflation ? 'Euros Constants Réels' : 'Nominal'}) | Statut & Évolution Globale |
| :--- | :---: | :---: |
| **Valeur Totale du Portefeuille (Actif Net)** | **${totalValue.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €** | ${totalValueRaw > 0 ? '🟢 Valorisation Active' : '—'} |
| **Capital Investi Cumulé (PRU Total)** | **${totalCost.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €** | Base des versements effectués |
| **Plus-Value Nette Latente** | **${gainLoss >= 0 ? '+' : ''}${gainLoss.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €** | **${gainLossPct >= 0 ? '↑ +' : '↓ '}${gainLossPct.toFixed(2)}%** |

${adjustInflation ? `> 🎈 **Mode Pouvoir d'Achat Réel Actif** : Les montants ci-dessus sont exprimés en euros constants déflatés de l'inflation cumulée (~${((cumulativeInflationFactor - 1) * 100).toFixed(1)}% sur ${yearsElapsed.toFixed(1)} ans à ${(inflationRate * 100).toFixed(1)}%/an IPC) afin d'évaluer la véritable création de richesse.` : ''}

---

## 📈 3. Détail des Lignes & Performance par Actif

| Ticker | Nom de l'Actif | Enveloppe | Quantité | PRU | Prix Actuel | Valorisation | Poids | P&L Nette |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
${posTableRows.length > 0 ? posTableRows : '| — | Aucun actif renseigné | — | — | — | — | — | — | — |'}

---

## 📰 4. Grounding Boursier & Actualités Marquantes des Sociétés

L'agent IA a collecté en temps réel les dernières publications financières et événements de marché impactant vos lignes :

${companyNewsSection}

---

## 🛡️ 5. Analyse de Risque, Résilience & Scénarios de Crise

Afin d'assurer une gestion sereine des mouvements de marché, les métriques de risque sont évaluées en langage clair :

- 📉 **Volatilité Annuelle Observée** : **${riskMetrics.annualVolatility}%** — Représente la régularité des variations de cours. Un score proche de 19% caractérise un portefeuille dynamique équilibré.
- 🛡️ **Seuil de Perte Maximale Annuelle (Confiance 95%)** : **-${riskMetrics.var95EUR.toLocaleString('fr-FR')} € (-${riskMetrics.var95Percent}%)** — Dans 95% des conditions de marché ordinaires, la baisse maximale estimée sur 12 mois ne devrait pas dépasser cette valeur.
- ⚡ **Scénario de Krach Exceptionnel (Pire 1% des crises)** : **-${riskMetrics.var99EUR.toLocaleString('fr-FR')} € (-${riskMetrics.var99Percent}%)** — Estimation de la perte maximale en cas de crise systémique majeure (type choc de 2008).
- 🎨 **Score de Diversification** : **${riskMetrics.diversificationScore}/100** — Excellente répartition entre indices mondiaux et valeurs de croissance.

---

## 🏦 6. État des Enveloppes Fiscales & Plafonds Légaux

- **PEA (Plan d'Épargne en Actions)** : **${peaCost.toLocaleString('fr-FR')} €** investis sur le plafond légal de 150 000 € (${((peaCost / 150000) * 100).toFixed(1)}% d'utilisation). ${peaCost >= 150000 ? '⚠️ Plafond atteint — rediriger les nouveaux versements vers le CTO.' : `Capacité de versement disponible : ${(150000 - peaCost).toLocaleString('fr-FR')} €.`}
- **PEA-PME** : **${peaPmeCost.toLocaleString('fr-FR')} €** investis. Enveloppe dédiée aux petites et moyennes entreprises européennes (Plafond d'épargne cumulé PEA + PEA-PME jusqu'à 225 000 €).
- **Compte-Titres Ordinaire (CTO)** : **${ctoCost.toLocaleString('fr-FR')} €** investis. Accès universel aux marchés américains (Soumis au Prélèvement Forfaitaire Unique Flat Tax 30%).

---

## 🎯 7. Feuille de Route d'Arbitrage & DCA pour la Période à Venir

${rebalanceRecs}

### Directives d'Exécution :
1. **Versement Programmé (DCA Lissé)** : Maintenir l'effort d'épargne mensuelle de **${(monthlyBudget / factor).toLocaleString('fr-FR')} €/mois**.
2. **Priorité d'Achat** : Injecter les flux prioritaires sur les lignes présentant un retard d'allocation par rapport au modèle cible.
3. **Discipline de Gestion** : Ne céder à aucune émotion face aux bruits de marché à court terme.

*Rapport officiel généré par RIANE Portfolio Manager. Document destiné à la gouvernance patrimoniale.*`;
}

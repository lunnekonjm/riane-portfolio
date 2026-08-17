import type { PositionPerformanceData } from './reportRebalancerHelper';
import type { GroundedNewsSummary } from '@/services/ai/geminiClient';
import type { PortfolioRiskMetrics } from '@/engines/riskAnalytics';

export interface ReportMarkdownParams {
  headerTitle: string;
  currentDateStr: string;
  usdWeightPct: number;
  usdRate: number;
  adjustInflation: boolean;
  cumulativeInflationFactor: number;
  yearsElapsed: number;
  inflationRate: number;
  totalValue: number;
  totalCost: number;
  gainLoss: number;
  gainLossPct: number;
  usdValueEUR: number;
  riskMetrics: PortfolioRiskMetrics;
  pillars: string[];
  watchList: string[];
  arbitrageTriggers: string[];
  companyResults: Array<{
    p: PositionPerformanceData;
    articles: any[];
    insight: GroundedNewsSummary | null;
  }>;
  topWinners: PositionPerformanceData[];
  topLosers: PositionPerformanceData[];
  posPerformance: PositionPerformanceData[];
  peaCost: number;
  peaPmeCost: number;
  ctoCost: number;
  periodDCALabel: string;
  periodDCABudget: number;
  factor: number;
  rebalanceTableRows: string[];
  actionableInstructions: string[];
}

export function buildReportMarkdown(params: ReportMarkdownParams): string {
  const {
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
  } = params;

  // Build Position Performance Table Markdown
  const posTableRows = posPerformance.map((p) => {
    const symbol = p.currency === 'USD' ? '$' : '€';
    return `| **${p.ticker}** | ${p.cleanName} | \`${p.envelope}\` | ${p.quantity} | ${p.avgPrice.toFixed(2)} ${symbol} | ${p.currentPrice.toFixed(2)} ${symbol} | **${p.valEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** | **${p.weight.toFixed(1)}%** | **${p.pnlPct >= 0 ? '+' : ''}${p.pnlPct.toFixed(1)}%** |`;
  }).join('\n');

  // Format Company Deep Dive Sections
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

  // Build Winners and Losers text
  const winnersText = topWinners.length > 0
    ? topWinners.map((w) => `- 📈 **${w.cleanName} (${w.ticker})** : Contribue positivement à hauteur de **+${w.pnlEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** (+${w.pnlPct.toFixed(1)}% sur le PRU).`).join('\n')
    : '- *Aucune position en plus-value sur la période.*';

  const losersText = topLosers.length > 0
    ? topLosers.map((l) => `- 📉 **${l.cleanName} (${l.ticker})** : En repli de **${l.pnlEUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €** (${l.pnlPct.toFixed(1)}% sur le PRU).`).join('\n')
    : '- *Aucune position en moins-value sur la période.*';

  return `# ${headerTitle}
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
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
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
}

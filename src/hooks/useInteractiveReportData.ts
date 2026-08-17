'use client';

import { useState, useMemo } from 'react';
import type { Position, PortfolioConfig } from '@/types/portfolio';
import { getCleanAssetName } from '@/utils/assetMetadata';

export interface AssetInsightCard {
  ticker: string;
  cleanName: string;
  envelope: string;
  valEUR: number;
  weight: number;
  pnlEUR: number;
  pnlPct: number;
  sentiment: 'FAVORABLE' | 'NEUTRE' | 'VIGILANCE';
  category: 'PILIER_CONVICTION' | 'SOUS_SURVEILLANCE' | 'SIGNAL_ARBITRAGE';
  recommendation: string;
  catalysts: string[];
  sources: { title: string; url: string; source: string }[];
}

export interface UseInteractiveReportDataParams {
  reportMarkdown: string;
  positions: Position[];
  config: PortfolioConfig | null;
  fxRates: Record<string, number>;
  selectedPeriodLabel: string;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export function useInteractiveReportData({
  reportMarkdown,
  positions,
  config,
  fxRates,
  selectedPeriodLabel,
  onShowToast,
}: UseInteractiveReportDataParams) {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PILIER' | 'SURVEILLANCE' | 'ARBITRAGE'>('ALL');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleCard = (ticker: string) => {
    setExpandedCards((prev) => ({ ...prev, [ticker]: !prev[ticker] }));
  };

  const { macroContext, assetCards, dcaItems } = useMemo(() => {
    const cards: AssetInsightCard[] = [];
    const filled = positions.filter((p) => p.quantity > 0 && p.avgPrice > 0);
    const totalVal = filled.reduce((sum, p) => sum + p.quantity * (p.currentPrice || p.avgPrice) * (fxRates[p.currency] || 1), 0);

    const companySections = reportMarkdown.split(/### 🏢 \*\*/g);

    filled.forEach((p) => {
      const cleanName = getCleanAssetName(p.ticker, p.name);
      const price = p.currentPrice || p.avgPrice;
      const rate = fxRates[p.currency] || 1.0;
      const valEUR = p.quantity * price * rate;
      const costEUR = p.quantity * p.avgPrice * rate;
      const pnlEUR = valEUR - costEUR;
      const pnlPct = costEUR > 0 ? (pnlEUR / costEUR) * 100 : 0;
      const weight = totalVal > 0 ? (valEUR / totalVal) * 100 : 0;

      const section = companySections.find((sec) => sec.includes(p.ticker) || sec.includes(cleanName));

      let sentiment: AssetInsightCard['sentiment'] = pnlEUR >= 0 ? 'FAVORABLE' : 'NEUTRE';
      let category: AssetInsightCard['category'] = pnlEUR >= 0 ? 'PILIER_CONVICTION' : 'SOUS_SURVEILLANCE';
      let recommendation = pnlEUR >= 0
        ? 'Maintenir la position au sein du portefeuille et respecter la pondération cible.'
        : 'Suivre la consolidation et attendre les prochains résultats trimestriels.';
      const catalysts: string[] = [];
      const sources: { title: string; url: string; source: string }[] = [];

      if (section) {
        if (section.includes('🟢 Favorable') || section.includes('Favorable')) sentiment = 'FAVORABLE';
        else if (section.includes('🔴 Vigilance') || section.includes('Vigilance')) sentiment = 'VIGILANCE';
        else if (section.includes('🟡 Neutre')) sentiment = 'NEUTRE';

        if (section.includes('Pilier de Conviction') || section.includes('🟢 Pilier')) category = 'PILIER_CONVICTION';
        else if (section.includes("Piste d'Arbitrage") || section.includes('🔴 Piste')) category = 'SIGNAL_ARBITRAGE';
        else if (section.includes('Sous Surveillance') || section.includes('🟡 Ligne')) category = 'SOUS_SURVEILLANCE';

        const recoMatch = section.match(/\*\*Recommandation de Gestion\*\* : ([^\n]+)/);
        if (recoMatch && recoMatch[1]) {
          recommendation = recoMatch[1].trim();
        }

        const lines = section.split('\n');
        let inCatalysts = false;
        lines.forEach((line) => {
          if (line.includes('Faits Marquants') || line.includes('Catalyseurs')) {
            inCatalysts = true;
          } else if (line.startsWith('**') || line.startsWith('###') || line.startsWith('---')) {
            inCatalysts = false;
          } else if (inCatalysts && line.trim().startsWith('-')) {
            catalysts.push(line.replace(/^-+\s*/, '').trim());
          }
        });

        const sourceMatches = section.matchAll(/\[(.*?)\]\((https?:\/\/.*?)\) \*?\((.*?)\)\*?/g);
        for (const m of sourceMatches) {
          sources.push({
            title: m[1],
            url: m[2],
            source: m[3] || 'Presse Financière',
          });
        }
      }

      cards.push({
        ticker: p.ticker,
        cleanName,
        envelope: p.envelope,
        valEUR,
        weight,
        pnlEUR,
        pnlPct,
        sentiment,
        category,
        recommendation,
        catalysts: catalysts.length > 0 ? catalysts.slice(0, 3) : [
          `Actif structurant logé en enveloppe ${p.envelope}.`,
          `Valorisation actuelle à ${Math.round(valEUR).toLocaleString('fr-FR')} € (${weight.toFixed(1)}% du portefeuille).`
        ],
        sources: sources.slice(0, 2),
      });
    });

    let macro = "L'orientation des banques centrales et les résultats technologiques continuent de piloter le marché. Le portefeuille combine un cœur indiciel solide et des satellites de croissance ciblés.";
    const macroMatch = reportMarkdown.match(/## 🏛️ 1\. Lettre de Conjoncture[\s\S]*?(?=## 📊 2|$)/);
    if (macroMatch) {
      const cleanMacro = macroMatch[0]
        .replace(/## 🏛️ 1\. Lettre de Conjoncture[^\n]*\n+/g, '')
        .replace(/\n\n+/g, ' ')
        .replace(/\*\*/g, '')
        .trim();
      if (cleanMacro.length > 20) macro = cleanMacro.slice(0, 320) + '...';
    }

    const dcaRows = cards.map((c) => {
      const pos = positions.find((p) => p.ticker === c.ticker);
      const targetWeight = pos?.targetWeight || 0;
      const targetVal = totalVal * targetWeight;
      const gapEUR = targetVal - c.valEUR;
      const isUnderWeight = gapEUR > 0;
      return {
        ticker: c.ticker,
        cleanName: c.cleanName,
        currentWeight: c.weight,
        targetWeight: targetWeight * 100,
        gapEUR,
        isUnderWeight,
      };
    });

    return { macroContext: macro, assetCards: cards, dcaItems: dcaRows };
  }, [reportMarkdown, positions, fxRates]);

  const filteredCards = useMemo(() => {
    if (activeFilter === 'PILIER') return assetCards.filter((c) => c.category === 'PILIER_CONVICTION');
    if (activeFilter === 'SURVEILLANCE') return assetCards.filter((c) => c.category === 'SOUS_SURVEILLANCE');
    if (activeFilter === 'ARBITRAGE') return assetCards.filter((c) => c.category === 'SIGNAL_ARBITRAGE');
    return assetCards;
  }, [assetCards, activeFilter]);

  const counts = useMemo(() => {
    return {
      all: assetCards.length,
      pilier: assetCards.filter((c) => c.category === 'PILIER_CONVICTION').length,
      surveillance: assetCards.filter((c) => c.category === 'SOUS_SURVEILLANCE').length,
      arbitrage: assetCards.filter((c) => c.category === 'SIGNAL_ARBITRAGE').length,
    };
  }, [assetCards]);

  const copyDCAPlan = () => {
    const text = dcaItems
      .filter((d) => d.isUnderWeight)
      .map((d) => `• ${d.cleanName} (${d.ticker}) : Déficit de -${Math.round(d.gapEUR)} € (Poids actuel ${d.currentWeight.toFixed(1)}% vs Cible ${d.targetWeight.toFixed(1)}%)`)
      .join('\n');
    navigator.clipboard.writeText(`Feuille de route DCA (${selectedPeriodLabel}) :\n` + text);
    onShowToast('Ordres DCA copiés dans le presse-papier !');
  };

  return {
    activeFilter,
    setActiveFilter,
    expandedCards,
    toggleCard,
    macroContext,
    filteredCards,
    counts,
    copyDCAPlan,
  };
}

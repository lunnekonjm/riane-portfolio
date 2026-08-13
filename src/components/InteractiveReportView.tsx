'use client';

import React, { useState, useMemo } from 'react';
import type { Position, PortfolioConfig } from '@/types/portfolio';
import { getCleanAssetName } from '@/utils/assetMetadata';

interface InteractiveReportViewProps {
  reportMarkdown: string;
  positions: Position[];
  config: PortfolioConfig | null;
  fxRates: Record<string, number>;
  selectedPeriodLabel: string;
  onSendEmail: () => void;
  onRegenerate: () => void;
  sendingEmail: boolean;
  generating: boolean;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

interface AssetInsightCard {
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

export default function InteractiveReportView({
  reportMarkdown,
  positions,
  config,
  fxRates,
  selectedPeriodLabel,
  onSendEmail,
  onRegenerate,
  sendingEmail,
  generating,
  onShowToast,
}: InteractiveReportViewProps) {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PILIER' | 'SURVEILLANCE' | 'ARBITRAGE'>('ALL');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleCard = (ticker: string) => {
    setExpandedCards((prev) => ({ ...prev, [ticker]: !prev[ticker] }));
  };

  // Extract structured insights from reportMarkdown and positions
  const { macroContext, assetCards, dcaItems } = useMemo(() => {
    // 1. Parse Asset Intelligence from markdown
    const cards: AssetInsightCard[] = [];
    const filled = positions.filter((p) => p.quantity > 0 && p.avgPrice > 0);
    const totalVal = filled.reduce((sum, p) => sum + p.quantity * (p.currentPrice || p.avgPrice) * (fxRates[p.currency] || 1), 0);

    // Regex extractors from markdown
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

      // Find corresponding markdown section
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

        // Extract recommendation
        const recoMatch = section.match(/\*\*Recommandation de Gestion\*\* : ([^\n]+)/);
        if (recoMatch && recoMatch[1]) {
          recommendation = recoMatch[1].trim();
        }

        // Extract catalysts
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

        // Extract sources
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

    // 2. Extract Macro Context
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

    // 3. Extract DCA Items
    const monthlyBudget = config?.monthlyBudget || 1000;
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
  }, [reportMarkdown, positions, config, fxRates]);

  // Filtered Cards
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Interactive Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(6, 78, 59, 0.35))',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          borderRadius: 14,
          padding: 20,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ maxWidth: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>🏛️</span>
            <strong style={{ fontSize: 16, color: '#ffffff' }}>Synthèse Stratégique &amp; Conjoncture — {selectedPeriodLabel}</strong>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
            {macroContext}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              color: '#000000',
              fontWeight: 800,
              fontSize: 13,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
            }}
            onClick={onSendEmail}
            disabled={sendingEmail || generating}
          >
            {sendingEmail ? '⏳ Envoi...' : `📧 Envoyer par Email`}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
            onClick={onRegenerate}
            disabled={generating}
            title="Relance l'audit IA complet avec les dernières données en direct"
          >
            {generating ? '⏳ Calcul...' : '🔄 Forcer la Régénération IA'}
          </button>
        </div>
      </div>

      {/* Radar Matrix Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginRight: 4 }}>
            🎯 Radar Tactique :
          </span>
          <button
            type="button"
            className={`btn btn-sm ${activeFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveFilter('ALL')}
            style={{ fontSize: 12, padding: '4px 12px' }}
          >
            Tous les Actifs ({counts.all})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeFilter === 'PILIER' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveFilter('PILIER')}
            style={{
              fontSize: 12,
              padding: '4px 12px',
              borderColor: activeFilter === 'PILIER' ? 'var(--accent-emerald)' : 'rgba(16, 185, 129, 0.3)',
              color: activeFilter === 'PILIER' ? '#ffffff' : 'var(--accent-emerald)',
            }}
          >
            🟢 Piliers de Conviction ({counts.pilier})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeFilter === 'SURVEILLANCE' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveFilter('SURVEILLANCE')}
            style={{
              fontSize: 12,
              padding: '4px 12px',
              borderColor: activeFilter === 'SURVEILLANCE' ? 'var(--accent-amber)' : 'rgba(245, 158, 11, 0.3)',
              color: activeFilter === 'SURVEILLANCE' ? '#ffffff' : 'var(--accent-amber)',
            }}
          >
            🟡 Sous Surveillance ({counts.surveillance})
          </button>
          {counts.arbitrage > 0 && (
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === 'ARBITRAGE' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveFilter('ARBITRAGE')}
              style={{
                fontSize: 12,
                padding: '4px 12px',
                borderColor: activeFilter === 'ARBITRAGE' ? 'var(--accent-rose)' : 'rgba(244, 63, 94, 0.3)',
                color: activeFilter === 'ARBITRAGE' ? '#ffffff' : 'var(--accent-rose)',
              }}
            >
              🔴 Pistes d&apos;Arbitrage ({counts.arbitrage})
            </button>
          )}
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={copyDCAPlan}
          style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          📋 Copier les Ordres DCA
        </button>
      </div>

      {/* Interactive Asset Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 }}>
        {filteredCards.map((card) => {
          const isExpanded = !!expandedCards[card.ticker];
          const isPositive = card.pnlEUR >= 0;

          const sentimentBadgeColor =
            card.sentiment === 'FAVORABLE' ? '#10b981' :
            card.sentiment === 'VIGILANCE' ? '#f43f5e' : '#f59e0b';

          const categoryBadgeColor =
            card.category === 'PILIER_CONVICTION' ? '#10b981' :
            card.category === 'SIGNAL_ARBITRAGE' ? '#f43f5e' : '#f59e0b';

          const categoryLabel =
            card.category === 'PILIER_CONVICTION' ? '🟢 Pilier de Conviction' :
            card.category === 'SIGNAL_ARBITRAGE' ? '🔴 Arbitrage Suggéré' : '🟡 Sous Surveillance';

          return (
            <div
              key={card.ticker}
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: `1px solid ${isExpanded ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div>
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>{card.cleanName}</strong>
                      <span className="badge badge-cyan" style={{ fontSize: 10, padding: '2px 6px' }}>{card.ticker}</span>
                      <span className="badge badge-indigo" style={{ fontSize: 10, padding: '2px 6px' }}>{card.envelope}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                      Valorisation : <strong>{Math.round(card.valEUR).toLocaleString('fr-FR')} €</strong> ({card.weight.toFixed(1)}% du portefeuille)
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: isPositive ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                      background: isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                      padding: '4px 8px',
                      borderRadius: 6,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isPositive ? '+' : ''}{card.pnlPct.toFixed(1)}%
                  </span>
                </div>

                {/* Badges Row */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: categoryBadgeColor,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${categoryBadgeColor}`,
                      padding: '2px 8px',
                      borderRadius: 12,
                    }}
                  >
                    {categoryLabel}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: sentimentBadgeColor,
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '2px 8px',
                      borderRadius: 12,
                    }}
                  >
                    Climat : {card.sentiment === 'FAVORABLE' ? '🟢 Favorable' : card.sentiment === 'VIGILANCE' ? '🔴 Vigilance' : '🟡 Neutre'}
                  </span>
                </div>

                {/* Direct Actionable Recommendation */}
                <div
                  style={{
                    background: 'rgba(6, 182, 212, 0.08)',
                    borderLeft: '3px solid var(--accent-cyan)',
                    padding: '8px 12px',
                    borderRadius: '0 6px 6px 0',
                    fontSize: 12.5,
                    color: '#e2e8f0',
                    lineHeight: 1.45,
                    marginBottom: 12,
                  }}
                >
                  <strong style={{ color: 'var(--accent-cyan)', display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 2 }}>
                    Recommandation de Gestion :
                  </strong>
                  {card.recommendation}
                </div>

                {/* Expandable Catalysts & Sources */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 10 }}>
                    <strong style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      ⚡ Catalyseurs Récents &amp; Marché :
                    </strong>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
                      {card.catalysts.map((cat, idx) => (
                        <li key={idx} style={{ marginBottom: 4 }}>{cat}</li>
                      ))}
                    </ul>

                    {card.sources.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <strong style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                          📰 Articles &amp; Sources Vérifiées :
                        </strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {card.sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: 11,
                                color: 'var(--accent-cyan)',
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              🔗 {src.title} ({src.source})
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Toggle Button */}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  color: 'var(--accent-cyan)',
                  padding: '4px 0',
                  justifyContent: 'center',
                }}
                onClick={() => toggleCard(card.ticker)}
              >
                {isExpanded ? '▲ Masquer les détails' : '▼ Voir les catalyseurs & sources'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

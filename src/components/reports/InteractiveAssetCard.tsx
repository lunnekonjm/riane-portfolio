'use client';

import React from 'react';
import type { AssetInsightCard } from '@/hooks/useInteractiveReportData';

interface InteractiveAssetCardProps {
  card: AssetInsightCard;
  isExpanded: boolean;
  onToggle: () => void;
}

export function InteractiveAssetCard({
  card,
  isExpanded,
  onToggle,
}: InteractiveAssetCardProps) {
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
              <strong style={{ fontSize: 16, color: 'var(--text-primary)' }}>{card.cleanName}</strong>
              <span className="badge badge-cyan" style={{ fontSize: 12, padding: '3px 8px' }}>{card.ticker}</span>
              <span className="badge badge-indigo" style={{ fontSize: 12, padding: '3px 8px' }}>{card.envelope}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
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
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              color: categoryBadgeColor,
              background: 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${categoryBadgeColor}`,
              padding: '3px 9px',
              borderRadius: 12,
            }}
          >
            {categoryLabel}
          </span>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: sentimentBadgeColor,
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '3px 9px',
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
            padding: '10px 14px',
            borderRadius: '0 6px 6px 0',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            marginBottom: 12,
          }}
        >
          <strong style={{ color: 'var(--accent-cyan)', display: 'block', fontSize: 'var(--text-xs)', textTransform: 'uppercase', marginBottom: 4 }}>
            Recommandation de Gestion :
          </strong>
          {card.recommendation}
        </div>

        {/* Expandable Catalysts & Sources */}
        {isExpanded && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 10 }}>
            <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              ⚡ Catalyseurs Récents &amp; Marché :
            </strong>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              {card.catalysts.map((cat, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>{cat}</li>
              ))}
            </ul>

            {card.sources.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
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
                        fontSize: 'var(--text-xs)',
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
          fontSize: 'var(--text-xs)',
          color: 'var(--accent-cyan)',
          padding: '4px 0',
          justifyContent: 'center',
          fontWeight: 600,
        }}
        onClick={onToggle}
      >
        {isExpanded ? '▲ Masquer les détails' : '▼ Voir les catalyseurs & sources'}
      </button>
    </div>
  );
}

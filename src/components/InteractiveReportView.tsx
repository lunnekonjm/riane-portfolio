'use client';

import React from 'react';
import type { Position, PortfolioConfig } from '@/types/portfolio';
import { useInteractiveReportData } from '@/hooks/useInteractiveReportData';
import { InteractiveAssetCard } from './reports/InteractiveAssetCard';

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
  const {
    activeFilter,
    setActiveFilter,
    expandedCards,
    toggleCard,
    macroContext,
    filteredCards,
    counts,
    copyDCAPlan,
  } = useInteractiveReportData({
    reportMarkdown,
    positions,
    config,
    fxRates,
    selectedPeriodLabel,
    onShowToast,
  });

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
        {filteredCards.map((card) => (
          <InteractiveAssetCard
            key={card.ticker}
            card={card}
            isExpanded={!!expandedCards[card.ticker]}
            onToggle={() => toggleCard(card.ticker)}
          />
        ))}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { StockValuationRecord } from '@/data/valuationData';
import { ValuationEngineResult } from '@/engines/valuationEngine';

interface ValuationAIDiagnosticProps {
  stock: StockValuationRecord;
  val: ValuationEngineResult;
}

export const ValuationAIDiagnostic: React.FC<ValuationAIDiagnosticProps> = ({ stock, val }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleGenerateAI = async () => {
    setLoading(true);
    setIsOpen(true);
    try {
      const res = await fetch('/api/valuation-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: stock.shortTick,
          name: stock.name,
          currentPrice: val.currentPrice,
          currency: stock.currency,
          metricType: val.metricType,
          ratioName: val.ratioName,
          currentRatio: val.currentRatio,
          avgRatio: val.avgRatio,
          gapPct: val.gapPct,
          zScore: val.zScore,
          signal: val.signal,
          analystMean: val.analystMean,
          analystUpsidePct: val.analystUpsidePct,
          growthCagrPct: val.growthCagrPct,
          verdict: stock.verdict,
          salesModel: stock.salesModel,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setAnalysisText(json.data.analysisText);
        setModelUsed(json.data.modelUsed);
      } else if (json.fallbackAnalysis) {
        setAnalysisText(json.fallbackAnalysis);
        setModelUsed('Modèle Déterministe');
      }
    } catch (err) {
      console.error('[Valuation AI] Erreur fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!analysisText) return;
    navigator.clipboard.writeText(analysisText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="val-card">
      {/* Header */}
      <div className="val-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🧠</span>
          <span className="val-card-title">
            Diagnostic Institutionnel IA (Gemini 3.7 Flash)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {analysisText && (
            <button onClick={handleCopy} className="val-btn">
              {copied ? '✓ Copié !' : '📋 Copier'}
            </button>
          )}

          <button
            onClick={handleGenerateAI}
            disabled={loading}
            className="val-btn val-btn-ai"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <span>{loading ? '⚡ Analyse en cours...' : analysisText ? '🔄 Relancer l\'Analyse IA' : '✨ Lancer Analyse Gemini 3.7 Flash'}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div style={{ marginTop: 14 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', gap: 12 }}>
              <div style={{ width: 28, height: 28, border: '3px solid #06b6d4', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                Consultation de Gemini 3.7 Flash, recoupement des multiples et synthèse institutionnelle...
              </p>
            </div>
          ) : analysisText ? (
            <div style={{ padding: '16px', background: 'rgba(11, 15, 26, 0.95)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, fontSize: 12, color: '#e2e8f0', lineHeight: 1.65 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', fontFamily: 'JetBrains Mono, monospace', paddingBottom: 8, marginBottom: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span>Modèle actif : <b style={{ color: '#06b6d4' }}>{modelUsed || 'Gemini 3.7 Flash'}</b></span>
                <span>Date : {new Date().toLocaleDateString('fr-FR')}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {analysisText.split('\n\n').map((block, idx) => {
                  if (block.startsWith('### ')) {
                    return (
                      <h4 key={idx} style={{ fontSize: 13, fontWeight: 700, color: '#06b6d4', margin: '10px 0 4px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: 4 }}>
                        {block.replace('### ', '')}
                      </h4>
                    );
                  }
                  return (
                    <p key={idx} style={{ margin: 0, color: '#cbd5e1' }}>
                      {block}
                    </p>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {!isOpen && (
        <p style={{ fontSize: 12, color: '#94a3b8', margin: '12px 0 0 0', lineHeight: 1.55 }}>
          Générez une note de recherche institutionnelle en temps réel basée sur le modèle <b>Gemini 3.7 Flash</b>. Le modèle confronte les données de valorisation fondamentales avec les catalyseurs de croissance et les risques de marché.
        </p>
      )}
    </div>
  );
};

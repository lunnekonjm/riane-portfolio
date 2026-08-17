'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';

interface AuditJournalViewProps {
  positions: Position[];
  envelopeGroups: Record<string, Position[]>;
  history: any[];
  onClearResult: () => void;
  onNavigateAnalysis: () => void;
}

export function AuditJournalView({
  positions,
  envelopeGroups,
  history,
  onClearResult,
  onNavigateAnalysis,
}: AuditJournalViewProps) {
  return (
    <>
      {/* Résumé portefeuille */}
      <div className="grid-3">
        <div className="card">
          <div className="card-header"><span className="card-title">Positions</span></div>
          <div className="card-value" style={{ color: 'var(--accent-cyan)' }}>{positions.length}</div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Enveloppes</span></div>
          <div className="card-value">{Object.keys(envelopeGroups).length}</div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Analyses</span></div>
          <div className="card-value">{history.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Journal d&apos;Audit des Décisions</span>
        </div>
        {history.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14, textAlign: 'center', padding: 40 }}>
            Aucune analyse effectuée pour le moment.<br />
            Lancez une analyse depuis le Dashboard ou la page Analyse.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {history.map((h) => (
              <div
                key={h.id}
                style={{
                  padding: 16,
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  onClearResult();
                  onNavigateAnalysis();
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>{h.request.query}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {h.completedAt ? new Date(h.completedAt).toLocaleString('fr-FR') : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className={`badge ${h.request.status === 'complete' ? 'badge-emerald' : h.request.status === 'abstention' ? 'badge-amber' : 'badge-rose'}`}>
                    {h.request.status === 'complete' ? '✓ Complète' : h.request.status === 'abstention' ? '⛔ Abstention' : h.request.status}
                  </span>
                  {h.recommendation && (
                    <span className="badge badge-cyan">{h.recommendation.action}</span>
                  )}
                  {h.recommendation && (
                    <span className={`confidence-badge ${h.recommendation.confidence}`}>
                      {h.recommendation.confidence}
                    </span>
                  )}
                  {h.marketData && (
                    <span className="badge badge-violet">
                      {h.marketData.ticker} · {h.marketData.price?.toFixed(2)} {h.marketData.currency}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

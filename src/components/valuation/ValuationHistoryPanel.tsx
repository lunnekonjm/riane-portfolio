'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StockValuationRecord } from '@/data/valuationData';
import { ValuationEngineResult } from '@/engines/valuationEngine';
import {
  ValuationSnapshot,
  getStoredSnapshots,
  saveValuationSnapshot,
  deleteStoredSnapshot,
  getTemporalEvolutionDelta,
} from '@/engines/valuationHistoryStore';

interface ValuationHistoryPanelProps {
  stock: StockValuationRecord;
  val: ValuationEngineResult;
}

export const ValuationHistoryPanel: React.FC<ValuationHistoryPanelProps> = ({ stock, val }) => {
  const [snapshots, setSnapshots] = useState<ValuationSnapshot[]>([]);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [userNote, setUserNote] = useState<string>('');
  const [showAddNote, setShowAddNote] = useState<boolean>(false);

  const refreshList = useCallback(() => {
    const list = getStoredSnapshots(stock.key);
    setSnapshots(list);
  }, [stock.key]);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const handleSaveNow = () => {
    saveValuationSnapshot({
      stockKey: stock.key,
      ticker: stock.shortTick,
      name: stock.name,
      price: val.currentPrice,
      currency: stock.currency,
      metricType: val.metricType,
      ratioName: val.ratioName,
      ratioValue: val.currentRatio,
      signal: val.signal,
      gapPct: val.gapPct,
      zScore: val.zScore,
      analystTarget: val.analystMean,
      analystUpside: val.analystUpsidePct,
      source: 'manual_save',
      notes: userNote.trim() || undefined,
    });

    setUserNote('');
    setShowAddNote(false);
    setSavedSuccess(true);
    refreshList();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDelete = (id: string) => {
    deleteStoredSnapshot(id);
    refreshList();
  };

  const delta = getTemporalEvolutionDelta(stock.key);

  return (
    <div className="val-card">
      {/* Header */}
      <div className="val-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>⏳</span>
          <span className="val-card-title">
            Mémoire Persistante &amp; Suivi Temporel
          </span>
          <span className="val-badge val-badge-cyan">
            {snapshots.length} instantané{snapshots.length > 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowAddNote(!showAddNote)}
            className="val-btn"
          >
            {showAddNote ? '✕ Annuler Note' : '📝 + Note'}
          </button>
          <button
            onClick={handleSaveNow}
            className="val-btn val-btn-cyan"
            style={{ fontWeight: 700 }}
          >
            <span>📸 Enregistrer instantané aujourd&apos;hui</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div style={{ margin: '12px 0 0 0', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 10, fontSize: 12, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>✓ Instantané enregistré avec succès dans la mémoire persistante locale.</span>
        </div>
      )}

      {showAddNote && (
        <div style={{ margin: '12px 0 0 0', padding: '14px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
            Ajouter une note de contexte pour cet instantané (optionnel) :
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="Ex: Avant annonce des résultats T2, après décrochage du cours..."
              className="val-input"
            />
            <button
              onClick={handleSaveNow}
              className="val-btn val-btn-cyan"
              style={{ padding: '8px 16px', fontWeight: 700 }}
            >
              Sauvegarder
            </button>
          </div>
        </div>
      )}

      {/* Delta Evolution Card */}
      {delta && delta.previous && (
        <div className="val-subcard" style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>ÉVOLUTION SUR {delta.daysDiff} JOURS :</span>
              <span className="val-badge val-badge-neutral" style={{ fontSize: 10, padding: '2px 6px' }}>
                {delta.summaryBadge}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#ffffff', fontWeight: 600, marginTop: 6 }}>
              <span style={{ color: '#94a3b8' }}>Il y a {delta.daysDiff} jours ({delta.previous.dateLabel.split(' ')[0]}) :</span>{' '}
              <span>{delta.previous.signal}</span> à{' '}
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{delta.previous.price.toFixed(2)}{stock.currency}</span> ({delta.previous.gapPct >= 0 ? '+' : ''}{delta.previous.gapPct.toFixed(0)}%){' '}
              <span style={{ color: '#06b6d4', fontWeight: 800 }}>➔ Aujourd&apos;hui :</span>{' '}
              <span>{delta.latest?.signal}</span> à{' '}
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{delta.latest?.price.toFixed(2)}{stock.currency}</span> ({delta.latest && delta.latest.gapPct >= 0 ? '+' : ''}{delta.latest?.gapPct.toFixed(0)}%)
            </div>
          </div>

          <div>
            <span
              className="val-badge"
              style={{
                fontSize: 12,
                padding: '4px 10px',
                background: delta.priceDiffPct < 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                color: delta.priceDiffPct < 0 ? '#10b981' : '#f59e0b',
                borderColor: delta.priceDiffPct < 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)',
              }}
            >
              Cours : {delta.priceDiffPct >= 0 ? '+' : ''}{delta.priceDiffPct.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Snapshot Timeline List */}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {snapshots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: 12 }}>
            Aucun instantané enregistré pour {stock.name}. Cliquez sur &quot;Enregistrer instantané aujourd&apos;hui&quot; pour initier le suivi.
          </div>
        ) : (
          snapshots.map((s, idx) => {
            const badgeClass =
              s.signal === 'Favorable'
                ? 'val-badge-good'
                : s.signal === 'Défavorable' || s.signal === 'Vigilance'
                ? 'val-badge-bad'
                : 'val-badge-warn';

            return (
              <div
                key={s.id}
                style={{
                  padding: '12px 14px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderLeft: idx === 0 ? '3px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                  fontSize: 12,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#94a3b8', fontSize: 11, minWidth: 120 }}>
                    {s.dateLabel}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 800, color: '#ffffff', fontSize: 13 }}>
                      {s.price.toFixed(2)} {s.currency}
                    </span>
                    <span className={`val-badge ${badgeClass}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                      {s.signal} ({s.gapPct >= 0 ? '+' : ''}{s.gapPct.toFixed(0)}%)
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {s.notes && (
                    <span style={{ color: '#94a3b8', fontStyle: 'italic', fontFamily: 'Inter, sans-serif', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.notes}>
                      💬 {s.notes}
                    </span>
                  )}
                  <span style={{ color: '#64748b', fontSize: 11 }}>
                    Consensus : {s.analystTarget.toFixed(0)}{s.currency} ({s.analystUpside >= 0 ? '+' : ''}{s.analystUpside.toFixed(0)}%)
                  </span>
                  <button
                    onClick={() => handleDelete(s.id)}
                    style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 12, padding: 4 }}
                    title="Supprimer cet instantané"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

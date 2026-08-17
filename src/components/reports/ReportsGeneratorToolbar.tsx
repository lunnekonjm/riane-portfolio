'use client';

import React from 'react';
import type { ReportPeriod } from '@/engines/periodicReportEngine';
import type { SavedReportItem } from '@/hooks/useReportsState';

interface ReportsGeneratorToolbarProps {
  selectedPeriod: ReportPeriod;
  generating: boolean;
  savedReports: SavedReportItem[];
  onSelectPeriod: (period: ReportPeriod, label: string) => void;
  onShowHistoryModal: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export function ReportsGeneratorToolbar({
  selectedPeriod,
  generating,
  savedReports,
  onSelectPeriod,
  onShowHistoryModal,
  onShowToast,
}: ReportsGeneratorToolbarProps) {
  return (
    <>
      {/* Periodic Reminder Banner */}
      <div
        className="no-print"
        style={{
          background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.12), rgba(139, 92, 246, 0.12))',
          border: '1px solid var(--accent-cyan)',
          borderRadius: 12,
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🔔</span>
          <div>
            <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>Rappel de Clôture Périodique Automatique</strong>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Fin de période mensuelle atteinte (Juillet 2026). Cliquez pour charger ou régénérer votre audit.
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          style={{ padding: '6px 14px', fontWeight: 700 }}
          onClick={() => onSelectPeriod('monthly', 'Juillet 2026')}
          disabled={generating}
        >
          ⚡ Consulter l&apos;Audit IA (Juillet 2026)
        </button>
      </div>

      {/* Selector Header Bar with Smart Caching */}
      <div
        className="card no-print"
        style={{
          borderLeft: '4px solid var(--accent-violet)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>📰</span> Rapports &amp; Audits AI Institutionnels
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Audits 360° avec mise en cache instantanée, radar tactique et synthèse interactive.
          </p>
        </div>

        {/* Preset Generation Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className={`btn ${selectedPeriod === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onSelectPeriod('weekly', 'Hebdomadaire (Semaine en cours)')}
            disabled={generating}
          >
            🗓️ Hebdo
          </button>
          <button
            className={`btn ${selectedPeriod === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onSelectPeriod('monthly', 'Juillet 2026')}
            disabled={generating}
          >
            📅 Mensuel (Juillet 2026)
          </button>
          <button
            className={`btn ${selectedPeriod === 'quarterly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onSelectPeriod('quarterly', 'Q2 2026 (Clôturé)')}
            disabled={generating}
            title="Trimestre révolu — Bilan Q2 2026"
          >
            📊 Trimestriel (Q2 2026)
          </button>
          <button
            className="btn btn-secondary"
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
            onClick={() => onShowToast('🔒 Le trimestre Q3 2026 est en cours. Clôture le 30 Septembre 2026.', 'error')}
            title="🔒 Période non échue — Clôture le 30 Septembre 2026"
          >
            🔒 Q3 2026
          </button>

          <button
            className={`btn ${selectedPeriod === 'semestrial' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onSelectPeriod('semestrial', 'S1 2026 (Clôturé)')}
            disabled={generating}
            title="Semestre révolu — Bilan S1 2026"
          >
            🌓 Semestriel (S1 2026)
          </button>
          <button
            className="btn btn-secondary"
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
            onClick={() => onShowToast('🔒 Le semestre S2 2026 est en cours. Clôture le 31 Décembre 2026.', 'error')}
            title="🔒 Période non échue — Clôture le 31 Décembre 2026"
          >
            🔒 S2 2026
          </button>

          <button
            className={`btn ${selectedPeriod === 'annual' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onSelectPeriod('annual', 'Exercice 2025 (Clôturé)')}
            disabled={generating}
            title="Exercice révolu — Bilan 2025"
          >
            🏆 Annuel (2025)
          </button>
          <button
            className="btn btn-secondary"
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
            onClick={() => onShowToast('🔒 L\'exercice 2026 est en cours. Clôture le 31 Décembre 2026.', 'error')}
            title="🔒 Exercice en cours — Clôture le 31 Décembre 2026"
          >
            🔒 2026
          </button>

          {savedReports.length > 0 && (
            <button
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: '6px 10px', borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' }}
              onClick={onShowHistoryModal}
            >
              📚 Archives ({savedReports.length})
            </button>
          )}
        </div>
      </div>
    </>
  );
}

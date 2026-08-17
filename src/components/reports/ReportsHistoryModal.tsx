'use client';

import React from 'react';
import type { SavedReportItem } from '@/hooks/useReportsState';
import type { ReportPeriod } from '@/engines/periodicReportEngine';

interface ReportsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedReports: SavedReportItem[];
  onSelectReport: (rep: SavedReportItem) => void;
  onSendReportByEmail: (markdown: string, title: string) => void;
  onClearHistory: () => void;
}

export function ReportsHistoryModal({
  isOpen,
  onClose,
  savedReports,
  onSelectReport,
  onSendReportByEmail,
  onClearHistory,
}: ReportsHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <h2>📚 Archives des Audits &amp; Rapports Générés ({savedReports.length})</h2>
          <button className="modal-close-btn" onClick={onClose} type="button">✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto', marginTop: 16 }}>
          {savedReports.map((rep) => (
            <div
              key={rep.id}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
              }}
              onClick={() => onSelectReport(rep)}
            >
              <div>
                <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>{rep.title}</strong>
                {rep.generatedBy === 'cron' && (
                  <span className="badge badge-cyan" style={{ marginLeft: 8, fontSize: 'var(--text-xs)' }}>🤖 Auto</span>
                )}
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Généré le {rep.dateStr}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  type="button"
                  style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', fontWeight: 600 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendReportByEmail(rep.content, rep.title);
                  }}
                  title="Envoyer cette archive par email"
                >
                  📧 Envoyer
                </button>
                <button className="btn btn-primary btn-sm" type="button" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                  📖 Consulter
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-rose)' }} onClick={onClearHistory}>
            🗑️ Supprimer définitivement tout l&apos;historique
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

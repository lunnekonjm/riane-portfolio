'use client';

import { useState, useEffect } from 'react';
import type { Position, PortfolioConfig } from '@/types/portfolio';
import { generatePeriodicReport, type ReportPeriod } from '@/engines/periodicReportEngine';
import MarkdownRenderer from './MarkdownRenderer';

interface SavedReportItem {
  id: string;
  period: ReportPeriod;
  title: string;
  dateStr: string;
  timestamp: number;
  content: string;
}

interface ReportsViewProps {
  positions: Position[];
  config: PortfolioConfig | null;
  fxRates: Record<string, number>;
  adjustInflation: boolean;
  cumulativeInflationFactor: number;
  inflationRate: number;
  yearsElapsed: number;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function ReportsView({
  positions,
  config,
  fxRates,
  adjustInflation,
  cumulativeInflationFactor,
  inflationRate,
  yearsElapsed,
  onShowToast,
}: ReportsViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly');
  const [reportMarkdown, setReportMarkdown] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [savedReports, setSavedReports] = useState<SavedReportItem[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  const periodLabels: Record<ReportPeriod, string> = {
    monthly: 'Juillet 2026',
    quarterly: 'Q3 2026',
    semestrial: 'S2 2026',
    annual: 'Exercice 2025/2026',
  };

  // Load saved report history from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('riane_saved_reports');
      if (raw) {
        setSavedReports(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleGenerateReport = async (period: ReportPeriod) => {
    setSelectedPeriod(period);
    setGenerating(true);
    try {
      const md = await generatePeriodicReport(positions, config, fxRates, {
        period,
        periodLabel: periodLabels[period],
        adjustInflation,
        cumulativeInflationFactor,
        inflationRate,
        yearsElapsed,
      });
      setReportMarkdown(md);

      // Save report into persistent archives
      const newReport: SavedReportItem = {
        id: `report-${Date.now()}`,
        period,
        title: period === 'monthly' ? 'Rapport Mensuel (Juillet 2026)' :
               period === 'quarterly' ? 'Bulletin Trimestriel (Q3 2026)' :
               period === 'semestrial' ? 'Bilan Semestriel (S2 2026)' : 'Bilan Annuel (2025/2026)',
        dateStr: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        content: md,
      };

      setSavedReports((prev) => {
        const updated = [newReport, ...prev.filter((r) => r.id !== newReport.id)].slice(0, 30);
        try {
          localStorage.setItem('riane_saved_reports', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });

    } catch {
      onShowToast('Erreur lors de la génération du rapport', 'error');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    handleGenerateReport('monthly');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjustInflation]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(reportMarkdown);
    onShowToast('Rapport copié dans le presse-papier !');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClearHistory = () => {
    if (confirm('Effacer tout l\'historique des rapports archivés ?')) {
      setSavedReports([]);
      try {
        localStorage.removeItem('riane_saved_reports');
      } catch {
        // ignore
      }
      onShowToast('Historique des rapports effacé !');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
            <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>Rappel de Gestion Périodique Automatique</strong>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Fin de période atteinte (Juillet 2026). Pensez à générer et archiver votre compte-rendu officiel.
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          style={{ padding: '6px 14px', fontWeight: 700 }}
          onClick={() => handleGenerateReport(selectedPeriod)}
          disabled={generating}
        >
          ⚡ Générer {periodLabels[selectedPeriod]}
        </button>
      </div>

      {/* Selector Header Bar */}
      <div className="card no-print" style={{ borderLeft: '4px solid var(--accent-violet)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>📰</span> Rapports & Newsletters AI Périodiques
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Comptes-rendus de gestion 360° automatisés (Mensuels, Trimestriels, Semestriels et Annuels).
          </p>
        </div>

        {/* Preset Generation Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className={`btn ${selectedPeriod === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleGenerateReport('monthly')}
            disabled={generating}
          >
            📅 Mensuel
          </button>
          <button
            className={`btn ${selectedPeriod === 'quarterly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleGenerateReport('quarterly')}
            disabled={generating}
          >
            📊 Trimestriel
          </button>
          <button
            className={`btn ${selectedPeriod === 'semestrial' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleGenerateReport('semestrial')}
            disabled={generating}
          >
            🌓 Semestriel
          </button>
          <button
            className={`btn ${selectedPeriod === 'annual' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleGenerateReport('annual')}
            disabled={generating}
          >
            🏆 Annuel
          </button>

          {savedReports.length > 0 && (
            <button
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: '6px 10px', borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' }}
              onClick={() => setShowHistoryModal(true)}
            >
              📚 Archives ({savedReports.length})
            </button>
          )}
        </div>
      </div>

      {/* Main Report Document Card */}
      <div className="card" style={{ padding: 24, background: 'var(--bg-secondary)', minHeight: 400 }}>
        {generating ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="loading-spinner" style={{ width: 32, height: 32, margin: '0 auto 16px auto' }} />
            <div style={{ fontWeight: 600, fontSize: 15 }}>Génération du rapport en cours...</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
              Collecte des cours, actualités boursières, analyse de risque &amp; recommandations d&apos;arbitrage...
            </div>
          </div>
        ) : (
          <div>
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 20 }} className="no-print">
              {savedReports.length > 0 ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--accent-rose)', fontSize: 12 }}
                  onClick={handleClearHistory}
                >
                  🗑️ Effacer l&apos;Historique des Rapports
                </button>
              ) : <div />}

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary btn-sm" onClick={copyToClipboard}>
                  📋 Copier le rapport Markdown
                </button>
                <button className="btn btn-primary btn-sm" onClick={handlePrint}>
                  🖨️ Imprimer / Imprimer en PDF
                </button>
              </div>
            </div>

            {/* Executive Document Paper Wrapper */}
            <div
              id="report-print-area"
              style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: 12,
                padding: '32px 36px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              }}
            >
              <MarkdownRenderer content={reportMarkdown} />
            </div>
          </div>
        )}
      </div>

      {/* Archives Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2>📚 Archives des Rapports Générés ({savedReports.length})</h2>
              <button className="modal-close-btn" onClick={() => setShowHistoryModal(false)} type="button">✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto', marginTop: 16 }}>
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
                  onClick={() => {
                    setReportMarkdown(rep.content);
                    setSelectedPeriod(rep.period);
                    setShowHistoryModal(false);
                    onShowToast(`Rapport "${rep.title}" chargé depuis les archives`);
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>{rep.title}</strong>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      Généré le {rep.dateStr}
                    </div>
                  </div>
                  <button className="btn btn-secondary btn-sm" type="button">
                    📖 Consulter
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-rose)' }} onClick={handleClearHistory}>
                🗑️ Vider toutes les archives
              </button>
              <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

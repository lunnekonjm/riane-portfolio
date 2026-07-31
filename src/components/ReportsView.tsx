'use client';

import { useState, useEffect } from 'react';
import type { Position, PortfolioConfig } from '@/types/portfolio';
import { generatePeriodicReport, type ReportPeriod } from '@/engines/periodicReportEngine';
import MarkdownRenderer from './MarkdownRenderer';

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

  const periodLabels: Record<ReportPeriod, string> = {
    monthly: 'Juillet 2026',
    quarterly: 'Q3 2026',
    annual: 'Exercice 2025/2026',
  };

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Selector Header Bar */}
      <div className="card" style={{ borderLeft: '4px solid var(--accent-violet)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>📰</span> Rapports & Newsletters AI Périodiques
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Générez des comptes-rendus de gestion professionnels automatisés (Mensuels, Trimestriels et Annuels).
          </p>
        </div>

        {/* Preset Generation Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={`btn ${selectedPeriod === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleGenerateReport('monthly')}
            disabled={generating}
          >
            📅 Mensuel (Juillet 2026)
          </button>
          <button
            className={`btn ${selectedPeriod === 'quarterly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleGenerateReport('quarterly')}
            disabled={generating}
          >
            📊 Trimestriel (Q3 2026)
          </button>
          <button
            className={`btn ${selectedPeriod === 'annual' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleGenerateReport('annual')}
            disabled={generating}
          >
            🏆 Bilan Annuel (2025/2026)
          </button>
        </div>
      </div>

      {/* Main Report Document Card */}
      <div className="card" style={{ padding: 24, background: 'var(--bg-secondary)', minHeight: 400 }}>
        {generating ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="loading-spinner" style={{ width: 32, height: 32, margin: '0 auto 16px auto' }} />
            <div style={{ fontWeight: 600, fontSize: 15 }}>Génération du rapport en cours...</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
              Collecte des cours, calcul de l&apos;inflation et synthèse des actualités boursières...
            </div>
          </div>
        ) : (
          <div>
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 20 }} className="no-print">
              <button className="btn btn-secondary btn-sm" onClick={copyToClipboard}>
                📋 Copier le rapport Markdown
              </button>
              <button className="btn btn-primary btn-sm" onClick={handlePrint}>
                🖨️ Imprimer / Imprimer en PDF
              </button>
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
    </div>
  );
}

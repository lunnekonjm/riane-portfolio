'use client';

import React from 'react';
import type { Position, PortfolioConfig } from '@/types/portfolio';
import { useReportsState, PIPELINE_LOADING_STEPS } from '@/hooks/useReportsState';
import { ReportsGeneratorToolbar } from './reports/ReportsGeneratorToolbar';
import { ReportsHistoryModal } from './reports/ReportsHistoryModal';
import MarkdownRenderer from './MarkdownRenderer';
import InteractiveReportView from './InteractiveReportView';

interface ReportsViewProps {
  positions: Position[];
  config: PortfolioConfig | null;
  fxRates: Record<string, number>;
  adjustInflation: boolean;
  cumulativeInflationFactor: number;
  inflationRate?: number;
  yearsElapsed?: number;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  onTestEmail?: () => void;
  uid?: string | null;
  userEmail?: string | null;
}

export default function ReportsView({
  positions,
  config,
  fxRates,
  adjustInflation,
  cumulativeInflationFactor,
  inflationRate = 0.02,
  yearsElapsed = 0,
  onShowToast,
  uid,
  userEmail,
}: ReportsViewProps) {
  const {
    selectedPeriod,
    selectedPeriodLabel,
    reportMarkdown,
    generating,
    sendingEmail,
    savedReports,
    showHistoryModal,
    setShowHistoryModal,
    loadingStepIndex,
    viewMode,
    setViewMode,
    handleSelectPeriod,
    handleForceRegenerate,
    handleSendCurrentReportByEmail,
    copyToClipboard,
    handlePrint,
    handleClearHistory,
    setReportMarkdown,
    setSelectedPeriod,
    setSelectedPeriodLabel,
  } = useReportsState({
    positions,
    config,
    fxRates,
    adjustInflation,
    cumulativeInflationFactor,
    inflationRate,
    yearsElapsed,
    onShowToast,
    uid,
    userEmail,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Selector Header Bar with Smart Caching */}
      <ReportsGeneratorToolbar
        selectedPeriod={selectedPeriod}
        generating={generating}
        savedReports={savedReports}
        onSelectPeriod={handleSelectPeriod}
        onShowHistoryModal={() => setShowHistoryModal(true)}
        onShowToast={onShowToast}
      />

      {/* Main Report Document Card */}
      <div className="card" style={{ padding: 24, background: 'var(--bg-secondary)', minHeight: 400 }}>
        {generating ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="loading-spinner" style={{ width: 36, height: 36, margin: '0 auto 20px auto' }} />
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent-cyan)' }}>
              {PIPELINE_LOADING_STEPS[loadingStepIndex].label}
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
              {PIPELINE_LOADING_STEPS.map((s, idx) => (
                <div
                  key={s.step}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: idx <= loadingStepIndex ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                    transition: 'background 0.3s ease',
                  }}
                />
              ))}
            </div>
          </div>
        ) : reportMarkdown ? (
          <div>
            {/* View Mode Toggle & Actions Toolbar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 20,
                paddingBottom: 16,
                borderBottom: '1px solid var(--border-subtle)',
              }}
              className="no-print"
            >
              {/* Mode Switcher */}
              <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 8, padding: 3, border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  style={{
                    background: viewMode === 'interactive' ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'transparent',
                    color: viewMode === 'interactive' ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 14px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setViewMode('interactive')}
                >
                  ✨ Synthèse Interactive
                </button>
                <button
                  type="button"
                  style={{
                    background: viewMode === 'document' ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'transparent',
                    color: viewMode === 'document' ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 14px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setViewMode('document')}
                >
                  📄 Document Officiel (Markdown)
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                  onClick={handleForceRegenerate}
                  disabled={generating}
                  title="Relance l'audit IA complet avec les dernières données en direct"
                >
                  🔄 Régénérer IA
                </button>

                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                    color: '#000000',
                    fontWeight: 800,
                    fontSize: 12.5,
                    padding: '6px 14px',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    border: 'none',
                  }}
                  onClick={() => handleSendCurrentReportByEmail()}
                  disabled={sendingEmail}
                  title="Recevoir cet audit complet formaté en HTML dans votre boîte mail"
                >
                  {sendingEmail ? '⏳ Envoi...' : `📧 Envoyer par Email`}
                </button>

                <button className="btn btn-secondary btn-sm" onClick={copyToClipboard} style={{ fontSize: 12 }}>
                  📋 Copier
                </button>
                <button className="btn btn-primary btn-sm" onClick={handlePrint} style={{ fontSize: 12 }}>
                  🖨️ Imprimer / PDF
                </button>
              </div>
            </div>

            {/* View Rendering */}
            {viewMode === 'interactive' ? (
              <InteractiveReportView
                reportMarkdown={reportMarkdown}
                positions={positions}
                config={config}
                fxRates={fxRates}
                selectedPeriodLabel={selectedPeriodLabel}
                onSendEmail={() => handleSendCurrentReportByEmail()}
                onRegenerate={handleForceRegenerate}
                sendingEmail={sendingEmail}
                generating={generating}
                onShowToast={onShowToast}
              />
            ) : (
              <div
                id="report-print-area"
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  overflowX: 'auto',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: 12,
                  padding: '24px 24px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                }}
              >
                <MarkdownRenderer content={reportMarkdown} />
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '70px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📰</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Aucun rapport affiché</div>
            <div style={{ fontSize: 13, marginTop: 6, marginBottom: 24, color: 'var(--text-secondary)' }}>
              L&apos;historique des rapports est vide. Cliquez sur l&apos;un des boutons ci-dessus pour déclencher le grounding et générer un audit.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => handleSelectPeriod('monthly', 'Juillet 2026')}>
                ⚡ Consulter / Générer l&apos;Audit Mensuel (Juillet 2026)
              </button>
              <button className="btn btn-secondary" onClick={() => handleSelectPeriod('quarterly', 'Q2 2026 (Clôturé)')}>
                📊 Bilan Q2 2026 (Clôturé)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Archives Modal */}
      <ReportsHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        savedReports={savedReports}
        onSelectReport={(rep) => {
          setReportMarkdown(rep.content);
          setSelectedPeriod(rep.period);
          setSelectedPeriodLabel(rep.title.replace('Rapport ', ''));
          setShowHistoryModal(false);
          onShowToast(`Rapport "${rep.title}" chargé depuis les archives`);
        }}
        onSendReportByEmail={(content, title) => handleSendCurrentReportByEmail(content, title)}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}

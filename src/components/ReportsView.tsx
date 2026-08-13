'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Position, PortfolioConfig } from '@/types/portfolio';
import { generatePeriodicReport, type ReportPeriod } from '@/engines/periodicReportEngine';
import { getReports, saveReport, deleteAllReports } from '@/services/firebase/firestore';
import MarkdownRenderer from './MarkdownRenderer';
import InteractiveReportView from './InteractiveReportView';

interface SavedReportItem {
  id: string;
  period: ReportPeriod;
  title: string;
  dateStr: string;
  timestamp: number;
  content: string;
  generatedBy?: 'user' | 'cron';
}

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

const PIPELINE_LOADING_STEPS = [
  { step: 1, label: '🔍 Grounding Gemini 3.7 Flash & Web Search sur vos lignes (Collecte des annonces et résultats)...' },
  { step: 2, label: '📊 Audit de Valuation & Radar Stratégique des Lignes...' },
  { step: 3, label: '🛡️ Calcul des Risques, VaR 95% & Tirage Maximal en langage clair...' },
  { step: 4, label: '🎯 Calcul Mathématique du DCA : Allocation exacte en Euros et Nombre d\'Actions à acheter...' },
];

export default function ReportsView({
  positions,
  config,
  fxRates,
  adjustInflation,
  cumulativeInflationFactor,
  inflationRate = 0.02,
  yearsElapsed = 0,
  onShowToast,
  onTestEmail,
  uid,
  userEmail,
}: ReportsViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly');
  const [selectedPeriodLabel, setSelectedPeriodLabel] = useState<string>('Juillet 2026');
  const [reportMarkdown, setReportMarkdown] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);
  const [savedReports, setSavedReports] = useState<SavedReportItem[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'interactive' | 'document'>('interactive');

  // Period Options Definition with Elapsed Lock Logic
  const periodOptions = [
    { period: 'weekly' as ReportPeriod, label: 'Hebdomadaire (Semaine en cours)', isLocked: false, note: 'Semaine écoulée — Disponible' },
    { period: 'monthly' as ReportPeriod, label: 'Juillet 2026', isLocked: false, note: 'Mois clôturé — Disponible' },
    { period: 'quarterly' as ReportPeriod, label: 'Q2 2026 (Clôturé)', isLocked: false, note: 'Trimestre révolu — Disponible' },
    { period: 'quarterly' as ReportPeriod, label: 'Q3 2026', isLocked: true, note: '🔒 Q3 2026 en cours (Clôture le 30 Septembre 2026)' },
    { period: 'quadrimestrial' as ReportPeriod, label: 'P1 2026 — Jan-Avr (Clôturé)', isLocked: false, note: 'Période de 4 mois révolue — Disponible' },
    { period: 'quadrimestrial' as ReportPeriod, label: 'P2 2026 — Mai-Août', isLocked: true, note: '🔒 P2 2026 en cours (Clôture le 31 Août 2026)' },
    { period: 'semestrial' as ReportPeriod, label: 'S1 2026 (Clôturé)', isLocked: false, note: 'Semestre révolu — Disponible' },
    { period: 'semestrial' as ReportPeriod, label: 'S2 2026', isLocked: true, note: '🔒 S2 2026 en cours (Clôture le 31 Décembre 2026)' },
    { period: 'annual' as ReportPeriod, label: 'Exercice 2025 (Clôturé)', isLocked: false, note: 'Exercice révolu — Disponible' },
    { period: 'annual' as ReportPeriod, label: 'Exercice 2026', isLocked: true, note: '🔒 Exercice 2026 en cours (Clôture le 31 Décembre 2026)' },
  ];

  // Charge l'historique : Firestore (source durable) fusionné avec localStorage
  useEffect(() => {
    let localReports: SavedReportItem[] = [];
    try {
      const raw = localStorage.getItem('riane_saved_reports');
      if (raw) localReports = JSON.parse(raw);
    } catch {
      // ignore
    }

    if (!uid) {
      setSavedReports(localReports);
      if (localReports.length > 0) {
        const match = localReports.find((r) => r.period === 'monthly') || localReports[0];
        setReportMarkdown(match.content);
        setSelectedPeriod(match.period);
        setSelectedPeriodLabel(match.title.replace('Rapport ', ''));
      }
      return;
    }

    getReports(uid)
      .then((remoteReports) => {
        const typedRemote = remoteReports as unknown as SavedReportItem[];
        const merged = [...typedRemote, ...localReports.filter((l) => !typedRemote.some((r) => r.id === l.id))]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 30);
        setSavedReports(merged);
        if (merged.length > 0) {
          const match = merged.find((r) => r.period === 'monthly') || merged[0];
          setReportMarkdown(match.content);
          setSelectedPeriod(match.period);
          setSelectedPeriodLabel(match.title.replace('Rapport ', ''));
        }
      })
      .catch(() => {
        setSavedReports(localReports);
      });
  }, [uid]);

  const handleGenerateReport = useCallback(async (period: ReportPeriod, label: string, saveToHistory: boolean = true) => {
    const option = periodOptions.find((o) => o.period === period && o.label === label);
    if (option?.isLocked) {
      onShowToast(`🔒 ${option.note}`, 'error');
      return;
    }

    setSelectedPeriod(period);
    setSelectedPeriodLabel(label);
    setGenerating(true);
    setLoadingStepIndex(0);

    const stepInterval = setInterval(() => {
      setLoadingStepIndex((prev) => (prev < PIPELINE_LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1400);

    try {
      const md = await generatePeriodicReport(positions, config, fxRates, {
        period,
        periodLabel: label,
        adjustInflation,
        cumulativeInflationFactor,
        inflationRate,
        yearsElapsed,
      });

      clearInterval(stepInterval);
      setReportMarkdown(md);

      if (saveToHistory) {
        const newReport: SavedReportItem = {
          id: `report-${period}-${Date.now()}`,
          period,
          title: `Rapport ${label}`,
          dateStr: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          content: md,
        };

        setSavedReports((prev) => {
          const updated = [newReport, ...prev.filter((r) => r.title !== newReport.title)].slice(0, 30);
          try {
            localStorage.setItem('riane_saved_reports', JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });

        if (uid) {
          saveReport(uid, { ...newReport, generatedBy: 'user' }).catch(() => {
            // La copie locale reste disponible
          });
        }

        onShowToast(`Audit "${label}" généré avec succès !`);
      }
    } catch (err: unknown) {
      clearInterval(stepInterval);
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      onShowToast(`Erreur lors de la génération du rapport : ${message}`, 'error');
    } finally {
      setGenerating(false);
    }
  }, [periodOptions, positions, config, fxRates, adjustInflation, cumulativeInflationFactor, inflationRate, yearsElapsed, uid, onShowToast]);

  // SMART CACHING SELECTOR : Charge instantanément le cache si existant, sinon génère
  const handleSelectPeriod = (period: ReportPeriod, label: string) => {
    const option = periodOptions.find((o) => o.period === period && o.label === label);
    if (option?.isLocked) {
      onShowToast(`🔒 ${option.note}`, 'error');
      return;
    }

    setSelectedPeriod(period);
    setSelectedPeriodLabel(label);

    // Vérifier si un rapport existe déjà dans le cache
    const cached = savedReports.find(
      (r) => r.period === period && (r.title.includes(label) || label.includes(r.title.replace('Rapport ', '')))
    );

    if (cached && cached.content) {
      setReportMarkdown(cached.content);
      onShowToast(`⚡ Rapport "${label}" chargé instantanément depuis le cache !`);
    } else {
      // Si pas encore en cache, on lance la génération
      handleGenerateReport(period, label, true);
    }
  };

  const handleForceRegenerate = () => {
    onShowToast(`🔄 Régénération complète de l'audit "${selectedPeriodLabel}" avec Gemini 3.7 Flash...`);
    handleGenerateReport(selectedPeriod, selectedPeriodLabel, true);
  };

  const handleSendCurrentReportByEmail = async (customMarkdown?: string, customLabel?: string) => {
    const md = customMarkdown || reportMarkdown;
    const label = customLabel || selectedPeriodLabel;
    if (!md) {
      onShowToast('Veuillez d\'abord générer un rapport avant de l\'envoyer par email.', 'error');
      return;
    }
    setSendingEmail(true);
    onShowToast(`Envoi de l'audit ${label} par email...`);
    try {
      const res = await fetch('/api/send-report-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          periodLabel: label,
          period: selectedPeriod,
          reportMarkdown: md,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onShowToast(`✅ Audit ${label} envoyé avec succès à votre adresse email !`);
      } else {
        onShowToast(data.error || 'Erreur lors de l\'envoi de l\'email', 'error');
      }
    } catch {
      onShowToast('Erreur réseau lors de l\'envoi de l\'email', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  const copyToClipboard = () => {
    if (!reportMarkdown) return;
    navigator.clipboard.writeText(reportMarkdown);
    onShowToast('Rapport copié dans le presse-papier !');
  };

  const handlePrint = () => {
    if (!reportMarkdown) return;
    window.print();
  };

  const handleClearHistory = () => {
    if (confirm('⚠️ Supprimer définitivement tout l\'historique des rapports et effacer la vue ?\nTous les rapports sauvegardés et le document affiché seront purgés.')) {
      const idsToDelete = savedReports.map((r) => r.id);
      setSavedReports([]);
      setReportMarkdown('');
      setShowHistoryModal(false);
      try {
        localStorage.removeItem('riane_saved_reports');
        localStorage.setItem('riane_saved_reports', '[]');
      } catch {
        // ignore
      }
      if (uid && idsToDelete.length > 0) {
        deleteAllReports(uid, idsToDelete).catch(() => {
          // best-effort
        });
      }
      onShowToast('Tous les rapports ont été définitivement effacés !');
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
          onClick={() => handleSelectPeriod('monthly', 'Juillet 2026')}
          disabled={generating}
        >
          ⚡ Consulter l&apos;Audit IA (Juillet 2026)
        </button>
      </div>

      {/* Selector Header Bar with Smart Caching */}
      <div className="card no-print" style={{ borderLeft: '4px solid var(--accent-violet)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>📰</span> Rapports &amp; Audits AI Institutionnels
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Audits 360° avec mise en cache instantanée, radar tactique et synthèse interactive.
          </p>
        </div>

        {/* Preset Generation Buttons with Locking & Caching */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className={`btn ${selectedPeriod === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleSelectPeriod('weekly', 'Hebdomadaire (Semaine en cours)')}
            disabled={generating}
          >
            🗓️ Hebdo
          </button>
          <button
            className={`btn ${selectedPeriod === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleSelectPeriod('monthly', 'Juillet 2026')}
            disabled={generating}
          >
            📅 Mensuel (Juillet 2026)
          </button>
          <button
            className={`btn ${selectedPeriod === 'quarterly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleSelectPeriod('quarterly', 'Q2 2026 (Clôturé)')}
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
            onClick={() => handleSelectPeriod('semestrial', 'S1 2026 (Clôturé)')}
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
            onClick={() => handleSelectPeriod('annual', 'Exercice 2025 (Clôturé)')}
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
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h2>📚 Archives des Audits &amp; Rapports Générés ({savedReports.length})</h2>
              <button className="modal-close-btn" onClick={() => setShowHistoryModal(false)} type="button">✕</button>
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
                  onClick={() => {
                    setReportMarkdown(rep.content);
                    setSelectedPeriod(rep.period);
                    setSelectedPeriodLabel(rep.title.replace('Rapport ', ''));
                    setShowHistoryModal(false);
                    onShowToast(`Rapport "${rep.title}" chargé depuis les archives`);
                  }}
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
                        handleSendCurrentReportByEmail(rep.content, rep.title);
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
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-rose)' }} onClick={handleClearHistory}>
                🗑️ Supprimer définitivement tout l&apos;historique
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

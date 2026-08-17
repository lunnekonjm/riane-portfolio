'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Position, PortfolioConfig } from '@/types/portfolio';
import { generatePeriodicReport, type ReportPeriod } from '@/engines/periodicReportEngine';
import { getReports, saveReport, deleteAllReports } from '@/services/firebase/firestore';

export interface SavedReportItem {
  id: string;
  period: ReportPeriod;
  title: string;
  dateStr: string;
  timestamp: number;
  content: string;
  generatedBy?: 'user' | 'cron';
}

export interface PeriodOption {
  period: ReportPeriod;
  label: string;
  isLocked: boolean;
  note: string;
}

export const PIPELINE_LOADING_STEPS = [
  { step: 1, label: '🔍 Grounding Gemini 3.7 Flash & Web Search sur vos lignes (Collecte des annonces et résultats)...' },
  { step: 2, label: '📊 Audit de Valuation & Radar Stratégique des Lignes...' },
  { step: 3, label: '🛡️ Calcul des Risques, VaR 95% & Tirage Maximal en langage clair...' },
  { step: 4, label: '🎯 Calcul Mathématique du DCA : Allocation exacte en Euros et Nombre d\'Actions à acheter...' },
];

export const PERIOD_OPTIONS: PeriodOption[] = [
  { period: 'weekly', label: 'Hebdomadaire (Semaine en cours)', isLocked: false, note: 'Semaine écoulée — Disponible' },
  { period: 'monthly', label: 'Juillet 2026', isLocked: false, note: 'Mois clôturé — Disponible' },
  { period: 'quarterly', label: 'Q2 2026 (Clôturé)', isLocked: false, note: 'Trimestre révolu — Disponible' },
  { period: 'quarterly', label: 'Q3 2026', isLocked: true, note: '🔒 Q3 2026 en cours (Clôture le 30 Septembre 2026)' },
  { period: 'quadrimestrial', label: 'P1 2026 — Jan-Avr (Clôturé)', isLocked: false, note: 'Période de 4 mois révolue — Disponible' },
  { period: 'quadrimestrial', label: 'P2 2026 — Mai-Août', isLocked: true, note: '🔒 P2 2026 en cours (Clôture le 31 Août 2026)' },
  { period: 'semestrial', label: 'S1 2026 (Clôturé)', isLocked: false, note: 'Semestre révolu — Disponible' },
  { period: 'semestrial', label: 'S2 2026', isLocked: true, note: '🔒 S2 2026 en cours (Clôture le 31 Décembre 2026)' },
  { period: 'annual', label: 'Exercice 2025 (Clôturé)', isLocked: false, note: 'Exercice révolu — Disponible' },
  { period: 'annual', label: 'Exercice 2026', isLocked: true, note: '🔒 Exercice 2026 en cours (Clôture le 31 Décembre 2026)' },
];

export function useReportsState(params: {
  positions: Position[];
  config: PortfolioConfig | null;
  fxRates: Record<string, number>;
  adjustInflation: boolean;
  cumulativeInflationFactor: number;
  inflationRate: number;
  yearsElapsed: number;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  uid?: string | null;
  userEmail?: string | null;
}) {
  const {
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
  } = params;

  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly');
  const [selectedPeriodLabel, setSelectedPeriodLabel] = useState<string>('Juillet 2026');
  const [reportMarkdown, setReportMarkdown] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);
  const [savedReports, setSavedReports] = useState<SavedReportItem[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'interactive' | 'document'>('interactive');

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
    const option = PERIOD_OPTIONS.find((o) => o.period === period && o.label === label);
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
            // best-effort
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
  }, [positions, config, fxRates, adjustInflation, cumulativeInflationFactor, inflationRate, yearsElapsed, uid, onShowToast]);

  const handleSelectPeriod = (period: ReportPeriod, label: string) => {
    const option = PERIOD_OPTIONS.find((o) => o.period === period && o.label === label);
    if (option?.isLocked) {
      onShowToast(`🔒 ${option.note}`, 'error');
      return;
    }

    setSelectedPeriod(period);
    setSelectedPeriodLabel(label);

    const cached = savedReports.find(
      (r) => r.period === period && (r.title.includes(label) || label.includes(r.title.replace('Rapport ', '')))
    );

    if (cached && cached.content) {
      setReportMarkdown(cached.content);
      onShowToast(`⚡ Rapport "${label}" chargé instantanément depuis le cache !`);
    } else {
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

  return {
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
  };
}

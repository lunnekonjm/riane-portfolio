'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import type { SalaryRecord, RevenueConfig, ReserveAllocation, ExtraCashEntry, ExtraCashCategory } from '@/types/revenue';
import { computeSalaryAnalytics, computeReserveBalance, DEFAULT_REVENUE_CONFIG, REFERENCE_NET_RATES } from '@/types/revenue';
import type { PortfolioConfig } from '@/types/portfolio';
import { useBoursoLive } from '@/hooks/useBoursoLive';

interface RevenueBudgetViewProps {
  records: SalaryRecord[];
  revenueConfig: RevenueConfig;
  allocations: ReserveAllocation[];
  extraCashEntries?: ExtraCashEntry[];
  portfolioConfig: PortfolioConfig | null;
  onSaveRecord: (record: SalaryRecord) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  onSaveRevenueConfig: (config: RevenueConfig) => Promise<void>;
  onSaveAllocation: (allocation: ReserveAllocation) => Promise<void>;
  onDeleteAllocation: (id: string) => Promise<void>;
  onSaveExtraCashEntry?: (entry: ExtraCashEntry) => Promise<void>;
  onDeleteExtraCashEntry?: (id: string) => Promise<void>;
  onOpenRebalancerWithBudget?: (budget: number) => void;
  onSyncMonthlyBudget: (amount: number) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

function currentPeriod(): { period: string; label: string } {
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const label = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return { period, label: label.charAt(0).toUpperCase() + label.slice(1) };
}

function emptyRecord(): SalaryRecord {
  const { period, label } = currentPeriod();
  const now = Date.now();
  return {
    id: `sal-${now}`,
    period,
    periodLabel: label,
    netSalary: 0,
    regularInvestableAmount: 0,
    bonusReserveContribution: 0,
    savingsRate: 0,
    source: 'manual',
    createdAt: now,
    updatedAt: now,
  };
}

function inferNet(gross: number | undefined, net: number | undefined, refRate: number): number {
  if (net !== undefined && net !== null) return net;
  if (gross !== undefined && gross !== null) return Math.round(gross * refRate * 100) / 100;
  return 0;
}

const CATEGORY_LABELS: Record<ExtraCashCategory, { label: string; icon: string; color: string }> = {
  PRIME: { label: 'Prime annuelle / Objectifs', icon: '🎖️', color: 'var(--accent-cyan)' },
  TONTINE: { label: 'Tontine familiale / Tour', icon: '🤝', color: 'var(--accent-emerald)' },
  BONUS: { label: 'Bonus / Intéressement', icon: '💎', color: 'var(--accent-amber)' },
  '13EME_MOIS': { label: '13ème mois', icon: '🎁', color: '#a855f7' },
  VENTE: { label: 'Vente d\'équipement / Actif', icon: '🏷️', color: '#38bdf8' },
  AUTRE: { label: 'Autre rentrée exceptionnelle', icon: '💰', color: 'var(--text-secondary)' },
};

export default function RevenueBudgetView({
  records,
  revenueConfig,
  allocations,
  extraCashEntries = [],
  portfolioConfig,
  onSaveRecord,
  onDeleteRecord,
  onSaveRevenueConfig,
  onSaveAllocation,
  onDeleteAllocation,
  onSaveExtraCashEntry,
  onDeleteExtraCashEntry,
  onOpenRebalancerWithBudget,
  onSyncMonthlyBudget,
  onShowToast,
}: RevenueBudgetViewProps) {
  const [draft, setDraft] = useState<SalaryRecord>(emptyRecord());
  const [showForm, setShowForm] = useState(false);
  const [parsing, setParsing] = useState(false);

  // Extra Cash (Windfall / Tontine / Primes) Form State
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [extraLabel, setExtraLabel] = useState('');
  const [extraAmount, setExtraAmount] = useState<number>(0);
  const [extraCategory, setExtraCategory] = useState<ExtraCashCategory>('TONTINE');
  const [extraDate, setExtraDate] = useState(new Date().toISOString().slice(0, 10));
  const [extraNotes, setExtraNotes] = useState('');

  const safeConfigProp: RevenueConfig = useMemo(() => ({
    ...DEFAULT_REVENUE_CONFIG,
    ...(revenueConfig || {}),
    allocationSplit: {
      ...DEFAULT_REVENUE_CONFIG.allocationSplit,
      ...(revenueConfig?.allocationSplit || {}),
    },
    defaultReserveEnvelope: revenueConfig?.defaultReserveEnvelope || DEFAULT_REVENUE_CONFIG.defaultReserveEnvelope,
  }), [revenueConfig]);

  const [localConfig, setLocalConfig] = useState<RevenueConfig>(safeConfigProp);
  const [showAllocForm, setShowAllocForm] = useState(false);
  const [allocAmount, setAllocAmount] = useState<number>(0);
  const [allocEnvelope, setAllocEnvelope] = useState<'PEA' | 'PEA-PME' | 'CTO'>('CTO');
  const [allocTicker, setAllocTicker] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const boursoLive = useBoursoLive();

  const analytics = computeSalaryAnalytics(records || [], allocations || [], localConfig?.rollingAverageMonths || 3);
  const reserveBalance = useMemo(() => computeReserveBalance(records || [], allocations || []), [records, allocations]);

  const availableExtraCashTotal = useMemo(() => {
    return extraCashEntries
      .filter((e) => e.isAvailable)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [extraCashEntries]);

  const grandTotalAvailableExtra = availableExtraCashTotal + (reserveBalance || 0);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setParsing(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        const res = await fetch('/api/parse-payslip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Data }),
        });
        const json = await res.json();

        if (!res.ok) {
          onShowToast(json.error || 'Échec du parsing de la fiche de paie', 'error');
          setParsing(false);
          return;
        }

        const parsed = json.data;
        const now = Date.now();
        const netSalary = parsed.netSalary || 0;

        const bonusNet = parsed.hasExplicitBonus
          ? inferNet(parsed.bonusGross, parsed.bonusNet, REFERENCE_NET_RATES.bonus)
          : 0;
        const congesRachatNet = parsed.hasCongesRachat
          ? inferNet(parsed.congesRachatGross, parsed.congesRachatNet, REFERENCE_NET_RATES.congesRachat)
          : 0;

        const baseSalaryNetEstimate = Math.max(0, netSalary - bonusNet - congesRachatNet);
        const regularInvestable = Math.round(baseSalaryNetEstimate * 0.35);
        const bonusReserve = Math.round((bonusNet + congesRachatNet) * 100) / 100;
        const savingsRate = baseSalaryNetEstimate > 0 ? (regularInvestable / baseSalaryNetEstimate) * 100 : 0;

        const record: SalaryRecord = {
          id: `sal-${now}`,
          period: parsed.period || draft.period,
          periodLabel: parsed.periodLabel || draft.periodLabel,
          netSalary,
          grossSalary: parsed.grossSalary,
          netSocial: parsed.netSocial,
          socialContributions: parsed.socialContributions,
          incomeTaxAmount: parsed.incomeTaxAmount,
          incomeTaxRatePercent: parsed.incomeTaxRatePercent,
          companySavingsPEE: parsed.companySavingsPEE,
          baseSalaryGross: parsed.baseSalaryGross,
          baseSalaryNet: parsed.baseSalaryNet || baseSalaryNetEstimate,
          bonusAmount: parsed.bonusAmount,
          bonusGross: parsed.bonusGross,
          bonusNet,
          bonusDescription: parsed.bonusDescription,
          hasExplicitBonus: parsed.hasExplicitBonus,
          congesRachatGross: parsed.congesRachatGross,
          congesRachatNet,
          congesRachatJours: parsed.congesRachatJours,
          hasCongesRachat: parsed.hasCongesRachat,
          regularInvestableAmount: regularInvestable,
          bonusReserveContribution: bonusReserve,
          savingsRate: Math.round(savingsRate * 10) / 10,
          source: 'pdf-import',
          documentName: file.name,
          notes: parsed.notes,
          createdAt: now,
          updatedAt: now,
        };

        setDraft(record);
        setShowForm(true);
        onShowToast(`Fiche ${parsed.periodLabel || parsed.period} analysée avec succès`, 'success');
      } catch (err) {
        console.error('Payslip parsing error:', err);
        onShowToast('Erreur lors de l\'analyse du document', 'error');
      } finally {
        setParsing(false);
      }
    },
    [draft.period, draft.periodLabel, onShowToast]
  );

  const handleSave = useCallback(async () => {
    if (!draft.netSalary || draft.netSalary <= 0) {
      onShowToast('Veuillez renseigner au moins le salaire net', 'error');
      return;
    }
    const bonusNet = draft.bonusNet || 0;
    const congesNet = draft.congesRachatNet || 0;
    const baseNet = Math.max(0, draft.netSalary - bonusNet - congesNet);
    const regInv = draft.regularInvestableAmount || Math.round(baseNet * 0.35);
    const bonusReserve = draft.bonusReserveContribution ?? (bonusNet + congesNet);
    const rate = baseNet > 0 ? (regInv / baseNet) * 100 : 0;

    const recordToSave: SalaryRecord = {
      ...draft,
      regularInvestableAmount: regInv,
      bonusReserveContribution: bonusReserve,
      savingsRate: Math.round(rate * 10) / 10,
      updatedAt: Date.now(),
    };

    await onSaveRecord(recordToSave);
    setShowForm(false);
    setDraft(emptyRecord());
    onShowToast(`Fiche ${recordToSave.periodLabel} enregistrée`, 'success');
  }, [draft, onSaveRecord, onShowToast]);

  const handleSaveExtraCash = useCallback(async () => {
    if (!extraLabel.trim() || extraAmount <= 0) {
      onShowToast('Veuillez saisir un libellé et un montant positif', 'error');
      return;
    }
    if (!onSaveExtraCashEntry) return;

    const now = Date.now();
    const entry: ExtraCashEntry = {
      id: `extra-${now}`,
      label: extraLabel.trim(),
      amount: extraAmount,
      date: extraDate,
      category: extraCategory,
      isAvailable: true,
      notes: extraNotes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    await onSaveExtraCashEntry(entry);
    setShowExtraForm(false);
    setExtraLabel('');
    setExtraAmount(0);
    setExtraNotes('');
    onShowToast(`💰 ${entry.label} (+${entry.amount.toLocaleString('fr-FR')} €) enregistré !`, 'success');
  }, [extraLabel, extraAmount, extraDate, extraCategory, extraNotes, onSaveExtraCashEntry, onShowToast]);

  const handleToggleExtraAvailability = useCallback(async (entry: ExtraCashEntry) => {
    if (!onSaveExtraCashEntry) return;
    await onSaveExtraCashEntry({
      ...entry,
      isAvailable: !entry.isAvailable,
      updatedAt: Date.now(),
    });
    onShowToast(`Statut mis à jour (${!entry.isAvailable ? 'Disponible' : 'Marqué comme investi'})`, 'success');
  }, [onSaveExtraCashEntry, onShowToast]);

  const handleConfigChange = useCallback(
    async (partial: Partial<RevenueConfig>) => {
      const updated: RevenueConfig = {
        ...localConfig,
        ...partial,
        allocationSplit: {
          ...localConfig.allocationSplit,
          ...(partial.allocationSplit || {}),
        },
      };
      setLocalConfig(updated);
      await onSaveRevenueConfig(updated);
      onShowToast('Paramètres mis à jour', 'success');
    },
    [localConfig, onSaveRevenueConfig, onShowToast]
  );

  const handleSyncBudget = useCallback(async () => {
    const suggested = analytics.suggestedMonthlyBudget;
    if (suggested > 0) {
      await onSyncMonthlyBudget(suggested);
      onShowToast(`Budget mensuel mis à jour à ${suggested.toLocaleString('fr-FR')} €`, 'success');
    }
  }, [analytics.suggestedMonthlyBudget, onSyncMonthlyBudget, onShowToast]);

  const handleAllocate = useCallback(async () => {
    if (allocAmount <= 0 || allocAmount > reserveBalance) {
      onShowToast(`Montant invalide (réserve disponible : ${reserveBalance.toLocaleString('fr-FR')} €)`, 'error');
      return;
    }
    const now = Date.now();
    await onSaveAllocation({
      id: `alloc-${now}`,
      date: new Date().toISOString().slice(0, 10),
      amount: allocAmount,
      envelope: allocEnvelope,
      ticker: allocTicker || undefined,
      createdAt: now,
    });
    setShowAllocForm(false);
    setAllocAmount(0);
    setAllocTicker('');
    onShowToast(`${allocAmount.toLocaleString('fr-FR')} € alloués vers ${allocEnvelope}${allocTicker ? ` (${allocTicker})` : ''}`, 'success');
  }, [allocAmount, allocEnvelope, allocTicker, reserveBalance, onSaveAllocation, onShowToast]);

  return (
    <div>
      {/* 📊 Metrics Bar */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Net moyen ({localConfig?.rollingAverageMonths ?? 3} mois)</span></div>
          <div className="card-value">{(analytics?.averageNetSalary ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Régulier investissable (hors primes)</span></div>
          <div className="card-value">{(analytics?.averageRegularInvestable ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Taux d&apos;épargne régulier</span></div>
          <div className="card-value">{(analytics?.averageSavingsRate ?? 0).toFixed(1)} %</div>
        </div>
        <div className="card" style={{ borderLeft: '3px solid var(--accent-emerald)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)' }}>
          <div className="card-header"><span className="card-title">💎 Total Extras &amp; Primes Dispo</span></div>
          <div className="card-value" style={{ color: 'var(--accent-emerald)' }}>+{grandTotalAvailableExtra.toLocaleString('fr-FR')} €</div>
        </div>
      </div>

      {/* 🏦 LIVE BOURSOBANK REAL ACCOUNTS & TAMPON SAS */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          border: '1px solid rgba(6, 182, 212, 0.3)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)',
          padding: 16,
          borderRadius: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🏦</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h4 style={{ fontSize: 15, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Comptes Bancaires Live (BoursoBank Open Banking)
                </h4>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: boursoLive.isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: boursoLive.isConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                    border: `1px solid ${boursoLive.isConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)'}`,
                  }}
                >
                  {boursoLive.isConnected ? '🟢 Live DSP2' : '🟡 À synchroniser'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                Soldes réels synchronisés — Utilisez votre Compte Tampon comme sas de dispatching
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {boursoLive.tamponEUR > 0 && onOpenRebalancerWithBudget && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  fontWeight: 700,
                  fontSize: 12,
                  padding: '6px 12px',
                }}
                onClick={() => onOpenRebalancerWithBudget(boursoLive.tamponEUR)}
              >
                ⚡ Rééquilibrer avec le Tampon ({boursoLive.tamponEUR.toLocaleString('fr-FR')} €)
              </button>
            )}
          </div>
        </div>

        {/* Real Accounts 4-Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>💳 Compte Courant</span>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 4, color: boursoLive.checkingEUR < 0 ? 'var(--accent-amber)' : 'var(--text-primary)' }}>
              {boursoLive.checkingEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <span style={{ fontSize: 11, color: 'var(--accent-emerald)', fontWeight: 800, textTransform: 'uppercase' }}>⚡ Compte Tampon (Surplus)</span>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 4, color: 'var(--accent-emerald)' }}>
              {boursoLive.tamponEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(129, 140, 248, 0.08)', border: '1px solid rgba(129, 140, 248, 0.3)' }}>
            <span style={{ fontSize: 11, color: '#818cf8', fontWeight: 800, textTransform: 'uppercase' }}>🤝 Compte Tontine</span>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 4, color: '#818cf8' }}>
              {boursoLive.tontineEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>🛡️ Livret A ({boursoLive.livretARate}%)</span>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 4, color: 'var(--text-primary)' }}>
              {boursoLive.livretAEUR > 0 ? boursoLive.livretAEUR.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : 'Non renseigné'}
            </div>
          </div>
        </div>
      </div>

      {/* 💎 NEW SECTION: Primes, Tontines & Extras de Trésorerie */}
      <div className="card" style={{ marginBottom: 24, border: '1px solid rgba(16, 185, 129, 0.3)', background: 'var(--bg-secondary)' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="card-title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>💎</span> Primes, Tontines &amp; Rentrées Exceptionnelles (Windfalls)
            </span>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              Ajoutez vos rentrées exceptionnelles (Prime d&apos;intéressement, Tontine, 13e mois, Ventes) pour décider de les injecter lors de vos rééquilibrages.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {grandTotalAvailableExtra > 0 && onOpenRebalancerWithBudget && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontWeight: 700 }}
                onClick={() => onOpenRebalancerWithBudget(grandTotalAvailableExtra)}
              >
                🎯 Rééquilibrer avec ces {grandTotalAvailableExtra.toLocaleString('fr-FR')} €
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowExtraForm(!showExtraForm)}
            >
              {showExtraForm ? 'Fermer' : '➕ Ajouter un Extra / Prime / Tontine'}
            </button>
          </div>
        </div>

        {/* Extra Cash Form */}
        {showExtraForm && (
          <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 10, marginTop: 14, border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 14 }}>💰 Déclarer un Extra de Trésorerie</h4>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Libellé de la rentrée</label>
                <input
                  className="input"
                  placeholder="ex: Tontine d'août, Prime annuelle Vestas, Vente d'ordinateur"
                  value={extraLabel}
                  onChange={(e) => setExtraLabel(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Montant net (€)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="2500"
                  value={extraAmount || ''}
                  onChange={(e) => setExtraAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Catégorie</label>
                <select
                  className="input"
                  value={extraCategory}
                  onChange={(e) => setExtraCategory(e.target.value as ExtraCashCategory)}
                >
                  <option value="TONTINE">🤝 Tontine familiale / Tour</option>
                  <option value="PRIME">🎖️ Prime annuelle / Objectifs</option>
                  <option value="BONUS">💎 Bonus / Intéressement</option>
                  <option value="13EME_MOIS">🎁 13ème mois</option>
                  <option value="VENTE">🏷️ Vente d&apos;actif / Matériel</option>
                  <option value="AUTRE">💰 Autre rentrée exceptionnelle</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Date de réception</label>
                <input
                  type="date"
                  className="input"
                  value={extraDate}
                  onChange={(e) => setExtraDate(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Notes (optionnel)</label>
                <input
                  className="input"
                  placeholder="ex: Reçu sur BoursoBank, à investir en septembre"
                  value={extraNotes}
                  onChange={(e) => setExtraNotes(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowExtraForm(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSaveExtraCash}>💾 Enregistrer l&apos;Extra</button>
            </div>
          </div>
        )}

        {/* Extra Cash List */}
        <div style={{ marginTop: 16 }}>
          {extraCashEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              Aucun extra ponctuel enregistré. Cliquez sur &quot;Ajouter un Extra&quot; pour consigner une prime ou une tontine.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {extraCashEntries.map((entry) => {
                const cat = CATEGORY_LABELS[entry.category] || CATEGORY_LABELS.AUTRE;
                return (
                  <div
                    key={entry.id}
                    style={{
                      padding: '10px 14px',
                      background: entry.isAvailable ? 'var(--bg-tertiary)' : 'rgba(255,255,255,0.02)',
                      opacity: entry.isAvailable ? 1 : 0.65,
                      borderRadius: 8,
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{cat.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                          {entry.label}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {cat.label} • {new Date(entry.date).toLocaleDateString('fr-FR')} {entry.notes ? `• ${entry.notes}` : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <strong className="mono" style={{ fontSize: 15, color: entry.isAvailable ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                        +{entry.amount.toLocaleString('fr-FR')} €
                      </strong>

                      <button
                        type="button"
                        className={`badge ${entry.isAvailable ? 'badge-emerald' : 'badge-ghost'}`}
                        style={{ cursor: 'pointer', border: 'none', padding: '4px 10px', fontSize: 12, fontWeight: 700 }}
                        onClick={() => handleToggleExtraAvailability(entry)}
                        title="Cliquer pour basculer entre Disponible et Déjà investi"
                      >
                        {entry.isAvailable ? '🟢 Disponible' : '⚪ Déjà investi'}
                      </button>

                      {onDeleteExtraCashEntry && (
                        <button
                          className="btn-ghost"
                          style={{ padding: '4px 8px', fontSize: 13 }}
                          onClick={() => onDeleteExtraCashEntry(entry.id)}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Payslip & OCR Upload Card */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>💼 Fiches de Paie &amp; Bulletins de Salaire</h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            Importez votre bulletin PDF pour extraction automatique Gemini ou saisissez votre salaire net en quelques secondes.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="application/pdf,image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f);
            }}
          />
          <button
            className="btn btn-secondary"
            disabled={parsing}
            onClick={() => fileInputRef.current?.click()}
          >
            {parsing ? '⏳ Analyse OCR en cours...' : '📄 Importer un Bulletin PDF'}
          </button>
          <button className="btn btn-primary" onClick={() => { setDraft(emptyRecord()); setShowForm(true); }}>
            ➕ Saisir manuellement
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24, borderLeft: '3px solid var(--accent-cyan)' }}>
          <div className="card-header"><span className="card-title">Vérifier / compléter la fiche</span></div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Période (YYYY-MM)</label>
              <input className="input" value={draft.period} onChange={(e) => setDraft({ ...draft, period: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Libellé</label>
              <input className="input" value={draft.periodLabel} onChange={(e) => setDraft({ ...draft, periodLabel: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Net à payer total (€)</label>
              <input type="number" className="input" value={draft.netSalary || ''} onChange={(e) => setDraft({ ...draft, netSalary: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="form-group">
              <label className="form-label">Épargne PEE ce mois (€, optionnel)</label>
              <input type="number" className="input" value={draft.companySavingsPEE ?? ''} onChange={(e) => setDraft({ ...draft, companySavingsPEE: parseFloat(e.target.value) || undefined })} />
            </div>
          </div>

          <p style={{ fontSize: 13, fontWeight: 600, marginTop: 12, marginBottom: 4 }}>Ventilation par composante</p>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Net prime/bonus (€, si détecté)</label>
              <input type="number" className="input" value={draft.bonusNet ?? ''}
                onChange={(e) => setDraft({ ...draft, bonusNet: parseFloat(e.target.value) || undefined, hasExplicitBonus: true })} />
            </div>
            <div className="form-group">
              <label className="form-label">Net rachat congés (€, si détecté)</label>
              <input type="number" className="input" value={draft.congesRachatNet ?? ''}
                onChange={(e) => setDraft({ ...draft, congesRachatNet: parseFloat(e.target.value) || undefined, hasCongesRachat: true })} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Montant régulier à investir ce mois (€) — hors primes/rachats</label>
              <input type="number" className="input" value={draft.regularInvestableAmount || ''} onChange={(e) => setDraft({ ...draft, regularInvestableAmount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="form-group">
              <label className="form-label">→ Ira dans la réserve (€, calculé)</label>
              <input type="number" className="input" disabled
                value={Math.round(((draft.bonusNet || 0) + (draft.congesRachatNet || 0)) * 100) / 100}
                onChange={() => {}} />
            </div>
          </div>
          {((draft.bonusNet || 0) + (draft.congesRachatNet || 0)) > 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              💰 Ce montant ira automatiquement dans la réserve à l&apos;enregistrement — aucune répartition PEA/PEA-PME/CTO
              n&apos;est proposée ici, vous déciderez plus tard via le bouton &quot;Allouer maintenant&quot;.
            </p>
          )}
          {draft.notes && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>ℹ️ {draft.notes}</p>}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button className="btn btn-primary" onClick={() => {
              const bonusReserveContribution = Math.round(((draft.bonusNet || 0) + (draft.congesRachatNet || 0)) * 100) / 100;
              setDraft({ ...draft, bonusReserveContribution });
              handleSave();
            }}>💾 Enregistrer</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      {/* Historique des Fiches de Paie */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><span className="card-title">📊 Historique des fiches de paie</span></div>
        {records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">Aucune fiche de paie enregistrée pour l&apos;instant.</div>
          </div>
        ) : (
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Période</th>
                <th>Net total</th>
                <th>Régulier investi</th>
                <th>→ Réserve</th>
                <th>Source</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id || `r-${Math.random()}`}>
                  <td>{r.periodLabel || r.period || '—'}</td>
                  <td>{(r.netSalary ?? 0).toLocaleString('fr-FR')} €</td>
                  <td>{(r.regularInvestableAmount ?? r.netSalary ?? 0).toLocaleString('fr-FR')} €</td>
                  <td>{(r.bonusReserveContribution ?? 0) > 0 ? `+${(r.bonusReserveContribution ?? 0).toLocaleString('fr-FR')} €` : '—'}</td>
                  <td>{r.source === 'pdf-import' ? '📄 PDF' : '✏️ Manuel'}</td>
                  <td>
                    <button className="btn-ghost" onClick={() => onDeleteRecord(r.id)} title="Supprimer">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {allocations.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title">📜 Historique des allocations de réserve</span></div>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr><th>Date</th><th>Montant</th><th>Enveloppe</th><th>Ticker</th><th></th></tr>
            </thead>
            <tbody>
              {allocations.map((a) => (
                <tr key={a.id || `a-${Math.random()}`}>
                  <td>{a.date ? new Date(a.date).toLocaleDateString('fr-FR') : '—'}</td>
                  <td>{(a.amount ?? 0).toLocaleString('fr-FR')} €</td>
                  <td>{a.envelope || '—'}</td>
                  <td>{a.ticker || '—'}</td>
                  <td><button className="btn-ghost" onClick={() => onDeleteAllocation(a.id)} title="Supprimer">🗑️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

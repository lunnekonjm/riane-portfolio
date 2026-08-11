'use client';

import { useState, useCallback, useRef } from 'react';
import type { SalaryRecord, RevenueConfig } from '@/types/revenue';
import { computeSalaryAnalytics, DEFAULT_REVENUE_CONFIG } from '@/types/revenue';
import type { PortfolioConfig } from '@/types/portfolio';

interface RevenueBudgetViewProps {
  records: SalaryRecord[];
  revenueConfig: RevenueConfig;
  portfolioConfig: PortfolioConfig | null;
  onSaveRecord: (record: SalaryRecord) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  onSaveRevenueConfig: (config: RevenueConfig) => Promise<void>;
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
    investableAmount: 0,
    savingsRate: 0,
    source: 'manual',
    createdAt: now,
    updatedAt: now,
  };
}

export default function RevenueBudgetView({
  records,
  revenueConfig,
  portfolioConfig,
  onSaveRecord,
  onDeleteRecord,
  onSaveRevenueConfig,
  onSyncMonthlyBudget,
  onShowToast,
}: RevenueBudgetViewProps) {
  const [draft, setDraft] = useState<SalaryRecord>(emptyRecord());
  const [showForm, setShowForm] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [localConfig, setLocalConfig] = useState<RevenueConfig>(revenueConfig || DEFAULT_REVENUE_CONFIG);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analytics = computeSalaryAnalytics(records, localConfig.rollingAverageMonths);

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
        const suggestedInvestable = Math.round(netSalary * (analytics.averageSavingsRate > 0 ? analytics.averageSavingsRate / 100 : 0.25));

        setDraft({
          id: `sal-${now}`,
          period: parsed.period,
          periodLabel: parsed.periodLabel,
          netSalary,
          grossSalary: parsed.grossSalary ?? undefined,
          netSocial: parsed.netSocial ?? undefined,
          socialContributions: parsed.socialContributions ?? undefined,
          incomeTaxAmount: parsed.incomeTaxAmount ?? undefined,
          incomeTaxRatePercent: parsed.incomeTaxRatePercent ?? undefined,
          companySavingsPEE: parsed.companySavingsPEE ?? undefined,
          hasExplicitBonus: parsed.hasExplicitBonus ?? false,
          bonusDescription: parsed.bonusDescription ?? undefined,
          bonusAmount: parsed.bonusAmount ?? undefined,
          investableAmount: suggestedInvestable,
          savingsRate: netSalary > 0 ? (suggestedInvestable / netSalary) * 100 : 0,
          source: 'pdf-import',
          documentName: file.name,
          notes: parsed.extractionNotes || undefined,
          createdAt: now,
          updatedAt: now,
        });
        setShowForm(true);
        onShowToast(
          parsed.confidence === 'low'
            ? 'Extraction incertaine — vérifiez chaque champ avant de valider.'
            : 'Fiche de paie extraite — vérifiez et complétez le montant investissable.',
          parsed.confidence === 'low' ? 'error' : 'success'
        );
      } catch {
        onShowToast('Erreur lors de la lecture du fichier', 'error');
      } finally {
        setParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [analytics.averageSavingsRate, onShowToast]
  );

  const handleSave = useCallback(async () => {
    if (!draft.period || draft.netSalary <= 0) {
      onShowToast('Période et salaire net sont requis', 'error');
      return;
    }
    const savingsRate = draft.netSalary > 0 ? (draft.investableAmount / draft.netSalary) * 100 : 0;
    await onSaveRecord({ ...draft, savingsRate });
    setShowForm(false);
    setDraft(emptyRecord());
    onShowToast('Fiche de paie enregistrée', 'success');
  }, [draft, onSaveRecord, onShowToast]);

  const handleSyncBudget = useCallback(async () => {
    await onSyncMonthlyBudget(analytics.suggestedMonthlyBudget);
    onShowToast(`Budget mensuel synchronisé : ${analytics.suggestedMonthlyBudget.toLocaleString('fr-FR')} €/mois`, 'success');
  }, [analytics.suggestedMonthlyBudget, onSyncMonthlyBudget, onShowToast]);

  const handleConfigChange = useCallback(
    async (patch: Partial<RevenueConfig>) => {
      const next = { ...localConfig, ...patch };
      setLocalConfig(next);
      await onSaveRevenueConfig(next);
    },
    [localConfig, onSaveRevenueConfig]
  );

  return (
    <div>
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Net moyen ({localConfig.rollingAverageMonths} mois)</span></div>
          <div className="card-value">{analytics.averageNetSalary.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Investissable moyen</span></div>
          <div className="card-value">{analytics.averageInvestable.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Taux d&apos;épargne moyen</span></div>
          <div className="card-value">{analytics.averageSavingsRate.toFixed(1)} %</div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Budget mensuel actuel (config)</span></div>
          <div className="card-value">{(portfolioConfig?.monthlyBudget ?? 0).toLocaleString('fr-FR')} €</div>
        </div>
      </div>

      {analytics.suggestedMonthlyBudget > 0 && portfolioConfig && analytics.suggestedMonthlyBudget !== portfolioConfig.monthlyBudget && (
        <div className="card" style={{ marginBottom: 24, borderLeft: '3px solid var(--accent-amber)' }}>
          <div className="card-header"><span className="card-title">⚠️ Écart détecté</span></div>
          <p style={{ margin: '8px 0' }}>
            Le budget mensuel configuré ({portfolioConfig.monthlyBudget.toLocaleString('fr-FR')} €) diffère de la moyenne
            de vos {localConfig.rollingAverageMonths} dernières fiches de paie ({analytics.suggestedMonthlyBudget.toLocaleString('fr-FR')} €).
            Ce montant alimente le DCA mensuel utilisé par le rééquilibrage et les rapports périodiques.
          </p>
          <button className="btn btn-primary" onClick={handleSyncBudget}>
            Synchroniser à {analytics.suggestedMonthlyBudget.toLocaleString('fr-FR')} €/mois
          </button>
        </div>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><span className="card-title">⚙️ Paramètres de synchronisation</span></div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                checked={localConfig.autoSyncMonthlyBudget}
                onChange={(e) => handleConfigChange({ autoSyncMonthlyBudget: e.target.checked })}
              />{' '}
              Synchronisation automatique du budget mensuel
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Moyenne glissante sur (mois)</label>
            <input
              type="number"
              className="input"
              min={1}
              max={12}
              value={localConfig.rollingAverageMonths}
              onChange={(e) => handleConfigChange({ rollingAverageMonths: parseInt(e.target.value, 10) || 3 })}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Répartition PEA</label>
            <input
              type="number" className="input" min={0} max={100}
              value={Math.round(localConfig.allocationSplit.PEA * 100)}
              onChange={(e) => handleConfigChange({ allocationSplit: { ...localConfig.allocationSplit, PEA: (parseInt(e.target.value, 10) || 0) / 100 } })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Répartition PEA-PME</label>
            <input
              type="number" className="input" min={0} max={100}
              value={Math.round(localConfig.allocationSplit['PEA-PME'] * 100)}
              onChange={(e) => handleConfigChange({ allocationSplit: { ...localConfig.allocationSplit, 'PEA-PME': (parseInt(e.target.value, 10) || 0) / 100 } })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Répartition CTO</label>
            <input
              type="number" className="input" min={0} max={100}
              value={Math.round(localConfig.allocationSplit.CTO * 100)}
              onChange={(e) => handleConfigChange({ allocationSplit: { ...localConfig.allocationSplit, CTO: (parseInt(e.target.value, 10) || 0) / 100 } })}
            />
          </div>
        </div>
        {Math.round((localConfig.allocationSplit.PEA + localConfig.allocationSplit['PEA-PME'] + localConfig.allocationSplit.CTO) * 100) !== 100 && (
          <p className="stat-loss" style={{ fontSize: 13 }}>⚠️ La répartition doit sommer à 100 %.</p>
        )}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">📄 Importer une fiche de paie</span>
        </div>
        <p style={{ marginBottom: 12, fontSize: 14, color: 'var(--text-secondary)' }}>
          Le PDF est analysé par IA (Gemini) pour extraire le net à payer, le net social, les cotisations et
          détecter une éventuelle prime. Rien n&apos;est stocké côté serveur — vérifiez toujours les champs avant validation.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" disabled={parsing} onClick={() => fileInputRef.current?.click()}>
            {parsing ? '⏳ Extraction en cours…' : '📤 Importer un PDF'}
          </button>
          <button className="btn btn-secondary" onClick={() => { setDraft(emptyRecord()); setShowForm(true); }}>
            ✏️ Saisie manuelle
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
              <label className="form-label">Net à payer (€)</label>
              <input type="number" className="input" value={draft.netSalary || ''} onChange={(e) => setDraft({ ...draft, netSalary: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="form-group">
              <label className="form-label">Brut (€, optionnel)</label>
              <input type="number" className="input" value={draft.grossSalary ?? ''} onChange={(e) => setDraft({ ...draft, grossSalary: parseFloat(e.target.value) || undefined })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Épargne PEE ce mois (€, optionnel)</label>
              <input type="number" className="input" value={draft.companySavingsPEE ?? ''} onChange={(e) => setDraft({ ...draft, companySavingsPEE: parseFloat(e.target.value) || undefined })} />
            </div>
            <div className="form-group">
              <label className="form-label">Montant à investir ce mois (€)</label>
              <input type="number" className="input" value={draft.investableAmount || ''} onChange={(e) => setDraft({ ...draft, investableAmount: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          {draft.notes && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>ℹ️ {draft.notes}</p>}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button className="btn btn-primary" onClick={handleSave}>💾 Enregistrer</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      <div className="card">
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
                <th>Net</th>
                <th>PEE</th>
                <th>Investi</th>
                <th>Taux</th>
                <th>Source</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.periodLabel}</td>
                  <td>{r.netSalary.toLocaleString('fr-FR')} €</td>
                  <td>{r.companySavingsPEE ? `${r.companySavingsPEE.toLocaleString('fr-FR')} €` : '—'}</td>
                  <td>{r.investableAmount.toLocaleString('fr-FR')} €</td>
                  <td>{r.savingsRate.toFixed(1)} %</td>
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
    </div>
  );
}

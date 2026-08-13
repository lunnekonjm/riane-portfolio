'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import type { SalaryRecord, RevenueConfig, ReserveAllocation } from '@/types/revenue';
import { computeSalaryAnalytics, computeReserveBalance, DEFAULT_REVENUE_CONFIG, REFERENCE_NET_RATES } from '@/types/revenue';
import type { PortfolioConfig } from '@/types/portfolio';

interface RevenueBudgetViewProps {
  records: SalaryRecord[];
  revenueConfig: RevenueConfig;
  allocations: ReserveAllocation[];
  portfolioConfig: PortfolioConfig | null;
  onSaveRecord: (record: SalaryRecord) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  onSaveRevenueConfig: (config: RevenueConfig) => Promise<void>;
  onSaveAllocation: (allocation: ReserveAllocation) => Promise<void>;
  onDeleteAllocation: (id: string) => Promise<void>;
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

export default function RevenueBudgetView({
  records,
  revenueConfig,
  allocations,
  portfolioConfig,
  onSaveRecord,
  onDeleteRecord,
  onSaveRevenueConfig,
  onSaveAllocation,
  onDeleteAllocation,
  onSyncMonthlyBudget,
  onShowToast,
}: RevenueBudgetViewProps) {
  const [draft, setDraft] = useState<SalaryRecord>(emptyRecord());
  const [showForm, setShowForm] = useState(false);
  const [parsing, setParsing] = useState(false);

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

  const analytics = computeSalaryAnalytics(records || [], allocations || [], localConfig?.rollingAverageMonths || 3);
  const reserveBalance = useMemo(() => computeReserveBalance(records || [], allocations || []), [records, allocations]);

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
        const suggestedRegular = Math.round(
          baseSalaryNetEstimate * (analytics.averageSavingsRate > 0 ? analytics.averageSavingsRate / 100 : 0.20)
        );
        const bonusReserveContribution = Math.round((bonusNet + congesRachatNet) * 100) / 100;

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
          baseSalaryGross: parsed.baseSalaryGross ?? undefined,
          baseSalaryNet: parsed.baseSalaryNet ?? baseSalaryNetEstimate,
          hasExplicitBonus: parsed.hasExplicitBonus ?? false,
          bonusDescription: parsed.bonusDescription ?? undefined,
          bonusGross: parsed.bonusGross ?? undefined,
          bonusNet: bonusNet || undefined,
          hasCongesRachat: parsed.hasCongesRachat ?? false,
          congesRachatJours: parsed.congesRachatJours ?? undefined,
          congesRachatGross: parsed.congesRachatGross ?? undefined,
          congesRachatNet: congesRachatNet || undefined,
          regularInvestableAmount: suggestedRegular,
          bonusReserveContribution,
          savingsRate: baseSalaryNetEstimate > 0 ? (suggestedRegular / baseSalaryNetEstimate) * 100 : 0,
          source: 'pdf-import',
          documentName: file.name,
          notes: parsed.extractionNotes || undefined,
          createdAt: now,
          updatedAt: now,
        });
        setShowForm(true);

        const bonusMsg = bonusReserveContribution > 0
          ? ` Prime/rachat détecté(e) : ${bonusReserveContribution.toLocaleString('fr-FR')} € net iront dans la réserve (pas de répartition automatique).`
          : '';
        onShowToast(
          (parsed.confidence === 'low' ? 'Extraction incertaine — vérifiez chaque champ.' : 'Fiche de paie extraite — vérifiez avant de valider.') + bonusMsg,
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
    const baseNet = draft.baseSalaryNet ?? Math.max(0, draft.netSalary - (draft.bonusNet || 0) - (draft.congesRachatNet || 0));
    const savingsRate = baseNet > 0 ? (draft.regularInvestableAmount / baseNet) * 100 : 0;
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
        <div className="card" style={{ borderLeft: '3px solid var(--accent-amber)' }}>
          <div className="card-header"><span className="card-title">💰 Réserve primes/rachats</span></div>
          <div className="card-value">{(reserveBalance ?? 0).toLocaleString('fr-FR')} €</div>
        </div>
      </div>

      {(reserveBalance ?? 0) > 0 && (
        <div className="card" style={{ marginBottom: 24, borderLeft: '3px solid var(--accent-amber)' }}>
          <div className="card-header"><span className="card-title">💰 Réserve primes &amp; rachats de congés — non allouée</span></div>
          <p style={{ margin: '8px 0' }}>
            <strong>{(reserveBalance ?? 0).toLocaleString('fr-FR')} €</strong> accumulés depuis les primes et rachats de jours détectés
            sur vos bulletins, en attente de votre décision. Cette somme n&apos;est <strong>jamais</strong> répartie
            automatiquement selon la cible PEA/PEA-PME/CTO — c&apos;est vous qui décidez quand et où l&apos;investir.
          </p>
          {!showAllocForm ? (
            <button className="btn btn-primary" onClick={() => { setAllocAmount(reserveBalance); setShowAllocForm(true); }}>
              Allouer maintenant
            </button>
          ) : (
            <div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Montant à allouer (€)</label>
                  <input type="number" className="input" value={allocAmount || ''} max={reserveBalance}
                    onChange={(e) => setAllocAmount(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Enveloppe</label>
                  <select className="input" value={allocEnvelope} onChange={(e) => setAllocEnvelope(e.target.value as 'PEA' | 'PEA-PME' | 'CTO')}>
                    <option value="CTO">CTO</option>
                    <option value="PEA">PEA classique</option>
                    <option value="PEA-PME">PEA-PME</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Ticker (optionnel)</label>
                  <input className="input" placeholder="ex: SYM" value={allocTicker} onChange={(e) => setAllocTicker(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="btn btn-primary" onClick={handleAllocate}>Confirmer l&apos;allocation</button>
                <button className="btn btn-ghost" onClick={() => setShowAllocForm(false)}>Annuler</button>
              </div>
            </div>
          )}
        </div>
      )}

      {(analytics?.suggestedMonthlyBudget ?? 0) > 0 && portfolioConfig && portfolioConfig.monthlyBudget != null && analytics.suggestedMonthlyBudget !== portfolioConfig.monthlyBudget && (
        <div className="card" style={{ marginBottom: 24, borderLeft: '3px solid var(--accent-amber)' }}>
          <div className="card-header"><span className="card-title">⚠️ Écart détecté</span></div>
          <p style={{ margin: '8px 0' }}>
            Le budget mensuel configuré ({(portfolioConfig.monthlyBudget ?? 0).toLocaleString('fr-FR')} €) diffère de la moyenne
            régulière de vos {localConfig?.rollingAverageMonths ?? 3} dernières fiches de paie ({(analytics.suggestedMonthlyBudget ?? 0).toLocaleString('fr-FR')} €,
            primes et rachats exclus). Ce montant alimente le DCA mensuel — la réserve primes/rachats n&apos;y est jamais mélangée.
          </p>
          <button className="btn btn-primary" onClick={handleSyncBudget}>
            Synchroniser à {(analytics.suggestedMonthlyBudget ?? 0).toLocaleString('fr-FR')} €/mois
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
                checked={localConfig?.autoSyncMonthlyBudget ?? true}
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
              value={localConfig?.rollingAverageMonths ?? 3}
              onChange={(e) => handleConfigChange({ rollingAverageMonths: parseInt(e.target.value, 10) || 3 })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Enveloppe par défaut pour la réserve</label>
            <select className="input" value={localConfig?.defaultReserveEnvelope ?? 'CTO'}
              onChange={(e) => handleConfigChange({ defaultReserveEnvelope: e.target.value as 'PEA' | 'PEA-PME' | 'CTO' })}>
              <option value="CTO">CTO</option>
              <option value="PEA">PEA classique</option>
              <option value="PEA-PME">PEA-PME</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Répartition PEA (capacité régulière uniquement)</label>
            <input
              type="number" className="input" min={0} max={100}
              value={Math.round((localConfig?.allocationSplit?.PEA ?? 0.4) * 100)}
              onChange={(e) => handleConfigChange({
                allocationSplit: {
                  PEA: (parseInt(e.target.value, 10) || 0) / 100,
                  'PEA-PME': localConfig?.allocationSplit?.['PEA-PME'] ?? 0.4,
                  CTO: localConfig?.allocationSplit?.CTO ?? 0.2,
                }
              })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Répartition PEA-PME</label>
            <input
              type="number" className="input" min={0} max={100}
              value={Math.round((localConfig?.allocationSplit?.['PEA-PME'] ?? 0.4) * 100)}
              onChange={(e) => handleConfigChange({
                allocationSplit: {
                  PEA: localConfig?.allocationSplit?.PEA ?? 0.4,
                  'PEA-PME': (parseInt(e.target.value, 10) || 0) / 100,
                  CTO: localConfig?.allocationSplit?.CTO ?? 0.2,
                }
              })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Répartition CTO</label>
            <input
              type="number" className="input" min={0} max={100}
              value={Math.round((localConfig?.allocationSplit?.CTO ?? 0.2) * 100)}
              onChange={(e) => handleConfigChange({
                allocationSplit: {
                  PEA: localConfig?.allocationSplit?.PEA ?? 0.4,
                  'PEA-PME': localConfig?.allocationSplit?.['PEA-PME'] ?? 0.4,
                  CTO: (parseInt(e.target.value, 10) || 0) / 100,
                }
              })}
            />
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
          Rappel fréquence d&apos;achat réelle (section 08/09 du plan) : seul le PEA classique (PUST) est en virement
          mensuel. PEA-PME et CTO accumulent jusqu&apos;à un seuil avant achat groupé, pour limiter le poids des frais
          proportionnels sur les petits montants — voir la fiche de chaque position.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>💼 Fiches de Paie &amp; Revenus Mensuels</h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            Saisissez votre salaire net et primes en 5 secondes pour calculer automatiquement votre capacité d&apos;épargne.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setDraft(emptyRecord()); setShowForm(true); }}>
          ➕ Saisir un salaire
        </button>
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

'use client';

import { useState, useMemo } from 'react';
import type { PortfolioConfig, InvestorProfile, DCATranche } from '@/types/portfolio';
import {
  calculateCumulativeDCA,
  addOrStepUpDCATranche,
  getActiveDCATranche,
  getTodayDateString,
  updateChainedTranches,
  deleteChainedTranche,
} from '@/utils/dcaHistoryHelper';
import InfoTooltip from '@/components/InfoTooltip';
import CustomDatePicker from '@/components/CustomDatePicker';

interface ConfigEditorProps {
  config: PortfolioConfig;
  investorProfile?: InvestorProfile | null;
  onSave: (config: PortfolioConfig) => void;
  onSyncProfile?: (profile: InvestorProfile) => void;
  onClose: () => void;
  onTestNotification?: () => void;
  onTestEmail?: () => void;
}

const RISK_PROFILES: Array<{ value: PortfolioConfig['riskProfile']; label: string }> = [
  { value: 'conservative', label: 'Conservateur' },
  { value: 'balanced', label: 'Équilibré' },
  { value: 'dynamic', label: 'Dynamique' },
  { value: 'aggressive', label: 'Agressif' },
];

export default function ConfigEditor({
  config,
  investorProfile,
  onSave,
  onSyncProfile,
  onClose,
  onTestNotification,
  onTestEmail,
}: ConfigEditorProps) {
  const [form, setForm] = useState<PortfolioConfig>({ ...config });
  const [isMultiTierDCA, setIsMultiTierDCA] = useState<boolean>(() => {
    return Boolean(config.dcaHistory && config.dcaHistory.length > 1);
  });
  const [dcaHistory, setDcaHistory] = useState<DCATranche[]>(() => {
    if (config.dcaHistory && config.dcaHistory.length > 0) {
      return [...config.dcaHistory];
    }
    return [
      {
        id: `dca-tranche-init`,
        startDate: config.dcaStartDate || '2024-01-01',
        amount: config.monthlyBudget || 1000,
        label: 'Palier initial',
      },
    ];
  });

  const [newTrancheAmount, setNewTrancheAmount] = useState<number>(() => (form.monthlyBudget || 1000) + 200);
  const [newTrancheDate, setNewTrancheDate] = useState<string>(() => getTodayDateString());
  const [newTrancheReason, setNewTrancheReason] = useState<string>('Augmentation de salaire');
  const [showAddTrancheForm, setShowAddTrancheForm] = useState<boolean>(false);

  const handleChange = (field: keyof PortfolioConfig, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof PortfolioConfig, value: string) => {
    const num = value === '' ? 0 : parseFloat(value);
    if (!isNaN(num)) handleChange(field, num);
  };

  // Sync dynamic active monthly budget from dcaHistory if in multi-tier mode
  const activeTranche = useMemo(() => getActiveDCATranche(dcaHistory), [dcaHistory]);

  const cumulativeStats = useMemo(() => {
    return calculateCumulativeDCA(
      isMultiTierDCA ? dcaHistory : undefined,
      form.monthlyBudget,
      form.dcaStartDate || '2024-01-01'
    );
  }, [isMultiTierDCA, dcaHistory, form.monthlyBudget, form.dcaStartDate]);

  const handleAddStepUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTrancheAmount <= 0) return;
    const updated = addOrStepUpDCATranche(dcaHistory, newTrancheAmount, newTrancheDate, newTrancheReason);
    setDcaHistory(updated);
    setShowAddTrancheForm(false);
    
    // Auto sync active budget
    const active = getActiveDCATranche(updated);
    if (active) {
      setForm((prev) => ({ ...prev, monthlyBudget: active.amount, dcaHistory: updated }));
    }
  };

  const handleUpdateTranche = (id: string, updates: Partial<DCATranche>) => {
    setDcaHistory((prev) => {
      const next = updateChainedTranches(prev, id, updates);
      const active = getActiveDCATranche(next);
      if (active) {
        setForm((p) => ({ ...p, monthlyBudget: active.amount, dcaHistory: next }));
      }
      return next;
    });
  };

  const handleDeleteTranche = (id: string) => {
    setDcaHistory((prev) => {
      if (prev.length <= 1) return prev;
      const next = deleteChainedTranche(prev, id);
      const active = getActiveDCATranche(next);
      if (active) {
        setForm((p) => ({ ...p, monthlyBudget: active.amount, dcaHistory: next }));
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalMonthlyBudget = isMultiTierDCA && activeTranche ? activeTranche.amount : form.monthlyBudget;
    const finalConfig: PortfolioConfig = {
      ...form,
      monthlyBudget: finalMonthlyBudget,
      dcaHistory: isMultiTierDCA ? dcaHistory : undefined,
    };

    onSave(finalConfig);

    // Sync riskProfile & horizonYears back to InvestorProfile
    if (onSyncProfile && investorProfile && investorProfile.onboardingCompleted) {
      if (
        finalConfig.riskProfile !== investorProfile.riskProfile ||
        finalConfig.horizonYears !== investorProfile.horizonYears ||
        finalConfig.monthlyBudget !== investorProfile.monthlyBudget
      ) {
        onSyncProfile({
          ...investorProfile,
          riskProfile: finalConfig.riskProfile,
          horizonYears: finalConfig.horizonYears,
          monthlyBudget: finalConfig.monthlyBudget,
          updatedAt: Date.now(),
        });
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div>
            <h2>⚙️ Configuration Portefeuille</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              Paramétrez vos budgets d&apos;investissement et l&apos;historique de vos paliers de DCA.
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button" aria-label="Fermer">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* SECTION DCA & HISTORICITÉ */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  💶 Capacité Mensuelle DCA
                </span>
                <InfoTooltip
                  title="Historicité du DCA"
                  text="Permet de suivre l'évolution de votre capacité d'épargne (step-ups, promotions) sans écraser le passé ni fausser votre capital cumulé."
                  theme="cyan"
                  align="left"
                />
              </div>

              {/* Mode Toggle */}
              <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: 3, borderRadius: 8 }}>
                <button
                  type="button"
                  style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    borderRadius: 6,
                    border: 'none',
                    background: !isMultiTierDCA ? 'var(--accent-cyan)' : 'transparent',
                    color: !isMultiTierDCA ? '#000' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={() => setIsMultiTierDCA(false)}
                >
                  Montant Fixe
                </button>
                <button
                  type="button"
                  style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    borderRadius: 6,
                    border: 'none',
                    background: isMultiTierDCA ? 'var(--accent-emerald)' : 'transparent',
                    color: isMultiTierDCA ? '#000' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setIsMultiTierDCA(true);
                  }}
                >
                  📈 Paliers Historiques ({dcaHistory.length})
                </button>
              </div>
            </div>

            {!isMultiTierDCA ? (
              <div>
                <div className="form-group" style={{ marginBottom: 8 }}>
                  <label className="form-label">Budget mensuel actuel (€/mois)</label>
                  <input
                    className="input mono"
                    type="number"
                    step="50"
                    min="0"
                    value={form.monthlyBudget}
                    onChange={(e) => handleNumberChange('monthlyBudget', e.target.value)}
                    id="config-monthly-budget"
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    💡 Si votre capacité d&apos;épargne a augmenté récemment, utilisez les <strong>Paliers Historiques</strong> pour conserver l&apos;exactitude de vos versements passés.
                  </span>
                </div>
              </div>
            ) : (
              <div>
                {/* Visual Timeline of DCA Slices */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  {dcaHistory.map((tranche, idx) => {
                    const isTrancheActive = !tranche.endDate || tranche.endDate >= getTodayDateString();
                    return (
                      <div
                        key={tranche.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(110px, 1.2fr) minmax(110px, 1.2fr) minmax(90px, 1fr) minmax(110px, 1.5fr) 32px',
                          gap: 8,
                          alignItems: 'center',
                          padding: '8px 10px',
                          background: isTrancheActive ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-tertiary)',
                          border: `1px solid ${isTrancheActive ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
                          borderRadius: 8,
                        }}
                      >
                        <div>
                          <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: 2 }}>Début</label>
                          <CustomDatePicker
                            value={tranche.startDate}
                            onChange={(val) => handleUpdateTranche(tranche.id, { startDate: val })}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: 2 }}>Fin</label>
                          <CustomDatePicker
                            value={tranche.endDate || ''}
                            onChange={(val) => handleUpdateTranche(tranche.id, { endDate: val || undefined })}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: 2 }}>Montant</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <input
                              type="number"
                              step="50"
                              min="0"
                              className="input mono font-bold"
                              style={{ padding: '6px 8px', fontSize: 12, color: isTrancheActive ? 'var(--accent-emerald)' : 'inherit' }}
                              value={tranche.amount}
                              onChange={(e) => handleUpdateTranche(tranche.id, { amount: parseFloat(e.target.value) || 0 })}
                            />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>€</span>
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: 2 }}>Motif / Label</label>
                          <input
                            type="text"
                            className="input"
                            style={{ padding: '6px 8px', fontSize: 12 }}
                            value={tranche.label || ''}
                            placeholder="ex: Promotion, Bonus..."
                            onChange={(e) => handleUpdateTranche(tranche.id, { label: e.target.value })}
                          />
                        </div>

                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--accent-rose)', padding: 4, height: 28, width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Supprimer ce palier"
                          onClick={() => handleDeleteTranche(tranche.id)}
                          disabled={dcaHistory.length <= 1}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add Step-up Form Toggle */}
                {!showAddTrancheForm ? (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onClick={() => setShowAddTrancheForm(true)}
                  >
                    <span>➕</span>
                    <span>Ajouter une augmentation de DCA (Step-up)</span>
                  </button>
                ) : (
                  <div style={{
                    padding: 12,
                    background: 'var(--bg-tertiary)',
                    borderRadius: 8,
                    border: '1px dashed var(--accent-cyan)',
                    marginBottom: 12,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--accent-cyan)' }}>
                      🚀 Programmer un nouveau palier d&apos;épargne
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: 8, marginBottom: 8 }}>
                      <div>
                        <label className="form-label" style={{ fontSize: 11, marginBottom: 2 }}>Date d&apos;effet</label>
                        <CustomDatePicker
                          value={newTrancheDate}
                          onChange={(val) => setNewTrancheDate(val)}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: 11 }}>Nouveau DCA (€/m)</label>
                        <input
                          type="number"
                          step="50"
                          min="0"
                          className="input mono font-bold"
                          style={{ fontSize: 12 }}
                          value={newTrancheAmount}
                          onChange={(e) => setNewTrancheAmount(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: 11 }}>Motif / Commentaire</label>
                        <input
                          type="text"
                          className="input"
                          style={{ fontSize: 12 }}
                          value={newTrancheReason}
                          onChange={(e) => setNewTrancheReason(e.target.value)}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddTrancheForm(false)}>
                        Annuler
                      </button>
                      <button type="button" className="btn btn-primary btn-sm" onClick={handleAddStepUp}>
                        ✓ Valider le palier
                      </button>
                    </div>
                  </div>
                )}

                {/* Cumulative DCA KPI Box */}
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(56, 189, 248, 0.06)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Cumul historique injecté</span>
                    <span className="mono font-bold text-sm" style={{ color: 'var(--accent-cyan)' }}>
                      {cumulativeStats.totalInvested.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Durée cumulée</span>
                    <span className="mono font-bold text-sm">
                      {cumulativeStats.totalMonths} mois ({(cumulativeStats.totalMonths / 12).toFixed(1)} ans)
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Rythme moyen historique</span>
                    <span className="mono font-bold text-sm" style={{ color: 'var(--accent-emerald)' }}>
                      {cumulativeStats.averageMonthly.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}/m
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION AUTRES BUDGETS & PROFIL */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Budget annuel CTO (€)</label>
              <input
                className="input mono"
                type="number"
                step="100"
                min="0"
                value={form.annualCTOBudget}
                onChange={(e) => handleNumberChange('annualCTOBudget', e.target.value)}
                id="config-cto-budget"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cap spéculatif annuel (€)</label>
              <input
                className="input mono"
                type="number"
                step="100"
                min="0"
                value={form.annualSpeculativeCap}
                onChange={(e) => handleNumberChange('annualSpeculativeCap', e.target.value)}
                id="config-speculative-cap"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Profil de risque</label>
              <select
                className="input"
                value={form.riskProfile}
                onChange={(e) => handleChange('riskProfile', e.target.value)}
                id="config-risk-profile"
              >
                {RISK_PROFILES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Horizon (années)</label>
              <input
                className="input mono"
                type="number"
                step="1"
                min="1"
                max="40"
                value={form.horizonYears}
                onChange={(e) => handleNumberChange('horizonYears', e.target.value)}
                id="config-horizon"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Devise de base</label>
            <select
              className="input"
              value={form.baseCurrency}
              onChange={(e) => handleChange('baseCurrency', e.target.value)}
              id="config-currency"
            >
              <option value="EUR">EUR — Euro</option>
              <option value="USD">USD — Dollar</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 8, marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={form.noLeverage}
                onChange={(e) => handleChange('noLeverage', e.target.checked)}
              />
              Pas d&apos;effet de levier
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={form.rebalanceByFlows}
                onChange={(e) => handleChange('rebalanceByFlows', e.target.checked)}
              />
              Rééquilibrage par les flux
            </label>
          </div>

          {(onTestNotification || onTestEmail) && (
            <div style={{ marginTop: 20, padding: 14, background: 'var(--bg-tertiary)', borderRadius: 8, borderLeft: '3px solid var(--accent-cyan)' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🛠️ Outils Développeur</h4>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {onTestNotification && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={onTestNotification}>
                    🧪 Tester Notifications DCA
                  </button>
                )}
                {onTestEmail && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={onTestEmail}>
                    📧 Envoyer Email de Test
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" id="btn-save-config">
              💾 Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import type { PortfolioConfig, InvestorProfile } from '@/types/portfolio';
import { useConfigEditorState } from '@/hooks/useConfigEditorState';
import { ConfigEditorDcaSection } from './config/ConfigEditorDcaSection';

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
  const {
    form,
    isMultiTierDCA,
    setIsMultiTierDCA,
    dcaHistory,
    newTrancheAmount,
    setNewTrancheAmount,
    newTrancheDate,
    setNewTrancheDate,
    newTrancheReason,
    setNewTrancheReason,
    showAddTrancheForm,
    setShowAddTrancheForm,
    handleChange,
    handleNumberChange,
    cumulativeStats,
    handleAddStepUp,
    handleUpdateTranche,
    handleDeleteTranche,
    handleSubmit,
  } = useConfigEditorState({
    config,
    investorProfile,
    onSave,
    onSyncProfile,
    onClose,
  });

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
          <ConfigEditorDcaSection
            form={form}
            isMultiTierDCA={isMultiTierDCA}
            setIsMultiTierDCA={setIsMultiTierDCA}
            dcaHistory={dcaHistory}
            handleNumberChange={handleNumberChange}
            handleUpdateTranche={handleUpdateTranche}
            handleDeleteTranche={handleDeleteTranche}
            showAddTrancheForm={showAddTrancheForm}
            setShowAddTrancheForm={setShowAddTrancheForm}
            newTrancheDate={newTrancheDate}
            setNewTrancheDate={setNewTrancheDate}
            newTrancheAmount={newTrancheAmount}
            setNewTrancheAmount={setNewTrancheAmount}
            newTrancheReason={newTrancheReason}
            setNewTrancheReason={setNewTrancheReason}
            handleAddStepUp={handleAddStepUp}
            cumulativeStats={cumulativeStats}
          />

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

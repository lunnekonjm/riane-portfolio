'use client';

import { useState } from 'react';
import type { PortfolioConfig } from '@/types/portfolio';

interface ConfigEditorProps {
  config: PortfolioConfig;
  onSave: (config: PortfolioConfig) => void;
  onClose: () => void;
}

const RISK_PROFILES: Array<{ value: PortfolioConfig['riskProfile']; label: string }> = [
  { value: 'conservative', label: 'Conservateur' },
  { value: 'balanced', label: 'Équilibré' },
  { value: 'dynamic', label: 'Dynamique' },
  { value: 'aggressive', label: 'Agressif' },
];

export default function ConfigEditor({ config, onSave, onClose }: ConfigEditorProps) {
  const [form, setForm] = useState<PortfolioConfig>({ ...config });

  const handleChange = (field: keyof PortfolioConfig, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof PortfolioConfig, value: string) => {
    const num = value === '' ? 0 : parseFloat(value);
    if (!isNaN(num)) handleChange(field, num);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h2>⚙️ Configuration Portefeuille</h2>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: 20 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Budget mensuel DCA (€)</label>
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

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
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

'use client';

import React, { useState } from 'react';
import { THEMES } from '@/data/themes';

interface TargetWeightsThemesSectionProps {
  targetWeight?: number;
  onTargetWeightChange: (val?: number) => void;
  maxWeight?: number;
  onMaxWeightChange: (val?: number) => void;
  themes: string[];
  onThemesChange: (themes: string[]) => void;
}

export default function TargetWeightsThemesSection({
  targetWeight,
  onTargetWeightChange,
  maxWeight,
  onMaxWeightChange,
  themes,
  onThemesChange,
}: TargetWeightsThemesSectionProps) {
  const [themeInput, setThemeInput] = useState('');

  const addTheme = (themeId: string) => {
    if (!themeId) return;
    if (!themes.includes(themeId)) {
      onThemesChange([...themes, themeId]);
    }
    setThemeInput('');
  };

  const removeTheme = (themeId: string) => {
    onThemesChange(themes.filter((t) => t !== themeId));
  };

  return (
    <>
      {/* Row: Target & Max Weights with Preset Buttons */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Poids cible (%)</label>
          <input
            className="input mono"
            type="number"
            step="1"
            min="0"
            max="100"
            value={targetWeight !== undefined ? (targetWeight * 100).toFixed(0) : ''}
            onChange={(e) => {
              const val = e.target.value ? parseFloat(e.target.value) / 100 : undefined;
              onTargetWeightChange(val);
            }}
            placeholder="ex: 10%"
            id="input-target-weight"
          />
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            {[5, 10, 15, 20, 25, 50].map((pct) => (
              <button
                key={pct}
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 'var(--text-xs)', padding: '3px 8px', fontWeight: 600 }}
                onClick={() => onTargetWeightChange(pct / 100)}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Poids max (%)</label>
          <input
            className="input mono"
            type="number"
            step="1"
            min="0"
            max="100"
            value={maxWeight !== undefined ? (maxWeight * 100).toFixed(0) : ''}
            onChange={(e) => {
              const val = e.target.value ? parseFloat(e.target.value) / 100 : undefined;
              onMaxWeightChange(val);
            }}
            placeholder="ex: 30%"
            id="input-max-weight"
          />
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: 'var(--text-xs)',
                padding: '3px 8px',
                fontWeight: 600,
                background: maxWeight === undefined ? 'rgba(6, 182, 212, 0.2)' : undefined,
                color: maxWeight === undefined ? 'var(--accent-cyan)' : undefined,
                border: maxWeight === undefined ? '1px solid var(--accent-cyan)' : undefined,
              }}
              onClick={() => onMaxWeightChange(undefined)}
            >
              🚫 Sans plafond
            </button>
            {[5, 10, 15, 25, 30, 50].map((pct) => {
              const isCur = maxWeight !== undefined && Math.round(maxWeight * 100) === pct;
              return (
                <button
                  key={pct}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: 'var(--text-xs)',
                    padding: '3px 8px',
                    fontWeight: 600,
                    background: isCur ? 'rgba(245, 158, 11, 0.2)' : undefined,
                    color: isCur ? 'var(--accent-amber)' : undefined,
                    border: isCur ? '1px solid var(--accent-amber)' : undefined,
                  }}
                  onClick={() => onMaxWeightChange(pct / 100)}
                >
                  {pct}%
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Themes */}
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Thèmes d&apos;Investissement</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-violet)', fontWeight: 600 }}>✨ Générés automatiquement selon le secteur</span>
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {themes.map((t) => (
            <span key={t} className="badge badge-violet" style={{ cursor: 'pointer', padding: '4px 10px', fontSize: 12 }} onClick={() => removeTheme(t)} title="Cliquer pour retirer">
              {THEMES.find((th) => th.id === t)?.label || t} ✕
            </span>
          ))}
        </div>
        <select
          className="input"
          value={themeInput}
          onChange={(e) => { addTheme(e.target.value); }}
          id="select-theme"
        >
          <option value="">+ Modifier / Ajouter un thème personnalisé...</option>
          {THEMES.filter((t) => !themes.includes(t.id)).map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>
    </>
  );
}

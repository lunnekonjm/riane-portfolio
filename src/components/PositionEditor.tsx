'use client';

import { useState, useEffect } from 'react';
import type { Position } from '@/types/portfolio';
import { THEMES } from '@/data/themes';

interface PositionEditorProps {
  position?: Position | null;
  onSave: (position: Position) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

const ENVELOPES = ['PEA', 'PEA-PME', 'CTO', 'PEE', 'SPECULATIVE', 'OPPORTUNISTIC'];
const ASSET_TYPES: Position['assetType'][] = ['ETF', 'STOCK', 'FUND', 'BOND', 'CRYPTO', 'CASH'];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];

function generateId(): string {
  return `pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function PositionEditor({ position, onSave, onClose, onDelete }: PositionEditorProps) {
  const isNew = !position;

  const [form, setForm] = useState<Position>({
    id: position?.id || generateId(),
    ticker: position?.ticker || '',
    name: position?.name || '',
    envelope: position?.envelope || 'PEA',
    assetType: position?.assetType || 'ETF',
    currency: position?.currency || 'EUR',
    quantity: position?.quantity || 0,
    avgPrice: position?.avgPrice || 0,
    currentPrice: position?.currentPrice,
    themes: position?.themes || [],
    monthlyDCA: position?.monthlyDCA,
    annualBudget: position?.annualBudget,
    targetWeight: position?.targetWeight,
    maxWeight: position?.maxWeight,
    updatedAt: Date.now(),
  });

  const [themeInput, setThemeInput] = useState('');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleChange = (field: keyof Position, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof Position, value: string) => {
    const num = value === '' ? 0 : parseFloat(value);
    if (!isNaN(num)) {
      handleChange(field, num);
    }
  };

  const handleOptionalNumber = (field: keyof Position, value: string) => {
    if (value === '') {
      handleChange(field, undefined);
    } else {
      const num = parseFloat(value);
      if (!isNaN(num)) handleChange(field, num);
    }
  };

  const addTheme = (themeId: string) => {
    if (themeId && !form.themes.includes(themeId)) {
      handleChange('themes', [...form.themes, themeId]);
    }
    setThemeInput('');
  };

  const removeTheme = (themeId: string) => {
    handleChange('themes', form.themes.filter((t) => t !== themeId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ticker.trim() || !form.name.trim()) return;
    onSave({ ...form, updatedAt: Date.now() });
  };

  const totalValue = form.quantity * (form.currentPrice || form.avgPrice);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isNew ? '➕ Ajouter une Position' : `✏️ Modifier ${form.name}`}</h2>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: 20 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Row 1: Ticker + Name */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ticker *</label>
              <input
                className="input"
                value={form.ticker}
                onChange={(e) => handleChange('ticker', e.target.value.toUpperCase())}
                placeholder="CW8.PA, COHR, PUST.PA..."
                required
                id="input-ticker"
              />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Nom *</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="MSCI ACWI (Amundi)..."
                required
                id="input-name"
              />
            </div>
          </div>

          {/* Row 2: Envelope + Asset Type + Currency */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Enveloppe</label>
              <select className="input" value={form.envelope} onChange={(e) => handleChange('envelope', e.target.value)} id="select-envelope">
                {ENVELOPES.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Type d&apos;actif</label>
              <select className="input" value={form.assetType} onChange={(e) => handleChange('assetType', e.target.value)} id="select-asset-type">
                {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Devise</label>
              <select className="input" value={form.currency} onChange={(e) => handleChange('currency', e.target.value)} id="select-currency">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3: Quantity + Avg Price + Current Price */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantité</label>
              <input
                className="input mono"
                type="number"
                step="any"
                min="0"
                value={form.quantity || ''}
                onChange={(e) => handleNumberChange('quantity', e.target.value)}
                placeholder="0"
                id="input-quantity"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Prix moyen d&apos;achat</label>
              <input
                className="input mono"
                type="number"
                step="0.01"
                min="0"
                value={form.avgPrice || ''}
                onChange={(e) => handleNumberChange('avgPrice', e.target.value)}
                placeholder="0.00"
                id="input-avg-price"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Prix actuel</label>
              <input
                className="input mono"
                type="number"
                step="0.01"
                min="0"
                value={form.currentPrice || ''}
                onChange={(e) => handleOptionalNumber('currentPrice', e.target.value)}
                placeholder="Auto-refresh"
                id="input-current-price"
              />
            </div>
          </div>

          {/* Value display */}
          {totalValue > 0 && (
            <div style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Valeur actuelle</span>
              <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {totalValue.toLocaleString('fr-FR', { style: 'currency', currency: form.currency })}
              </span>
            </div>
          )}

          {/* Row 4: DCA + Annual Budget */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">DCA mensuel (€)</label>
              <input
                className="input mono"
                type="number"
                step="10"
                min="0"
                value={form.monthlyDCA ?? ''}
                onChange={(e) => handleOptionalNumber('monthlyDCA', e.target.value)}
                placeholder="—"
                id="input-monthly-dca"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Budget annuel (€)</label>
              <input
                className="input mono"
                type="number"
                step="100"
                min="0"
                value={form.annualBudget ?? ''}
                onChange={(e) => handleOptionalNumber('annualBudget', e.target.value)}
                placeholder="—"
                id="input-annual-budget"
              />
            </div>
          </div>

          {/* Row 5: Weights */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Poids cible (%)</label>
              <input
                className="input mono"
                type="number"
                step="1"
                min="0"
                max="100"
                value={form.targetWeight ? (form.targetWeight * 100).toFixed(0) : ''}
                onChange={(e) => handleOptionalNumber('targetWeight', e.target.value ? String(parseFloat(e.target.value) / 100) : '')}
                placeholder="—"
                id="input-target-weight"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Poids max (%)</label>
              <input
                className="input mono"
                type="number"
                step="1"
                min="0"
                max="100"
                value={form.maxWeight ? (form.maxWeight * 100).toFixed(0) : ''}
                onChange={(e) => handleOptionalNumber('maxWeight', e.target.value ? String(parseFloat(e.target.value) / 100) : '')}
                placeholder="—"
                id="input-max-weight"
              />
            </div>
          </div>

          {/* Themes */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Thèmes</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {form.themes.map((t) => (
                <span key={t} className="badge badge-violet" style={{ cursor: 'pointer' }} onClick={() => removeTheme(t)}>
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
              <option value="">+ Ajouter un thème...</option>
              {THEMES.filter((t) => !form.themes.includes(t.id)).map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
            <div>
              {!isNew && onDelete && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ color: 'var(--accent-rose)' }}
                  onClick={() => { if (confirm(`Supprimer ${form.name} ?`)) onDelete(form.id); }}
                  id="btn-delete-position"
                >
                  🗑️ Supprimer
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
              <button type="submit" className="btn btn-primary" id="btn-save-position">
                {isNew ? '➕ Ajouter' : '💾 Enregistrer'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

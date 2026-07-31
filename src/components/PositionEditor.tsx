'use client';

import { useState, useEffect, useRef } from 'react';
import type { Position } from '@/types/portfolio';
import { THEMES } from '@/data/themes';
import { simulatePositionDCA, type DCASimulationResult } from '@/engines/dcaSimulation';
import { searchAssets, ASSET_REGISTRY, type RegisteredAsset } from '@/data/assetRegistry';
import { getQuote, getCompanyProfile, searchYahooFinance } from '@/services/market-data/provider';

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

  // Autocomplete & Verification States
  const [tickerSearchInput, setTickerSearchInput] = useState<string>(position?.ticker || '');
  const [searchResults, setSearchResults] = useState<RegisteredAsset[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isVerifyingTicker, setIsVerifyingTicker] = useState<boolean>(false);
  const [verifiedQuoteText, setVerifiedQuoteText] = useState<string | null>(position?.currentPrice ? `✓ Prix en direct : ${position.currentPrice} ${position.currency}` : null);
  const [tickerError, setTickerError] = useState<string | null>(null);

  const [themeInput, setThemeInput] = useState('');

  // DCA Auto-Calculation State
  const [dcaStartDate, setDcaStartDate] = useState<string>('2024-01');
  const [isCalculatingDCA, setIsCalculatingDCA] = useState<boolean>(false);
  const [dcaResult, setDcaResult] = useState<DCASimulationResult | null>(null);
  const [showDCAHistory, setShowDCAHistory] = useState<boolean>(false);

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

  // Asset Cache Engine (localStorage)
  const [cachedAssets, setCachedAssets] = useState<RegisteredAsset[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('riane_asset_cache');
      if (raw) {
        setCachedAssets(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveToAssetCache = (asset: RegisteredAsset) => {
    try {
      const updated = [asset, ...cachedAssets.filter((a) => a.ticker !== asset.ticker)].slice(0, 10);
      setCachedAssets(updated);
      localStorage.setItem('riane_asset_cache', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

function autoGenerateThemes(
  ticker: string,
  name?: string,
  sector?: string,
  industry?: string
): string[] {
  const t = (ticker || '').toUpperCase();
  const n = (name || '').toLowerCase();
  const s = (sector || '').toLowerCase();
  const ind = (industry || '').toLowerCase();
  const matched = new Set<string>();

  // 1. Core global ETFs
  if (t.includes('CW8') || t.includes('GPEA') || t.includes('ACWI') || n.includes('msci world') || n.includes('acwi')) {
    matched.add('global-core');
  }

  // 2. Tech / Nasdaq / AI
  if (t.includes('PUST') || t.includes('QQQ') || n.includes('nasdaq') || s.includes('tech') || ind.includes('software') || ind.includes('cloud')) {
    matched.add('ai-datacenters');
    matched.add('tech-satellite');
  }

  // 3. Semiconductors
  if (ind.includes('semi') || n.includes('semi') || s.includes('semi') || t.includes('ALRIB') || t.includes('MEMS') || t.includes('NVDA') || t.includes('AMD') || t.includes('ASML')) {
    matched.add('semiconductors');
    matched.add('ai-datacenters');
  }

  // 4. Photonics / Sensors / Deep Tech (e.g. Kalray, Coherent, STMicro)
  if (t.includes('COHR') || t.includes('ALKAL') || ind.includes('photo') || n.includes('kalray') || n.includes('coherent')) {
    matched.add('photonics');
    matched.add('semiconductors');
  }

  // 5. European Small Caps
  if (t.endsWith('.PA') && (t.startsWith('AL') || t.includes('INDE') || n.includes('small cap') || s.includes('small'))) {
    matched.add('europe-small-caps');
    matched.add('sovereign-industry');
  }

  // 6. Defense
  if (s.includes('defense') || s.includes('aerospace') || ind.includes('defense') || n.includes('airbus') || n.includes('thales') || n.includes('dassault') || n.includes('safran')) {
    matched.add('defense');
    matched.add('sovereign-industry');
  }

  // 7. Energy / Electrification
  if (s.includes('energy') || s.includes('utilit') || ind.includes('solar') || ind.includes('electricity') || t.includes('CEG') || t.includes('TTE')) {
    matched.add('energy-electrification');
  }

  // 8. Health
  if (s.includes('health') || s.includes('pharma') || ind.includes('biotech') || n.includes('sanofi') || n.includes('novartis')) {
    matched.add('health');
  }

  if (matched.size === 0) {
    if (s.includes('tech')) matched.add('tech-satellite');
    else matched.add('global-core');
  }

  return Array.from(matched);
}

  const handleSelectRegisteredAsset = async (asset: RegisteredAsset) => {
    setShowDropdown(false);
    setTickerSearchInput(`${asset.name} (${asset.ticker})`);
    setTickerError(null);
    setIsVerifyingTicker(true);
    saveToAssetCache(asset);

    setForm((prev) => ({
      ...prev,
      ticker: asset.ticker,
      name: asset.name,
      envelope: asset.envelope,
      assetType: asset.assetType,
      currency: asset.currency,
      themes: asset.themes,
      quantity: prev.quantity || 0,
    }));

    try {
      const [quote, profile] = await Promise.all([
        getQuote(asset.ticker).catch(() => null),
        getCompanyProfile(asset.ticker).catch(() => null),
      ]);

      setForm((prev) => {
        const price = quote?.price && quote.price > 0 ? quote.price : prev.currentPrice;
        const autoThemes = autoGenerateThemes(asset.ticker, profile?.name || asset.name, profile?.sector, profile?.industry);
        return {
          ...prev,
          name: profile?.name || asset.name || prev.name,
          currentPrice: price,
          avgPrice: prev.avgPrice > 0 ? prev.avgPrice : (price || 100),
          currency: (profile?.currency as any) || (quote?.currency as any) || prev.currency,
          themes: autoThemes.length > 0 ? autoThemes : asset.themes,
          quantity: prev.quantity || 0,
        };
      });

      if (quote && quote.price > 0) {
        setVerifiedQuoteText(`✓ Actif officiel vérifié : ${profile?.name || asset.name} (${profile?.sector || asset.exchange || 'Bourse'}) — Prix : ${quote.price.toFixed(2)} ${quote.currency || asset.currency}`);
      } else {
        setVerifiedQuoteText(`✓ Actif répertorié (${asset.exchange})`);
      }
    } catch {
      setVerifiedQuoteText(`✓ Actif répertorié (${asset.exchange})`);
    } finally {
      setIsVerifyingTicker(false);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setTickerSearchInput(value);
    setVerifiedQuoteText(null);
    setTickerError(null);

    const matches = searchAssets(value);
    setSearchResults(matches);
    setShowDropdown(matches.length > 0);

    const exactMatch = ASSET_REGISTRY.find((a) => a.ticker.toLowerCase() === value.trim().toLowerCase());
    if (exactMatch) {
      handleSelectRegisteredAsset(exactMatch);
    } else {
      setForm((prev) => ({ ...prev, ticker: value.toUpperCase() }));
    }
  };

  const [didYouMeanAsset, setDidYouMeanAsset] = useState<RegisteredAsset | null>(null);

  const handleVerifyManualTicker = async () => {
    const rawQuery = (tickerSearchInput || form.ticker).trim();
    if (!rawQuery) return;

    setIsVerifyingTicker(true);
    setTickerError(null);
    setVerifiedQuoteText(null);
    setDidYouMeanAsset(null);

    // 1. Try exact quote fetch for raw ticker
    try {
      const [quote, profile] = await Promise.all([
        getQuote(rawQuery.toUpperCase()).catch(() => null),
        getCompanyProfile(rawQuery.toUpperCase()).catch(() => null),
      ]);

      if (quote && quote.price > 0) {
        setForm((prev) => {
          const autoThemes = autoGenerateThemes(rawQuery.toUpperCase(), profile?.name || prev.name, profile?.sector, profile?.industry);
          return {
            ...prev,
            ticker: rawQuery.toUpperCase(),
            name: profile?.name || prev.name || rawQuery.toUpperCase(),
            currentPrice: quote.price,
            avgPrice: prev.avgPrice > 0 ? prev.avgPrice : (quote.price || 100),
            currency: (profile?.currency as any) || (quote.currency as any) || prev.currency,
            themes: autoThemes.length > 0 ? autoThemes : prev.themes,
            quantity: prev.quantity || 0,
          };
        });
        setVerifiedQuoteText(`✓ Actif officiel vérifié : ${profile?.name || rawQuery.toUpperCase()} (${profile?.sector || 'Marché Direct'}) — Prix : ${quote.price.toFixed(2)} ${quote.currency}`);
        setIsVerifyingTicker(false);
        return;
      }
    } catch {
      // Direct quote failed, fallback to Yahoo Finance Search API
    }

    // 2. Query Yahoo Finance Search API for fuzzy company/brand match (ex: "kalray")
    try {
      const yahooMatches = await searchYahooFinance(rawQuery);
      if (yahooMatches.length > 0) {
        const topMatch = yahooMatches[0];
        const isFrench = topMatch.ticker.endsWith('.PA');
        const candidate: RegisteredAsset = {
          ticker: topMatch.ticker,
          name: topMatch.name,
          assetType: topMatch.assetType,
          envelope: isFrench ? (topMatch.ticker.startsWith('AL') ? 'PEA-PME' : 'PEA') : 'CTO',
          currency: topMatch.currency,
          themes: ['general'],
          exchange: topMatch.exchange,
          searchTerms: [rawQuery.toLowerCase()],
        };

        setDidYouMeanAsset(candidate);
        setTickerError(`💡 Intention détectée : '${rawQuery}' correspond à l'actif officiel ${candidate.name} (${candidate.ticker}).`);
      } else {
        setTickerError(`❌ Impossible de trouver '${rawQuery}' sur les marchés boursiers.`);
      }
    } catch {
      setTickerError(`❌ Ticker ou entreprise '${rawQuery}' non trouvé.`);
    } finally {
      setIsVerifyingTicker(false);
    }
  };

  const handleRunDCASimulation = async () => {
    if (!form.ticker) return;
    const monthlyAmount = form.monthlyDCA || (form.annualBudget ? form.annualBudget / 12 : 100);
    setIsCalculatingDCA(true);
    try {
      // PEA / PEA-PME / CTO require integer shares (no fractional shares!)
      const isIntegerOnly = form.envelope === 'PEA' || form.envelope === 'PEA-PME' || form.envelope === 'CTO';
      const result = await simulatePositionDCA(
        form.ticker,
        monthlyAmount,
        dcaStartDate,
        form.currentPrice || form.avgPrice || 100,
        isIntegerOnly,
        form.dcaFrequency || 'monthly',
        form.dcaDepositMonth || 1,
        form.dcaDepositDay || 5
      );
      setDcaResult(result);
    } catch (err) {
      console.error('DCA Simulation failed:', err);
    } finally {
      setIsCalculatingDCA(false);
    }
  };

  const handleApplyDCAResult = () => {
    if (!dcaResult) return;
    setForm((prev) => ({
      ...prev,
      quantity: dcaResult.totalShares,
      avgPrice: dcaResult.avgPrice,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ticker.trim() || !form.name.trim()) return;

    const cost = form.quantity * form.avgPrice;
    if (form.envelope === 'PEA' && cost > 150000) {
      if (!confirm(`⚠️ Attention : Les versements sur cette position (${cost.toLocaleString('fr-FR')} €) dépassent le plafond légal individuel du PEA (150 000 €).\nVoulez-vous quand même enregistrer ?`)) {
        return;
      }
    }
    if (form.envelope === 'PEA-PME' && cost > 225000) {
      if (!confirm(`⚠️ Attention : Les versements sur cette position (${cost.toLocaleString('fr-FR')} €) dépassent le plafond légal cumulé PEA + PEA-PME (225 000 € max au total).\nVoulez-vous quand même enregistrer ?`)) {
        return;
      }
    }

    onSave({ ...form, updatedAt: Date.now() });
  };

  const totalValue = form.quantity * (form.currentPrice || form.avgPrice);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h2>{isNew ? '➕ Ajouter une Position' : `✏️ Modifier ${form.name}`}</h2>
          <button className="modal-close-btn" onClick={onClose} type="button" aria-label="Fermer">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Autocomplete Search & Ticker Verification Bar */}
          <div className="form-group" style={{ position: 'relative', marginBottom: 16 }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔍 Rechercher une Action, ETF ou Fond Reconnus *</span>
              {isVerifyingTicker && <span style={{ fontSize: 12, color: 'var(--accent-cyan)' }}>Vérification du cours...</span>}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                value={tickerSearchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onFocus={() => setShowDropdown(searchResults.length > 0)}
                placeholder="Tapez un nom ou un ticker (ex: LVMH, Air Liquide, CW8, PUST, Nvidia, MSFT...)"
                id="input-asset-search"
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleVerifyManualTicker}
                disabled={isVerifyingTicker || !form.ticker}
                style={{ whiteSpace: 'nowrap', fontSize: 13 }}
              >
                {isVerifyingTicker ? <span className="loading-spinner" /> : '🔍 Vérifier le cours'}
              </button>
            </div>

            {/* Dropdown Suggestions */}
            {showDropdown && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 100,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-accent)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                maxHeight: 220,
                overflowY: 'auto',
                marginTop: 4,
              }}>
                {searchResults.map((asset) => (
                  <div
                    key={asset.ticker}
                    onClick={() => handleSelectRegisteredAsset(asset)}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <strong style={{ color: 'var(--accent-cyan)', fontSize: 14 }}>{asset.ticker}</strong>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)', marginLeft: 8 }}>{asset.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className="badge badge-cyan" style={{ fontSize: 11 }}>{asset.envelope}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{asset.exchange}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Status Feedback */}
            {verifiedQuoteText && (
              <div style={{ fontSize: 12, color: 'var(--accent-emerald)', fontWeight: 600, marginTop: 6 }}>
                {verifiedQuoteText}
              </div>
            )}
            {tickerError && (
              <div style={{ fontSize: 12, color: 'var(--accent-rose)', fontWeight: 600, marginTop: 6 }}>
                {tickerError}
              </div>
            )}

            {/* Did You Mean Suggestion Button */}
            {didYouMeanAsset && (
              <div style={{ marginTop: 8, padding: 10, background: 'rgba(56, 189, 248, 0.15)', borderRadius: 8, border: '1px solid var(--accent-cyan)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                  💡 Actif trouvé : <strong>{didYouMeanAsset.name}</strong> ({didYouMeanAsset.ticker} · {didYouMeanAsset.exchange})
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleSelectRegisteredAsset(didYouMeanAsset)}
                  style={{ fontSize: 12 }}
                >
                  ✅ Sélectionner {didYouMeanAsset.ticker}
                </button>
              </div>
            )}

            {/* Cached Recent Assets Pills */}
            {cachedAssets.length > 0 && !showDropdown && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>⏱️ Récemment vérifiés :</span>
                {cachedAssets.map((asset) => (
                  <button
                    key={asset.ticker}
                    type="button"
                    className="badge badge-cyan"
                    onClick={() => handleSelectRegisteredAsset(asset)}
                    style={{ cursor: 'pointer', fontSize: 11, padding: '3px 8px', border: '1px solid var(--border-subtle)' }}
                  >
                    {asset.ticker} ({asset.name})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Row 1: Ticker + Name */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ticker Officiel *</label>
              <input
                className="input mono"
                value={form.ticker}
                onChange={(e) => handleChange('ticker', e.target.value.toUpperCase())}
                placeholder="CW8.PA, PUST.PA, MSFT..."
                required
                id="input-ticker"
              />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Nom Complet *</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Amundi PEA Global MSCI ACWI..."
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

          {/* ⚡ Calculateur DCA Automatique Section */}
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--accent-cyan)' }}>
                ⚡ Auto-Calculateur DCA (Règle PEA : Actions entières)
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Indiquez quand vous avez commencé votre DCA. L&apos;application simule l&apos;accumulation mensuelle (actions entières + reliquat d&apos;espèces) jusqu&apos;à aujourd&apos;hui.
            </p>

            <div className="form-row" style={{ marginBottom: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Début du DCA (Mois/Année)</label>
                <input
                  type="month"
                  className="input mono"
                  value={dcaStartDate}
                  onChange={(e) => setDcaStartDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Fréquence</label>
                <select
                  className="input"
                  style={{ fontSize: 12 }}
                  value={form.dcaFrequency || 'monthly'}
                  onChange={(e) => handleChange('dcaFrequency', e.target.value)}
                >
                  <option value="monthly">Mensuel</option>
                  <option value="quarterly">Trimestriel</option>
                  <option value="annual">Annuel</option>
                </select>
              </div>

              {(form.dcaFrequency === 'annual' || form.dcaFrequency === 'quarterly') && (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Mois du versement</label>
                  <select
                    className="input"
                    style={{ fontSize: 12 }}
                    value={form.dcaDepositMonth || 1}
                    onChange={(e) => handleChange('dcaDepositMonth', parseInt(e.target.value))}
                  >
                    <option value={1}>Janvier</option>
                    <option value={2}>Février</option>
                    <option value={3}>Mars</option>
                    <option value={4}>Avril</option>
                    <option value={5}>Mai</option>
                    <option value={6}>Juin</option>
                    <option value={7}>Juillet</option>
                    <option value={8}>Août</option>
                    <option value={9}>Septembre</option>
                    <option value={10}>Octobre</option>
                    <option value={11}>Novembre</option>
                    <option value={12}>Décembre</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Jour du mois</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  className="input mono"
                  style={{ fontSize: 12 }}
                  value={form.dcaDepositDay || 5}
                  onChange={(e) => handleChange('dcaDepositDay', Math.min(31, Math.max(1, parseInt(e.target.value) || 5)))}
                  placeholder="5"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Versement (€)</label>
                <input
                  type="number"
                  className="input mono"
                  value={form.monthlyDCA || (form.annualBudget ? form.annualBudget / 12 : 100)}
                  onChange={(e) => handleOptionalNumber('monthlyDCA', e.target.value)}
                  placeholder="100"
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%', borderColor: 'var(--accent-cyan)' }}
                  onClick={handleRunDCASimulation}
                  disabled={isCalculatingDCA || !form.ticker}
                >
                  {isCalculatingDCA ? <span className="loading-spinner" /> : '⚡ Simuler DCA'}
                </button>
              </div>
            </div>

            {dcaResult && (
              <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)', marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    📊 Résultats DCA ({dcaResult.monthsCount} mois) :
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: 11, padding: '2px 8px' }}
                    onClick={() => setShowDCAHistory(!showDCAHistory)}
                  >
                    {showDCAHistory ? 'Masquer historique' : '🔍 Voir historique mois par mois'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center', marginBottom: 10 }}>
                  <div>
                    <span style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)' }}>Actions entières</span>
                    <strong style={{ fontSize: 15, color: 'var(--accent-cyan)' }}>{dcaResult.totalShares}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)' }}>PRU Estimé</span>
                    <strong style={{ fontSize: 15 }}>{dcaResult.avgPrice.toFixed(2)} €</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)' }}>Total Investi</span>
                    <strong style={{ fontSize: 15 }}>{dcaResult.totalInvested.toFixed(0)} €</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)' }}>Reliquat Cash PEA</span>
                    <strong style={{ fontSize: 15, color: 'var(--accent-amber)' }}>{dcaResult.uninvestedCash.toFixed(2)} €</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: 13, padding: '6px 12px' }}
                  onClick={handleApplyDCAResult}
                >
                  ✅ Appliquer ces {dcaResult.totalShares} actions & PRU ({dcaResult.avgPrice.toFixed(2)} €) au formulaire
                </button>

                {showDCAHistory && (
                  <div style={{ marginTop: 12, maxHeight: 180, overflowY: 'auto', fontSize: 11 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                          <th>Mois</th>
                          <th>Cours</th>
                          <th>Disponible</th>
                          <th>Acheté</th>
                          <th>Reliquat</th>
                          <th>Cumul Actions</th>
                          <th>PRU</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dcaResult.logs.map((log) => (
                          <tr key={log.date} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td>{log.date}</td>
                            <td>{log.sharePrice} €</td>
                            <td>{log.cashAvailable} €</td>
                            <td style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>+{log.sharesBought}</td>
                            <td style={{ color: 'var(--accent-amber)' }}>{log.rolloverCash} €</td>
                            <td>{log.cumulativeShares}</td>
                            <td>{log.cumulativePRU} €</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Row 3: Quantity + Avg Price + Current Price */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantité (Actions entières)</label>
              <input
                className="input mono"
                type="number"
                step="1"
                min="0"
                value={form.quantity || ''}
                onChange={(e) => handleNumberChange('quantity', e.target.value)}
                placeholder="0"
                id="input-quantity"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Prix moyen d&apos;achat (PRU €)</label>
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

          {/* Row 5: Weights with Preset Buttons */}
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
                placeholder="ex: 10%"
                id="input-target-weight"
              />
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                {[5, 10, 15, 20, 25, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 10, padding: '2px 6px' }}
                    onClick={() => handleChange('targetWeight', pct / 100)}
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
                value={form.maxWeight ? (form.maxWeight * 100).toFixed(0) : ''}
                onChange={(e) => handleOptionalNumber('maxWeight', e.target.value ? String(parseFloat(e.target.value) / 100) : '')}
                placeholder="ex: 30%"
                id="input-max-weight"
              />
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                {[15, 25, 30, 40, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 10, padding: '2px 6px' }}
                    onClick={() => handleChange('maxWeight', pct / 100)}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Themes */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Thèmes d&apos;Investissement</span>
              <span style={{ fontSize: 11, color: 'var(--accent-violet)', fontWeight: 600 }}>✨ Générés automatiquement selon le secteur</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {form.themes.map((t) => (
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

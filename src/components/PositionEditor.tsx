'use client';

import { useState, useEffect, useRef } from 'react';
import type { Position } from '@/types/portfolio';
import { THEMES } from '@/data/themes';
import { simulatePositionDCA, type DCASimulationResult } from '@/engines/dcaSimulation';
import { searchAssets, ASSET_REGISTRY, type RegisteredAsset } from '@/data/assetRegistry';
import { getQuote, getCompanyProfile, searchYahooFinance } from '@/services/market-data/provider';
import CustomDatePicker from '@/components/CustomDatePicker';

interface PositionEditorProps {
  position?: Position | null;
  initialEnvelope?: Position['envelope'];
  onSave: (position: Position) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

const ENVELOPE_OPTIONS: { value: Position['envelope']; label: string; icon: string; isSavings: boolean }[] = [
  { value: 'PEA', label: 'PEA (Plan d\'Épargne en Actions)', icon: '📈', isSavings: false },
  { value: 'PEA-PME', label: 'PEA-PME', icon: '🟣', isSavings: false },
  { value: 'CTO', label: 'CTO (Compte-Titres Ordinaire)', icon: '🟢', isSavings: false },
  { value: 'LIVRET', label: 'Livret & Épargne (Livret A, LDDS, Cash)', icon: '🛡️', isSavings: true },
  { value: 'ASSURANCE_VIE', label: 'Assurance-Vie', icon: '📜', isSavings: true },
  { value: 'PER', label: 'PER (Plan Épargne Retraite)', icon: '🏛️', isSavings: true },
  { value: 'PEE', label: 'PEE / PERCO (Épargne Salariale)', icon: '🏢', isSavings: true },
  { value: 'IMMOBILIER', label: 'Immobilier & SCPI', icon: '🧱', isSavings: true },
  { value: 'SPECULATIVE', label: 'Spéculatif & Crypto', icon: '🚀', isSavings: false },
  { value: 'OPPORTUNISTIC', label: 'Réserve Opportuniste', icon: '⚖️', isSavings: false },
];

const ASSET_TYPE_OPTIONS: { value: Position['assetType']; label: string; icon: string }[] = [
  { value: 'ETF', label: 'ETF / Tracker', icon: '📊' },
  { value: 'STOCK', label: 'Action Directe', icon: '🏢' },
  { value: 'FUND', label: 'Fonds / OPCVM', icon: '📦' },
  { value: 'BOND', label: 'Obligation / Fonds Euro', icon: '📜' },
  { value: 'SAVINGS', label: 'Épargne / Livret / Cash', icon: '🛡️' },
  { value: 'REAL_ESTATE', label: 'Immobilier / SCPI', icon: '🧱' },
  { value: 'CRYPTO', label: 'Crypto-Actif', icon: '🪙' },
  { value: 'CASH', label: 'Liquidités', icon: '💶' },
];

const CURRENCY_OPTIONS: { value: Position['currency']; label: string; icon: string }[] = [
  { value: 'EUR', label: 'EUR (€)', icon: '💶' },
  { value: 'USD', label: 'USD ($)', icon: '💵' },
  { value: 'GBP', label: 'GBP (£)', icon: '💷' },
  { value: 'CHF', label: 'CHF (CHF)', icon: '🇨🇭' },
];

function generateId(): string {
  return `pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function CustomSelect<T extends string>({
  value,
  options,
  onChange,
  id,
}: {
  value: T;
  options: { value: T; label: string; icon?: string }[];
  onChange: (val: T) => void;
  id?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }} id={id}>
      <button
        type="button"
        className="input"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 13,
          padding: '9px 12px',
          cursor: 'pointer',
          textAlign: 'left',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden', flex: 1 }}>
          {selectedOption.icon && <span style={{ fontSize: 13, flexShrink: 0 }}>{selectedOption.icon}</span>}
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12 }}>{selectedOption.label}</span>
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 350,
            marginTop: 4,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
            maxHeight: 240,
            overflowY: 'auto',
            padding: 4,
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: opt.value === value ? 'var(--bg-tertiary)' : 'transparent',
                color: opt.value === value ? 'var(--accent-cyan)' : 'var(--text-primary)',
                fontWeight: opt.value === value ? 700 : 400,
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (opt.value !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                if (opt.value !== value) e.currentTarget.style.background = 'transparent';
              }}
            >
              {opt.icon && <span>{opt.icon}</span>}
              <span>{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PositionEditor({ position, initialEnvelope, onSave, onClose, onDelete }: PositionEditorProps) {
  const isNew = !position;

  const defaultEnv = position?.envelope || initialEnvelope || 'PEA';
  const isSavingsDefault = defaultEnv === 'LIVRET' || defaultEnv === 'ASSURANCE_VIE' || defaultEnv === 'PER' || defaultEnv === 'PEE' || defaultEnv === 'IMMOBILIER';
  const isSavingsTabContext = (initialEnvelope && ['LIVRET', 'ASSURANCE_VIE', 'PER', 'PEE', 'IMMOBILIER'].includes(initialEnvelope)) || isSavingsDefault;

  const [form, setForm] = useState<Position>({
    id: position?.id || generateId(),
    ticker: position?.ticker || '',
    name: position?.name || '',
    envelope: defaultEnv,
    assetType: position?.assetType || (isSavingsDefault ? 'SAVINGS' : 'ETF'),
    currency: position?.currency || 'EUR',
    quantity: position?.quantity || 0,
    avgPrice: position?.avgPrice || 0,
    currentPrice: position?.currentPrice,
    themes: position?.themes || [],
    monthlyDCA: position?.dcaFrequency === 'annual' 
      ? (position.annualBudget || (position.monthlyDCA ? position.monthlyDCA * 12 : undefined))
      : (position?.dcaFrequency === 'semestrial' 
          ? (position.monthlyDCA ? position.monthlyDCA * 6 : undefined)
          : (position?.dcaFrequency === 'quarterly' 
              ? (position.monthlyDCA ? position.monthlyDCA * 3 : undefined)
              : position?.monthlyDCA)),
    annualBudget: position?.annualBudget,
    dcaFrequency: position?.dcaFrequency || 'monthly',
    dcaDepositMonth: position?.dcaDepositMonth || 1,
    dcaDepositDay: position?.dcaDepositDay || 5,
    targetWeight: position?.targetWeight,
    maxWeight: position?.maxWeight,
    institutionName: position?.institutionName || '',
    interestRateOverride: position?.interestRateOverride,
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

  // DCA Auto-Calculation State — default to position saved date, global saved date, or today's date
  const [dcaStartDate, setDcaStartDate] = useState<string>(() => {
    if (position?.dcaStartDate) return position.dcaStartDate;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('riane_dca_start_date');
      if (saved) return saved;
    }
    return new Date().toISOString().split('T')[0];
  });
  const [isCalculatingDCA, setIsCalculatingDCA] = useState<boolean>(false);
  const [dcaResult, setDcaResult] = useState<DCASimulationResult | null>(null);
  const [isFutureDca, setIsFutureDca] = useState<boolean>(false);
  const [showDCAHistory, setShowDCAHistory] = useState<boolean>(false);

  useEffect(() => {
    if (dcaStartDate) {
      const parts = dcaStartDate.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[2], 10);
        if (!isNaN(day) && day >= 1 && day <= 31) {
          setForm((prev) => ({ ...prev, dcaDepositDay: day }));
        }
      }
    }
  }, [dcaStartDate]);

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
      const todayStr = new Date().toISOString().slice(0, 7);
      const startMonthStr = (dcaStartDate || todayStr).slice(0, 7);

      if (startMonthStr >= todayStr) {
        // Future / Current month DCA Strategy — no historical backtest, 0 past months
        setIsFutureDca(true);
        setDcaResult(null);
        return;
      }

      setIsFutureDca(false);
      const isIntegerOnly = form.envelope === 'PEA' || form.envelope === 'PEA-PME' || form.envelope === 'CTO';
      const depositDay = dcaStartDate ? parseInt(dcaStartDate.slice(8, 10)) : 5;
      const result = await simulatePositionDCA(
        form.ticker,
        monthlyAmount,
        dcaStartDate,
        form.currentPrice || form.avgPrice || 100,
        isIntegerOnly,
        form.dcaFrequency || 'monthly',
        form.dcaDepositMonth || 1,
        depositDay
      );
      setDcaResult(result);
      // DO NOT automatically overwrite form.quantity or form.avgPrice!
      // The user's actual current holdings are preserved intact.
    } catch (err) {
      console.error('DCA Simulation failed:', err);
    } finally {
      setIsCalculatingDCA(false);
    }
  };

  const handleApplyDCAResult = () => {
    if (!dcaResult || dcaResult.totalShares <= 0) return;
    const updated: Position = {
      ...form,
      quantity: dcaResult.totalShares,
      avgPrice: dcaResult.avgPrice,
      dcaStartDate,
      updatedAt: Date.now(),
    };
    setForm(updated);
  };


  const availableEnvelopeOptions = ENVELOPE_OPTIONS.filter((opt) => {
    if (isSavingsTabContext) {
      return ['LIVRET', 'ASSURANCE_VIE', 'PER', 'PEE', 'IMMOBILIER'].includes(opt.value);
    } else {
      return ['PEA', 'PEA-PME', 'CTO', 'SPECULATIVE', 'OPPORTUNISTIC'].includes(opt.value);
    }
  });

  const isSavingsEnvelope = form.envelope === 'LIVRET' || form.envelope === 'ASSURANCE_VIE' || form.envelope === 'PER' || form.envelope === 'PEE' || form.envelope === 'IMMOBILIER';

  const availableAssetTypeOptions = ASSET_TYPE_OPTIONS.filter((opt) => {
    if (isSavingsEnvelope) {
      return ['SAVINGS', 'BOND', 'FUND', 'REAL_ESTATE'].includes(opt.value);
    }
    return ['ETF', 'STOCK', 'FUND', 'CRYPTO', 'CASH'].includes(opt.value);
  });

  const handleEnvelopeChange = (newEnv: Position['envelope']) => {
    const isSav = newEnv === 'LIVRET' || newEnv === 'ASSURANCE_VIE' || newEnv === 'PER' || newEnv === 'PEE' || newEnv === 'IMMOBILIER';
    let defaultAssetType = form.assetType;
    if (isSav) {
      if (newEnv === 'LIVRET') defaultAssetType = 'SAVINGS';
      else if (newEnv === 'ASSURANCE_VIE') defaultAssetType = 'BOND';
      else if (newEnv === 'PER') defaultAssetType = 'SAVINGS';
      else if (newEnv === 'PEE') defaultAssetType = 'FUND';
      else if (newEnv === 'IMMOBILIER') defaultAssetType = 'REAL_ESTATE';
    } else {
      if (['SAVINGS', 'BOND', 'REAL_ESTATE'].includes(defaultAssetType)) {
        defaultAssetType = 'ETF';
      }
    }
    setForm((prev) => ({
      ...prev,
      envelope: newEnv,
      assetType: defaultAssetType,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalTicker = form.ticker.trim();
    let finalName = form.name.trim();

    if (isSavingsEnvelope) {
      if (!finalName) {
        const envLabel = ENVELOPE_OPTIONS.find((o) => o.value === form.envelope)?.label || form.envelope;
        finalName = envLabel;
      }
      if (!finalTicker) {
        finalTicker = `${form.envelope}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
      }
    }

    if (!finalTicker || !finalName) return;

    const finalQuantity = isSavingsEnvelope ? 1 : (typeof form.quantity === 'number' && !isNaN(form.quantity) ? form.quantity : 0);
    const finalAvgPrice = typeof form.avgPrice === 'number' && !isNaN(form.avgPrice) ? form.avgPrice : 0;
    const finalCurrentPrice = isSavingsEnvelope ? finalAvgPrice : (form.currentPrice || finalAvgPrice);

    const cost = finalQuantity * finalAvgPrice;
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

    let finalMonthlyDCA = form.monthlyDCA;
    let finalAnnualBudget = form.annualBudget;

    // Convert the unified UI "amount" back to the expected underlying properties
    if (form.dcaFrequency === 'annual') {
      finalAnnualBudget = form.monthlyDCA;
      finalMonthlyDCA = undefined; // Ensure we don't double count
    } else if (form.dcaFrequency === 'semestrial' && form.monthlyDCA) {
      finalMonthlyDCA = form.monthlyDCA / 6;
      finalAnnualBudget = undefined;
    } else if (form.dcaFrequency === 'quarterly' && form.monthlyDCA) {
      finalMonthlyDCA = form.monthlyDCA / 3;
      finalAnnualBudget = undefined;
    } else {
      finalAnnualBudget = undefined;
    }

    onSave({
      ...form,
      ticker: finalTicker,
      name: finalName,
      quantity: finalQuantity,
      avgPrice: finalAvgPrice,
      currentPrice: finalCurrentPrice,
      monthlyDCA: finalMonthlyDCA,
      annualBudget: finalAnnualBudget,
      dcaStartDate,
      updatedAt: Date.now(),
    });
  };

  const totalValue = form.quantity * (form.currentPrice || form.avgPrice);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: '10px' }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 700, margin: '0 auto' }}>
        <div className="modal-header" style={{ flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}>{isNew ? '➕ Ajouter une Position' : `✏️ Modifier ${form.name}`}</h2>
          <button className="modal-close-btn" onClick={onClose} type="button" aria-label="Fermer">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Row 0: Envelope + Asset Type + Currency Selector using CustomSelect */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Enveloppe</label>
              <CustomSelect
                value={form.envelope}
                options={availableEnvelopeOptions}
                onChange={(val) => handleEnvelopeChange(val as Position['envelope'])}
                id="select-envelope"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Type d&apos;actif</label>
              <CustomSelect
                value={form.assetType}
                options={availableAssetTypeOptions}
                onChange={(val) => handleChange('assetType', val)}
                id="select-asset-type"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Devise</label>
              <CustomSelect
                value={form.currency}
                options={CURRENCY_OPTIONS}
                onChange={(val) => handleChange('currency', val)}
                id="select-currency"
              />
            </div>
          </div>

          {isSavingsEnvelope ? (
            /* DYNAMIC SAVINGS & WEALTH FORM (Livret A, LDDS, Assurance-Vie, PER, PEE, SCPI) */
            <>
              <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>🛡️</span>
                  <strong style={{ fontSize: 13, color: 'var(--accent-cyan)' }}>Épargne &amp; Enveloppe Sécurisée</strong>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                  Indiquez le nom de votre compte (ex: Livret A Bourso, Fonds Euro Linxea, SCPI Primopierre) et le solde total épargné. Aucun cours boursier n&apos;est requis.
                </p>
              </div>

              <div className="form-row" style={{ marginBottom: 16 }}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Nom du compte / de l&apos;actif *</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="ex: Livret A, FCPE PEG, SCPI Corum Origin..."
                    required
                    id="input-name"
                  />
                </div>
                <div className="form-group" style={{ flex: 1.2 }}>
                  <label className="form-label">Organisme / Banque</label>
                  <input
                    className="input"
                    value={form.institutionName || ''}
                    onChange={(e) => handleChange('institutionName', e.target.value)}
                    placeholder="ex: BoursoBank, Natixis, Linxea..."
                    id="input-institution"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Solde Total ({form.currency === 'USD' ? '$' : '€'}) *</label>
                  <input
                    className="input mono"
                    type="number"
                    step="any"
                    min="0"
                    value={form.avgPrice || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setForm((prev) => ({ ...prev, avgPrice: val, currentPrice: val, quantity: 1 }));
                    }}
                    placeholder="15000"
                    required
                    id="input-solde"
                  />
                </div>
              </div>

              <div className="form-row" style={{ marginBottom: 20 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Taux d&apos;intérêt / Rendement (%)</label>
                  <input
                    className="input mono"
                    type="number"
                    step="0.05"
                    min="0"
                    max="100"
                    value={form.interestRateOverride !== undefined ? (form.interestRateOverride * 100).toFixed(2) : ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) / 100 : undefined;
                      setForm((prev) => ({ ...prev, interestRateOverride: val }));
                    }}
                    placeholder="ex: 3.00%"
                    id="input-interest-rate"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Épargne mensuelle (DCA)</label>
                  <input
                    className="input mono"
                    type="number"
                    step="10"
                    min="0"
                    value={form.monthlyDCA ?? ''}
                    onChange={(e) => handleOptionalNumber('monthlyDCA', e.target.value)}
                    placeholder="ex: 200 € / mois"
                    id="input-savings-dca"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Début du versement (DCA)</label>
                  <CustomDatePicker
                    value={dcaStartDate}
                    onChange={setDcaStartDate}
                  />
                </div>
              </div>
            </>
          ) : (
            <>

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

          {/* Row 3: Quantity + Avg Price + Current Price */}
          <div className="form-row" style={{ marginTop: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Quantité ({form.assetType === 'STOCK' ? 'Actions' : 'Parts'})</label>
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
              <label className="form-label">PRU d&apos;Achat ({form.currency === 'USD' ? '$' : form.currency === 'GBP' ? '£' : '€'})</label>
              <input
                className="input mono"
                type="number"
                step="any"
                min="0"
                value={form.avgPrice || ''}
                onChange={(e) => handleNumberChange('avgPrice', e.target.value)}
                placeholder="0.00"
                id="input-avg-price"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Prix actuel ({form.currency === 'USD' ? '$' : form.currency === 'GBP' ? '£' : '€'})</label>
              <input
                className="input mono"
                type="number"
                step="any"
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

          {/* Row 2.5: Auto-Calculateur DCA */}
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--accent-cyan)' }}>
                ⚡ Auto-Calculateur DCA ({form.envelope === 'PEA' || form.envelope === 'PEA-PME' || form.envelope === 'CTO' ? 'Actions entières' : 'Parts décimales'})
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Indiquez la date d&apos;entrée DCA et le jour de virement. L&apos;application simule l&apos;accumulation réelle (cours boursiers historiques + reliquat) jusqu&apos;à aujourd&apos;hui.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Date d'entrée DCA</label>
                <CustomDatePicker
                  value={dcaStartDate}
                  onChange={setDcaStartDate}
                />
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '10px 16px',
                borderColor: 'var(--accent-cyan)',
                color: 'var(--accent-cyan)',
                fontWeight: 700,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onClick={handleRunDCASimulation}
              disabled={isCalculatingDCA || !form.ticker}
            >
              {isCalculatingDCA ? <span className="loading-spinner" /> : '⚡ Simuler / Vérifier la Stratégie DCA'}
            </button>

            {isFutureDca && (
              <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 8, border: '1px solid var(--accent-cyan)', marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>📅</span>
                  <strong style={{ fontSize: 13, color: 'var(--accent-cyan)' }}>Stratégie DCA Futur configurée</strong>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                  Versement prévu de <strong>{(form.monthlyDCA || (form.annualBudget ? form.annualBudget / 12 : 100)).toLocaleString('fr-FR')} {form.currency === 'USD' ? '$' : '€'}</strong> ({form.dcaFrequency === 'annual' ? 'par an' : form.dcaFrequency === 'quarterly' ? 'par trimestre' : form.dcaFrequency === 'semestrial' ? 'par semestre' : 'par mois'}) à partir de <strong>{dcaStartDate || 'mois prochain'}</strong>.
                </p>
                <p style={{ fontSize: 11, color: 'var(--accent-emerald)', marginTop: 8, margin: 0, fontWeight: 600 }}>
                  ✓ Vos positions réelles actuelles ({form.quantity || 0} parts @ {(form.avgPrice || 0).toFixed(2)} {form.currency === 'USD' ? '$' : '€'}) sont conservées et ne sont pas écrasées.
                </p>
              </div>
            )}

            {dcaResult && dcaResult.monthsCount > 0 && (() => {
              const sym = form.currency === 'USD' ? '$' : form.currency === 'GBP' ? '£' : '€';
              const latestPrice = form.currentPrice || (dcaResult.logs.length > 0 ? dcaResult.logs[dcaResult.logs.length - 1].sharePrice : dcaResult.avgPrice);
              const currentValue = dcaResult.totalShares * latestPrice;
              const totalProfitLoss = currentValue - dcaResult.totalInvested;
              const profitLossPercent = dcaResult.totalInvested > 0 ? (totalProfitLoss / dcaResult.totalInvested) * 100 : 0;
              const totalCapitalWithCash = currentValue + dcaResult.uninvestedCash;

              return (
                <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-emerald)' }}>
                      📊 Résultats Simulation Historique ({dcaResult.monthsCount} mois passés) :
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

                  {/* 🚀 Performance & Profit/Loss Banner */}
                  <div style={{
                    background: totalProfitLoss >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                    border: `1px solid ${totalProfitLoss >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`,
                    borderRadius: 8,
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
                        Gain / Perte Réalisé(e) du DCA
                      </span>
                      <div style={{ fontSize: 18, fontWeight: 800, color: totalProfitLoss >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', margin: '2px 0' }}>
                        {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toFixed(2)} {sym} ({totalProfitLoss >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)} %)
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Valeur Portefeuille Actuelle</span>
                      <strong style={{ fontSize: 16, color: 'var(--accent-cyan)' }}>{currentValue.toFixed(2)} {sym}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center', marginBottom: 12 }}>
                    <div style={{ background: 'var(--bg-tertiary)', padding: 8, borderRadius: 6 }}>
                      <span style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)' }}>Parts/Actions</span>
                      <strong style={{ fontSize: 14, color: 'var(--accent-cyan)' }}>{dcaResult.totalShares}</strong>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: 8, borderRadius: 6 }}>
                      <span style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)' }}>PRU Moyen</span>
                      <strong style={{ fontSize: 14 }}>{dcaResult.avgPrice.toFixed(2)} {sym}</strong>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: 8, borderRadius: 6 }}>
                      <span style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)' }}>Total Investi</span>
                      <strong style={{ fontSize: 14 }}>{dcaResult.totalInvested.toFixed(0)} {sym}</strong>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: 8, borderRadius: 6 }}>
                      <span style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)' }}>Total + Cash</span>
                      <strong style={{ fontSize: 14, color: 'var(--accent-amber)' }}>{totalCapitalWithCash.toFixed(2)} {sym}</strong>
                    </div>
                  </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: 12, padding: '8px 12px', borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' }}
                  onClick={handleApplyDCAResult}
                >
                  📋 Importer cette simulation historique dans mon portefeuille actuel ({dcaResult.totalShares} actions @ {dcaResult.avgPrice.toFixed(2)} {form.currency === 'USD' ? '$' : '€'})
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
                            <td>{log.sharePrice} {form.currency === 'USD' ? '$' : '€'}</td>
                            <td>{log.cashAvailable} {form.currency === 'USD' ? '$' : '€'}</td>
                            <td style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>+{log.sharesBought}</td>
                            <td style={{ color: 'var(--accent-amber)' }}>{log.rolloverCash} {form.currency === 'USD' ? '$' : '€'}</td>
                            <td>{log.cumulativeShares}</td>
                            <td>{log.cumulativePRU} {form.currency === 'USD' ? '$' : '€'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
          </div>


          {/* Row 4: DCA Strategy */}
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--accent-emerald)' }}>
                🔄 Stratégie de versement régulier
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Fréquence</label>
                <select
                  className="input"
                  style={{ fontSize: 13, padding: '8px 10px' }}
                  value={form.dcaFrequency || 'monthly'}
                  onChange={(e) => handleChange('dcaFrequency', e.target.value)}
                >
                  <option value="monthly">Mensuel</option>
                  <option value="quarterly">Trimestriel</option>
                  <option value="semestrial">Semestriel</option>
                  <option value="annual">Annuel</option>
                </select>
              </div>
              
              {(form.dcaFrequency === 'annual' || form.dcaFrequency === 'quarterly' || form.dcaFrequency === 'semestrial') && (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Mois (cible)</label>
                  <select
                    className="input"
                    style={{ fontSize: 13, padding: '8px 10px' }}
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
                <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Montant ({form.currency === 'USD' ? '$' : form.currency === 'GBP' ? '£' : '€'})</label>
                <input
                  className="input mono"
                  type="number"
                  step="10"
                  min="0"
                  style={{ fontSize: 13, padding: '8px 10px' }}
                  value={form.monthlyDCA ?? ''}
                  onChange={(e) => handleOptionalNumber('monthlyDCA', e.target.value)}
                  placeholder="ex: 150"
                  id="input-monthly-dca"
                />
              </div>
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
        </>
      )}

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

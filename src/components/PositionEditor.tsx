'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { Position, SavingsDeposit, DCATranche } from '@/types/portfolio';
import { THEMES } from '@/data/themes';
import { simulatePositionDCA, type DCASimulationResult } from '@/engines/dcaSimulation';
import { searchAssets, ASSET_REGISTRY, isCryptoAsset, type RegisteredAsset } from '@/data/assetRegistry';
import { getQuote, getCompanyProfile, searchYahooFinance } from '@/services/market-data/provider';
import { computeSavingsPositionInterest } from '@/engines/savingsInterestEngine';
import { getActiveDCATranche, updateChainedTranches, deleteChainedTranche, addContinuousTranche } from '@/utils/dcaHistoryHelper';
import CustomDatePicker from '@/components/CustomDatePicker';
import ConfirmationModal from '@/components/ConfirmationModal';

interface PositionEditorProps {
  position?: Position | null;
  initialEnvelope?: Position['envelope'];
  existingPositions?: Position[];
  onSave: (position: Position) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

const ENVELOPE_OPTIONS: { value: Position['envelope']; label: string; icon: string; isSavings: boolean }[] = [
  { value: 'PEA', label: 'PEA (Plan d\'Épargne en Actions)', icon: '📈', isSavings: false },
  { value: 'PEA-PME', label: 'PEA-PME', icon: '🟣', isSavings: false },
  { value: 'CTO', label: 'CTO (Compte-Titres Ordinaire)', icon: '🟢', isSavings: false },
  { value: 'CRYPTO', label: 'Portefeuille Crypto-Actifs', icon: '🪙', isSavings: false },
  { value: 'LIVRET', label: 'Livret & Épargne (Livret A, LDDS, Cash)', icon: '🛡️', isSavings: true },
  { value: 'ASSURANCE_VIE', label: 'Assurance-Vie', icon: '📜', isSavings: true },
  { value: 'PER', label: 'PER (Plan Épargne Retraite)', icon: '🏛️', isSavings: true },
  { value: 'PEE', label: 'PEE / PERCO (Épargne Salariale)', icon: '🏢', isSavings: true },
  { value: 'IMMOBILIER', label: 'Immobilier & SCPI', icon: '🧱', isSavings: true },
  { value: 'SPECULATIVE', label: 'Spéculatif & Opportuniste', icon: '🚀', isSavings: false },
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
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginLeft: 8 }}>▼</span>
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

export default function PositionEditor({ position, initialEnvelope, existingPositions, onSave, onClose, onDelete }: PositionEditorProps) {
  const isNew = !position;
  const [allowDuplicateLine, setAllowDuplicateLine] = useState(false);

  const defaultEnv = position?.envelope || initialEnvelope || 'PEA';
  const isSavingsDefault = defaultEnv === 'LIVRET' || defaultEnv === 'ASSURANCE_VIE' || defaultEnv === 'PER' || defaultEnv === 'PEE' || defaultEnv === 'IMMOBILIER';
  const isSavingsTabContext = (initialEnvelope && ['LIVRET', 'ASSURANCE_VIE', 'PER', 'PEE', 'IMMOBILIER'].includes(initialEnvelope)) || isSavingsDefault;

  const [form, setForm] = useState<Position>({
    id: position?.id || generateId(),
    ticker: position?.ticker || '',
    name: position?.name || '',
    envelope: defaultEnv,
    assetType: position?.assetType || (defaultEnv === 'CRYPTO' ? 'CRYPTO' : isSavingsDefault ? 'SAVINGS' : 'ETF'),
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

  // Controlled string inputs for fluid decimal typing (avoids decimal point/comma reset on keystrokes)
  const [quantityInput, setQuantityInput] = useState<string>(() => {
    if (position?.quantity !== undefined && position?.quantity !== null && position?.quantity !== 0) {
      return String(position.quantity);
    }
    return '';
  });

  const [avgPriceInput, setAvgPriceInput] = useState<string>(() => {
    if (position?.avgPrice !== undefined && position?.avgPrice !== null && position?.avgPrice !== 0) {
      return String(position.avgPrice);
    }
    return '';
  });

  const [currentPriceInput, setCurrentPriceInput] = useState<string>(() => {
    if (position?.currentPrice !== undefined && position?.currentPrice !== null && position?.currentPrice !== 0) {
      return String(position.currentPrice);
    }
    return '';
  });

  // Sync string inputs when position prop updates
  useEffect(() => {
    if (position) {
      if (position.quantity !== undefined && position.quantity !== null && position.quantity !== 0) {
        setQuantityInput(String(position.quantity));
      }
      if (position.avgPrice !== undefined && position.avgPrice !== null && position.avgPrice !== 0) {
        setAvgPriceInput(String(position.avgPrice));
      }
      if (position.currentPrice !== undefined && position.currentPrice !== null && position.currentPrice !== 0) {
        setCurrentPriceInput(String(position.currentPrice));
      }
    }
  }, [position]);

  // Autocomplete & Verification States
  const [tickerSearchInput, setTickerSearchInput] = useState<string>(position?.ticker || '');
  const [searchResults, setSearchResults] = useState<RegisteredAsset[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isVerifyingTicker, setIsVerifyingTicker] = useState<boolean>(false);
  const [isSearchingLive, setIsSearchingLive] = useState<boolean>(false);
  const [verifiedQuoteText, setVerifiedQuoteText] = useState<string | null>(position?.currentPrice ? `✓ Prix en direct : ${position.currentPrice} ${position.currency}` : null);
  const [tickerError, setTickerError] = useState<string | null>(null);
  const [didYouMeanAsset, setDidYouMeanAsset] = useState<RegisteredAsset | null>(null);

  // Duplicate Guard State & Calculations
  const duplicatePosition = useMemo(() => {
    if (!existingPositions || existingPositions.length === 0 || allowDuplicateLine) return null;
    const currentTicker = (form.ticker || '').trim().toUpperCase();
    if (!currentTicker) return null;
    return existingPositions.find((p) => {
      if (p.id === form.id) return false;
      const sameTicker = p.ticker && p.ticker.trim().toUpperCase() === currentTicker;
      const sameName = isSavingsDefault && form.name && p.name.trim().toLowerCase() === form.name.trim().toLowerCase();
      return sameTicker || sameName;
    }) || null;
  }, [existingPositions, form.id, form.ticker, form.name, isSavingsDefault, allowDuplicateLine]);

  const handleSwitchToExisting = (existingPos: Position) => {
    setForm({ ...existingPos });
    if (existingPos.quantity !== undefined && existingPos.quantity !== null && existingPos.quantity !== 0) {
      setQuantityInput(String(existingPos.quantity));
    }
    if (existingPos.avgPrice !== undefined && existingPos.avgPrice !== null && existingPos.avgPrice !== 0) {
      setAvgPriceInput(String(existingPos.avgPrice));
    }
    if (existingPos.currentPrice !== undefined && existingPos.currentPrice !== null && existingPos.currentPrice !== 0) {
      setCurrentPriceInput(String(existingPos.currentPrice));
    }
    setTickerSearchInput(`${existingPos.name} (${existingPos.ticker})`);
    setVerifiedQuoteText(`✓ Position existante chargée (${existingPos.quantity} parts à ${existingPos.avgPrice} ${existingPos.currency})`);
    setAllowDuplicateLine(true);
  };

  const parsedQty = parseFloat(quantityInput.replace(',', '.')) || (form.quantity || 0);
  const parsedPrice = parseFloat(avgPriceInput.replace(',', '.')) || (form.avgPrice || form.currentPrice || (duplicatePosition ? duplicatePosition.avgPrice : 0));

  const reinforcementCalc = useMemo(() => {
    if (!duplicatePosition || parsedQty <= 0) return null;
    const oldQty = duplicatePosition.quantity || 0;
    const oldPru = duplicatePosition.avgPrice || 0;
    const newTotalQty = oldQty + parsedQty;
    const newWeightedPRU = newTotalQty > 0 ? (oldQty * oldPru + parsedQty * parsedPrice) / newTotalQty : oldPru;
    return {
      oldQty,
      oldPru,
      addedQty: parsedQty,
      buyPrice: parsedPrice,
      newTotalQty,
      newWeightedPRU,
    };
  }, [duplicatePosition, parsedQty, parsedPrice]);

  const handleApplyReinforcement = () => {
    if (!duplicatePosition || !reinforcementCalc) return;
    const updated: Position = {
      ...duplicatePosition,
      quantity: reinforcementCalc.newTotalQty,
      avgPrice: reinforcementCalc.newWeightedPRU,
      currentPrice: form.currentPrice || duplicatePosition.currentPrice,
      updatedAt: Date.now(),
    };
    onSave(updated);
    onClose();
  };

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

  // Opening / Initial Deposit Date for savings positions
  const [initialDepositDate, setInitialDepositDate] = useState<string>(() => {
    if (position?.initialDepositDate) return position.initialDepositDate;
    if (position?.dcaStartDate && (!position.monthlyDCA || position.monthlyDCA <= 0)) return position.dcaStartDate;
    return '2023-01-01';
  });

  // Historical Ad-Hoc Free Deposits, PEE Bonuses & Profit-Sharing
  const [depositsHistory, setDepositsHistory] = useState<SavingsDeposit[]>(() => {
    return position?.depositsHistory ? [...position.depositsHistory] : [];
  });
  const [depositSearchQuery, setDepositSearchQuery] = useState<string>('');

  const handleAddDeposit = (
    category: SavingsDeposit['category'] = 'LIBRE',
    defaultAmount: number = 1000,
    defaultLabel?: string
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const defaultLbl = defaultLabel || (category === 'PRIME' ? 'Prime annuelle / Intéressement' : category === 'ABONDEMENT' ? 'Abondement Employeur' : 'Apport personnel ponctuel');
    const newDep: SavingsDeposit = {
      id: `dep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: todayStr,
      amount: defaultAmount,
      label: defaultLbl,
      category,
    };
    setDepositsHistory((prev) => [...prev, newDep]);
  };

  const [isClearDepositsModalOpen, setIsClearDepositsModalOpen] = useState(false);
  const [isDeletePositionModalOpen, setIsDeletePositionModalOpen] = useState(false);

  const handleUpdateDeposit = (id: string, updates: Partial<SavingsDeposit>) => {
    setDepositsHistory((prev) => prev.map((d) => d.id === id ? { ...d, ...updates } : d));
  };

  const handleDeleteDeposit = (id: string) => {
    setDepositsHistory((prev) => prev.filter((d) => d.id !== id));
  };

  const handleClearAllDeposits = () => {
    setIsClearDepositsModalOpen(true);
  };

  const handleConfirmClearDeposits = () => {
    setDepositsHistory([]);
    setIsClearDepositsModalOpen(false);
  };

  // Multi-Tier Historical DCA Tranches (Paliers d'évolution du DCA)
  const [dcaHistory, setDcaHistory] = useState<DCATranche[]>(() => {
    if (position?.dcaHistory && position.dcaHistory.length > 0) {
      return [...position.dcaHistory];
    }
    if (position?.monthlyDCA && position.monthlyDCA > 0) {
      return [
        {
          id: 'tranche-1',
          startDate: position.dcaStartDate || '2023-01-01',
          amount: position.monthlyDCA,
          frequency: position.dcaFrequency || 'monthly',
          depositDay: position.dcaDepositDay || 5,
          label: 'Palier 1',
        },
      ];
    }
    return [];
  });

  const [isMultiTierDCA, setIsMultiTierDCA] = useState<boolean>(() => {
    return Boolean(position?.dcaHistory && position.dcaHistory.length > 1);
  });

  const handleAddTranche = () => {
    setIsMultiTierDCA(true);
    setDcaHistory((prev) => addContinuousTranche(prev, form.monthlyDCA || 200));
  };

  const handleCreateSuccessorTranche = () => {
    setIsMultiTierDCA(true);
    const todayStr = new Date().toISOString().split('T')[0];
    setDcaHistory((prev) => {
      if (prev.length === 0) {
        return [
          {
            id: `tranche-${Date.now()}-0`,
            startDate: dcaStartDate || '2023-01-01',
            endDate: todayStr,
            amount: form.monthlyDCA || 200,
            frequency: form.dcaFrequency || 'monthly',
            depositDay: form.dcaDepositDay || 5,
            label: 'Palier 1 (Précédent)',
          },
          {
            id: `tranche-${Date.now()}-1`,
            startDate: todayStr,
            amount: (form.monthlyDCA || 200) > 0 ? Math.round(((form.monthlyDCA || 200) * 1.5) / 50) * 50 : 400,
            frequency: form.dcaFrequency || 'monthly',
            depositDay: form.dcaDepositDay || 5,
            label: 'Palier 2 (Nouveau budget)',
          },
        ];
      }
      return addContinuousTranche(prev, undefined, todayStr);
    });
  };

  const handleUpdateTranche = (id: string, updates: Partial<DCATranche>) => {
    setDcaHistory((prev) => updateChainedTranches(prev, id, updates));
  };

  const handleDeleteTranche = (id: string) => {
    setDcaHistory((prev) => deleteChainedTranche(prev, id));
  };

  const [simMode, setSimMode] = useState<'DCA_FIXED' | 'ONE_SHOT' | 'MULTI_TIER'>('DCA_FIXED');
  const [oneShotAmount, setOneShotAmount] = useState<number>(1000);
  const [oneShotDate, setOneShotDate] = useState<string>('2012-01-01');
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

  const handleQuantityChange = (val: string) => {
    setQuantityInput(val);
    const normalized = val.replace(',', '.').trim();
    if (normalized === '' || normalized === '.' || normalized === '-') {
      setForm((prev) => ({ ...prev, quantity: 0 }));
    } else {
      const num = parseFloat(normalized);
      if (!isNaN(num) && num >= 0) {
        setForm((prev) => ({ ...prev, quantity: num }));
      }
    }
  };

  const handleAvgPriceChange = (val: string) => {
    setAvgPriceInput(val);
    const normalized = val.replace(',', '.').trim();
    if (normalized === '' || normalized === '.' || normalized === '-') {
      setForm((prev) => ({ ...prev, avgPrice: 0 }));
    } else {
      const num = parseFloat(normalized);
      if (!isNaN(num) && num >= 0) {
        setForm((prev) => ({ ...prev, avgPrice: num }));
      }
    }
  };

  const handleCurrentPriceChange = (val: string) => {
    setCurrentPriceInput(val);
    const normalized = val.replace(',', '.').trim();
    if (normalized === '' || normalized === '.' || normalized === '-') {
      setForm((prev) => ({ ...prev, currentPrice: undefined }));
    } else {
      const num = parseFloat(normalized);
      if (!isNaN(num) && num >= 0) {
        setForm((prev) => ({ ...prev, currentPrice: num }));
      }
    }
  };

  const handleNumberChange = (field: keyof Position, value: string) => {
    const normalized = value.replace(',', '.').trim();
    const num = normalized === '' ? 0 : parseFloat(normalized);
    if (!isNaN(num)) {
      handleChange(field, num);
    }
  };

  const handleOptionalNumber = (field: keyof Position, value: string) => {
    const normalized = value.replace(',', '.').trim();
    if (normalized === '') {
      handleChange(field, undefined);
    } else {
      const num = parseFloat(normalized);
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
    setDidYouMeanAsset(null);
    setIsVerifyingTicker(true);
    saveToAssetCache(asset);

    const isCrypto = isCryptoAsset(asset.ticker, asset.name) || asset.assetType === 'CRYPTO' || asset.envelope === 'CRYPTO' || initialEnvelope === 'CRYPTO';
    const finalEnvelope = isCrypto ? 'CRYPTO' : (asset.envelope || initialEnvelope);
    const finalAssetType = isCrypto ? 'CRYPTO' : (asset.assetType || 'ETF');

    setForm((prev) => ({
      ...prev,
      ticker: asset.ticker,
      name: asset.name,
      envelope: finalEnvelope,
      assetType: finalAssetType,
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
          envelope: finalEnvelope,
          assetType: finalAssetType,
          currentPrice: price,
          avgPrice: prev.avgPrice > 0 ? prev.avgPrice : (price || 100),
          currency: (profile?.currency as any) || (quote?.currency as any) || prev.currency,
          themes: autoThemes.length > 0 ? autoThemes : asset.themes,
          quantity: prev.quantity || 0,
        };
      });

      if (quote && quote.price > 0) {
        const formattedPrice = quote.price < 1 ? quote.price.toFixed(6) : quote.price.toFixed(2);
        setCurrentPriceInput(formattedPrice);
        setAvgPriceInput((prev) => (!prev || prev === '0' || prev === '0.00' ? formattedPrice : prev));
        setVerifiedQuoteText(`✓ Actif officiel vérifié : ${profile?.name || asset.name} (${profile?.sector || asset.exchange || (isCrypto ? 'Marché Crypto 24/7' : 'Bourse')}) — Prix en direct : ${quote.price.toFixed(2)} ${quote.currency || asset.currency}`);
      } else {
        setVerifiedQuoteText(`✓ Actif répertorié officiel (${asset.exchange || (isCrypto ? 'Marché Crypto 24/7' : 'Euronext Paris')})`);
      }
    } catch {
      setVerifiedQuoteText(`✓ Actif répertorié officiel (${asset.exchange || (isCrypto ? 'Marché Crypto 24/7' : 'Euronext Paris')})`);
    } finally {
      setIsVerifyingTicker(false);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setTickerSearchInput(value);
    setVerifiedQuoteText(null);
    setTickerError(null);
    setDidYouMeanAsset(null);

    const matches = searchAssets(value);
    setSearchResults(matches);
    setShowDropdown(matches.length > 0 || value.trim().length >= 2);

    const exactMatch = ASSET_REGISTRY.find(
      (a) =>
        a.ticker.toLowerCase() === value.trim().toLowerCase() ||
        (a.isin && a.isin.toLowerCase() === value.trim().toLowerCase())
    );
    if (exactMatch) {
      handleSelectRegisteredAsset(exactMatch);
    } else {
      const isCrypto = isCryptoAsset(value);
      setForm((prev) => ({
        ...prev,
        ticker: value.toUpperCase(),
        ...(isCrypto ? { envelope: 'CRYPTO' as const, assetType: 'CRYPTO' as const } : {})
      }));
    }
  };

  // Debounced live Yahoo Finance search for international & unlisted assets
  useEffect(() => {
    const query = tickerSearchInput.trim();
    if (!query || query.length < 2) return;

    const timer = setTimeout(async () => {
      setIsSearchingLive(true);
      try {
        const localMatches = searchAssets(query);
        const yahooMatches = await searchYahooFinance(query);
        const combined: RegisteredAsset[] = [...localMatches];

        yahooMatches.forEach((ym) => {
          if (!combined.some((c) => c.ticker.toUpperCase() === ym.ticker.toUpperCase())) {
            const isFrench = ym.ticker.endsWith('.PA');
            const isCrypto = (ym.assetType as string) === 'CRYPTO' || isCryptoAsset(ym.ticker, ym.name) || initialEnvelope === 'CRYPTO';
            combined.push({
              ticker: ym.ticker,
              name: ym.name,
              assetType: isCrypto ? 'CRYPTO' : ym.assetType,
              envelope: isCrypto ? 'CRYPTO' : isFrench ? (ym.ticker.startsWith('AL') ? 'PEA-PME' : 'PEA') : 'CTO',
              currency: ym.currency,
              themes: ['general'],
              exchange: isCrypto ? 'Crypto Market 24/7' : ym.exchange,
              searchTerms: [query.toLowerCase()],
            });
          }
        });

        setSearchResults(combined);
        if (combined.length > 0) setShowDropdown(true);
      } catch {
        // ignore
      } finally {
        setIsSearchingLive(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [tickerSearchInput]);

  const handleVerifyManualTicker = async () => {
    const rawQuery = (form.ticker || tickerSearchInput).trim();
    if (!rawQuery) return;

    setIsVerifyingTicker(true);
    setTickerError(null);
    setVerifiedQuoteText(null);
    setDidYouMeanAsset(null);

    // 1. Check local registry first
    const localMatch = ASSET_REGISTRY.find(
      (a) =>
        a.ticker.toLowerCase() === rawQuery.toLowerCase() ||
        (a.isin && a.isin.toLowerCase() === rawQuery.toLowerCase())
    );
    if (localMatch) {
      await handleSelectRegisteredAsset(localMatch);
      setIsVerifyingTicker(false);
      return;
    }

    // 2. Try exact quote fetch for raw ticker
    try {
      const [quote, profile] = await Promise.all([
        getQuote(rawQuery.toUpperCase()).catch(() => null),
        getCompanyProfile(rawQuery.toUpperCase()).catch(() => null),
      ]);

      if (quote && quote.price > 0) {
        const isCrypto = isCryptoAsset(rawQuery, profile?.name || form.name) || initialEnvelope === 'CRYPTO';
        const isFrench = rawQuery.toUpperCase().endsWith('.PA');
        const autoThemes = autoGenerateThemes(rawQuery.toUpperCase(), profile?.name || form.name, profile?.sector, profile?.industry);
        setForm((prev) => ({
          ...prev,
          ticker: rawQuery.toUpperCase(),
          name: profile?.name || prev.name || rawQuery.toUpperCase(),
          envelope: isCrypto ? 'CRYPTO' : prev.envelope,
          assetType: isCrypto ? 'CRYPTO' : prev.assetType,
          currentPrice: quote.price,
          avgPrice: prev.avgPrice > 0 ? prev.avgPrice : (quote.price || 100),
          currency: (profile?.currency as any) || (quote.currency as any) || prev.currency,
          themes: autoThemes.length > 0 ? autoThemes : prev.themes,
          quantity: prev.quantity || 0,
        }));
        const formattedPrice = quote.price < 1 ? quote.price.toFixed(6) : quote.price.toFixed(2);
        setCurrentPriceInput(formattedPrice);
        setAvgPriceInput((prev) => (!prev || prev === '0' || prev === '0.00' ? formattedPrice : prev));
        setVerifiedQuoteText(`✓ Actif officiel vérifié : ${profile?.name || rawQuery.toUpperCase()} (${profile?.sector || (isCrypto ? 'Marché Crypto 24/7' : isFrench ? 'Euronext Paris' : 'Marché Direct')}) — Prix : ${quote.price.toFixed(2)} ${quote.currency}`);
        setIsVerifyingTicker(false);
        return;
      }
    } catch {
      // Direct quote failed, fallback to Yahoo Finance Search API
    }

    // 3. Query Yahoo Finance Search API for fuzzy company/brand match (ex: "kalray", "amundi", ISIN)
    try {
      const yahooMatches = await searchYahooFinance(rawQuery);
      if (yahooMatches.length > 0) {
        const topMatch = yahooMatches[0];
        const isCrypto = (topMatch.assetType as string) === 'CRYPTO' || isCryptoAsset(topMatch.ticker, topMatch.name) || initialEnvelope === 'CRYPTO';
        const isFrench = topMatch.ticker.endsWith('.PA');
        const candidate: RegisteredAsset = {
          ticker: topMatch.ticker,
          name: topMatch.name,
          assetType: isCrypto ? 'CRYPTO' : topMatch.assetType,
          envelope: isCrypto ? 'CRYPTO' : isFrench ? (topMatch.ticker.startsWith('AL') ? 'PEA-PME' : 'PEA') : 'CTO',
          currency: topMatch.currency,
          themes: ['general'],
          exchange: isCrypto ? 'Crypto Market 24/7' : topMatch.exchange,
          searchTerms: [rawQuery.toLowerCase()],
        };

        setDidYouMeanAsset(candidate);
        setTickerError(`💡 Intention détectée : '${rawQuery}' correspond à l'actif officiel ${candidate.name} (${candidate.ticker}).`);
      } else {
        setTickerError(`❌ Impossible de vérifier '${rawQuery}' sur les marchés. Seuls les actifs officiels reconnus peuvent être suivis.`);
      }
    } catch {
      setTickerError(`❌ Ticker ou actif '${rawQuery}' non trouvé.`);
    } finally {
      setIsVerifyingTicker(false);
    }
  };

  const handleRunDCASimulation = async () => {
    if (!form.ticker) return;
    setIsCalculatingDCA(true);
    try {
      const todayStr = new Date().toISOString().slice(0, 7);
      const isIntegerOnly = (form.envelope === 'PEA' || form.envelope === 'PEA-PME') && form.assetType !== 'CRYPTO';

      if (simMode === 'ONE_SHOT') {
        setIsFutureDca(false);
        const result = await simulatePositionDCA(
          form.ticker,
          0,
          oneShotDate || '2012-01-01',
          form.currentPrice || form.avgPrice || 100,
          isIntegerOnly,
          'monthly',
          1,
          1,
          undefined,
          undefined,
          'lump_sum',
          oneShotAmount || 1000
        );
        setDcaResult(result);
        return;
      }

      const monthlyAmount = form.monthlyDCA || (form.annualBudget ? form.annualBudget / 12 : 100);
      const startMonthStr = (dcaStartDate || todayStr).slice(0, 7);

      if (simMode === 'DCA_FIXED' && startMonthStr >= todayStr) {
        // Future / Current month DCA Strategy — no historical backtest, 0 past months
        setIsFutureDca(true);
        setDcaResult(null);
        return;
      }

      setIsFutureDca(false);
      const depositDay = dcaStartDate ? parseInt(dcaStartDate.slice(8, 10)) : 5;
      const result = await simulatePositionDCA(
        form.ticker,
        monthlyAmount,
        dcaStartDate,
        form.currentPrice || form.avgPrice || 100,
        isIntegerOnly,
        form.dcaFrequency || 'monthly',
        form.dcaDepositMonth || 1,
        depositDay,
        simMode === 'MULTI_TIER' && dcaHistory.length > 0 ? dcaHistory : undefined,
        depositsHistory.length > 0 ? depositsHistory : undefined,
        'dca',
        0
      );
      setDcaResult(result);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setIsCalculatingDCA(false);
    }
  };

  const handleApplyDCAResult = () => {
    if (!dcaResult || dcaResult.totalShares <= 0) return;
    const finalQty = dcaResult.totalShares;
    const finalQtyStr = finalQty < 1 ? finalQty.toFixed(8).replace(/\.?0+$/, '') : String(finalQty);
    const finalAvgPriceStr = dcaResult.avgPrice > 0 ? dcaResult.avgPrice.toFixed(2) : '';
    setQuantityInput(finalQtyStr);
    setAvgPriceInput(finalAvgPriceStr);
    const updated: Position = {
      ...form,
      quantity: finalQty,
      avgPrice: dcaResult.avgPrice,
      dcaStartDate: simMode === 'ONE_SHOT' ? oneShotDate : dcaStartDate,
      dcaHistory: simMode === 'MULTI_TIER' && dcaHistory.length > 0 ? dcaHistory : undefined,
      depositsHistory: depositsHistory.length > 0 ? depositsHistory : undefined,
      updatedAt: Date.now(),
    };
    setForm(updated);
  };


  const availableEnvelopeOptions = ENVELOPE_OPTIONS.filter((opt) => {
    if (isSavingsTabContext) {
      return ['LIVRET', 'ASSURANCE_VIE', 'PER', 'PEE', 'IMMOBILIER'].includes(opt.value);
    } else {
      return ['PEA', 'PEA-PME', 'CTO', 'CRYPTO', 'SPECULATIVE', 'OPPORTUNISTIC'].includes(opt.value);
    }
  });

  const isSavingsEnvelope = form.envelope === 'LIVRET' || form.envelope === 'ASSURANCE_VIE' || form.envelope === 'PER' || form.envelope === 'PEE' || form.envelope === 'IMMOBILIER';

  const liveSavingsInterest = useMemo(() => {
    if (!isSavingsEnvelope) return null;
    const hasDCA = Boolean((form.monthlyDCA && form.monthlyDCA > 0) || (form.annualBudget && form.annualBudget > 0) || (isMultiTierDCA && dcaHistory.length > 0));
    const tempPos: Position = {
      ...form,
      quantity: 1,
      avgPrice: form.avgPrice || 0,
      currentPrice: form.avgPrice || 0,
      monthlyDCA: form.monthlyDCA,
      dcaStartDate: hasDCA ? dcaStartDate : undefined,
      dcaHistory: isMultiTierDCA && dcaHistory.length > 0 ? dcaHistory : undefined,
      initialDepositDate: initialDepositDate,
      depositsHistory: depositsHistory,
    };
    return computeSavingsPositionInterest(tempPos);
  }, [isSavingsEnvelope, form, dcaStartDate, initialDepositDate, depositsHistory, isMultiTierDCA, dcaHistory]);

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

    if (!isSavingsEnvelope) {
      if (!finalTicker || !finalName) {
        setTickerError('❌ Veuillez renseigner un ticker officiel et un nom d\'actif reconnus.');
        return;
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
    let finalDcaStartDate = dcaStartDate;

    if (isMultiTierDCA && dcaHistory.length > 0) {
      const active = getActiveDCATranche(dcaHistory);
      if (active) {
        finalMonthlyDCA = active.amount;
      }
      const sortedTranches = [...dcaHistory].sort((a, b) => a.startDate.localeCompare(b.startDate));
      if (sortedTranches.length > 0) {
        finalDcaStartDate = sortedTranches[0].startDate;
      }
    } else {
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
    }

    const hasActiveDCA = (finalMonthlyDCA !== undefined && finalMonthlyDCA > 0) || (finalAnnualBudget !== undefined && finalAnnualBudget > 0) || (isMultiTierDCA && dcaHistory.length > 0);
    const isCrypto = isCryptoAsset(finalTicker, finalName) || form.assetType === 'CRYPTO' || form.envelope === 'CRYPTO' || initialEnvelope === 'CRYPTO';
    const finalEnvelope = isCrypto ? 'CRYPTO' : form.envelope;
    const finalAssetType = isCrypto ? 'CRYPTO' : form.assetType;

    onSave({
      ...form,
      ticker: finalTicker,
      name: finalName,
      envelope: finalEnvelope,
      assetType: finalAssetType,
      quantity: finalQuantity,
      avgPrice: finalAvgPrice,
      currentPrice: finalCurrentPrice,
      monthlyDCA: finalMonthlyDCA,
      annualBudget: finalAnnualBudget,
      dcaStartDate: hasActiveDCA ? finalDcaStartDate : undefined,
      dcaHistory: isMultiTierDCA && dcaHistory.length > 0 ? dcaHistory : undefined,
      initialDepositDate: isSavingsEnvelope ? initialDepositDate : undefined,
      depositsHistory: depositsHistory.length > 0 ? depositsHistory : undefined,
      updatedAt: Date.now(),
    });
  };

  const totalValue = form.quantity * (form.currentPrice || form.avgPrice);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: '10px', overflowX: 'hidden' }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 700, margin: '0 auto', overflowX: 'hidden', boxSizing: 'border-box' }}>
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
                  <strong style={{ fontSize: 13, color: 'var(--accent-cyan)' }}>Épargne &amp; Patrimoine Hors-Bourse (Livrets, PEE, Assurance-Vie, SCPI)</strong>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                  Indiquez le nom de votre compte (ex: Livret A Bourso, PEE Entreprise, Fonds Euro Linxea, SCPI Primopierre) et gérez vos apports initiaux, versements libres (primes PEE/intéressement) et versements réguliers (DCA).
                </p>
              </div>

              {/* 🛡️ Garde-Fou Anti-Doublon Livrets/Épargne */}
              {duplicatePosition && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.08) 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    marginBottom: 16,
                  }}
                  id="duplicate-guard-alert-savings"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>🛡️</span>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: 13, color: 'var(--accent-amber)', display: 'block', marginBottom: 2 }}>
                        Compte/Livret déjà existant : {duplicatePosition.name}
                      </strong>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
                        Un compte portant le même nom est déjà présent dans votre patrimoine (Solde : {duplicatePosition.avgPrice.toLocaleString('fr-FR')} {duplicatePosition.currency}).
                      </p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleSwitchToExisting(duplicatePosition)}
                          style={{ fontSize: 11, padding: '4px 10px' }}
                        >
                          🔁 Modifier le compte existant
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => setAllowDuplicateLine(true)}
                          style={{ fontSize: 11, padding: '4px 8px', color: 'var(--text-muted)' }}
                        >
                          🔀 Conserver 2 comptes séparés
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Compte & Organisme */}
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Nom du compte / de l&apos;actif *</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="ex: Livret A, PEE Amundi, Fonds Euro, SCPI..."
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
              </div>

              {/* Capital initial & Date d'ouverture & Taux */}
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div className="form-group" style={{ flex: 1.2 }}>
                  <label className="form-label">Capital initial / Apport de départ ({form.currency === 'USD' ? '$' : '€'})</label>
                  <input
                    className="input mono"
                    type="number"
                    step="any"
                    min="0"
                    value={form.avgPrice !== undefined && form.avgPrice !== null ? form.avgPrice : ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setForm((prev) => ({ ...prev, avgPrice: val, currentPrice: val, quantity: 1 }));
                    }}
                    placeholder="0"
                    id="input-solde"
                  />
                </div>
                <div className="form-group" style={{ flex: 1.2, minWidth: 155 }}>
                  <label className="form-label">Date du capital initial / Ouverture</label>
                  <CustomDatePicker
                    value={initialDepositDate}
                    onChange={setInitialDepositDate}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Rendement annuel / Taux (%)</label>
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
              </div>

              {/* 📥 SECTION : Versements Libres, Primes PEE & Abondements Exceptionnels */}
              <div style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-accent)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>📥</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent-cyan)' }}>
                      Versements libres &amp; Primes exceptionnelles (PEE, Intéressement, Abondement)
                    </span>
                  </div>
                  {depositsHistory.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 11,
                        color: 'var(--accent-cyan)',
                        background: 'rgba(6, 182, 212, 0.12)',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontWeight: 700,
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                      }}>
                        {depositsHistory.length} versement{depositsHistory.length > 1 ? 's' : ''} ({depositsHistory.reduce((s, d) => s + (d.amount || 0), 0).toLocaleString('fr-FR')} €)
                      </span>
                      {depositsHistory.length > 3 && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 10, padding: '2px 6px', color: 'var(--accent-rose)' }}
                          onClick={handleClearAllDeposits}
                          title="Effacer tous les versements"
                        >
                          🗑️ Tout effacer
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                  Ajoutez vos primes annuelles, abondements employeur ou versements ponctuels. Chaque versement génère automatiquement ses propres intérêts historiques à partir de sa date exacte.
                </p>

                {/* Quick Add Preset Buttons */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8 }}
                    onClick={() => handleAddDeposit('PRIME')}
                  >
                    ➕ Prime Intéressement
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8 }}
                    onClick={() => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      setDepositsHistory((prev) => [
                        ...prev,
                        {
                          id: `dep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                          date: todayStr,
                          amount: 1500,
                          label: 'Prime Participation',
                          category: 'PRIME',
                        }
                      ]);
                    }}
                  >
                    ➕ Prime Participation
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8 }}
                    onClick={() => handleAddDeposit('ABONDEMENT')}
                  >
                    ➕ Abondement Employeur
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8 }}
                    onClick={() => handleAddDeposit('LIBRE')}
                  >
                    ➕ Versement Libre
                  </button>
                </div>

                {/* Search / Filter if more than 3 deposits */}
                {depositsHistory.length > 3 && (
                  <div style={{ marginBottom: 10 }}>
                    <input
                      className="input"
                      style={{ fontSize: 11, padding: '5px 10px', background: 'var(--bg-secondary)', width: '100%', maxWidth: 320 }}
                      placeholder="🔍 Filtrer par année, libellé ou montant..."
                      value={depositSearchQuery}
                      onChange={(e) => setDepositSearchQuery(e.target.value)}
                    />
                  </div>
                )}

                {/* Deposit List Container with Max-Height & Custom Scrollbar */}
                {depositsHistory.length === 0 ? (
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed var(--border-subtle)',
                    fontSize: 12,
                    color: 'var(--text-tertiary)',
                    textAlign: 'center',
                  }}>
                    Aucun versement ponctuel enregistré. Cliquez sur les boutons ci-dessus pour ajouter des primes ou apports libres.
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    maxHeight: 250,
                    overflowY: 'auto',
                    paddingRight: 4,
                    scrollbarWidth: 'thin',
                  }}>
                    {depositsHistory
                      .filter((dep) => {
                        if (!depositSearchQuery.trim()) return true;
                        const q = depositSearchQuery.toLowerCase();
                        return (
                          (dep.label && dep.label.toLowerCase().includes(q)) ||
                          (dep.date && dep.date.includes(q)) ||
                          (dep.amount && dep.amount.toString().includes(q)) ||
                          (dep.category && dep.category.toLowerCase().includes(q))
                        );
                      })
                      .map((dep, idx) => (
                        <div
                          key={dep.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(130px, 1.2fr) minmax(120px, 1.5fr) minmax(90px, 1fr) 32px',
                            gap: 8,
                            alignItems: 'center',
                            padding: '6px 8px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 8,
                          }}
                        >
                          {/* Date Picker */}
                          <div>
                            <label style={{ display: 'block', fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                              Date #{idx + 1}
                            </label>
                            <CustomDatePicker
                              value={dep.date}
                              onChange={(newDate) => handleUpdateDeposit(dep.id, { date: newDate })}
                            />
                          </div>

                          {/* Libellé */}
                          <div>
                            <label style={{ display: 'block', fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                              Libellé / Nature
                            </label>
                            <input
                              className="input"
                              style={{ fontSize: 12, padding: '5px 8px' }}
                              value={dep.label || ''}
                              onChange={(e) => handleUpdateDeposit(dep.id, { label: e.target.value })}
                              placeholder="ex: Prime 2024..."
                            />
                          </div>

                          {/* Montant */}
                          <div>
                            <label style={{ display: 'block', fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                              Montant ({form.currency === 'USD' ? '$' : '€'})
                            </label>
                            <input
                              className="input mono"
                              type="number"
                              step="50"
                              min="0"
                              style={{ fontSize: 12, padding: '5px 8px', fontWeight: 600 }}
                              value={dep.amount || ''}
                              onChange={(e) => handleUpdateDeposit(dep.id, { amount: parseFloat(e.target.value) || 0 })}
                              placeholder="0"
                            />
                          </div>

                          {/* Delete Button */}
                          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ padding: '4px', color: 'var(--accent-rose)', minWidth: 'auto', fontSize: 13 }}
                              onClick={() => handleDeleteDeposit(dep.id)}
                              title="Supprimer ce versement"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* 🔄 SECTION : Stratégie de versement régulier (DCA optionnel & Multi-Paliers) */}
              <div style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-accent)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--accent-emerald)' }}>
                      🔄 Stratégie de versement régulier (DCA)
                    </span>
                  </div>

                  {/* Mode Selector Toggle */}
                  <div style={{
                    display: 'flex',
                    background: 'var(--bg-secondary)',
                    padding: 2,
                    borderRadius: 6,
                    border: '1px solid var(--border-subtle)',
                    gap: 2
                  }}>
                    <button
                      type="button"
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 4,
                        border: 'none',
                        background: !isMultiTierDCA ? 'var(--accent-emerald)' : 'transparent',
                        color: !isMultiTierDCA ? '#000' : 'var(--text-secondary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      onClick={() => setIsMultiTierDCA(false)}
                    >
                      Montant Constant
                    </button>
                    <button
                      type="button"
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 4,
                        border: 'none',
                        background: isMultiTierDCA ? 'var(--accent-emerald)' : 'transparent',
                        color: isMultiTierDCA ? '#000' : 'var(--text-secondary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setIsMultiTierDCA(true);
                        if (dcaHistory.length === 0) {
                          handleAddTranche();
                        }
                      }}
                    >
                      📈 Paliers Historiques ({dcaHistory.length})
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                  {!isMultiTierDCA
                    ? 'Définissez votre versement programmé récurrent (ex: 200€/mois). Laissez à 0 ou vide si vous n\'avez pas de DCA régulier.'
                    : 'Gérez l\'évolution de vos montants de DCA dans le temps (ex: 500€/mois de 2021 à 2022, 300€/mois en 2023, 200€/mois actuellement).'}
                </p>
                
                {!isMultiTierDCA ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 12 }}>
                      <div className="form-group" style={{ minWidth: 115 }}>
                        <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>Fréquence</label>
                        <CustomSelect
                          value={form.dcaFrequency || 'monthly'}
                          options={[
                            { label: 'Mensuel', value: 'monthly' },
                            { label: 'Trimestriel', value: 'quarterly' },
                            { label: 'Semestriel', value: 'semestrial' },
                            { label: 'Annuel', value: 'annual' },
                          ]}
                          onChange={(val) => handleChange('dcaFrequency', val as string)}
                        />
                      </div>
                      
                      <div className="form-group" style={{ minWidth: 75 }}>
                        <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>Jour (cible)</label>
                        <CustomSelect
                          value={(form.dcaDepositDay || 5).toString()}
                          options={Array.from({ length: 31 }, (_, i) => ({ label: (i + 1).toString(), value: (i + 1).toString() }))}
                          onChange={(val) => handleChange('dcaDepositDay', parseInt(val as string))}
                        />
                      </div>

                      {(form.dcaFrequency === 'annual' || form.dcaFrequency === 'quarterly' || form.dcaFrequency === 'semestrial') && (
                        <div className="form-group" style={{ minWidth: 110 }}>
                          <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>Mois (cible)</label>
                          <CustomSelect
                            value={(form.dcaDepositMonth || 1).toString()}
                            options={[
                              { label: 'Janvier', value: '1' },
                              { label: 'Février', value: '2' },
                              { label: 'Mars', value: '3' },
                              { label: 'Avril', value: '4' },
                              { label: 'Mai', value: '5' },
                              { label: 'Juin', value: '6' },
                              { label: 'Juillet', value: '7' },
                              { label: 'Août', value: '8' },
                              { label: 'Septembre', value: '9' },
                              { label: 'Octobre', value: '10' },
                              { label: 'Novembre', value: '11' },
                              { label: 'Décembre', value: '12' },
                            ]}
                            onChange={(val) => handleChange('dcaDepositMonth', parseInt(val as string))}
                          />
                        </div>
                      )}
                      
                      <div className="form-group" style={{ minWidth: 95 }}>
                        <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>Montant ({form.currency === 'USD' ? '$' : form.currency === 'GBP' ? '£' : '€'})</label>
                        <input
                          className="input mono"
                          type="number"
                          step="10"
                          min="0"
                          style={{ fontSize: 13, padding: '8px 10px' }}
                          value={form.monthlyDCA ?? ''}
                          onChange={(e) => handleOptionalNumber('monthlyDCA', e.target.value)}
                          placeholder="0 (laisser vide si pas de DCA)"
                          id="input-savings-monthly-dca"
                        />
                      </div>

                      <div className="form-group" style={{ minWidth: 155, flex: 1.2 }}>
                        <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>Début du versement (DCA)</label>
                        <CustomDatePicker
                          value={dcaStartDate}
                          onChange={setDcaStartDate}
                        />
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: 11, padding: '5px 12px', borderRadius: 6, color: 'var(--accent-cyan)', borderColor: 'var(--border-accent)', fontWeight: 600 }}
                        onClick={handleCreateSuccessorTranche}
                      >
                        📈 Historiser une évolution de DCA (créer un palier avec date d'effet)
                      </button>
                    </div>
                  </>
                ) : (
                  <div>
                    {/* Multi-Tier Tranches List */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      maxHeight: 220,
                      overflowY: 'auto',
                      paddingRight: 4,
                      scrollbarWidth: 'thin',
                      marginBottom: 10
                    }}>
                      {dcaHistory.map((tranche, idx) => (
                        <div
                          key={tranche.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(120px, 1fr) minmax(120px, 1fr) minmax(90px, 0.9fr) minmax(110px, 1.1fr) 32px',
                            gap: 8,
                            alignItems: 'center',
                            padding: '6px 8px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 8,
                          }}
                        >
                          <div>
                            <label style={{ display: 'block', fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                              Début #{idx + 1}
                            </label>
                            <CustomDatePicker
                              value={tranche.startDate}
                              onChange={(newDate) => handleUpdateTranche(tranche.id, { startDate: newDate })}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                              Fin {tranche.endDate ? '' : '(En cours)'}
                            </label>
                            <CustomDatePicker
                              value={tranche.endDate || ''}
                              onChange={(newDate) => handleUpdateTranche(tranche.id, { endDate: newDate || undefined })}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                              Montant ({form.currency === 'USD' ? '$' : '€'})
                            </label>
                            <input
                              className="input mono"
                              type="number"
                              step="10"
                              min="0"
                              style={{ fontSize: 12, padding: '5px 8px', fontWeight: 600 }}
                              value={tranche.amount || ''}
                              onChange={(e) => handleUpdateTranche(tranche.id, { amount: parseFloat(e.target.value) || 0 })}
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                              Libellé / Note
                            </label>
                            <input
                              className="input"
                              style={{ fontSize: 12, padding: '5px 8px' }}
                              value={tranche.label || ''}
                              onChange={(e) => handleUpdateTranche(tranche.id, { label: e.target.value })}
                              placeholder={`Palier #${idx + 1}`}
                            />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ padding: '4px', color: 'var(--accent-rose)', minWidth: 'auto', fontSize: 13 }}
                              onClick={() => handleDeleteTranche(tranche.id)}
                              title="Supprimer ce palier"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6 }}
                        onClick={handleAddTranche}
                      >
                        ➕ Ajouter un palier libre
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, color: 'var(--accent-cyan)', borderColor: 'var(--border-accent)' }}
                        onClick={handleCreateSuccessorTranche}
                      >
                        📈 Clôturer le palier précédent et ouvrir un nouveau palier
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Live Calculation Card for Savings / Livret */}
              {liveSavingsInterest && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: 14,
                  marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16 }}>⚡</span>
                      <strong className="text-xs font-bold text-primary" style={{ textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Calcul &amp; Projection en direct ({liveSavingsInterest.isQuinzaineRule ? 'Règle des Quinzaines' : 'Intérêts composés'})
                      </strong>
                    </div>
                    <span className="badge-projected">
                      {liveSavingsInterest.quinzainesCount > 0 ? `${liveSavingsInterest.quinzainesCount} quinzaines calculées` : 'Calcul dynamique'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                    <div>
                      <span className="text-xs text-secondary" style={{ display: 'block', marginBottom: 2 }}>Versements Cumulés</span>
                      <strong className="text-sm font-bold text-primary mono">
                        {liveSavingsInterest.principalDeposited.toLocaleString('fr-FR', { style: 'currency', currency: form.currency })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-xs text-secondary" style={{ display: 'block', marginBottom: 2 }}>Intérêts Acquis</span>
                      <strong className="text-sm font-bold mono" style={{ color: 'var(--accent-emerald)' }}>
                        +{liveSavingsInterest.interestEarnedToDate.toLocaleString('fr-FR', { style: 'currency', currency: form.currency })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-xs text-secondary" style={{ display: 'block', marginBottom: 2 }}>Solde Total Actuel</span>
                      <strong className="text-base font-extrabold mono" style={{ color: 'var(--accent-cyan)' }}>
                        {liveSavingsInterest.currentBalance.toLocaleString('fr-FR', { style: 'currency', currency: form.currency })}
                      </strong>
                    </div>
                    {liveSavingsInterest.legalCap && (
                      <div>
                        <span className="text-xs text-secondary" style={{ display: 'block', marginBottom: 2 }}>Plafond ({liveSavingsInterest.capUtilizationPercent}%)</span>
                        <strong className="text-sm font-bold mono text-primary">
                          {liveSavingsInterest.legalCap.toLocaleString('fr-FR')} €
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Autocomplete Search & Ticker Verification Bar */}
              <div className="form-group" style={{ position: 'relative', marginBottom: 20 }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🔍</span> Recherche &amp; Autocomplétion d&apos;Actif (Nom, Ticker, Code ISIN) *
                  </span>
                  {(isVerifyingTicker || isSearchingLive) && (
                    <span style={{ fontSize: 12, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="loading-spinner" style={{ width: 12, height: 12 }} />
                      {isVerifyingTicker ? 'Vérification du cours en direct...' : 'Recherche de l\'actif...'}
                    </span>
                  )}
                </label>

                {/* Quick popular chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 2 }}>Populaires :</span>
                  {(form.envelope === 'CRYPTO'
                    ? [
                        { label: '₿ Bitcoin (BTC)', ticker: 'BTC-EUR' },
                        { label: 'Ξ Ethereum (ETH)', ticker: 'ETH-EUR' },
                        { label: '◎ Solana (SOL)', ticker: 'SOL-EUR' },
                        { label: '🟡 Binance Coin (BNB)', ticker: 'BNB-EUR' },
                        { label: '✕ Ripple (XRP)', ticker: 'XRP-EUR' },
                        { label: '₳ Cardano (ADA)', ticker: 'ADA-EUR' },
                        { label: '🔺 Avalanche (AVAX)', ticker: 'AVAX-EUR' },
                      ]
                    : [
                        { label: 'CW8 (MSCI World)', ticker: 'CW8.PA' },
                        { label: 'PUST (Nasdaq-100)', ticker: 'PUST.PA' },
                        { label: 'GPEA (MSCI ACWI)', ticker: 'GPEA.PA' },
                        { label: 'LVMH', ticker: 'MC.PA' },
                        { label: 'Air Liquide', ticker: 'AI.PA' },
                        { label: 'Kalray (PEA-PME)', ticker: 'ALKAL.PA' },
                        { label: 'Microsoft', ticker: 'MSFT' },
                        { label: 'NVIDIA', ticker: 'NVDA' },
                        { label: 'Bitcoin (BTC)', ticker: 'BTC-EUR' },
                      ]
                  ).map((chip) => (
                    <button
                      key={chip.ticker}
                      type="button"
                      onClick={() => {
                        const match = ASSET_REGISTRY.find((a) => a.ticker === chip.ticker);
                        if (match) {
                          handleSelectRegisteredAsset(match);
                        } else {
                          handleChange('ticker', chip.ticker);
                          handleVerifyManualTicker();
                        }
                      }}
                      className="badge"
                      style={{
                        cursor: 'pointer',
                        fontSize: 11,
                        padding: '3px 8px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                        e.currentTarget.style.color = 'var(--accent-cyan)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Main Search Input + Verification Button */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      className="input"
                      value={tickerSearchInput}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                      onFocus={() => setShowDropdown(searchResults.length > 0)}
                      placeholder="Tapez un Nom (ex: LVMH, Amundi World), Ticker (ex: CW8, PUST, MSFT, BTC) ou code ISIN (ex: FR0010315770)..."
                      id="input-asset-search"
                      style={{ width: '100%', paddingRight: tickerSearchInput ? 32 : 12 }}
                    />
                    {tickerSearchInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setTickerSearchInput('');
                          setSearchResults([]);
                          setShowDropdown(false);
                          setVerifiedQuoteText(null);
                          setTickerError(null);
                          setDidYouMeanAsset(null);
                        }}
                        style={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          fontSize: 14,
                        }}
                        aria-label="Effacer la recherche"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleVerifyManualTicker}
                    disabled={isVerifyingTicker || (!form.ticker && !tickerSearchInput)}
                    style={{ whiteSpace: 'nowrap', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                    id="btn-verify-ticker"
                  >
                    {isVerifyingTicker ? (
                      <>
                        <span className="loading-spinner" style={{ width: 12, height: 12 }} />
                        <span>Vérification...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        <span>Vérifier cours direct</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Dropdown Suggestions */}
                {showDropdown && searchResults.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 200,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-accent)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                      maxHeight: 260,
                      overflowY: 'auto',
                      marginTop: 6,
                    }}
                  >
                    <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{searchResults.length} actif{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''} (Cliquez pour autocompléter)</span>
                      <button
                        type="button"
                        onClick={() => setShowDropdown(false)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11 }}
                      >
                        Fermer ✕
                      </button>
                    </div>
                    {searchResults.map((asset) => (
                      <div
                        key={`${asset.ticker}-${asset.isin || ''}`}
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong style={{ color: 'var(--accent-cyan)', fontSize: 14 }} className="mono">{asset.ticker}</strong>
                            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{asset.name}</span>
                          </div>
                          {asset.isin && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }} className="mono">
                              ISIN: {asset.isin}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span className="badge badge-purple" style={{ fontSize: 10 }}>{asset.assetType}</span>
                          <span className="badge badge-cyan" style={{ fontSize: 10 }}>{asset.envelope}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{asset.exchange}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Status Feedback / Verified Badge / Error Card / Suggestion */}
                {verifiedQuoteText && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--accent-emerald)',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      marginTop: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>✓</span>
                    <span style={{ fontWeight: 600 }}>{verifiedQuoteText}</span>
                  </div>
                )}

                {didYouMeanAsset && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--accent-cyan)',
                      background: 'rgba(6, 182, 212, 0.08)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px',
                      marginTop: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div>
                      <strong>💡 Actif officiel détecté :</strong> {didYouMeanAsset.name} ({didYouMeanAsset.ticker}) — {didYouMeanAsset.exchange}
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleSelectRegisteredAsset(didYouMeanAsset)}
                      style={{ fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap' }}
                    >
                      Sélectionner cet actif
                    </button>
                  </div>
                )}

                {tickerError && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--accent-rose)',
                      background: 'rgba(244, 63, 94, 0.08)',
                      border: '1px solid rgba(244, 63, 94, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      marginTop: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>⚠️</span>
                    <span style={{ fontWeight: 600 }}>{tickerError}</span>
                  </div>
                )}
              </div>

              {/* 🛡️ Garde-Fou Anti-Doublon & Anti-Addition */}
              {duplicatePosition && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.08) 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    marginBottom: 16,
                    boxShadow: '0 4px 16px rgba(245, 158, 11, 0.1)',
                  }}
                  id="duplicate-guard-alert"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>🛡️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                        <strong style={{ fontSize: 13, color: 'var(--accent-amber)', fontWeight: 800 }}>
                          GARDE-FOU ANTI-DOUBLON : Code déjà enregistré dans votre portefeuille !
                        </strong>
                        <span className="badge" style={{ fontSize: 11, background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-amber)', fontWeight: 700 }}>
                          {duplicatePosition.envelope}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.45 }}>
                        L&apos;actif <strong>{duplicatePosition.name}</strong> (<code style={{ color: 'var(--accent-cyan)' }}>{duplicatePosition.ticker}</code>) est déjà enregistré avec <strong>{duplicatePosition.quantity} part{duplicatePosition.quantity > 1 ? 's' : ''}</strong> à un PRU de <strong>{duplicatePosition.avgPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {duplicatePosition.currency}</strong>.
                      </p>

                      {reinforcementCalc && reinforcementCalc.addedQty > 0 && (
                        <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', marginBottom: 12, fontSize: 12 }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                            📊 Simulation de Renfort automatique (PRU Pondéré) :
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span>Actuel : {reinforcementCalc.oldQty} parts @ {reinforcementCalc.oldPru.toFixed(2)} €</span>
                            <span>+ Achat : {reinforcementCalc.addedQty} parts @ {reinforcementCalc.buyPrice.toFixed(2)} €</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontWeight: 700, color: 'var(--accent-emerald)' }}>
                            <span>Nouveau Solde : {reinforcementCalc.newTotalQty.toFixed(4)} parts</span>
                            <span>Nouveau PRU Pondéré : {reinforcementCalc.newWeightedPRU.toFixed(2)} €</span>
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleSwitchToExisting(duplicatePosition)}
                          style={{ fontSize: 12, padding: '6px 12px', background: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)' }}
                        >
                          🔁 Modifier la ligne existante
                        </button>
                        {reinforcementCalc && reinforcementCalc.addedQty > 0 && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleApplyReinforcement}
                            style={{ fontSize: 12, padding: '6px 12px', borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald)' }}
                          >
                            ➕ Fusionner &amp; Appliquer le renfort
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => setAllowDuplicateLine(true)}
                          style={{ fontSize: 11, padding: '6px 10px', color: 'var(--text-muted)' }}
                          title="Conserver une ligne séparée (ex: même actif sur un autre compte/banque)"
                        >
                          🔀 Conserver 2 lignes distinctes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
            <div className="form-group" style={{ flex: 1.2 }}>
              <label className="form-label">
                Quantité {form.envelope === 'CRYPTO' || form.assetType === 'CRYPTO' 
                  ? '(Tokens / Fractions)' 
                  : form.assetType === 'STOCK' 
                    ? '(Actions)' 
                    : '(Parts)'} *
              </label>

              {/* Quick fraction chips for Crypto positions */}
              {(form.envelope === 'CRYPTO' || form.assetType === 'CRYPTO') && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 2 }}>Fractions rapides :</span>
                  {['0.001', '0.005', '0.01', '0.05', '0.1', '0.5', '1'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuantityChange(val)}
                      style={{
                        padding: '2px 6px',
                        fontSize: 10.5,
                        borderRadius: 4,
                        border: '1px solid var(--border-subtle)',
                        background: quantityInput === val ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-tertiary)',
                        color: quantityInput === val ? 'var(--accent-amber)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              )}

              <input
                className="input mono"
                type="text"
                inputMode="decimal"
                value={quantityInput}
                onChange={(e) => handleQuantityChange(e.target.value)}
                placeholder={form.envelope === 'CRYPTO' ? 'ex: 0.001' : 'ex: 10'}
                id="input-quantity"
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">PRU d&apos;Achat ({form.currency === 'USD' ? '$' : form.currency === 'GBP' ? '£' : '€'})</label>
              <input
                className="input mono"
                type="text"
                inputMode="decimal"
                value={avgPriceInput}
                onChange={(e) => handleAvgPriceChange(e.target.value)}
                placeholder="0.00"
                id="input-avg-price"
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Prix de revient unitaire moyen.
              </span>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Prix actuel ({form.currency === 'USD' ? '$' : form.currency === 'GBP' ? '£' : '€'})</label>
              <input
                className="input mono"
                type="text"
                inputMode="decimal"
                value={currentPriceInput}
                onChange={(e) => handleCurrentPriceChange(e.target.value)}
                placeholder="Auto-refresh"
                id="input-current-price"
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Cotation marché en direct.
              </span>
            </div>
          </div>

          {/* Dynamic real-time calculation breakdown & Crypto Options */}
          {(form.envelope === 'CRYPTO' || form.assetType === 'CRYPTO') && (
            <div
              style={{
                padding: '12px 14px',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>🪙</span> Plateforme / Wallet de Détention :
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Multi-wallets &amp; Frais de réseau</span>
              </div>

              {/* Institution Quick Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {[
                  { label: '⚡ Revolut X', value: 'Revolut X' },
                  { label: '🛡️ Trust Wallet', value: 'Trust Wallet' },
                  { label: '🔒 Ledger (Cold Storage)', value: 'Ledger' },
                  { label: '🟡 Binance', value: 'Binance' },
                  { label: '🐙 Kraken', value: 'Kraken' },
                  { label: '🔵 Coinbase', value: 'Coinbase' },
                ].map((inst) => (
                  <button
                    key={inst.value}
                    type="button"
                    onClick={() => handleChange('institutionName', inst.value)}
                    style={{
                      padding: '3px 8px',
                      fontSize: 11,
                      borderRadius: 4,
                      border: '1px solid var(--border-subtle)',
                      background: form.institutionName === inst.value ? 'var(--accent-amber)' : 'var(--bg-secondary)',
                      color: form.institutionName === inst.value ? '#000' : 'var(--text-secondary)',
                      fontWeight: form.institutionName === inst.value ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {inst.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
                    Frais totaux / Gaz (€)
                  </label>
                  <input
                    className="input mono"
                    type="number"
                    step="0.1"
                    min="0"
                    style={{ fontSize: 12, padding: '4px 8px' }}
                    value={form.totalFeesEUR || ''}
                    onChange={(e) => handleChange('totalFeesEUR', parseFloat(e.target.value) || 0)}
                    placeholder="0.00 €"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
                    Flat Tax PFU 30% estimée
                  </label>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-rose)', paddingTop: 5 }}>
                    {(() => {
                      const cost = (form.quantity || 0) * (form.avgPrice || 0) + (form.totalFeesEUR || 0);
                      const val = (form.quantity || 0) * (form.currentPrice || form.avgPrice || 0);
                      const gain = val - cost;
                      if (gain > 305) {
                        return `-${(gain * 0.3).toFixed(2)} € (30%)`;
                      }
                      return '0.00 € (Exonéré)';
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic real-time calculation breakdown */}
          {(form.quantity > 0 || totalValue > 0) && (
            <div style={{
              padding: '12px 16px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8
            }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block' }}>
                  Valorisation calculée : {form.quantity < 1 ? form.quantity.toFixed(8).replace(/\.?0+$/, '') : form.quantity.toLocaleString('fr-FR')} {form.envelope === 'CRYPTO' ? 'token(s)' : 'part(s)'} × {((form.currentPrice || form.avgPrice) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {form.currency === 'USD' ? '$' : '€'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Coût total investi : {((form.quantity || 0) * (form.avgPrice || 0) + (form.totalFeesEUR || 0)).toLocaleString('fr-FR', { style: 'currency', currency: form.currency })}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Valeur actuelle</span>
                <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {totalValue.toLocaleString('fr-FR', { style: 'currency', currency: form.currency })}
                </span>
              </div>
            </div>
          )}

          {/* Row 2.5: Auto-Calculateur DCA & One-Shot (Lump Sum) */}
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>⚡</span>
                <span>Simulateur d'Investissement ({form.envelope === 'PEA' || form.envelope === 'PEA-PME' ? 'Actions entières' : 'Parts décimales'})</span>
              </span>

              {/* Mode Selector Toggle */}
              <div style={{
                display: 'flex',
                background: 'var(--bg-secondary)',
                padding: 2,
                borderRadius: 6,
                border: '1px solid var(--border-subtle)',
                gap: 2
              }}>
                <button
                  type="button"
                  style={{
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: 'none',
                    background: simMode === 'DCA_FIXED' ? 'var(--accent-cyan)' : 'transparent',
                    color: simMode === 'DCA_FIXED' ? '#000' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setSimMode('DCA_FIXED');
                    setIsMultiTierDCA(false);
                  }}
                >
                  ⚡ DCA Régulier
                </button>
                <button
                  type="button"
                  style={{
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: 'none',
                    background: simMode === 'ONE_SHOT' ? 'var(--accent-cyan)' : 'transparent',
                    color: simMode === 'ONE_SHOT' ? '#000' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setSimMode('ONE_SHOT');
                    setIsMultiTierDCA(false);
                  }}
                >
                  🎯 Versement Unique (One-Shot)
                </button>
                <button
                  type="button"
                  style={{
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: 'none',
                    background: simMode === 'MULTI_TIER' ? 'var(--accent-cyan)' : 'transparent',
                    color: simMode === 'MULTI_TIER' ? '#000' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setSimMode('MULTI_TIER');
                    setIsMultiTierDCA(true);
                    if (dcaHistory.length === 0) {
                      handleAddTranche();
                    }
                  }}
                >
                  📈 Paliers ({dcaHistory.length})
                </button>
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              {simMode === 'ONE_SHOT'
                ? 'Simulez un investissement ponctuel unique dans le passé (ex: Si en 2012 j\'avais mis 1 000 € sur cet actif, quelle serait sa valeur aujourd\'hui ?).'
                : simMode === 'DCA_FIXED'
                ? 'Indiquez la date d\'entrée DCA, le montant et le jour de virement. L\'application simule l\'accumulation réelle (cours boursiers historiques réels + reliquats de liquidité).'
                : 'Configurez vos différents paliers de budget DCA dans le temps. L\'application applique précisément chaque budget sur chaque période historique.'}
            </p>

            {simMode === 'ONE_SHOT' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
                    Montant One-Shot ({form.currency === 'USD' ? '$' : form.currency === 'GBP' ? '£' : '€'})
                  </label>
                  <input
                    className="input mono"
                    type="number"
                    step="50"
                    min="1"
                    style={{ fontSize: 13, padding: '8px 10px' }}
                    value={oneShotAmount || ''}
                    onChange={(e) => setOneShotAmount(parseFloat(e.target.value) || 0)}
                    placeholder="1000"
                  />
                </div>

                <div className="form-group" style={{ minWidth: 160, flex: 1.2 }}>
                  <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
                    Date d'investissement One-Shot
                  </label>
                  <CustomDatePicker
                    value={oneShotDate}
                    onChange={setOneShotDate}
                  />
                </div>
              </div>
            ) : simMode === 'DCA_FIXED' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 14 }}>
                  <div className="form-group" style={{ minWidth: 115 }}>
                    <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>Fréquence</label>
                    <CustomSelect
                      value={form.dcaFrequency || 'monthly'}
                      options={[
                        { label: 'Mensuel', value: 'monthly' },
                        { label: 'Trimestriel', value: 'quarterly' },
                        { label: 'Semestriel', value: 'semestrial' },
                        { label: 'Annuel', value: 'annual' },
                      ]}
                      onChange={(val) => handleChange('dcaFrequency', val as string)}
                    />
                  </div>

                  <div className="form-group" style={{ minWidth: 75 }}>
                    <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>Jour (cible)</label>
                    <CustomSelect
                      value={(form.dcaDepositDay || 5).toString()}
                      options={Array.from({ length: 31 }, (_, i) => ({ label: (i + 1).toString(), value: (i + 1).toString() }))}
                      onChange={(val) => handleChange('dcaDepositDay', parseInt(val as string))}
                    />
                  </div>

                  {(form.dcaFrequency === 'annual' || form.dcaFrequency === 'quarterly' || form.dcaFrequency === 'semestrial') && (
                    <div className="form-group" style={{ minWidth: 110 }}>
                      <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>Mois (cible)</label>
                      <CustomSelect
                        value={(form.dcaDepositMonth || 1).toString()}
                        options={[
                          { label: 'Janvier', value: '1' },
                          { label: 'Février', value: '2' },
                          { label: 'Mars', value: '3' },
                          { label: 'Avril', value: '4' },
                          { label: 'Mai', value: '5' },
                          { label: 'Juin', value: '6' },
                          { label: 'Juillet', value: '7' },
                          { label: 'Août', value: '8' },
                          { label: 'Septembre', value: '9' },
                          { label: 'Octobre', value: '10' },
                          { label: 'Novembre', value: '11' },
                          { label: 'Décembre', value: '12' },
                        ]}
                        onChange={(val) => handleChange('dcaDepositMonth', parseInt(val as string))}
                      />
                    </div>
                  )}

                  <div className="form-group" style={{ minWidth: 95 }}>
                    <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>Budget ({form.currency === 'USD' ? '$' : form.currency === 'GBP' ? '£' : '€'})</label>
                    <input
                      className="input mono"
                      type="number"
                      step="10"
                      min="0"
                      style={{ fontSize: 13, padding: '8px 10px' }}
                      value={form.monthlyDCA ?? ''}
                      onChange={(e) => handleOptionalNumber('monthlyDCA', e.target.value)}
                      placeholder="0"
                      id="input-market-monthly-dca"
                    />
                  </div>

                  <div className="form-group" style={{ minWidth: 155, flex: 1.2 }}>
                    <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>Date d'entrée DCA</label>
                    <CustomDatePicker
                      value={dcaStartDate}
                      onChange={setDcaStartDate}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, padding: '5px 12px', borderRadius: 6, color: 'var(--accent-cyan)', borderColor: 'var(--border-accent)', fontWeight: 600 }}
                    onClick={handleCreateSuccessorTranche}
                  >
                    📈 Historiser une évolution de DCA (créer un palier avec date d'effet)
                  </button>
                </div>
              </>
            ) : (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>🔗</span> <strong>Paliers liés en continu</strong> (dates enchaînées automatiquement)
                  </span>
                  {(() => {
                    const activeTranche = getActiveDCATranche(dcaHistory);
                    return activeTranche ? (
                      <span style={{ fontSize: 11, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', padding: '2px 8px', borderRadius: 6, fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        🟢 Actuel : {activeTranche.amount.toLocaleString('fr-FR')} {form.currency === 'USD' ? '$' : '€'}/m
                      </span>
                    ) : null;
                  })()}
                </div>

                {/* Multi-Tier Tranches List */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  maxHeight: 240,
                  overflowY: 'auto',
                  paddingRight: 4,
                  scrollbarWidth: 'thin',
                  marginBottom: 10
                }}>
                  {dcaHistory.map((tranche, idx) => {
                    const todayIso = new Date().toISOString().split('T')[0];
                    const isFuture = tranche.startDate > todayIso;
                    const isPast = Boolean(tranche.endDate && tranche.endDate < todayIso);
                    const isCurrent = !isFuture && !isPast;

                    return (
                      <div
                        key={tranche.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(120px, 1fr) minmax(120px, 1fr) minmax(90px, 0.9fr) minmax(110px, 1.1fr) 32px',
                          gap: 8,
                          alignItems: 'center',
                          padding: '8px 10px',
                          background: isCurrent ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-secondary)',
                          border: `1px solid ${isCurrent ? 'rgba(16, 185, 129, 0.4)' : isFuture ? 'rgba(6, 182, 212, 0.3)' : 'var(--border-subtle)'}`,
                          borderRadius: 8,
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                            <label style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
                              Début #{idx + 1}
                            </label>
                            {isCurrent && (
                              <span style={{ fontSize: 8, padding: '1px 3px', borderRadius: 3, background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                                En cours
                              </span>
                            )}
                            {isFuture && (
                              <span style={{ fontSize: 8, padding: '1px 3px', borderRadius: 3, background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                                Prévu
                              </span>
                            )}
                          </div>
                          <CustomDatePicker
                            value={tranche.startDate}
                            onChange={(newDate) => handleUpdateTranche(tranche.id, { startDate: newDate })}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                            Fin {tranche.endDate ? '' : '(Indéterminé)'}
                          </label>
                          <CustomDatePicker
                            value={tranche.endDate || ''}
                            onChange={(newDate) => handleUpdateTranche(tranche.id, { endDate: newDate || undefined })}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                            Budget ({form.currency === 'USD' ? '$' : '€'})
                          </label>
                          <input
                            className="input mono"
                            type="number"
                            step="10"
                            min="0"
                            style={{ fontSize: 12, padding: '5px 8px', fontWeight: 600 }}
                            value={tranche.amount || ''}
                            onChange={(e) => handleUpdateTranche(tranche.id, { amount: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                            Libellé / Note
                          </label>
                          <input
                            className="input"
                            style={{ fontSize: 12, padding: '5px 8px' }}
                            value={tranche.label || ''}
                            onChange={(e) => handleUpdateTranche(tranche.id, { label: e.target.value })}
                            placeholder={`Palier #${idx + 1}`}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: '4px', color: 'var(--accent-rose)', minWidth: 'auto', fontSize: 13 }}
                            onClick={() => handleDeleteTranche(tranche.id)}
                            title="Supprimer ce palier"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6 }}
                    onClick={handleAddTranche}
                  >
                    ➕ Ajouter un palier lié
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, color: 'var(--accent-cyan)', borderColor: 'var(--border-accent)' }}
                    onClick={handleCreateSuccessorTranche}
                  >
                    📈 Clôturer le palier précédent et ouvrir un nouveau palier
                  </button>
                </div>
              </div>
            )}

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
              {isCalculatingDCA ? (
                <span className="loading-spinner" />
              ) : simMode === 'ONE_SHOT' ? (
                `🎯 Simuler le Versement One-Shot de ${oneShotAmount.toLocaleString('fr-FR')} ${form.currency === 'USD' ? '$' : '€'}`
              ) : (
                '⚡ Simuler / Vérifier la Stratégie DCA'
              )}
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
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-emerald)', marginTop: 8, margin: 0, fontWeight: 600 }}>
                  ✓ Vos positions réelles actuelles ({form.quantity || 0} parts @ {(form.avgPrice || 0).toFixed(2)} {form.currency === 'USD' ? '$' : '€'}) sont conservées et ne sont pas écrasées.
                </p>
              </div>
            )}

            {dcaResult && dcaResult.monthsCount > 0 && (() => {
              const sym = form.currency === 'USD' ? '$' : form.currency === 'GBP' ? '£' : '€';
              const latestPrice = form.currentPrice || (dcaResult.logs.length > 0 ? dcaResult.logs[dcaResult.logs.length - 1].sharePrice : dcaResult.avgPrice);
              const currentValue = dcaResult.totalShares * latestPrice;
              const totalProfitLoss = dcaResult.totalProfitLoss ?? (currentValue - dcaResult.totalInvested);
              const profitLossPercent = dcaResult.profitLossPercent ?? (dcaResult.totalInvested > 0 ? (totalProfitLoss / dcaResult.totalInvested) * 100 : 0);
              const totalCapitalWithCash = currentValue + dcaResult.uninvestedCash;
              const isOneShot = dcaResult.simulationMode === 'lump_sum';

              return (
                <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-emerald)' }}>
                      {isOneShot
                        ? `🎯 Résultats Versement Unique One-Shot (${dcaResult.monthsCount} mois écoulés) :`
                        : `📊 Résultats Simulation DCA (${dcaResult.monthsCount} mois passés) :`}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', fontWeight: 600 }}
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
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                    marginBottom: 12,
                  }}>
                    <div>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
                        {isOneShot ? 'Gain Total de l\'Investissement' : 'Gain / Perte Réalisé(e) du DCA'}
                      </span>
                      <div style={{ fontSize: 19, fontWeight: 800, color: totalProfitLoss >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', margin: '2px 0' }}>
                        {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {sym} ({totalProfitLoss >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)} %)
                      </div>
                      {dcaResult.multiplier > 0 && (
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'flex', gap: 12, marginTop: 4 }}>
                          <span>Multiple : <strong style={{ color: 'var(--accent-cyan)' }}>x{dcaResult.multiplier.toFixed(2)}</strong></span>
                          {dcaResult.annualizedReturn !== 0 && (
                            <span>TRI / CAGR : <strong style={{ color: dcaResult.annualizedReturn >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>{dcaResult.annualizedReturn >= 0 ? '+' : ''}{dcaResult.annualizedReturn.toFixed(2)} % / an</strong></span>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'block' }}>Valeur Portefeuille Actuelle</span>
                      <strong style={{ fontSize: 18, color: 'var(--accent-cyan)', fontWeight: 900 }}>{currentValue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {sym}</strong>
                      {dcaResult.initialSharePrice && dcaResult.initialSharePrice > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginTop: 2 }}>
                          Cours initial : {dcaResult.initialSharePrice.toFixed(2)} {sym}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, textAlign: 'center', marginBottom: 14 }}>
                    <div style={{ background: 'var(--bg-tertiary)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                      <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600 }}>Parts/Actions</span>
                      <strong style={{ fontSize: 15, color: 'var(--accent-cyan)', fontWeight: 800 }}>{dcaResult.totalShares}</strong>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                      <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600 }}>PRU Moyen</span>
                      <strong style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 800 }}>{dcaResult.avgPrice.toFixed(2)} {sym}</strong>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                      <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600 }}>Total Investi</span>
                      <strong style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 800 }}>{dcaResult.totalInvested.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {sym}</strong>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                      <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600 }}>Total + Trésorerie</span>
                      <strong style={{ fontSize: 15, color: 'var(--accent-amber)', fontWeight: 800 }}>{totalCapitalWithCash.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {sym}</strong>
                    </div>
                  </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: 12.5, padding: '9px 14px', borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)', fontWeight: 700 }}
                  onClick={handleApplyDCAResult}
                >
                  📋 Importer ce résultat dans mon portefeuille actuel ({dcaResult.totalShares} parts @ {dcaResult.avgPrice.toFixed(2)} {form.currency === 'USD' ? '$' : '€'})
                </button>

                {showDCAHistory && (
                  <div style={{ marginTop: 12, maxHeight: 180, overflowY: 'auto', fontSize: 'var(--text-xs)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
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
                          <tr key={log.date} style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                            <td style={{ padding: '4px 0' }}>{log.date}</td>
                            <td>{log.sharePrice} {form.currency === 'USD' ? '$' : '€'}</td>
                            <td>{log.cashAvailable} {form.currency === 'USD' ? '$' : '€'}</td>
                            <td style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>+{log.sharesBought}</td>
                            <td style={{ color: 'var(--accent-amber)' }}>{log.rolloverCash} {form.currency === 'USD' ? '$' : '€'}</td>
                            <td style={{ fontWeight: 600 }}>{log.cumulativeShares}</td>
                            <td style={{ color: 'var(--accent-amber)' }}>{log.cumulativePRU} {form.currency === 'USD' ? '$' : '€'}</td>
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


          {/* Section: Apports Personnels & Versements Ponctuels Exceptionnels */}
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--accent-cyan)' }}>
                  💎 Apports Personnels &amp; Versements Ponctuels ({depositsHistory.length})
                </span>
              </div>
              {depositsHistory.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-primary" style={{ fontSize: 11 }}>
                    Total Apports : {depositsHistory.reduce((acc, d) => acc + (d.amount || 0), 0).toLocaleString('fr-FR')} {form.currency === 'USD' ? '$' : '€'}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: 11, padding: '2px 6px', color: 'var(--accent-rose)' }}
                    onClick={handleClearAllDeposits}
                    title="Effacer tous les apports"
                  >
                    Effacer tout
                  </button>
                </div>
              )}
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Ajoutez des injections de capital ponctuelles (prime, bonus, apport personnel exceptionnel). Ces montants s'ajoutent à la trésorerie DCA pour l'achat de titres lors du mois correspondant.
            </p>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8 }}
                onClick={() => handleAddDeposit('LIBRE', 1000, 'Apport personnel exceptionnel')}
              >
                ➕ Apport Personnel (+1 000 {form.currency === 'USD' ? '$' : '€'})
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8 }}
                onClick={() => handleAddDeposit('PRIME', 1500, 'Prime / Bonus annuel')}
              >
                ➕ Prime / Bonus (+1 500 {form.currency === 'USD' ? '$' : '€'})
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8 }}
                onClick={() => handleAddDeposit('LIBRE', 500, 'Virement ponctuel')}
              >
                ➕ Virement Libre (+500 {form.currency === 'USD' ? '$' : '€'})
              </button>
            </div>

            {depositsHistory.length === 0 ? (
              <div style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed var(--border-subtle)',
                fontSize: 12,
                color: 'var(--text-tertiary)',
                textAlign: 'center',
              }}>
                Aucun apport ponctuel enregistré sur cet actif. Utilisez les boutons ci-dessus pour ajouter des apports personnels ou primes.
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                maxHeight: 220,
                overflowY: 'auto',
                paddingRight: 4,
                scrollbarWidth: 'thin',
              }}>
                {depositsHistory.map((dep, idx) => (
                  <div
                    key={dep.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(130px, 1.2fr) minmax(120px, 1.5fr) minmax(90px, 1fr) 32px',
                      gap: 8,
                      alignItems: 'center',
                      padding: '6px 8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                    }}
                  >
                    <div>
                      <label style={{ display: 'block', fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                        Date #{idx + 1}
                      </label>
                      <CustomDatePicker
                        value={dep.date}
                        onChange={(newDate) => handleUpdateDeposit(dep.id, { date: newDate })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                        Libellé / Nature
                      </label>
                      <input
                        className="input"
                        style={{ fontSize: 12, padding: '5px 8px' }}
                        value={dep.label || ''}
                        onChange={(e) => handleUpdateDeposit(dep.id, { label: e.target.value })}
                        placeholder="ex: Apport personnel..."
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                        Montant ({form.currency === 'USD' ? '$' : '€'})
                      </label>
                      <input
                        className="input mono"
                        type="number"
                        step="50"
                        min="0"
                        style={{ fontSize: 12, padding: '5px 8px', fontWeight: 600 }}
                        value={dep.amount || ''}
                        onChange={(e) => handleUpdateDeposit(dep.id, { amount: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: '4px', color: 'var(--accent-rose)', minWidth: 'auto', fontSize: 13 }}
                        onClick={() => handleDeleteDeposit(dep.id)}
                        title="Supprimer cet apport"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                    style={{ fontSize: 'var(--text-xs)', padding: '3px 8px', fontWeight: 600 }}
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
                    style={{ fontSize: 'var(--text-xs)', padding: '3px 8px', fontWeight: 600 }}
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
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-violet)', fontWeight: 600 }}>✨ Générés automatiquement selon le secteur</span>
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
                  onClick={() => setIsDeletePositionModalOpen(true)}
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

      {/* ⚠️ Modal confirmation: Tout effacer les versements */}
      <ConfirmationModal
        isOpen={isClearDepositsModalOpen}
        title="Effacer tous les versements"
        variant="danger"
        icon="🗑️"
        confirmText="Supprimer tous les versements"
        cancelText="Annuler"
        message={
          <div>
            <p style={{ margin: '0 0 8px 0' }}>
              Êtes-vous sûr de vouloir supprimer tous les versements libres et apports enregistrés pour <strong>{form.name || 'cette position'}</strong> ?
            </p>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Les calculs d&apos;intérêts et de plus-values historiques associés à ces versements seront réinitialisés.
            </p>
          </div>
        }
        onConfirm={handleConfirmClearDeposits}
        onCancel={() => setIsClearDepositsModalOpen(false)}
      />

      {/* ⚠️ Modal confirmation: Supprimer la position */}
      {!isNew && onDelete && (
        <ConfirmationModal
          isOpen={isDeletePositionModalOpen}
          title={`Supprimer la position « ${form.name} »`}
          variant="danger"
          icon="⚠️"
          confirmText="Supprimer définitivement"
          cancelText="Conserver"
          message={
            <div>
              <p style={{ margin: '0 0 8px 0' }}>
                Êtes-vous certain de vouloir supprimer <strong>{form.name} ({form.ticker})</strong> de votre portefeuille ?
              </p>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                Cette opération enregistrera une vente / liquidation dans votre historique d&apos;arbitrages.
              </p>
            </div>
          }
          onConfirm={() => {
            setIsDeletePositionModalOpen(false);
            onDelete(form.id);
          }}
          onCancel={() => setIsDeletePositionModalOpen(false)}
        />
      )}
    </div>
  );
}

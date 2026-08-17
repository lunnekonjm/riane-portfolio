'use client';

import React from 'react';
import type { Position, DCATranche } from '@/types/portfolio';
import type { DCASimulationResult } from '@/engines/dcaSimulation';
import CustomDatePicker from '@/components/CustomDatePicker';
import DcaTranchesSection from '@/components/position-editor/DcaTranchesSection';
import { DcaSimulationResultCard } from './DcaSimulationResultCard';

interface DcaSimulationSectionProps {
  envelope: Position['envelope'];
  currency?: Position['currency'];
  ticker?: string;
  currentPrice?: number;
  avgPrice?: number;
  quantity?: number;
  monthlyDCA?: number;
  annualBudget?: number;
  dcaFrequency?: Position['dcaFrequency'];
  dcaDepositDay?: number;
  dcaDepositMonth?: number;
  onFieldChange: (field: keyof Position, val: any) => void;
  simMode: 'DCA_FIXED' | 'ONE_SHOT' | 'MULTI_TIER';
  setSimMode: (mode: 'DCA_FIXED' | 'ONE_SHOT' | 'MULTI_TIER') => void;
  oneShotAmount: number;
  setOneShotAmount: (amt: number) => void;
  oneShotDate: string;
  setOneShotDate: (date: string) => void;
  dcaHistory: DCATranche[];
  setDcaHistory: (h: DCATranche[]) => void;
  dcaStartDate: string;
  setDcaStartDate: (d: string) => void;
  isMultiTierDCA: boolean;
  setIsMultiTierDCA: (b: boolean) => void;
  onAddTranche: () => void;
  isCalculatingDCA: boolean;
  onRunDCASimulation: () => void;
  isFutureDca: boolean;
  dcaResult: DCASimulationResult | null;
  showDCAHistory: boolean;
  setShowDCAHistory: (b: boolean) => void;
  onApplyDCAResult: () => void;
}

export default function DcaSimulationSection({
  envelope,
  currency = 'EUR',
  ticker,
  currentPrice,
  avgPrice,
  quantity = 0,
  monthlyDCA,
  annualBudget,
  dcaFrequency = 'monthly',
  dcaDepositDay = 5,
  dcaDepositMonth = 1,
  onFieldChange,
  simMode,
  setSimMode,
  oneShotAmount,
  setOneShotAmount,
  oneShotDate,
  setOneShotDate,
  dcaHistory,
  setDcaHistory,
  dcaStartDate,
  setDcaStartDate,
  isMultiTierDCA,
  setIsMultiTierDCA,
  onAddTranche,
  isCalculatingDCA,
  onRunDCASimulation,
  isFutureDca,
  dcaResult,
  showDCAHistory,
  setShowDCAHistory,
  onApplyDCAResult,
}: DcaSimulationSectionProps) {
  const sym = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';

  return (
    <div
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-md)',
        padding: 16,
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>⚡</span>
          <span>Simulateur d'Investissement ({envelope === 'PEA' || envelope === 'PEA-PME' ? 'Actions entières' : 'Parts décimales'})</span>
        </span>

        {/* Mode Selector Toggle */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-secondary)',
            padding: 2,
            borderRadius: 6,
            border: '1px solid var(--border-subtle)',
            gap: 2,
          }}
        >
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
                onAddTranche();
              }
            }}
          >
            📈 Paliers ({dcaHistory.length})
          </button>
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
        {simMode === 'ONE_SHOT'
          ? "Simulez un investissement ponctuel unique dans le passé (ex: Si en 2012 j'avais mis 1 000 € sur cet actif, quelle serait sa valeur aujourd'hui ?)."
          : simMode === 'DCA_FIXED'
          ? "Indiquez la date d'entrée DCA, le montant et le jour de virement. L'application simule l'accumulation réelle (cours boursiers historiques réels + reliquats de liquidité)."
          : "Configurez vos différents paliers de budget DCA dans le temps. L'application applique précisément chaque budget sur chaque période historique."}
      </p>

      {simMode === 'ONE_SHOT' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
              Montant One-Shot ({sym})
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
            <CustomDatePicker value={oneShotDate} onChange={setOneShotDate} />
          </div>
        </div>
      ) : (
        <DcaTranchesSection
          dcaHistory={dcaHistory}
          onDcaHistoryChange={setDcaHistory}
          dcaFrequency={dcaFrequency}
          onDcaFrequencyChange={(f) => onFieldChange('dcaFrequency', f)}
          dcaDepositDay={dcaDepositDay}
          onDcaDepositDayChange={(d) => onFieldChange('dcaDepositDay', d)}
          dcaDepositMonth={dcaDepositMonth}
          onDcaDepositMonthChange={(m) => onFieldChange('dcaDepositMonth', m)}
          monthlyDCA={monthlyDCA}
          onMonthlyDCAChange={(amt) => onFieldChange('monthlyDCA', amt)}
          dcaStartDate={dcaStartDate}
          onDcaStartDateChange={setDcaStartDate}
          currency={currency}
          isMultiTierDCA={isMultiTierDCA}
          setIsMultiTierDCA={setIsMultiTierDCA}
          title="Plan d'Accumulation DCA & Paliers"
          subtitle="Planifiez vos versements réguliers ou retracez l'historique de vos paliers d'investissement."
        />
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
        onClick={onRunDCASimulation}
        disabled={isCalculatingDCA || !ticker}
      >
        {isCalculatingDCA ? (
          <span className="loading-spinner" />
        ) : simMode === 'ONE_SHOT' ? (
          `🎯 Simuler le Versement One-Shot de ${oneShotAmount.toLocaleString('fr-FR')} ${sym}`
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
            Versement prévu de <strong>{(monthlyDCA || (annualBudget ? annualBudget / 12 : 100)).toLocaleString('fr-FR')} {sym}</strong> ({dcaFrequency === 'annual' ? 'par an' : dcaFrequency === 'quarterly' ? 'par trimestre' : dcaFrequency === 'semestrial' ? 'par semestre' : 'par mois'}) à partir de <strong>{dcaStartDate || 'mois prochain'}</strong>.
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-emerald)', marginTop: 8, margin: 0, fontWeight: 600 }}>
            ✓ Vos positions réelles actuelles ({quantity} parts @ {(avgPrice || 0).toFixed(2)} {sym}) sont conservées et ne sont pas écrasées.
          </p>
        </div>
      )}

      {dcaResult && dcaResult.monthsCount > 0 && (
        <DcaSimulationResultCard
          dcaResult={dcaResult}
          currentPrice={currentPrice}
          sym={sym}
          showDCAHistory={showDCAHistory}
          setShowDCAHistory={setShowDCAHistory}
          onApplyDCAResult={onApplyDCAResult}
        />
      )}
    </div>
  );
}

'use client';

import React from 'react';
import type { DCATranche } from '@/types/portfolio';
import { getActiveDCATranche, updateChainedTranches, deleteChainedTranche, addContinuousTranche } from '@/utils/dcaHistoryHelper';
import { DcaSimpleModeForm } from './DcaSimpleModeForm';
import { DcaMultiTierRow } from './DcaMultiTierRow';

interface DcaTranchesSectionProps {
  dcaHistory: DCATranche[];
  onDcaHistoryChange: (tranches: DCATranche[]) => void;
  dcaFrequency: string;
  onDcaFrequencyChange: (freq: string) => void;
  dcaDepositDay: number;
  onDcaDepositDayChange: (day: number) => void;
  dcaDepositMonth?: number;
  onDcaDepositMonthChange?: (m: number) => void;
  monthlyDCA?: number;
  onMonthlyDCAChange: (amount?: number) => void;
  dcaStartDate: string;
  onDcaStartDateChange: (date: string) => void;
  currency: string;
  isMultiTierDCA: boolean;
  setIsMultiTierDCA: (b: boolean) => void;
  title?: string;
  subtitle?: string;
}

export default function DcaTranchesSection({
  dcaHistory,
  onDcaHistoryChange,
  dcaFrequency,
  onDcaFrequencyChange,
  dcaDepositDay,
  onDcaDepositDayChange,
  dcaDepositMonth = 1,
  onDcaDepositMonthChange,
  monthlyDCA,
  onMonthlyDCAChange,
  dcaStartDate,
  onDcaStartDateChange,
  currency,
  isMultiTierDCA,
  setIsMultiTierDCA,
  title = "Paliers & Historique d'Évolution DCA",
  subtitle = "Configurez vos versements périodiques et l'évolution historique de votre effort d'épargne.",
}: DcaTranchesSectionProps) {
  const currencySymbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';

  const handleCreateSuccessorTranche = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const baseDate = dcaStartDate || '2023-01-05';
    const baseAmount = monthlyDCA || 100;

    const baseTranche: DCATranche = {
      id: `tranche-${Date.now()}-1`,
      startDate: baseDate,
      endDate: todayStr,
      amount: baseAmount,
      frequency: (dcaFrequency as any) || 'monthly',
      depositDay: dcaDepositDay || 5,
    };

    const newTranche: DCATranche = {
      id: `tranche-${Date.now()}-2`,
      startDate: todayStr,
      amount: baseAmount,
      frequency: (dcaFrequency as any) || 'monthly',
      depositDay: dcaDepositDay || 5,
    };

    onDcaHistoryChange([baseTranche, newTranche]);
    setIsMultiTierDCA(true);
  };

  const handleAddTranche = () => {
    const active = getActiveDCATranche(dcaHistory);
    const amount = active?.amount || monthlyDCA || 100;
    const updated = addContinuousTranche(dcaHistory, amount);
    onDcaHistoryChange(updated);
  };

  const handleDeleteTranche = (id: string) => {
    if (dcaHistory.length <= 1) {
      setIsMultiTierDCA(false);
      onDcaHistoryChange([]);
      return;
    }
    const updated = deleteChainedTranche(dcaHistory, id);
    onDcaHistoryChange(updated);
    if (updated.length <= 1) {
      setIsMultiTierDCA(false);
      const remaining = updated[0];
      if (remaining) {
        onMonthlyDCAChange(remaining.amount);
        onDcaStartDateChange(remaining.startDate);
        if (remaining.frequency) onDcaFrequencyChange(remaining.frequency);
        if (remaining.depositDay) onDcaDepositDayChange(remaining.depositDay);
      }
    }
  };

  return (
    <div style={{ background: 'var(--bg-tertiary)', borderRadius: 10, padding: 14, border: '1px solid var(--border-subtle)', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <strong style={{ fontSize: 13, color: 'var(--text-primary)', display: 'block' }}>
            📅 {title}
          </strong>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {subtitle}
          </span>
        </div>
        {isMultiTierDCA && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 11, color: 'var(--text-muted)' }}
            onClick={() => {
              if (confirm('Revenir au mode DCA simple ? Les paliers intermédiaires seront réinitialisés.')) {
                setIsMultiTierDCA(false);
                const active = getActiveDCATranche(dcaHistory);
                if (active) {
                  onMonthlyDCAChange(active.amount);
                  onDcaStartDateChange(active.startDate);
                }
                onDcaHistoryChange([]);
              }
            }}
          >
            ↺ Mode Simple
          </button>
        )}
      </div>

      {!isMultiTierDCA ? (
        <DcaSimpleModeForm
          dcaFrequency={dcaFrequency}
          onDcaFrequencyChange={onDcaFrequencyChange}
          dcaDepositDay={dcaDepositDay}
          onDcaDepositDayChange={onDcaDepositDayChange}
          dcaDepositMonth={dcaDepositMonth}
          onDcaDepositMonthChange={onDcaDepositMonthChange}
          monthlyDCA={monthlyDCA}
          onMonthlyDCAChange={onMonthlyDCAChange}
          dcaStartDate={dcaStartDate}
          onDcaStartDateChange={onDcaStartDateChange}
          currencySymbol={currencySymbol}
          onCreateSuccessorTranche={handleCreateSuccessorTranche}
        />
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>🔗</span> <strong>Paliers liés en continu</strong> (dates enchaînées automatiquement)
            </span>
            {(() => {
              const activeTranche = getActiveDCATranche(dcaHistory);
              return activeTranche ? (
                <span style={{ fontSize: 11, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', padding: '2px 8px', borderRadius: 6, fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  🟢 Actuel : {activeTranche.amount.toLocaleString('fr-FR')} {currencySymbol}/m
                </span>
              ) : null;
            })()}
          </div>

          {/* Multi-Tier Tranches List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: 240,
              overflowY: 'auto',
              paddingRight: 4,
              scrollbarWidth: 'thin',
              marginBottom: 10,
            }}
          >
            {dcaHistory.map((tranche, idx) => (
              <DcaMultiTierRow
                key={tranche.id}
                tranche={tranche}
                idx={idx}
                totalTranches={dcaHistory.length}
                currencySymbol={currencySymbol}
                onUpdateTranche={(id, updates) => {
                  const updated = updateChainedTranches(dcaHistory, id, updates);
                  onDcaHistoryChange(updated);
                }}
                onDeleteTranche={handleDeleteTranche}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 11, padding: '5px 12px', color: 'var(--accent-cyan)', fontWeight: 600 }}
              onClick={handleAddTranche}
            >
              ➕ Ajouter un nouveau palier lié
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

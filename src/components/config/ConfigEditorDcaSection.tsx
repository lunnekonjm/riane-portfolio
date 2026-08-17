'use client';

import React from 'react';
import type { PortfolioConfig, DCATranche } from '@/types/portfolio';
import InfoTooltip from '@/components/InfoTooltip';
import { ConfigEditorDcaTrancheRow } from './ConfigEditorDcaTrancheRow';
import { ConfigEditorDcaStepUpForm } from './ConfigEditorDcaStepUpForm';

interface ConfigEditorDcaSectionProps {
  form: PortfolioConfig;
  isMultiTierDCA: boolean;
  setIsMultiTierDCA: (val: boolean) => void;
  dcaHistory: DCATranche[];
  handleNumberChange: (field: keyof PortfolioConfig, value: string) => void;
  handleUpdateTranche: (id: string, updates: Partial<DCATranche>) => void;
  handleDeleteTranche: (id: string) => void;
  showAddTrancheForm: boolean;
  setShowAddTrancheForm: (val: boolean) => void;
  newTrancheDate: string;
  setNewTrancheDate: (val: string) => void;
  newTrancheAmount: number;
  setNewTrancheAmount: (val: number) => void;
  newTrancheReason: string;
  setNewTrancheReason: (val: string) => void;
  handleAddStepUp: (e: React.FormEvent) => void;
  cumulativeStats: {
    totalInvested: number;
    totalMonths: number;
    averageMonthly: number;
  };
}

export function ConfigEditorDcaSection({
  form,
  isMultiTierDCA,
  setIsMultiTierDCA,
  dcaHistory,
  handleNumberChange,
  handleUpdateTranche,
  handleDeleteTranche,
  showAddTrancheForm,
  setShowAddTrancheForm,
  newTrancheDate,
  setNewTrancheDate,
  newTrancheAmount,
  setNewTrancheAmount,
  newTrancheReason,
  setNewTrancheReason,
  handleAddStepUp,
  cumulativeStats,
}: ConfigEditorDcaSectionProps) {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
      }}
    >
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
            onClick={() => setIsMultiTierDCA(true)}
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
            {dcaHistory.map((tranche) => (
              <ConfigEditorDcaTrancheRow
                key={tranche.id}
                tranche={tranche}
                handleUpdateTranche={handleUpdateTranche}
                handleDeleteTranche={handleDeleteTranche}
                canDelete={dcaHistory.length > 1}
              />
            ))}
          </div>

          {/* Add Step-up Form Toggle */}
          <ConfigEditorDcaStepUpForm
            showAddTrancheForm={showAddTrancheForm}
            setShowAddTrancheForm={setShowAddTrancheForm}
            newTrancheDate={newTrancheDate}
            setNewTrancheDate={setNewTrancheDate}
            newTrancheAmount={newTrancheAmount}
            setNewTrancheAmount={setNewTrancheAmount}
            newTrancheReason={newTrancheReason}
            setNewTrancheReason={setNewTrancheReason}
            handleAddStepUp={handleAddStepUp}
          />

          {/* Cumulative DCA KPI Box */}
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(56, 189, 248, 0.06)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
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
  );
}

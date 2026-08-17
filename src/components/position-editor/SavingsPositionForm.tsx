'use client';

import React from 'react';
import type { Position, SavingsDeposit, DCATranche } from '@/types/portfolio';
import CustomDatePicker from '@/components/CustomDatePicker';
import DcaTranchesSection from '@/components/position-editor/DcaTranchesSection';
import SavingsDepositsSection from '@/components/position-editor/SavingsDepositsSection';

interface SavingsPositionFormProps {
  form: Position;
  setForm: React.Dispatch<React.SetStateAction<Position>>;
  handleChange: (field: keyof Position, value: any) => void;
  duplicatePosition: Position | null;
  handleSwitchToExisting: (p: Position) => void;
  setAllowDuplicateLine: (b: boolean) => void;
  initialDepositDate: string;
  setInitialDepositDate: (d: string) => void;
  depositsHistory: SavingsDeposit[];
  setDepositsHistory: (d: SavingsDeposit[]) => void;
  dcaHistory: DCATranche[];
  setDcaHistory: (t: DCATranche[]) => void;
  dcaStartDate: string;
  setDcaStartDate: (d: string) => void;
  isMultiTierDCA: boolean;
  setIsMultiTierDCA: (b: boolean) => void;
  liveSavingsInterest: any;
}

export default function SavingsPositionForm({
  form,
  setForm,
  handleChange,
  duplicatePosition,
  handleSwitchToExisting,
  setAllowDuplicateLine,
  initialDepositDate,
  setInitialDepositDate,
  depositsHistory,
  setDepositsHistory,
  dcaHistory,
  setDcaHistory,
  dcaStartDate,
  setDcaStartDate,
  isMultiTierDCA,
  setIsMultiTierDCA,
  liveSavingsInterest,
}: SavingsPositionFormProps) {
  return (
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
            value={form.name || ''}
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
      <SavingsDepositsSection
        depositsHistory={depositsHistory}
        onDepositsHistoryChange={setDepositsHistory}
        currency={form.currency}
      />

      {/* 🔄 SECTION : Stratégie de versement régulier (DCA Épargne) */}
      <DcaTranchesSection
        dcaHistory={dcaHistory}
        onDcaHistoryChange={setDcaHistory}
        dcaFrequency={form.dcaFrequency || "monthly"}
        onDcaFrequencyChange={(f) => handleChange("dcaFrequency", f)}
        dcaDepositDay={form.dcaDepositDay || 5}
        onDcaDepositDayChange={(d) => handleChange("dcaDepositDay", d)}
        dcaDepositMonth={form.dcaDepositMonth || 1}
        onDcaDepositMonthChange={(m) => handleChange("dcaDepositMonth", m)}
        monthlyDCA={form.monthlyDCA}
        onMonthlyDCAChange={(amt) => handleChange("monthlyDCA", amt)}
        dcaStartDate={dcaStartDate}
        onDcaStartDateChange={setDcaStartDate}
        currency={form.currency || 'EUR'}
        isMultiTierDCA={isMultiTierDCA}
        setIsMultiTierDCA={setIsMultiTierDCA}
        title="Stratégie de versement régulier (DCA Épargne)"
        subtitle="Définissez votre versement programmé récurrent ou l'historique de vos paliers."
      />

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
                {liveSavingsInterest.principalDeposited.toLocaleString('fr-FR', { style: 'currency', currency: form.currency || 'EUR' })}
              </strong>
            </div>
            <div>
              <span className="text-xs text-secondary" style={{ display: 'block', marginBottom: 2 }}>Intérêts Acquis</span>
              <strong className="text-sm font-bold mono" style={{ color: 'var(--accent-emerald)' }}>
                +{liveSavingsInterest.interestEarnedToDate.toLocaleString('fr-FR', { style: 'currency', currency: form.currency || 'EUR' })}
              </strong>
            </div>
            <div>
              <span className="text-xs text-secondary" style={{ display: 'block', marginBottom: 2 }}>Solde Total Actuel</span>
              <strong className="text-base font-extrabold mono" style={{ color: 'var(--accent-cyan)' }}>
                {liveSavingsInterest.currentBalance.toLocaleString('fr-FR', { style: 'currency', currency: form.currency || 'EUR' })}
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
  );
}

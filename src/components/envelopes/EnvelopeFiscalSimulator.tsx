'use client';

import React from 'react';
import type { EnvelopeSummaryItem, WithdrawalSimulationResult } from '@/engines/taxEnvelopeEngine';

interface EnvelopeFiscalSimulatorProps {
  summaries: EnvelopeSummaryItem[];
  simEnvelope: string;
  setSimEnvelope: (env: string) => void;
  simSeniority: 'over5' | 'under5';
  setSimSeniority: (s: 'over5' | 'under5') => void;
  simWithdrawalAmount: number;
  setSimWithdrawalAmount: (amt: number) => void;
  ctoTaxRegime: 'pfu' | 'bareme';
  setCtoTaxRegime: (r: 'pfu' | 'bareme') => void;
  ctoTmiRate: number;
  setCtoTmiRate: (tmi: number) => void;
  psRate: number;
  setPsRate: (ps: number) => void;
  simResult: WithdrawalSimulationResult;
  simTotalVal: number;
  simTotalGain: number;
}

export function EnvelopeFiscalSimulator({
  summaries,
  simEnvelope,
  setSimEnvelope,
  simSeniority,
  setSimSeniority,
  simWithdrawalAmount,
  setSimWithdrawalAmount,
  ctoTaxRegime,
  setCtoTaxRegime,
  ctoTmiRate,
  setCtoTmiRate,
  psRate,
  setPsRate,
  simResult,
  simTotalVal,
  simTotalGain,
}: EnvelopeFiscalSimulatorProps) {
  const {
    actualGainRatio,
    grossWithdrawal,
    withdrawnGain,
    withdrawnCapital,
    irRate,
    irTax,
    psTax,
    totalTax,
    netReceived,
    ctoPfuTax,
    ctoBaremeTax,
    ctoSavingsWithPfu,
  } = simResult;

  return (
    <div className="card" style={{ borderLeft: '4px solid var(--accent-violet)' }}>
      <div className="card-header">
        <span className="card-title">💸 Simulateur de Retrait &amp; Calculateur d&apos;Impôt Réel (PEA &amp; CTO)</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Simulez un retrait partiel ou total sur votre **PEA, PEA-PME ou CTO** avec comparaison exacte des régimes fiscaux (Flat Tax 30% vs Barème Progressif IR).
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button
          type="button"
          className={`btn ${simEnvelope === 'PEA' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSimEnvelope('PEA')}
          style={{ fontSize: 13, fontWeight: 700 }}
        >
          🏛️ Simuler Retrait PEA (Exonéré IR)
        </button>
        <button
          type="button"
          className={`btn ${simEnvelope === 'CTO' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSimEnvelope('CTO')}
          style={{ fontSize: 13, fontWeight: 700 }}
        >
          💼 Simuler Retrait CTO (Flat Tax 30% / TMI)
        </button>
      </div>

      <div className="form-row" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">Enveloppe du retrait</label>
          <select
            className="input"
            value={simEnvelope}
            onChange={(e) => setSimEnvelope(e.target.value)}
          >
            {summaries.map((s) => (
              <option key={s.envKey} value={s.envKey}>
                {s.envKey} — {s.meta.label}
              </option>
            ))}
          </select>
        </div>

        {simEnvelope === 'PEA' || simEnvelope === 'PEA-PME' ? (
          <div className="form-group">
            <label className="form-label">Ancienneté du PEA</label>
            <select
              className="input"
              value={simSeniority}
              onChange={(e) => setSimSeniority(e.target.value as any)}
            >
              <option value="over5">Plus de 5 ans (Exonération IR 0% + PS)</option>
              <option value="under5">Moins de 5 ans (Flat Tax 30% : 12.8% IR + PS)</option>
            </select>
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">Régime Fiscal CTO</label>
            <select
              className="input"
              value={ctoTaxRegime}
              onChange={(e) => setCtoTaxRegime(e.target.value as any)}
            >
              <option value="pfu">Flat Tax / PFU (12.8% IR + Prélèvements Sociaux)</option>
              <option value="bareme">Barème Progressif IR (Option globale selon TMI)</option>
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Montant du retrait brut (€)</label>
          <input
            type="number"
            className="input mono"
            value={simWithdrawalAmount}
            onChange={(e) => setSimWithdrawalAmount(parseFloat(e.target.value) || 0)}
            min="0"
            step="10000"
          />
        </div>
      </div>

      {/* Dynamic Controls based on envelope selection */}
      <div className="form-row" style={{ marginBottom: 20, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 10 }}>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 12 }}>Taux des Prélèvements Sociaux (PS)</label>
          <select
            className="input mono"
            value={psRate}
            onChange={(e) => setPsRate(parseFloat(e.target.value))}
          >
            <option value="0.186">18.6% (Taux actualisé / Projet de Loi de Finances)</option>
            <option value="0.172">17.2% (Ancien taux légal)</option>
            <option value="0.20">20.0% (Scénario de hausse)</option>
          </select>
        </div>

        {simEnvelope === 'CTO' && ctoTaxRegime === 'bareme' && (
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 12 }}>Tranche Marginale d&apos;Imposition (TMI IR)</label>
            <select
              className="input mono"
              value={ctoTmiRate}
              onChange={(e) => setCtoTmiRate(parseFloat(e.target.value))}
            >
              <option value="0.0">0% (Non imposable)</option>
              <option value="0.11">11% (Tranche 11%)</option>
              <option value="0.30">30% (Tranche 30%)</option>
              <option value="0.41">41% (Tranche 41%)</option>
              <option value="0.45">45% (Tranche 45%)</option>
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label" style={{ fontSize: 12 }}>Part de Plus-Value Imposable (Calculée automatiquement)</label>
          <div className="input mono" style={{ background: 'var(--bg-secondary)', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{(actualGainRatio * 100).toFixed(1)}% de gains</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {((1 - actualGainRatio) * 100).toFixed(1)}% capital non imposable
            </span>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
            ℹ️ Calculé depuis l&apos;évolution réelle de votre portefeuille sur l&apos;enveloppe {simEnvelope} ({simTotalVal > 0 ? `${simTotalGain.toFixed(0)}€ de plus-value sur ${simTotalVal.toFixed(0)}€` : 'd&apos;après le portefeuille global'}).
          </span>
        </div>
      </div>

      {/* Breakdown Result */}
      {grossWithdrawal > 0 && (
        <div style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 12, border: '1px solid var(--border-medium)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'block' }}>Retrait Brut Simulé</span>
              <strong className="mono" style={{ fontSize: 20 }}>{grossWithdrawal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
            </div>
            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'block' }}>Capital Restitué (Exonéré)</span>
              <strong className="mono" style={{ fontSize: 18, color: 'var(--accent-emerald)' }}>{withdrawnCapital.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
            </div>
            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'block' }}>Plus-Value Imposable ({(actualGainRatio * 100).toFixed(1)}%)</span>
              <strong className="mono" style={{ fontSize: 18, color: 'var(--accent-amber)' }}>{withdrawnGain.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
            </div>
            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'block' }}>Total Impôts &amp; Cotisations</span>
              <strong className="mono" style={{ fontSize: 18, color: 'var(--accent-rose)' }}>-{totalTax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Détail de l&apos;imposition {simEnvelope} ({simEnvelope === 'CTO' ? (ctoTaxRegime === 'pfu' ? 'Flat Tax 31.4%' : `Barème IR TMI ${(ctoTmiRate * 100).toFixed(0)}%`) : (simSeniority === 'over5' ? 'PEA > 5 ans' : 'PEA < 5 ans')}) :
              </span>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 4 }}>
                • Impôt sur le Revenu IR ({(irRate * 100).toFixed(1)}%) : <strong className="mono">{irTax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong><br />
                • Prélèvements Sociaux PS ({(psRate * 100).toFixed(1)}%) : <strong className="mono">{psTax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
              </div>
            </div>

            <div style={{ textAlign: 'right', background: 'var(--bg-tertiary)', padding: '12px 20px', borderRadius: 10, border: '1px solid var(--border-accent)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Net Reçu en Compte Bancaire</span>
              <strong className="mono" style={{ fontSize: 24, color: 'var(--accent-emerald)' }}>
                {netReceived.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </strong>
            </div>
          </div>

          {/* CTO Optimization comparison card */}
          {simEnvelope === 'CTO' && (
            <div style={{ marginTop: 16, padding: 12, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 10, border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-cyan)' }}>
                  💡 Comparatif Fiscal CTO : Flat Tax (PFU) vs Barème Progressif (TMI {(ctoTmiRate * 100).toFixed(0)}%)
                </span>
                <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: ctoSavingsWithPfu >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                  {ctoSavingsWithPfu >= 0
                    ? `Économie PFU : +${ctoSavingsWithPfu.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`
                    : `Avantage Barème : +${Math.abs(ctoSavingsWithPfu).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                • Impôts totaux en Flat Tax (PFU 31.4%) : <strong className="mono">{ctoPfuTax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong><br />
                • Impôts totaux au Barème IR (TMI {(ctoTmiRate * 100).toFixed(0)}% + PS) : <strong className="mono">{ctoBaremeTax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

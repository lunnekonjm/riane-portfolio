'use client';

import { useState } from 'react';
import type { Position } from '@/types/portfolio';

interface EnvelopesTaxViewProps {
  positions: Position[];
  fxRates: Record<string, number>;
}

export const ENVELOPE_METADATA: Record<string, {
  label: string;
  depositLimit?: number;
  description: string;
  taxRules: {
    under5Years: { irRate: number; label: string };
    over5Years: { irRate: number; label: string };
  };
}> = {
  PEA: {
    label: 'PEA (Plan d\'Épargne en Actions)',
    depositLimit: 150000,
    description: 'Exonération d\'impôt sur le revenu après 5 ans (Plafond versement = 150 000 €)',
    taxRules: {
      under5Years: { irRate: 0.128, label: 'Clôture ou PFU (12.8% IR + Prélèvements Sociaux)' },
      over5Years: { irRate: 0.0, label: 'Exonération d\'IR (0%) + Prélèvements Sociaux' },
    },
  },
  'PEA-PME': {
    label: 'PEA-PME',
    depositLimit: 225000,
    description: 'Plafond cumulé PEA + PEA-PME = 225 000 € max au total (75 000 € si PEA à 150 000 €)',
    taxRules: {
      under5Years: { irRate: 0.128, label: 'Clôture ou PFU (12.8% IR + Prélèvements Sociaux)' },
      over5Years: { irRate: 0.0, label: 'Exonération d\'IR (0%) + Prélèvements Sociaux' },
    },
  },
  CTO: {
    label: 'Compte-Titres Ordinaire (CTO)',
    depositLimit: undefined,
    description: 'Aucun plafond de versement, accès universel aux marchés mondiaux',
    taxRules: {
      under5Years: { irRate: 0.128, label: 'Flat Tax / PFU (12.8% IR + Prélèvements Sociaux)' },
      over5Years: { irRate: 0.128, label: 'Flat Tax / PFU 30% ou option barème progressif IR' },
    },
  },
  PEE: {
    label: 'Plan d\'Épargne Entreprise (PEE)',
    depositLimit: undefined,
    description: 'Épargne salariale (abondement entreprise)',
    taxRules: {
      under5Years: { irRate: 0.128, label: 'Bloqué 5 ans (sauf déblocage anticipé)' },
      over5Years: { irRate: 0.0, label: 'Exonération d\'IR (0%) + Prélèvements Sociaux' },
    },
  },
  SPECULATIVE: {
    label: 'Poche Spéculative',
    depositLimit: 2000,
    description: 'Poche dédiée aux opérations à fort risque / levier',
    taxRules: {
      under5Years: { irRate: 0.128, label: 'Flat Tax 30%' },
      over5Years: { irRate: 0.128, label: 'Flat Tax 30%' },
    },
  },
  OPPORTUNISTIC: {
    label: 'Réserve Opportuniste',
    depositLimit: undefined,
    description: 'Liquidités et opportunités de marché',
    taxRules: {
      under5Years: { irRate: 0.128, label: 'Flat Tax 30%' },
      over5Years: { irRate: 0.128, label: 'Flat Tax 30%' },
    },
  },
};

export default function EnvelopesTaxView({ positions, fxRates }: EnvelopesTaxViewProps) {
  // Withdrawal simulator state
  const [simEnvelope, setSimEnvelope] = useState<string>('PEA');
  const [simSeniority, setSimSeniority] = useState<'over5' | 'under5'>('over5');
  const [simWithdrawalAmount, setSimWithdrawalAmount] = useState<number>(500000);
  
  // Tax rate settings (18.6% vs 17.2% vs custom)
  const [psRate, setPsRate] = useState<number>(0.186); // 18.6% default
  const [customGainPercent, setCustomGainPercent] = useState<number>(40); // 40% gain ratio default

  // Group positions by envelope
  const envelopeGroups = positions.reduce((acc, pos) => {
    const env = pos.envelope;
    if (!acc[env]) acc[env] = [];
    acc[env].push(pos);
    return acc;
  }, {} as Record<string, Position[]>);

  // Calculate PEA cost vs PEA-PME cost
  const peaPositions = envelopeGroups['PEA'] || [];
  const peaCost = peaPositions.reduce((sum, p) => sum + (p.quantity * p.avgPrice * (fxRates[p.currency] || 1)), 0);

  const peaPmePositions = envelopeGroups['PEA-PME'] || [];
  const peaPmeCost = peaPmePositions.reduce((sum, p) => sum + (p.quantity * p.avgPrice * (fxRates[p.currency] || 1)), 0);

  // Legal French Rule: Combined PEA + PEA-PME deposits cannot exceed 225,000 €!
  const maxPeaPmeAllowed = Math.max(0, 225000 - peaCost);

  const isPeaExceeded = peaCost > 150000;
  const isPeaPmeExceeded = peaPmeCost > maxPeaPmeAllowed;
  const isCombinedExceeded = (peaCost + peaPmeCost) > 225000;

  const envelopeKeys = Array.from(new Set([...Object.keys(ENVELOPE_METADATA), ...Object.keys(envelopeGroups)]));

  // Compute metrics per envelope
  const summaries = envelopeKeys.map((envKey) => {
    const envPositions = envelopeGroups[envKey] || [];
    const meta = ENVELOPE_METADATA[envKey] || {
      label: envKey,
      depositLimit: undefined,
      description: '',
      taxRules: {
        under5Years: { irRate: 0.128, label: 'Flat Tax 30%' },
        over5Years: { irRate: 0.128, label: 'Flat Tax 30%' },
      },
    };

    let totalValue = 0;
    let totalCost = 0;

    for (const p of envPositions) {
      if (p.quantity > 0 && p.avgPrice > 0) {
        const rate = fxRates[p.currency] || 1.0;
        const price = p.currentPrice || p.avgPrice;
        totalValue += p.quantity * price * rate;
        totalCost += p.quantity * p.avgPrice * rate;
      }
    }

    const gainLoss = totalValue - totalCost;
    const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

    // Dynamic legal deposit ceiling
    let depositLimit = meta.depositLimit;
    if (envKey === 'PEA-PME') {
      depositLimit = maxPeaPmeAllowed;
    }

    const fillRate = depositLimit && depositLimit > 0 ? (totalCost / depositLimit) * 100 : undefined;

    return {
      envKey,
      meta,
      positions: envPositions,
      totalValue,
      totalCost,
      gainLoss,
      gainLossPercent,
      fillRate,
      depositLimit,
    };
  });

  // Calculate withdrawal simulation (UNCONSTRAINED BY CURRENT PORTFOLIO VALUE)
  const targetSimSummary = summaries.find((s) => s.envKey === simEnvelope) || summaries[0];
  const simTotalVal = targetSimSummary?.totalValue || 0;
  const simTotalGain = targetSimSummary?.gainLoss || 0;

  // Auto gain ratio if portfolio has real data, otherwise use user's gain % slider
  const actualGainRatio = (simTotalVal > 0 && simTotalGain > 0)
    ? (simTotalGain / simTotalVal)
    : (customGainPercent / 100);

  const grossWithdrawal = Math.max(0, simWithdrawalAmount);
  const withdrawnGain = grossWithdrawal * actualGainRatio;
  const withdrawnCapital = grossWithdrawal - withdrawnGain;

  const rules = targetSimSummary?.meta.taxRules[simSeniority === 'over5' ? 'over5Years' : 'under5Years'];
  const irRate = rules?.irRate || 0;
  
  const irTax = withdrawnGain * irRate;
  const psTax = withdrawnGain * psRate;
  const totalTax = irTax + psTax;
  const netReceived = grossWithdrawal - totalTax;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ⚠️ Legal Warning Banner if PEA / PEA-PME ceiling is exceeded */}
      {(isPeaExceeded || isPeaPmeExceeded || isCombinedExceeded) && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-rose)', background: 'rgba(244, 63, 94, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>🚨</span>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-rose)' }}>
                Dépassement du Plafond Légal PEA / PEA-PME (Code Monétaire et Financier - Loi PACTE)
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 4 }}>
                {isPeaExceeded && `• Le PEA classique a dépassé le plafond légal de 150 000 € de versements (Actuel : ${peaCost.toLocaleString('fr-FR')} €).\n`}
                {isPeaPmeExceeded && `• Le PEA-PME a dépassé son plafond dynamique légal (${maxPeaPmeAllowed.toLocaleString('fr-FR')} € max sur PEA-PME car le PEA est à ${peaCost.toLocaleString('fr-FR')} €).\n`}
                {isCombinedExceeded && `• Le cumul PEA + PEA-PME dépasse la limite légale absolue de 225 000 € (Total actuel : ${(peaCost + peaPmeCost).toLocaleString('fr-FR')} €).`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 🏛️ Envelopes Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {summaries.map((s) => (
          <div key={s.envKey} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card-header" style={{ marginBottom: 0 }}>
              <div>
                <span className={`envelope-tag ${s.envKey.toLowerCase()}`} style={{ fontSize: 13, padding: '4px 10px' }}>
                  {s.envKey}
                </span>
                <div style={{ fontWeight: 700, fontSize: 16, marginTop: 6 }}>{s.meta.label}</div>
              </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, background: 'var(--bg-tertiary)', padding: 12, borderRadius: 10 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Versé (PRU)</span>
                <strong className="mono" style={{ fontSize: 14 }}>
                  {s.totalCost > 0 ? s.totalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '—'}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Valeur Actuelle</span>
                <strong className="mono" style={{ fontSize: 14, color: 'var(--accent-cyan)' }}>
                  {s.totalValue > 0 ? s.totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '—'}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Plus-Value Brute</span>
                <strong className={`mono ${s.gainLoss >= 0 ? 'stat-gain' : 'stat-loss'}`} style={{ fontSize: 14 }}>
                  {s.totalCost > 0 ? `${s.gainLoss >= 0 ? '+' : ''}${s.gainLoss.toFixed(0)}€ (${s.gainLossPercent >= 0 ? '+' : ''}${s.gainLossPercent.toFixed(1)}%)` : '—'}
                </strong>
              </div>
            </div>

            {/* Plafond de versement / Fill Rate */}
            {s.envKey === 'PEA' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Taux de remplissage PEA (Max 150 000 €)</span>
                  <span style={{ fontWeight: 600, color: (s.fillRate || 0) > 100 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                    {s.totalCost.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / 150 000 € ({(s.fillRate || 0).toFixed(1)}%)
                  </span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, s.fillRate || 0)}%`,
                      background: (s.fillRate || 0) > 100 ? 'var(--accent-rose)' : 'linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald))',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {s.envKey === 'PEA-PME' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Plafond dynamique PEA-PME (Cumul max 225k€)</span>
                  <span style={{ fontWeight: 600, color: (s.fillRate || 0) > 100 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                    {s.totalCost.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / {maxPeaPmeAllowed.toLocaleString('fr-FR')} € ({(s.fillRate || 0).toFixed(1)}%)
                  </span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, s.fillRate || 0)}%`,
                      background: (s.fillRate || 0) > 100 ? 'var(--accent-rose)' : 'linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald))',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                  ℹ️ Calculé dynamiquement : 225 000 € - {peaCost.toLocaleString('fr-FR')} € (PEA) = {maxPeaPmeAllowed.toLocaleString('fr-FR')} € max autorisés sur PEA-PME.
                </span>
              </div>
            )}

            {!s.depositLimit && s.envKey !== 'PEA-PME' && s.envKey !== 'PEA' && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                ℹ️ Sans plafond légal de versement
              </div>
            )}

            {/* Tax Info summary */}
            <div style={{ fontSize: 12, padding: 8, background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <strong>Fiscalité (&gt; 5 ans) :</strong> {s.meta.taxRules.over5Years.label} (PS: {(psRate * 100).toFixed(1)}%)
            </div>
          </div>
        ))}
      </div>

      {/* 💸 Simulateur de Retrait & Fiscalité */}
      <div className="card" style={{ borderLeft: '4px solid var(--accent-violet)' }}>
        <div className="card-header">
          <span className="card-title">💸 Simulateur de Retrait & Calculateur d&apos;Impôt Réel</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Simulez n&apos;importe quel montant de retrait (ex: 500 000 €) pour calculer l&apos;impôt sur le revenu (IR) et les cotisations sociales (PS) exactes.
        </p>

        <div className="form-row" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Enveloppe à simuler</label>
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

          <div className="form-group">
            <label className="form-label">Ancienneté du plan</label>
            <select
              className="input"
              value={simSeniority}
              onChange={(e) => setSimSeniority(e.target.value as any)}
            >
              <option value="over5">Plus de 5 ans (Exonération IR sur PEA / PS seulement)</option>
              <option value="under5">Moins de 5 ans (Flat Tax / PFU : 12.8% IR + PS)</option>
            </select>
          </div>

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

        {/* Advanced Tax Parameters */}
        <div className="form-row" style={{ marginBottom: 20, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 10 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 12 }}>Taux des Prélèvements Sociaux (PS)</label>
            <select
              className="input mono"
              value={psRate}
              onChange={(e) => setPsRate(parseFloat(e.target.value))}
            >
              <option value="0.172">17.2% (Taux légal actuel en vigueur)</option>
              <option value="0.186">18.6% (Taux ajusté / Projet de Loi de Finances)</option>
              <option value="0.20">20.0% (Scénario de hausse de cotisations)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: 12 }}>Part de Plus-Value dans le retrait (%)</label>
            <input
              type="number"
              className="input mono"
              value={Math.round(actualGainRatio * 100)}
              onChange={(e) => setCustomGainPercent(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              step="5"
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              {simTotalVal > 0 ? `Calculé d'après votre portefeuille actuel (${(actualGainRatio * 100).toFixed(1)}% de gains)` : 'Définissez la proportion de gains/intérêts'}
            </span>
          </div>
        </div>

        {/* Breakdown Result */}
        {grossWithdrawal > 0 && (
          <div style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 12, border: '1px solid var(--border-medium)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Retrait Brut Simulé</span>
                <strong className="mono" style={{ fontSize: 20 }}>{grossWithdrawal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Part Capital (Non Imposable)</span>
                <strong className="mono" style={{ fontSize: 18, color: 'var(--accent-emerald)' }}>{withdrawnCapital.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Part Plus-Value Imposable ({(actualGainRatio * 100).toFixed(0)}%)</span>
                <strong className="mono" style={{ fontSize: 18, color: 'var(--accent-amber)' }}>{withdrawnGain.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Total Impôts & Cotisations</span>
                <strong className="mono" style={{ fontSize: 18, color: 'var(--accent-rose)' }}>-{totalTax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Détail des prélèvements : </span>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 4 }}>
                  • Impôt sur le Revenu IR ({(irRate * 100).toFixed(1)}%) : <strong className="mono">{irTax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong><br />
                  • Prélèvements Sociaux PS ({(psRate * 100).toFixed(1)}%) : <strong className="mono">{psTax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right', background: 'var(--bg-tertiary)', padding: '12px 20px', borderRadius: 10, border: '1px solid var(--border-accent)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Capital Net Reçu en Compte Bancaire</span>
                <strong className="mono" style={{ fontSize: 24, color: 'var(--accent-emerald)' }}>
                  {netReceived.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

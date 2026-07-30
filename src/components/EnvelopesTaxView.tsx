'use client';

import { useState } from 'react';
import type { Position, Envelope } from '@/types/portfolio';

interface EnvelopesTaxViewProps {
  positions: Position[];
  fxRates: Record<string, number>;
}

export const ENVELOPE_METADATA: Record<string, {
  label: string;
  depositLimit?: number;
  description: string;
  taxRules: {
    under5Years: { irRate: number; psRate: number; label: string };
    over5Years: { irRate: number; psRate: number; label: string };
  };
}> = {
  PEA: {
    label: 'PEA (Plan d\'Épargne en Actions)',
    depositLimit: 150000,
    description: 'Exonération d\'impôt sur le revenu après 5 ans d\'ancienneté',
    taxRules: {
      under5Years: { irRate: 0.128, psRate: 0.172, label: 'Clôture du PEA ou PFU 30% (12.8% IR + 17.2% PS)' },
      over5Years: { irRate: 0.0, psRate: 0.172, label: 'Exonération d\'IR (0%) + Prélèvements Sociaux (17.2%)' },
    },
  },
  'PEA-PME': {
    label: 'PEA-PME',
    depositLimit: 225000,
    description: 'Dédié aux PME et ETI européennes (plafond cumulé PEA+PME = 225k€)',
    taxRules: {
      under5Years: { irRate: 0.128, psRate: 0.172, label: 'Clôture ou PFU 30% (12.8% IR + 17.2% PS)' },
      over5Years: { irRate: 0.0, psRate: 0.172, label: 'Exonération d\'IR (0%) + Prélèvements Sociaux (17.2%)' },
    },
  },
  CTO: {
    label: 'Compte-Titres Ordinaire (CTO)',
    depositLimit: undefined,
    description: 'Aucun plafond de versement, accès universel aux marchés mondiaux',
    taxRules: {
      under5Years: { irRate: 0.128, psRate: 0.172, label: 'PFU / Flat Tax 30% (12.8% IR + 17.2% PS)' },
      over5Years: { irRate: 0.128, psRate: 0.172, label: 'PFU / Flat Tax 30% ou option barème progressif IR' },
    },
  },
  PEE: {
    label: 'Plan d\'Épargne Entreprise (PEE)',
    depositLimit: undefined,
    description: 'Épargne salariale (abondement entreprise)',
    taxRules: {
      under5Years: { irRate: 0.128, psRate: 0.172, label: 'Bloqué 5 ans (sauf déblocage anticipé)' },
      over5Years: { irRate: 0.0, psRate: 0.172, label: 'Exonération d\'IR (0%) + Prélèvements Sociaux (17.2%)' },
    },
  },
  SPECULATIVE: {
    label: 'Poche Spéculative',
    depositLimit: 2000,
    description: 'Poche dédiée aux opérations à fort risque / levier',
    taxRules: {
      under5Years: { irRate: 0.128, psRate: 0.172, label: 'Flat Tax 30%' },
      over5Years: { irRate: 0.128, psRate: 0.172, label: 'Flat Tax 30%' },
    },
  },
  OPPORTUNISTIC: {
    label: 'Réserve Opportuniste',
    depositLimit: undefined,
    description: 'Liquidités et opportunités de marché',
    taxRules: {
      under5Years: { irRate: 0.128, psRate: 0.172, label: 'Flat Tax 30%' },
      over5Years: { irRate: 0.128, psRate: 0.172, label: 'Flat Tax 30%' },
    },
  },
};

export default function EnvelopesTaxView({ positions, fxRates }: EnvelopesTaxViewProps) {
  // Withdrawal simulator state
  const [simEnvelope, setSimEnvelope] = useState<string>('PEA');
  const [simSeniority, setSimSeniority] = useState<'over5' | 'under5'>('over5');
  const [simWithdrawalAmount, setSimWithdrawalAmount] = useState<number>(5000);

  // Group positions by envelope
  const envelopeGroups = positions.reduce((acc, pos) => {
    const env = pos.envelope;
    if (!acc[env]) acc[env] = [];
    acc[env].push(pos);
    return acc;
  }, {} as Record<string, Position[]>);

  const envelopeKeys = Array.from(new Set([...Object.keys(ENVELOPE_METADATA), ...Object.keys(envelopeGroups)]));

  // Compute metrics per envelope
  const summaries = envelopeKeys.map((envKey) => {
    const envPositions = envelopeGroups[envKey] || [];
    const meta = ENVELOPE_METADATA[envKey] || {
      label: envKey,
      depositLimit: undefined,
      description: '',
      taxRules: {
        under5Years: { irRate: 0.128, psRate: 0.172, label: 'Flat Tax 30%' },
        over5Years: { irRate: 0.128, psRate: 0.172, label: 'Flat Tax 30%' },
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
    const depositLimit = meta.depositLimit;
    const fillRate = depositLimit ? (totalCost / depositLimit) * 100 : undefined;

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

  // Calculate withdrawal simulation
  const targetSimSummary = summaries.find((s) => s.envKey === simEnvelope) || summaries[0];
  const simTotalVal = targetSimSummary?.totalValue || 0;
  const simTotalCost = targetSimSummary?.totalCost || 0;
  const simTotalGain = targetSimSummary?.gainLoss || 0;

  const actualWithdrawal = Math.min(simWithdrawalAmount, simTotalVal);
  const gainRatio = simTotalVal > 0 ? Math.max(0, simTotalGain / simTotalVal) : 0;
  const capitalRatio = 1 - gainRatio;

  const withdrawnCapital = actualWithdrawal * capitalRatio;
  const withdrawnGain = actualWithdrawal * gainRatio;

  const rules = targetSimSummary?.meta.taxRules[simSeniority === 'over5' ? 'over5Years' : 'under5Years'];
  const irTax = withdrawnGain * (rules?.irRate || 0);
  const psTax = withdrawnGain * (rules?.psRate || 0);
  const totalTax = irTax + psTax;
  const netReceived = actualWithdrawal - totalTax;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Plus-Value</span>
                <strong className={`mono ${s.gainLoss >= 0 ? 'stat-gain' : 'stat-loss'}`} style={{ fontSize: 14 }}>
                  {s.totalCost > 0 ? `${s.gainLoss >= 0 ? '+' : ''}${s.gainLoss.toFixed(0)}€` : '—'}
                </strong>
              </div>
            </div>

            {/* Plafond de versement / Fill Rate */}
            {s.depositLimit ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Taux de remplissage du plafond</span>
                  <span style={{ fontWeight: 600, color: (s.fillRate || 0) > 90 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                    {s.totalCost.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / {s.depositLimit.toLocaleString('fr-FR')} € ({(s.fillRate || 0).toFixed(1)}%)
                  </span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, s.fillRate || 0)}%`,
                      background: (s.fillRate || 0) > 90 ? 'var(--accent-rose)' : 'linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald))',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                ℹ️ Sans plafond légal de versement
              </div>
            )}

            {/* Tax Info summary */}
            <div style={{ fontSize: 12, padding: 8, background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <strong>Fiscalité (&gt; 5 ans) :</strong> {s.meta.taxRules.over5Years.label}
            </div>
          </div>
        ))}
      </div>

      {/* 💸 Simulateur de Retrait & Fiscalité */}
      <div className="card" style={{ borderLeft: '4px solid var(--accent-violet)' }}>
        <div className="card-header">
          <span className="card-title">💸 Simulateur de Retrait & Calculateur d&apos;Impôt</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Simulez un retrait partiel ou total pour calculer le montant net d&apos;impôts viré sur votre compte bancaire selon l&apos;ancienneté de l&apos;enveloppe.
        </p>

        <div className="form-row" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Enveloppe à retirer</label>
            <select
              className="input"
              value={simEnvelope}
              onChange={(e) => setSimEnvelope(e.target.value)}
            >
              {summaries.map((s) => (
                <option key={s.envKey} value={s.envKey}>
                  {s.envKey} — {s.totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
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
              <option value="over5">Plus de 5 ans (Exonération IR sur PEA)</option>
              <option value="under5">Moins de 5 ans (Flat Tax 30%)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Montant du retrait (€)</label>
            <input
              type="number"
              className="input mono"
              value={simWithdrawalAmount}
              onChange={(e) => setSimWithdrawalAmount(parseFloat(e.target.value) || 0)}
              min="0"
              max={simTotalVal}
            />
          </div>
        </div>

        {/* Breakdown Result */}
        {actualWithdrawal > 0 && (
          <div style={{ background: 'var(--bg-tertiary)', padding: 16, borderRadius: 12, border: '1px solid var(--border-medium)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Montant Retiré Brut</span>
                <strong className="mono" style={{ fontSize: 18 }}>{actualWithdrawal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Part Capital (Non Imposable)</span>
                <strong className="mono" style={{ fontSize: 16, color: 'var(--accent-emerald)' }}>{withdrawnCapital.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Part Plus-Value (Imposable)</span>
                <strong className="mono" style={{ fontSize: 16, color: 'var(--accent-amber)' }}>{withdrawnGain.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Total Impôts & Cotisations</span>
                <strong className="mono" style={{ fontSize: 16, color: 'var(--accent-rose)' }}>-{totalTax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Règle appliquée : </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-cyan)' }}>
                  {rules?.label}
                </span>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  IR ({(rules?.irRate || 0) * 100}%) = {irTax.toFixed(2)}€ | Prélèvements Sociaux ({(rules?.psRate || 0) * 100}%) = {psTax.toFixed(2)}€
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Netteté en compte bancaire</span>
                <strong className="mono" style={{ fontSize: 22, color: 'var(--accent-emerald)' }}>
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

'use client';

import { useState } from 'react';
import type { Position } from '@/types/portfolio';

interface EnvelopesTaxViewProps {
  positions: Position[];
  fxRates: Record<string, number>;
  adjustInflation?: boolean;
  cumulativeInflationFactor?: number;
  inflationRate?: number;
  yearsElapsed?: number;
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
      over5Years: { irRate: 0.128, label: 'Flat Tax / PFU (12.8% IR + Prélèvements Sociaux) ou Option Barème IR' },
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
  LIVRET: {
    label: 'Livrets & Épargne Sécurisée (Livret A, LDDS, LEP, Cash)',
    depositLimit: 22950,
    description: 'Épargne de précaution 100% liquide & sécurisée. Intérêts totalement exonérés d\'impôts et prélèvements sociaux.',
    taxRules: {
      under5Years: { irRate: 0.0, label: 'Exonération totale d\'IR (0%) et de Prélèvements Sociaux (0%)' },
      over5Years: { irRate: 0.0, label: 'Exonération totale d\'IR (0%) et de Prélèvements Sociaux (0%)' },
    },
  },
  ASSURANCE_VIE: {
    label: 'Assurance-Vie',
    depositLimit: undefined,
    description: 'Enveloppe d\'épargne et de transmission avec niche fiscale après 8 ans (abattement annuel de 4 600 € / 9 200 €).',
    taxRules: {
      under5Years: { irRate: 0.128, label: 'Flat Tax / PFU 30% (12.8% IR + 17.2% PS)' },
      over5Years: { irRate: 0.075, label: 'Abattement annuel 4 600 € puis IR réduit 7.5% + PS 17.2%' },
    },
  },
  PER: {
    label: 'Plan d\'Épargne Retraite (PER)',
    depositLimit: undefined,
    description: 'Déduction fiscale des versements à l\'entrée (économie d\'IR à la TMI). Imposé en capital à la sortie.',
    taxRules: {
      under5Years: { irRate: 0.30, label: 'Bloqué jusqu\'à la retraite (Capital à la TMI + Plus-value Flat Tax)' },
      over5Years: { irRate: 0.30, label: 'Capital à la TMI + Plus-value au PFU 30%' },
    },
  },
  IMMOBILIER: {
    label: 'Immobilier & SCPI (Pierre Papier / Locatif)',
    depositLimit: undefined,
    description: 'Patrimoine immobilier locatif, SCPI de rendement ou pierre papier.',
    taxRules: {
      under5Years: { irRate: 0.30, label: 'Revenus fonciers imposés selon TMI + 17.2% Prélèvements Sociaux' },
      over5Years: { irRate: 0.30, label: 'Revenus fonciers (TMI + PS) + Abattements pour durée de détention' },
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

export default function EnvelopesTaxView({
  positions,
  fxRates,
  adjustInflation = false,
  cumulativeInflationFactor = 1.0,
  inflationRate = 0.021,
  yearsElapsed = 0,
}: EnvelopesTaxViewProps) {
  const factor = adjustInflation ? cumulativeInflationFactor : 1.0;

  // Withdrawal simulator state
  const [simEnvelope, setSimEnvelope] = useState<string>('PEA');
  const [simSeniority, setSimSeniority] = useState<'over5' | 'under5'>('over5');
  const [simWithdrawalAmount, setSimWithdrawalAmount] = useState<number>(500000);
  
  // CTO specific state: Choice between Flat Tax PFU vs Progressive Income Tax TMI
  const [ctoTaxRegime, setCtoTaxRegime] = useState<'pfu' | 'bareme'>('pfu');
  const [ctoTmiRate, setCtoTmiRate] = useState<number>(0.30); // 30% TMI default
  
  // Tax rate settings (18.6% vs 17.2% vs custom)
  const [psRate, setPsRate] = useState<number>(0.186); // 18.6% default

  // UX Optimization: Option to hide empty 0€ envelopes to avoid screen clutter
  const [hideEmptyEnvelopes, setHideEmptyEnvelopes] = useState<boolean>(true);

  // Group positions by envelope
  const envelopeGroups = positions.reduce((acc, pos) => {
    const env = pos.envelope;
    if (!acc[env]) acc[env] = [];
    acc[env].push(pos);
    return acc;
  }, {} as Record<string, Position[]>);

  // Calculate PEA cost vs PEA-PME cost
  const peaPositions = envelopeGroups['PEA'] || [];
  const peaCost = peaPositions.reduce((sum, p) => sum + (p.quantity * p.avgPrice * (fxRates[p.currency] || 1)), 0) / factor;

  const peaPmePositions = envelopeGroups['PEA-PME'] || [];
  const peaPmeCost = peaPmePositions.reduce((sum, p) => sum + (p.quantity * p.avgPrice * (fxRates[p.currency] || 1)), 0) / factor;

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

  // Global portfolio metrics fallback if selected envelope is empty
  const globalTotalVal = summaries.reduce((sum, s) => sum + s.totalValue, 0);
  const globalTotalGain = summaries.reduce((sum, s) => sum + Math.max(0, s.gainLoss), 0);

  // Auto gain ratio calculated strictly from portfolio evolution
  const actualGainRatio = simTotalVal > 0
    ? Math.max(0, simTotalGain / simTotalVal)
    : (globalTotalVal > 0 ? Math.max(0, globalTotalGain / globalTotalVal) : 0.30);

  const grossWithdrawal = Math.max(0, simWithdrawalAmount);
  const withdrawnGain = grossWithdrawal * actualGainRatio;
  const withdrawnCapital = grossWithdrawal - withdrawnGain;

  // Compute IR rate depending on envelope & regime
  let irRate = 0;
  if (simEnvelope === 'CTO') {
    irRate = ctoTaxRegime === 'pfu' ? 0.128 : ctoTmiRate;
  } else if (simEnvelope === 'PEA' || simEnvelope === 'PEA-PME') {
    irRate = simSeniority === 'over5' ? 0.0 : 0.128;
  } else {
    irRate = 0.128;
  }

  const irTax = withdrawnGain * irRate;
  const psTax = withdrawnGain * psRate;
  const totalTax = irTax + psTax;
  const netReceived = grossWithdrawal - totalTax;

  // CTO comparison metrics (Flat Tax PFU vs Barème Progressif TMI)
  const ctoPfuTax = withdrawnGain * (0.128 + psRate);
  const ctoBaremeTax = withdrawnGain * (ctoTmiRate + psRate);
  const ctoSavingsWithPfu = ctoBaremeTax - ctoPfuTax;

  const activeSummaries = summaries.filter((s) => s.totalValue > 0 || s.totalCost > 0);
  const displayedSummaries = hideEmptyEnvelopes && activeSummaries.length > 0 ? activeSummaries : summaries;
  const emptyCount = summaries.length - activeSummaries.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Executive Toolbar & Filter Switch */}
      <div className="card" style={{ padding: '12px 18px', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderLeft: '4px solid var(--accent-violet)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🏛️</span>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Enveloppes Fiscales & Optimisation Patrimoniale
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {activeSummaries.length} enveloppes financées sur {summaries.length} au total
            </span>
          </div>
        </div>

        {emptyCount > 0 && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setHideEmptyEnvelopes(!hideEmptyEnvelopes)}
            style={{ fontSize: 12, padding: '6px 12px', fontWeight: 600 }}
          >
            {hideEmptyEnvelopes ? `👁️ Afficher toutes les enveloppes (+${emptyCount} inactives)` : `🙈 Masquer les enveloppes inactives (0 €)`}
          </button>
        )}
      </div>

      {/* 🔋 Dynamic Combined Battery Gauge (PEA + PEA-PME French Tax Ceiling) */}
      <div className="card" style={{ borderLeft: '4px solid var(--accent-emerald)', background: 'var(--bg-secondary)', padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🔋</span>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Jauge d&apos;Éligibilité & Saturation Fiscale (Cumul PEA + PEA-PME)
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Code Monétaire et Financier (Loi PACTE) — Plafond Global Cumulé : <strong>225 000 €</strong>
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>Capacité Fiscale Restante Exonérée d&apos;IR</span>
            <strong className="mono" style={{ fontSize: 15, color: 'var(--accent-emerald)' }}>
              {Math.max(0, 225000 - (peaCost + peaPmeCost)).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € disponibles
            </strong>
          </div>
        </div>

        {/* Multi-Segment Battery Shell */}
        <div style={{
          height: 28,
          background: 'var(--bg-tertiary)',
          borderRadius: 14,
          border: '2px solid var(--border-accent)',
          padding: 3,
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
        }}>
          {/* Segment 1: PEA */}
          <div style={{
            width: `${Math.min(100, (peaCost / 225000) * 100)}%`,
            background: 'linear-gradient(90deg, #06b6d4, #0b7285)',
            borderRadius: '10px 0 0 10px',
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}>
            {peaCost > 15000 ? `PEA: ${peaCost.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €` : ''}
          </div>

          {/* Segment 2: PEA-PME */}
          <div style={{
            width: `${Math.min(100, (peaPmeCost / 225000) * 100)}%`,
            background: 'linear-gradient(90deg, #8b5cf6, #6d28d9)',
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}>
            {peaPmeCost > 15000 ? `PEA-PME: ${peaPmeCost.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €` : ''}
          </div>

          {/* Dynamic Marker 150k limit */}
          <div style={{
            position: 'absolute',
            left: `${(150000 / 225000) * 100}%`,
            top: 0,
            bottom: 0,
            width: 2,
            background: 'rgba(255,255,255,0.7)',
            zIndex: 10,
          }} title="Plafond Léger PEA Classique (150 000 €)" />
        </div>

        {/* Legend & Breakdown */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 12, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#06b6d4' }} />
              <span>PEA Classique : <strong>{peaCost.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / 150 000 €</strong> ({(peaCost / 1500).toFixed(1)}%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#8b5cf6' }} />
              <span>PEA-PME : <strong>{peaPmeCost.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / {maxPeaPmeAllowed.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € max</strong> ({(maxPeaPmeAllowed > 0 ? (peaPmeCost / maxPeaPmeAllowed) * 100 : 100).toFixed(1)}%)</span>
            </div>
          </div>

          <div style={{ fontWeight: 700, color: (peaCost + peaPmeCost) > 225000 ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
            Remplissage Global : {((peaCost + peaPmeCost) / 2250).toFixed(1)}% du Plafond Légal (225 000 €)
          </div>
        </div>
      </div>

      {/* 🎈 Active Inflation Banner */}
      {adjustInflation && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-amber)', background: 'rgba(245, 158, 11, 0.1)', padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-primary)' }}>
            <span style={{ fontSize: 22 }}>🎈</span>
            <div>
              <strong>Mode Inflation Actif (Pouvoir d&apos;Achat Réel) :</strong> Les montants des enveloppes, versements et simulations de retrait sont déflatés en Euros constants (IPC Eurostat/INSEE ~{(inflationRate * 100).toFixed(1)}%/an sur {yearsElapsed.toFixed(1)} ans, déflateur cumulé : {((factor - 1) * 100).toFixed(1)}%).
            </div>
          </div>
        </div>
      )}

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {displayedSummaries.map((s) => (
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
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'block' }}>Versé (PRU)</span>
                <strong className="mono" style={{ fontSize: 14 }}>
                  {s.totalCost > 0 ? s.totalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '—'}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'block' }}>Valeur Actuelle</span>
                <strong className="mono" style={{ fontSize: 14, color: 'var(--accent-cyan)' }}>
                  {s.totalValue > 0 ? s.totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '—'}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'block' }}>Plus-Value Brute</span>
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
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'block', marginTop: 4 }}>
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
              <strong>Fiscalité :</strong> {s.meta.taxRules.over5Years.label} (PS: {(psRate * 100).toFixed(1)}%)
            </div>
          </div>
        ))}
      </div>

      {/* 💸 Simulateur de Retrait & Fiscalité Complexe (PEA + CTO) */}
      <div className="card" style={{ borderLeft: '4px solid var(--accent-violet)' }}>
        <div className="card-header">
          <span className="card-title">💸 Simulateur de Retrait & Calculateur d&apos;Impôt Réel (PEA & CTO)</span>
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
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'block' }}>Total Impôts & Cotisations</span>
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
    </div>
  );
}

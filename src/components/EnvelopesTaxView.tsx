'use client';

import React, { useState } from 'react';
import type { Position } from '@/types/portfolio';
import { useBoursoLive } from '@/hooks/useBoursoLive';
import { ENVELOPE_METADATA } from '@/data/envelopeMetadata';
import {
  computeEnvelopeSummaries,
  calculateWithdrawalSimulation,
} from '@/engines/taxEnvelopeEngine';
import { EnvelopeCombinedCeilingGauge } from './envelopes/EnvelopeCombinedCeilingGauge';
import { EnvelopeCard } from './envelopes/EnvelopeCard';
import { EnvelopeFiscalSimulator } from './envelopes/EnvelopeFiscalSimulator';

export { ENVELOPE_METADATA } from '@/data/envelopeMetadata';

interface EnvelopesTaxViewProps {
  positions: Position[];
  fxRates: Record<string, number>;
  adjustInflation?: boolean;
  cumulativeInflationFactor?: number;
  inflationRate?: number;
  yearsElapsed?: number;
}

export default function EnvelopesTaxView({
  positions,
  fxRates,
  adjustInflation = false,
  cumulativeInflationFactor = 1.0,
  inflationRate = 0.021,
  yearsElapsed = 0,
}: EnvelopesTaxViewProps) {
  const factor = adjustInflation ? cumulativeInflationFactor : 1.0;

  // Simulator state
  const [simEnvelope, setSimEnvelope] = useState<string>('PEA');
  const [simSeniority, setSimSeniority] = useState<'over5' | 'under5'>('over5');
  const [simWithdrawalAmount, setSimWithdrawalAmount] = useState<number>(500000);
  const [ctoTaxRegime, setCtoTaxRegime] = useState<'pfu' | 'bareme'>('pfu');
  const [ctoTmiRate, setCtoTmiRate] = useState<number>(0.30);
  const [psRate, setPsRate] = useState<number>(0.186);
  const [hideEmptyEnvelopes, setHideEmptyEnvelopes] = useState<boolean>(true);

  const boursoLive = useBoursoLive();

  const {
    summaries,
    peaCost,
    peaPmeCost,
    maxPeaPmeAllowed,
    isPeaExceeded,
    isPeaPmeExceeded,
    isCombinedExceeded,
  } = computeEnvelopeSummaries(positions, fxRates, factor, boursoLive);

  const simResult = calculateWithdrawalSimulation({
    summaries,
    simEnvelope,
    simSeniority,
    simWithdrawalAmount,
    ctoTaxRegime,
    ctoTmiRate,
    psRate,
  });

  const targetSimSummary = summaries.find((s) => s.envKey === simEnvelope) || summaries[0];
  const simTotalVal = targetSimSummary?.totalValue || 0;
  const simTotalGain = targetSimSummary?.gainLoss || 0;

  const activeSummaries = summaries.filter((s) => s.totalValue > 0 || s.totalCost > 0);
  const displayedSummaries = hideEmptyEnvelopes && activeSummaries.length > 0 ? activeSummaries : summaries;
  const emptyCount = summaries.length - activeSummaries.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Executive Toolbar & Filter Switch */}
      <div
        className="card"
        style={{
          padding: '12px 18px',
          background: 'var(--bg-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          borderLeft: '4px solid var(--accent-violet)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🏛️</span>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Enveloppes Fiscales &amp; Optimisation Patrimoniale
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
            {hideEmptyEnvelopes
              ? `👁️ Afficher toutes les enveloppes (+${emptyCount} inactives)`
              : `🙈 Masquer les enveloppes inactives (0 €)`}
          </button>
        )}
      </div>

      {/* 🔋 Combined PEA + PEA-PME Battery Gauge */}
      <EnvelopeCombinedCeilingGauge
        peaCost={peaCost}
        peaPmeCost={peaPmeCost}
        maxPeaPmeAllowed={maxPeaPmeAllowed}
      />

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
          <EnvelopeCard
            key={s.envKey}
            summary={s}
            peaCost={peaCost}
            maxPeaPmeAllowed={maxPeaPmeAllowed}
            psRate={psRate}
          />
        ))}
      </div>

      {/* 💸 Simulateur de Retrait & Fiscalité Complexe */}
      <EnvelopeFiscalSimulator
        summaries={summaries}
        simEnvelope={simEnvelope}
        setSimEnvelope={setSimEnvelope}
        simSeniority={simSeniority}
        setSimSeniority={setSimSeniority}
        simWithdrawalAmount={simWithdrawalAmount}
        setSimWithdrawalAmount={setSimWithdrawalAmount}
        ctoTaxRegime={ctoTaxRegime}
        setCtoTaxRegime={setCtoTaxRegime}
        ctoTmiRate={ctoTmiRate}
        setCtoTmiRate={setCtoTmiRate}
        psRate={psRate}
        setPsRate={setPsRate}
        simResult={simResult}
        simTotalVal={simTotalVal}
        simTotalGain={simTotalGain}
      />
    </div>
  );
}

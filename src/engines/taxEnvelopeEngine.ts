import type { Position } from '@/types/portfolio';
import { ENVELOPE_METADATA, type EnvelopeMetadataItem } from '@/data/envelopeMetadata';

export interface EnvelopeSummaryItem {
  envKey: string;
  meta: EnvelopeMetadataItem;
  positions: Position[];
  totalValue: number;
  totalCost: number;
  gainLoss: number;
  gainLossPercent: number;
  fillRate?: number;
  depositLimit?: number;
}

export interface WithdrawalSimulationResult {
  actualGainRatio: number;
  grossWithdrawal: number;
  withdrawnGain: number;
  withdrawnCapital: number;
  irRate: number;
  irTax: number;
  psTax: number;
  totalTax: number;
  netReceived: number;
  ctoPfuTax: number;
  ctoBaremeTax: number;
  ctoSavingsWithPfu: number;
}

export function computeEnvelopeSummaries(
  positions: Position[],
  fxRates: Record<string, number>,
  factor: number = 1.0,
  boursoLive: { livretAEUR: number; livretAYearlyInterest: number; peaPmeEUR: number } = { livretAEUR: 0, livretAYearlyInterest: 0, peaPmeEUR: 0 }
): {
  summaries: EnvelopeSummaryItem[];
  peaCost: number;
  peaPmeCost: number;
  maxPeaPmeAllowed: number;
  isPeaExceeded: boolean;
  isPeaPmeExceeded: boolean;
  isCombinedExceeded: boolean;
} {
  const envelopeGroups = positions.reduce((acc, pos) => {
    const env = pos.envelope;
    if (!acc[env]) acc[env] = [];
    acc[env].push(pos);
    return acc;
  }, {} as Record<string, Position[]>);

  const peaPositions = envelopeGroups['PEA'] || [];
  const peaCost = peaPositions.reduce((sum, p) => sum + (p.quantity * p.avgPrice * (fxRates[p.currency] || 1)), 0) / factor;

  const peaPmePositions = envelopeGroups['PEA-PME'] || [];
  const rawPeaPmeCost = peaPmePositions.reduce((sum, p) => sum + (p.quantity * p.avgPrice * (fxRates[p.currency] || 1)), 0) / factor;
  const peaPmeCost = rawPeaPmeCost > 0 ? rawPeaPmeCost : (boursoLive.peaPmeEUR / factor);

  const maxPeaPmeAllowed = Math.max(0, 225000 - peaCost);
  const isPeaExceeded = peaCost > 150000;
  const isPeaPmeExceeded = peaPmeCost > maxPeaPmeAllowed;
  const isCombinedExceeded = (peaCost + peaPmeCost) > 225000;

  const envelopeKeys = Array.from(new Set([...Object.keys(ENVELOPE_METADATA), ...Object.keys(envelopeGroups)]));

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

    if (envKey === 'LIVRET' && envPositions.length === 0 && boursoLive.livretAEUR > 0) {
      totalValue = (boursoLive.livretAEUR + boursoLive.livretAYearlyInterest) / factor;
      totalCost = boursoLive.livretAEUR / factor;
    } else if (envKey === 'PEA-PME' && envPositions.length === 0 && boursoLive.peaPmeEUR > 0) {
      totalValue = boursoLive.peaPmeEUR / factor;
      totalCost = boursoLive.peaPmeEUR / factor;
    }

    const gainLoss = totalValue - totalCost;
    const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

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

  return {
    summaries,
    peaCost,
    peaPmeCost,
    maxPeaPmeAllowed,
    isPeaExceeded,
    isPeaPmeExceeded,
    isCombinedExceeded,
  };
}

export function calculateWithdrawalSimulation(params: {
  summaries: EnvelopeSummaryItem[];
  simEnvelope: string;
  simSeniority: 'over5' | 'under5';
  simWithdrawalAmount: number;
  ctoTaxRegime: 'pfu' | 'bareme';
  ctoTmiRate: number;
  psRate: number;
}): WithdrawalSimulationResult {
  const {
    summaries,
    simEnvelope,
    simSeniority,
    simWithdrawalAmount,
    ctoTaxRegime,
    ctoTmiRate,
    psRate,
  } = params;

  const targetSimSummary = summaries.find((s) => s.envKey === simEnvelope) || summaries[0];
  const simTotalVal = targetSimSummary?.totalValue || 0;
  const simTotalGain = targetSimSummary?.gainLoss || 0;

  const globalTotalVal = summaries.reduce((sum, s) => sum + s.totalValue, 0);
  const globalTotalGain = summaries.reduce((sum, s) => sum + Math.max(0, s.gainLoss), 0);

  const actualGainRatio =
    simTotalVal > 0
      ? Math.max(0, simTotalGain / simTotalVal)
      : globalTotalVal > 0
      ? Math.max(0, globalTotalGain / globalTotalVal)
      : 0.30;

  const grossWithdrawal = Math.max(0, simWithdrawalAmount);
  const withdrawnGain = grossWithdrawal * actualGainRatio;
  const withdrawnCapital = grossWithdrawal - withdrawnGain;

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

  const ctoPfuTax = withdrawnGain * (0.128 + psRate);
  const ctoBaremeTax = withdrawnGain * (ctoTmiRate + psRate);
  const ctoSavingsWithPfu = ctoBaremeTax - ctoPfuTax;

  return {
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
  };
}

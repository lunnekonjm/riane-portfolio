'use client';

import { useState } from 'react';
import type { Position } from '@/types/portfolio';

export interface PillarData {
  id: 'core' | 'peapme' | 'satellite' | 'crypto';
  title: string;
  subtitle: string;
  badge: string;
  color: string;
  targetPct: number;
  minTargetPct: number;
  maxTargetPct: number;
  envelopeKey: string;
  positions: Array<{
    position: Position;
    valueEUR: number;
    weightPct: number;
  }>;
  totalValueEUR: number;
  actualPct: number;
  status: 'UNDERWEIGHT' | 'BALANCED' | 'OVERWEIGHT';
  statusText: string;
  recommendationText: string;
}

const MARKET_ENVELOPES = ['PEA', 'PEA-PME', 'CTO', 'SPECULATIVE', 'OPPORTUNISTIC'];
const ALL_RISK_ENVELOPES = ['PEA', 'PEA-PME', 'CTO', 'SPECULATIVE', 'OPPORTUNISTIC', 'CRYPTO'];

export function useCoreSatelliteClassification(
  positions: Position[],
  fxRates: Record<string, number>
) {
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);
  const [scope, setScope] = useState<'BOURSE' | 'GLOBAL'>('BOURSE');

  const activeEnvelopes = scope === 'GLOBAL' ? ALL_RISK_ENVELOPES : MARKET_ENVELOPES;
  const filledMarketPositions = positions.filter((p) => {
    const isMarket = activeEnvelopes.includes((p.envelope || '').toUpperCase()) || (scope === 'GLOBAL' && p.assetType === 'CRYPTO');
    const hasValue = (p.quantity || 0) > 0 && (p.avgPrice || 0) > 0;
    return isMarket && hasValue;
  });

  const totalMarketValueEUR = filledMarketPositions.reduce((sum, p) => {
    const pr = p.currentPrice || p.avgPrice || 0;
    const rate = (fxRates as any)[p.currency] || 1.0;
    return sum + p.quantity * pr * rate;
  }, 0);

  const corePositions: Position[] = [];
  const peaPmePositions: Position[] = [];
  const satellitePositions: Position[] = [];
  const cryptoPositions: Position[] = [];

  filledMarketPositions.forEach((p) => {
    const t = p.ticker.toUpperCase();
    const env = (p.envelope || '').toUpperCase();

    const isCore =
      p.assetType === 'ETF' ||
      t.includes('PUST') ||
      t.includes('CW8') ||
      t.includes('GPEA') ||
      t.includes('WPEA') ||
      t.includes('ACWI');

    const isPeaPme =
      env === 'PEA-PME' ||
      t.includes('0P0001DKPM') ||
      t.includes('ALRIB') ||
      t.includes('MEMS') ||
      t.includes('XFAB');

    const isCrypto = env === 'CRYPTO' || p.assetType === 'CRYPTO';

    if (isCrypto) {
      cryptoPositions.push(p);
    } else if (isCore) {
      corePositions.push(p);
    } else if (isPeaPme) {
      peaPmePositions.push(p);
    } else {
      satellitePositions.push(p);
    }
  });

  const formatPillar = (
    id: 'core' | 'peapme' | 'satellite' | 'crypto',
    title: string,
    subtitle: string,
    badge: string,
    color: string,
    targetPct: number,
    minTargetPct: number,
    maxTargetPct: number,
    envelopeKey: string,
    pillarPositions: Position[]
  ): PillarData => {
    const mapped = pillarPositions.map((p) => {
      const pr = p.currentPrice || p.avgPrice || 0;
      const rate = (fxRates as any)[p.currency] || 1.0;
      const val = p.quantity * pr * rate;
      const weight = totalMarketValueEUR > 0 ? (val / totalMarketValueEUR) * 100 : 0;
      return { position: p, valueEUR: val, weightPct: weight };
    });

    const totalVal = mapped.reduce((sum, item) => sum + item.valueEUR, 0);
    const actualPct = totalMarketValueEUR > 0 ? (totalVal / totalMarketValueEUR) * 100 : 0;

    let status: 'UNDERWEIGHT' | 'BALANCED' | 'OVERWEIGHT' = 'BALANCED';
    let statusText = '🟢 Allocation Équilibrée';
    let recommendationText = 'Poids conforme à votre cible stratégique.';

    if (actualPct < minTargetPct) {
      status = 'UNDERWEIGHT';
      statusText = '🔵 Sous-pondéré (Priorité DCA)';
      recommendationText = `Orientez vos prochains versements DCA vers ce pilier pour atteindre la cible de ${targetPct}%.`;
    } else if (actualPct > maxTargetPct) {
      status = 'OVERWEIGHT';
      statusText = '🟠 Sur-pondéré (Lissage passif)';
      recommendationText = `Pilier bien capitalisé. Laissez le DCA mensuel renforcer les autres piliers.`;
    }

    return {
      id,
      title,
      subtitle,
      badge,
      color,
      targetPct,
      minTargetPct,
      maxTargetPct,
      envelopeKey,
      positions: mapped,
      totalValueEUR: totalVal,
      actualPct,
      status,
      statusText,
      recommendationText,
    };
  };

  const pillars: PillarData[] = [
    formatPillar(
      'core',
      '🏛️ Pilier Cœur (Indiciaire Résilient)',
      'ETF grandes capitalisations mondiales & Nasdaq pour la croissance structurelle.',
      'Cible 40 % - 50 %',
      'var(--accent-cyan)',
      40,
      35,
      50,
      'PEA',
      corePositions
    ),
    formatPillar(
      'peapme',
      '🚀 Pilier Pépites Europe (Alpha & PEA-PME)',
      'Small & Mid Caps européennes à fort potentiel avec exonération fiscale totale.',
      'Cible 30 % - 40 %',
      'var(--accent-emerald)',
      40,
      30,
      45,
      'PEA-PME',
      peaPmePositions
    ),
    formatPillar(
      'satellite',
      '⚡ Pilier Satellites US & Conviction (CTO)',
      'Pure-plays technologiques de rupture (Robotique, IA, Énergie) pour booster la performance.',
      'Cible 15 % - 20 %',
      'var(--accent-purple)',
      20,
      15,
      25,
      'CTO',
      satellitePositions
    ),
  ];

  return {
    pillars,
    scope,
    setScope,
    expandedPillar,
    setExpandedPillar,
  };
}

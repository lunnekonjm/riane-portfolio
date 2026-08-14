/**
 * Skill Financier : Gouvernance des Risques & Conformité CDC V4
 * Vérifie le respect des quotas cibles 40/40/20, les seuils maximums de concentration par ligne et les règles prudentielles.
 */

import type { FinancialSkill, SkillExecutionContext, SkillResult, SkillActionSuggestion } from './types';

export const riskGovernanceSkill: FinancialSkill = {
  id: 'risk-governance',
  name: 'Gouvernance des Risques & Conformité CDC V4',
  description: 'Contrôle la conformité de l\'allocation d\'actifs vis-à-vis des règles strictes du CDC V4 (40% PEA / 40% PEA-PME / 20% CTO, max 10% par ligne).',
  keywords: ['risque', 'gouvernance', 'conformité', 'cdc', '40/40/20', 'concentration', 'seuil', 'diversification', 'alerte'],

  execute: (context: SkillExecutionContext): SkillResult => {
    const { positions } = context;

    let totalValEUR = 0;
    const posValues = positions.map((p) => {
      const val = (p.quantity || 0) * (p.currentPrice || p.avgPrice || 0);
      totalValEUR += val;
      return { position: p, valEUR: val };
    });

    const suggestions: SkillActionSuggestion[] = [];
    const alerts: string[] = [];
    let complianceViolations = 0;

    // 1. Calcul de la répartition par enveloppe
    const envelopeBreakdown: Record<string, number> = { PEA: 0, 'PEA-PME': 0, CTO: 0, AUTRE: 0 };
    posValues.forEach(({ position, valEUR }) => {
      const env = position.envelope.toUpperCase();
      if (envelopeBreakdown[env] !== undefined) {
        envelopeBreakdown[env] += valEUR;
      } else {
        envelopeBreakdown.AUTRE += valEUR;
      }
    });

    const peaWeight = totalValEUR > 0 ? envelopeBreakdown.PEA / totalValEUR : 0;
    const peaPmeWeight = totalValEUR > 0 ? envelopeBreakdown['PEA-PME'] / totalValEUR : 0;
    const ctoWeight = totalValEUR > 0 ? envelopeBreakdown.CTO / totalValEUR : 0;

    // 2. Vérification de la concentration par ligne (Plafond 10% par titre vif)
    posValues.forEach(({ position, valEUR }) => {
      const weight = totalValEUR > 0 ? valEUR / totalValEUR : 0;
      const maxAllowed = position.maxWeight || 0.10;

      if (position.assetType === 'STOCK' && weight > maxAllowed && totalValEUR > 1000) {
        complianceViolations++;
        alerts.push(`Sur-concentration : ${position.name} (${(weight * 100).toFixed(1)}%) dépasse le seuil max autorisé de ${(maxAllowed * 100).toFixed(1)}%.`);
        suggestions.push({
          type: 'RISK_ALERT',
          title: `Réduction de risque sur ${position.ticker}`,
          description: `La position représente ${(weight * 100).toFixed(1)}% du portefeuille total. Geler les nouveaux achats et réallouer les flux vers les lignes sous-pondérées.`,
          ticker: position.ticker,
          envelope: position.envelope,
          amountEUR: Math.round(valEUR - totalValEUR * maxAllowed),
          confidenceScore: 0.90,
          impactSummary: `Rétablit la concentration sous le plafond de sécurité de ${(maxAllowed * 100).toFixed(1)}%.`,
        });
      }
    });

    // 3. Score de gouvernance global (100 - pénalités)
    let score = 100;
    score -= complianceViolations * 15;
    if (Math.abs(peaWeight - 0.40) > 0.15 && totalValEUR > 1000) score -= 10;
    if (Math.abs(peaPmeWeight - 0.40) > 0.15 && totalValEUR > 1000) score -= 10;
    if (ctoWeight > 0.35 && totalValEUR > 1000) score -= 15;
    score = Math.max(0, Math.min(100, score));

    return {
      skillName: 'risk-governance',
      status: alerts.length > 0 ? 'WARNING' : 'SUCCESS',
      summary: `Score de gouvernance CDC V4 : ${score}/100.${alerts.length > 0 ? ` ${alerts.length} alerte(s) de risque détectée(s).` : ' Allocation parfaitement conforme aux règles prudentielles.'}`,
      details: {
        totalPortfolioValueEUR: totalValEUR,
        envelopeWeights: {
          PEA: `${(peaWeight * 100).toFixed(1)}% (Cible 40%)`,
          'PEA-PME': `${(peaPmeWeight * 100).toFixed(1)}% (Cible 40%)`,
          CTO: `${(ctoWeight * 100).toFixed(1)}% (Cible 20%)`,
        },
        alerts,
        complianceViolations,
      },
      suggestions,
      governanceScore: score,
      generatedAt: Date.now(),
    };
  },
};

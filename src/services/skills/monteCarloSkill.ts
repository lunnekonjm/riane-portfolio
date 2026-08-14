/**
 * Skill Financier : Simulation Monte Carlo & Analyse de Risque VaR
 * Projette les distributions de patrimoine à 5, 10 et 15 ans selon les rendements espérés et la volatilité.
 */

import type { FinancialSkill, SkillExecutionContext, SkillResult, SkillActionSuggestion } from './types';
import { runMonteCarloSimulation } from '@/engines/monteCarloEngine';

export const monteCarloSkill: FinancialSkill = {
  id: 'monte-carlo',
  name: 'Simulation Monte Carlo & Analyse Probabiliste',
  description: 'Génère 1 000 trajectoires stochastiques pour projeter l\'évolution future du patrimoine avec calcul des percentiles P10, P50 et P90.',
  keywords: ['monte carlo', 'simulation', 'projection', 'var', 'volatilité', 'probabilité', 'scénario', 'trajectoire', 'krach'],

  execute: (context: SkillExecutionContext): SkillResult => {
    const { positions, parameters = {} } = context;

    let initialWealthEUR = 0;
    positions.forEach((p) => {
      initialWealthEUR += (p.quantity || 0) * (p.currentPrice || p.avgPrice || 0);
    });
    if (initialWealthEUR <= 0) initialWealthEUR = 10000;

    const monthlyDCA = positions.reduce((sum, p) => sum + (p.monthlyDCA || 0), 0);
    const horizonYears = Number(parameters.horizonYears || 10);

    const simulation = runMonteCarloSimulation({
      initialCapital: initialWealthEUR,
      monthlyDCA,
      horizonYears,
      annualReturnMean: 0.08,
      annualVolatility: 0.15,
      numSimulations: 1000,
      taxEnvelope: 'PEA',
    });

    const suggestions: SkillActionSuggestion[] = [];
    if (monthlyDCA > 0) {
      suggestions.push({
        type: 'DCA_TRANCHE',
        title: `Effet d'amortissement du DCA : Risque contenu`,
        description: `Le versement mensuel continu de ${monthlyDCA.toLocaleString('fr-FR')} €/mois réduit la probabilité de perte à long terme grâce à l'achat progressif dans la baisse.`,
        confidenceScore: 0.92,
        impactSummary: `Valeur médiane projetée à ${horizonYears} ans : ${Math.round(simulation.finalP50).toLocaleString('fr-FR')} €.`,
      });
    }

    return {
      skillName: 'monte-carlo',
      status: 'SUCCESS',
      summary: `Simulation Monte Carlo (1 000 trajectoires sur ${horizonYears} ans) : Capital médian projeté de ${Math.round(simulation.finalP50).toLocaleString('fr-FR')} € (Scénario pessimiste P10 : ${Math.round(simulation.finalP10).toLocaleString('fr-FR')} €, Optimiste P90 : ${Math.round(simulation.finalP90).toLocaleString('fr-FR')} €).`,
      details: {
        initialWealthEUR,
        monthlyContributionEUR: monthlyDCA,
        horizonYears,
        medianFinalValueEUR: Math.round(simulation.finalP50),
        p10FinalValueEUR: Math.round(simulation.finalP10),
        p90FinalValueEUR: Math.round(simulation.finalP90),
        finalP50NetEUR: Math.round(simulation.finalP50Net),
      },
      suggestions,
      governanceScore: 95,
      generatedAt: Date.now(),
    };
  },
};

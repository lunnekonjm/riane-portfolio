/**
 * Skill Financier : Optimisation du DCA & Réinjection des Primes
 * Analyse les paliers d'investissement régulier, calcule la cadence optimale et répartit les apports exceptionnels.
 */

import type { FinancialSkill, SkillExecutionContext, SkillResult, SkillActionSuggestion } from './types';

export const dcaOptimizationSkill: FinancialSkill = {
  id: 'dca-optimization',
  name: 'Optimisation DCA & Paliers d\'Investissement',
  description: 'Analyse les plans de versement périodique, les paliers historiques et propose la répartition mathématique optimale des apports ponctuels.',
  keywords: ['dca', 'versement', 'palier', 'prime', 'apport', 'mensuel', 'tranche', 'épargne', 'cadence'],

  execute: (context: SkillExecutionContext): SkillResult => {
    const { positions, parameters = {} } = context;
    const bonusAmount = Number(parameters.bonusAmount || parameters.lumpSumEUR || 0);

    const activeDcaPositions = positions.filter((p) => (p.monthlyDCA || 0) > 0 || (p.dcaHistory && p.dcaHistory.length > 0));
    const totalMonthlyDca = positions.reduce((sum, p) => sum + (p.monthlyDCA || 0), 0);

    const suggestions: SkillActionSuggestion[] = [];

    // 1. Détection des paliers actifs et historiques
    const trancheStats = positions.map((p) => {
      const tranchesCount = p.dcaHistory?.length || 0;
      const latestTranche = tranchesCount > 0 ? p.dcaHistory![tranchesCount - 1] : null;
      return {
        ticker: p.ticker,
        name: p.name,
        envelope: p.envelope,
        monthlyDCA: p.monthlyDCA || 0,
        tranchesCount,
        latestTranche,
      };
    });

    // 2. Si une prime ou un apport ponctuel est renseigné, calculer la répartition optimale
    if (bonusAmount > 0) {
      // Priorité 1 : PEA (PUST.PA - Pilier conviction 40%)
      const peaPos = positions.find((p) => p.ticker.toUpperCase().includes('PUST') || p.envelope === 'PEA');
      // Priorité 2 : PEA-PME (Indépendance AM ou Small caps)
      const peaPmePos = positions.find((p) => p.envelope === 'PEA-PME');
      // Priorité 3 : CTO (Coherent / Symbotic)
      const ctoPos = positions.find((p) => p.envelope === 'CTO');

      if (peaPos) {
        const peaAllocation = Math.round(bonusAmount * 0.50);
        suggestions.push({
          type: 'LUMP_SUM_DEPOSIT',
          title: `Apport exceptionnel PEA : +${peaAllocation.toLocaleString('fr-FR')} €`,
          description: `Allouer 50% de la prime (${peaAllocation} €) sur ${peaPos.name} (${peaPos.ticker}) pour renforcer le moteur indiciel Nasdaq-100 sans friction fiscale.`,
          ticker: peaPos.ticker,
          envelope: peaPos.envelope,
          amountEUR: peaAllocation,
          confidenceScore: 0.95,
          impactSummary: `Accélère l'effet de capitalisation composé sur le coeur de portefeuille PEA.`,
        });
      }

      if (peaPmePos) {
        const peaPmeAllocation = Math.round(bonusAmount * 0.30);
        suggestions.push({
          type: 'LUMP_SUM_DEPOSIT',
          title: `Apport exceptionnel PEA-PME : +${peaPmeAllocation.toLocaleString('fr-FR')} €`,
          description: `Allouer 30% de la prime (${peaPmeAllocation} €) sur ${peaPmePos.name} (${peaPmePos.ticker}) afin d'optimiser l'enveloppe fiscale PEA-PME (plafond 225k€).`,
          ticker: peaPmePos.ticker,
          envelope: peaPmePos.envelope,
          amountEUR: peaPmeAllocation,
          confidenceScore: 0.90,
          impactSummary: `Renforce la poche Value Small Caps européennes.`,
        });
      }

      if (ctoPos) {
        const ctoAllocation = Math.round(bonusAmount * 0.20);
        suggestions.push({
          type: 'LUMP_SUM_DEPOSIT',
          title: `Apport Satellite CTO : +${ctoAllocation.toLocaleString('fr-FR')} €`,
          description: `Allouer 20% de la prime (${ctoAllocation} €) sur ${ctoPos.name} (${ctoPos.ticker}) pour le volet pure-play technologique / IA.`,
          ticker: ctoPos.ticker,
          envelope: ctoPos.envelope,
          amountEUR: ctoAllocation,
          confidenceScore: 0.85,
          impactSummary: `Exposition satellite ciblée CTO.`,
        });
      }
    }

    // 3. Calcul de projection sur 12 mois avec capitalisation
    const annualRate = 0.08;
    const monthlyRate = annualRate / 12;
    let projectedCapitalEUR = 0;
    for (let m = 1; m <= 12; m++) {
      projectedCapitalEUR = (projectedCapitalEUR + totalMonthlyDca) * (1 + monthlyRate);
    }

    return {
      skillName: 'dca-optimization',
      status: 'SUCCESS',
      summary: `Plan d'investissement programmé de ${totalMonthlyDca.toLocaleString('fr-FR')} €/mois sur ${activeDcaPositions.length} ligne(s) active(s).${bonusAmount > 0 ? ` Proposition de ventilation de prime de ${bonusAmount.toLocaleString('fr-FR')} € calculée.` : ''}`,
      details: {
        totalMonthlyDca,
        activePositionsCount: activeDcaPositions.length,
        trancheStats,
        projection12mEstimatedValueEUR: Math.round(projectedCapitalEUR),
        projection12mTotalInvestedEUR: totalMonthlyDca * 12,
      },
      suggestions,
      governanceScore: totalMonthlyDca > 0 ? 95 : 60,
      generatedAt: Date.now(),
    };
  },
};

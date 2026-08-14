/**
 * Skill Financier : Arbitrage & Optimisation Fiscale Française
 * Simule les frottements fiscaux entre PEA, PEA-PME, CTO et PEE (Flat Tax 30% vs Exonération IR post 5 ans).
 */

import type { FinancialSkill, SkillExecutionContext, SkillResult, SkillActionSuggestion } from './types';

export const taxArbitrageSkill: FinancialSkill = {
  id: 'tax-arbitrage',
  name: 'Arbitrage & Optimisation Fiscale (PEA / CTO / PEE)',
  description: 'Calcule l\'impact fiscal réel des plus-values et dividendes en droit fiscal français (Flat Tax 30% CTO vs Prélèvements Sociaux 17.2% PEA/PEA-PME/PEE).',
  keywords: ['fiscalité', 'impôt', 'taxe', 'pea', 'cto', 'pee', 'flat tax', 'pfu', '17.2%', '30%', 'plus-value', 'arbitrage fiscal'],

  execute: (context: SkillExecutionContext): SkillResult => {
    const { parameters = {} } = context;
    const capitalGainEUR = Number(parameters.capitalGainEUR || parameters.gainEUR || 10000);
    const holdingYears = Number(parameters.holdingYears || 5);

    // 1. Fiscalité CTO (Flat Tax PFU 30%)
    const ctoTaxIR = capitalGainEUR * 0.128; // 12.8% Impôt sur le revenu
    const ctoTaxPS = capitalGainEUR * 0.172; // 17.2% Prélèvements sociaux
    const ctoTotalTax = ctoTaxIR + ctoTaxPS;
    const ctoNetGain = capitalGainEUR - ctoTotalTax;

    // 2. Fiscalité PEA / PEA-PME (> 5 ans)
    const peaTaxIR = 0; // Exonération totale d'IR
    const peaTaxPS = capitalGainEUR * 0.172; // 17.2% Prélèvements sociaux
    const peaTotalTax = peaTaxIR + peaTaxPS;
    const peaNetGain = capitalGainEUR - peaTotalTax;

    // 3. Économie fiscale réalisée grâce au PEA / PEA-PME
    const taxSavingsEUR = ctoTotalTax - peaTotalTax;

    const suggestions: SkillActionSuggestion[] = [
      {
        type: 'TAX_OPTIMIZATION',
        title: `Optimisation PEA : +${Math.round(taxSavingsEUR).toLocaleString('fr-FR')} € préservés net d'impôt`,
        description: `Pour une plus-value de ${capitalGainEUR.toLocaleString('fr-FR')} €, loger l'actif dans le PEA ou PEA-PME permet d'économiser ${Math.round(taxSavingsEUR).toLocaleString('fr-FR')} € d'impôt sur le revenu (taux effectif de 17.2% au lieu de 30%).`,
        confidenceScore: 0.98,
        impactSummary: `Gain net post-fiscal supérieur de +${((taxSavingsEUR / ctoNetGain) * 100).toFixed(1)}% par rapport au CTO.`,
      },
    ];

    return {
      skillName: 'tax-arbitrage',
      status: 'SUCCESS',
      summary: `Sur une plus-value de ${capitalGainEUR.toLocaleString('fr-FR')} €, l'enveloppe PEA/PEA-PME fait économiser ${Math.round(taxSavingsEUR).toLocaleString('fr-FR')} € d'impôt par rapport au CTO.`,
      details: {
        simulatedGainEUR: capitalGainEUR,
        holdingPeriodYears: holdingYears,
        cto: {
          taxRate: '30% (PFU)',
          totalTaxEUR: Math.round(ctoTotalTax),
          netGainEUR: Math.round(ctoNetGain),
        },
        pea: {
          taxRate: '17.2% (PS uniquement après 5 ans)',
          totalTaxEUR: Math.round(peaTotalTax),
          netGainEUR: Math.round(peaNetGain),
        },
        taxSavingsEUR: Math.round(taxSavingsEUR),
      },
      suggestions,
      governanceScore: 100,
      generatedAt: Date.now(),
    };
  },
};

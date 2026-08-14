import { describe, it, expect } from 'vitest';
import {
  dcaOptimizationSkill,
  riskGovernanceSkill,
  taxArbitrageSkill,
  monteCarloSkill,
  matchSkillsByQuery,
  executeSkillById,
  executeAutoMatchedSkills,
} from '../services/skills';
import type { Position } from '../types/portfolio';

const MOCK_POSITIONS: Position[] = [
  {
    id: 'pea-nasdaq',
    ticker: 'PUST.PA',
    name: 'Amundi Nasdaq-100',
    envelope: 'PEA',
    assetType: 'ETF',
    currency: 'EUR',
    quantity: 10,
    avgPrice: 100,
    currentPrice: 110,
    monthlyDCA: 300,
    targetWeight: 0.40,
    updatedAt: Date.now(),
  },
  {
    id: 'pea-pme-ies',
    ticker: '0P0001DKPM.F',
    name: 'Indépendance Europe Small',
    envelope: 'PEA-PME',
    assetType: 'FUND',
    currency: 'EUR',
    quantity: 20,
    avgPrice: 50,
    currentPrice: 55,
    monthlyDCA: 200,
    targetWeight: 0.40,
    updatedAt: Date.now(),
  },
  {
    id: 'cto-coherent',
    ticker: 'COHR',
    name: 'Coherent',
    envelope: 'CTO',
    assetType: 'STOCK',
    currency: 'USD',
    quantity: 10,
    avgPrice: 80,
    currentPrice: 90,
    monthlyDCA: 100,
    targetWeight: 0.20,
    maxWeight: 0.10,
    updatedAt: Date.now(),
  },
];

describe('Financial Skills Engine', () => {
  it('dcaOptimizationSkill calcule correctement le total mensuel et ventile une prime', () => {
    const result = dcaOptimizationSkill.execute({
      positions: MOCK_POSITIONS,
      parameters: { bonusAmount: 2000 },
    });

    expect(result.status).toBe('SUCCESS');
    expect(result.details.totalMonthlyDca).toBe(600);
    expect(result.suggestions.length).toBeGreaterThan(0);
    const peaSuggestion = result.suggestions.find((s) => s.envelope === 'PEA');
    expect(peaSuggestion?.amountEUR).toBe(1000);
  });

  it('riskGovernanceSkill audite la conformité 40/40/20 et les seuils de concentration', () => {
    const result = riskGovernanceSkill.execute({
      positions: MOCK_POSITIONS,
    });

    expect(result.governanceScore).toBeGreaterThanOrEqual(60);
    expect(result.details.envelopeWeights).toBeDefined();
    expect(result.details.complianceViolations).toBeGreaterThanOrEqual(1); // COHR dépasse 10%
  });

  it('taxArbitrageSkill calcule le différentiel fiscal exact entre PEA et CTO', () => {
    const result = taxArbitrageSkill.execute({
      positions: MOCK_POSITIONS,
      parameters: { capitalGainEUR: 10000 },
    });

    expect(result.status).toBe('SUCCESS');
    expect(result.details.cto.totalTaxEUR).toBe(3000); // 30% Flat Tax
    expect(result.details.pea.totalTaxEUR).toBe(1720); // 17.2% PS
    expect(result.details.taxSavingsEUR).toBe(1280); // Économie de 1 280 €
  });

  it('monteCarloSkill simule les distributions probabilistes à horizon donné', () => {
    const result = monteCarloSkill.execute({
      positions: MOCK_POSITIONS,
      parameters: { horizonYears: 5 },
    });

    expect(result.status).toBe('SUCCESS');
    expect(result.details.medianFinalValueEUR).toBeGreaterThan(result.details.initialWealthEUR);
  });

  it('matchSkillsByQuery route automatiquement vers les compétences pertinentes', () => {
    const dcaMatches = matchSkillsByQuery('Comment optimiser mon DCA et ma prime de fin d année ?');
    expect(dcaMatches[0]?.id).toBe('dca-optimization');

    const taxMatches = matchSkillsByQuery('Combien je gagne en impôt entre le PEA et le CTO ?');
    expect(taxMatches[0]?.id).toBe('tax-arbitrage');

    const riskMatches = matchSkillsByQuery('Vérifie le risque et la conformité 40/40/20 de mon portefeuille');
    expect(riskMatches[0]?.id).toBe('risk-governance');
  });

  it('executeAutoMatchedSkills exécute le bon skill selon l intention', async () => {
    const results = await executeAutoMatchedSkills('Simule une trajectoire Monte Carlo à 10 ans', {
      positions: MOCK_POSITIONS,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].skillName).toBe('monte-carlo');
  });
});

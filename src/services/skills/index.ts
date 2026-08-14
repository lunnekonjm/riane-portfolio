/**
 * Registre Central des Skills Financiers & Routeur d'Intentions
 */

import type { FinancialSkill, SkillExecutionContext, SkillResult } from './types';
import { dcaOptimizationSkill } from './dcaOptimizationSkill';
import { riskGovernanceSkill } from './riskGovernanceSkill';
import { taxArbitrageSkill } from './taxArbitrageSkill';
import { monteCarloSkill } from './monteCarloSkill';

export * from './types';
export { dcaOptimizationSkill, riskGovernanceSkill, taxArbitrageSkill, monteCarloSkill };

export const REGISTERED_SKILLS: FinancialSkill[] = [
  dcaOptimizationSkill,
  riskGovernanceSkill,
  taxArbitrageSkill,
  monteCarloSkill,
];

/**
 * Trouve les skills les plus pertinents pour une requête textuelle donnée
 */
export function matchSkillsByQuery(query: string): FinancialSkill[] {
  const normQuery = query.toLowerCase().trim();
  const matched: { skill: FinancialSkill; score: number }[] = [];

  for (const skill of REGISTERED_SKILLS) {
    let score = 0;
    for (const keyword of skill.keywords) {
      if (normQuery.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    if (score > 0) {
      matched.push({ skill, score });
    }
  }

  matched.sort((a, b) => b.score - a.score);
  return matched.map((m) => m.skill);
}

/**
 * Exécute un skill par son identifiant unique
 */
export async function executeSkillById(
  skillId: string,
  context: SkillExecutionContext
): Promise<SkillResult | null> {
  const skill = REGISTERED_SKILLS.find((s) => s.id === skillId);
  if (!skill) return null;
  return await skill.execute(context);
}

/**
 * Exécute automatiquement les skills correspondants à une question utilisateur
 */
export async function executeAutoMatchedSkills(
  query: string,
  context: SkillExecutionContext
): Promise<SkillResult[]> {
  const matchedSkills = matchSkillsByQuery(query);
  if (matchedSkills.length === 0) {
    // Par défaut, exécuter le skill de gouvernance des risques
    const defaultResult = await riskGovernanceSkill.execute(context);
    return [defaultResult];
  }

  const results: SkillResult[] = [];
  for (const skill of matchedSkills.slice(0, 2)) {
    const result = await skill.execute(context);
    results.push(result);
  }
  return results;
}

import type { DCATranche, PortfolioConfig } from '@/types/portfolio';

export interface DCASliceSummary {
  tranche: DCATranche;
  monthsCount: number;
  investedAmount: number;
  isActive: boolean;
}

export interface CumulativeDCAResult {
  totalInvested: number;
  totalMonths: number;
  averageMonthly: number;
  activeMonthly: number;
  sliceBreakdown: DCASliceSummary[];
}

/**
 * Retourne la date courante au format YYYY-MM-DD
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Retourne la tranche active à une date donnée (par défaut aujourd'hui)
 */
export function getActiveDCATranche(tranches?: DCATranche[], targetDate?: string): DCATranche | null {
  if (!tranches || tranches.length === 0) return null;
  const target = (targetDate || getTodayDateString()).slice(0, 10);
  const targetMonth = target.slice(0, 7);

  // 1. Tri chronologique ascendant
  const sorted = [...tranches].sort((a, b) => a.startDate.localeCompare(b.startDate));

  // 2. Correspondance exacte jour : startDate <= target && (!endDate || endDate >= target)
  const exactMatch = sorted.find((t) => {
    const startD = t.startDate.slice(0, 10);
    const endD = t.endDate ? t.endDate.slice(0, 10) : null;
    return startD <= target && (!endD || endD >= target);
  });
  if (exactMatch) return exactMatch;

  // 3. Correspondance mois : startMonth <= targetMonth && (!endMonth || endMonth >= targetMonth)
  const monthMatch = sorted.find((t) => {
    const startM = t.startDate.slice(0, 7);
    const endM = t.endDate ? t.endDate.slice(0, 7) : null;
    return startM <= targetMonth && (!endM || endM >= targetMonth);
  });
  if (monthMatch) return monthMatch;

  // 4. Si la date cible est AVANT le tout premier palier, le palier actif/prévu est le premier chronologique
  if (target < sorted[0].startDate.slice(0, 10)) {
    return sorted[0];
  }

  // 5. Si la date cible est dans un intervalle ou après tous les paliers, prendre le plus récent palier passé
  const pastTranches = sorted.filter((t) => t.startDate.slice(0, 10) <= target);
  if (pastTranches.length > 0) {
    return pastTranches[pastTranches.length - 1];
  }

  // 6. Repli sur le premier palier chronologique
  return sorted[0] || null;
}

/**
 * Récupère le budget DCA mensuel effectif à la date cible
 */
export function getEffectiveDCAMonthly(config: PortfolioConfig, targetDate?: string): number {
  if (config.dcaHistory && config.dcaHistory.length > 0) {
    const active = getActiveDCATranche(config.dcaHistory, targetDate);
    if (active && typeof active.amount === 'number' && active.amount >= 0) {
      return active.amount;
    }
  }
  return config.monthlyBudget || 0;
}

/**
 * Calcule le nombre de mois complets entre deux dates (format YYYY-MM-DD ou YYYY-MM)
 */
export function getMonthsBetween(startDateStr: string, endDateStr: string): number {
  const startYear = parseInt(startDateStr.slice(0, 4), 10);
  const startMonth = parseInt(startDateStr.slice(5, 7), 10);
  const endYear = parseInt(endDateStr.slice(0, 4), 10);
  const endMonth = parseInt(endDateStr.slice(5, 7), 10);

  const months = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
  return Math.max(1, months);
}

/**
 * Calcule l'historique cumulé exact du capital investi par tranches temporelles de DCA
 */
export function calculateCumulativeDCA(
  tranches: DCATranche[] | undefined,
  defaultMonthly: number,
  globalStartDate?: string,
  targetDate?: string
): CumulativeDCAResult {
  const todayStr = targetDate || getTodayDateString();
  const todayMonth = todayStr.slice(0, 7);

  // Cas 1 : Aucun palier historique défini -> calcul simple sur le montant mensuel par défaut
  if (!tranches || tranches.length === 0) {
    const start = globalStartDate || todayStr;
    const startMonth = start.slice(0, 7);
    const monthsCount = startMonth <= todayMonth ? getMonthsBetween(start, todayStr) : 1;
    const totalInvested = monthsCount * defaultMonthly;

    return {
      totalInvested,
      totalMonths: monthsCount,
      averageMonthly: defaultMonthly,
      activeMonthly: defaultMonthly,
      sliceBreakdown: [
        {
          tranche: {
            id: 'default',
            startDate: start,
            amount: defaultMonthly,
            label: 'Palier unique',
          },
          monthsCount,
          investedAmount: totalInvested,
          isActive: true,
        },
      ],
    };
  }

  // Cas 2 : Paliers multiples historisés
  const sorted = [...tranches].sort((a, b) => a.startDate.localeCompare(b.startDate));
  let totalInvested = 0;
  let totalMonths = 0;
  const sliceBreakdown: DCASliceSummary[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const tranche = sorted[i];
    const trancheStart = tranche.startDate.slice(0, 7);
    
    // Détermination de la fin de la tranche
    let trancheEnd = tranche.endDate ? tranche.endDate.slice(0, 7) : todayMonth;
    if (trancheEnd > todayMonth) {
      trancheEnd = todayMonth;
    }

    // Si la tranche commence dans le futur par rapport à aujourd'hui, elle compte pour 0 mois passés
    if (trancheStart > todayMonth) {
      sliceBreakdown.push({
        tranche,
        monthsCount: 0,
        investedAmount: 0,
        isActive: !tranche.endDate || tranche.endDate >= todayStr,
      });
      continue;
    }

    const monthsInTranche = getMonthsBetween(tranche.startDate, trancheEnd + '-01');
    const invested = monthsInTranche * tranche.amount;

    totalMonths += monthsInTranche;
    totalInvested += invested;

    const isActive = trancheStart <= todayMonth && (!tranche.endDate || tranche.endDate.slice(0, 7) >= todayMonth);

    sliceBreakdown.push({
      tranche,
      monthsCount: monthsInTranche,
      investedAmount: invested,
      isActive,
    });
  }

  const activeTranche = getActiveDCATranche(sorted, todayStr);
  const activeMonthly = activeTranche ? activeTranche.amount : defaultMonthly;
  const averageMonthly = totalMonths > 0 ? Math.round(totalInvested / totalMonths) : activeMonthly;

  return {
    totalInvested,
    totalMonths,
    averageMonthly,
    activeMonthly,
    sliceBreakdown,
  };
}

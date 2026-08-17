import type { DCATranche } from '@/types/portfolio';
import { getTodayDateString } from './dcaCalculations';

/**
 * Met à jour un palier DCA en propageant automatiquement les dates aux paliers adjacents
 * afin de garantir une continuité stricte sans chevauchement ni rupture.
 */
export function updateChainedTranches(
  tranches: DCATranche[],
  targetId: string,
  updates: Partial<DCATranche>
): DCATranche[] {
  const index = tranches.findIndex((t) => t.id === targetId);
  if (index === -1) return tranches;

  const next = tranches.map((t) => ({ ...t }));
  const current = { ...next[index], ...updates };

  // Validation: Si date de fin < date de début sur le palier actuel, ajuster pour éviter les inversions
  if (current.endDate && current.startDate && current.endDate < current.startDate) {
    if (updates.endDate) {
      current.endDate = current.startDate;
    } else if (updates.startDate) {
      current.startDate = current.endDate;
    }
  }

  next[index] = current;

  // 1. Si on a modifié la date de fin du palier `i`, le palier `i+1` (s'il existe) commence à cette même date
  if (updates.endDate !== undefined && index < next.length - 1) {
    const nextTranche = next[index + 1];
    if (current.endDate) {
      nextTranche.startDate = current.endDate;
      if (nextTranche.endDate && nextTranche.endDate < nextTranche.startDate) {
        nextTranche.endDate = undefined;
      }
    }
  }

  // 2. Si on a modifié la date de début du palier `i`, le palier `i-1` (s'il existe) se termine à cette même date
  if (updates.startDate !== undefined && index > 0) {
    const prevTranche = next[index - 1];
    prevTranche.endDate = current.startDate;
  }

  return next;
}

/**
 * Supprime un palier tout en raccordant les paliers adjacents pour maintenir la continuité
 */
export function deleteChainedTranche(tranches: DCATranche[], targetId: string): DCATranche[] {
  const index = tranches.findIndex((t) => t.id === targetId);
  if (index === -1) return tranches;
  if (tranches.length <= 1) return tranches;

  const filtered = tranches.filter((t) => t.id !== targetId);

  // Si on a supprimé un palier intermédiaire, on relie le palier précédent au palier suivant
  if (index > 0 && index < tranches.length && filtered[index - 1] && filtered[index]) {
    filtered[index - 1].endDate = filtered[index].startDate;
  }

  return filtered;
}

/**
 * Ajoute un nouveau palier continu démarrant exactement à la date de fin du dernier palier
 * (ou à aujourd'hui si le dernier palier n'a pas de date de fin, en clôturant le dernier palier à aujourd'hui)
 */
export function addContinuousTranche(
  tranches: DCATranche[],
  defaultAmount?: number,
  transitionDate?: string
): DCATranche[] {
  const todayStr = transitionDate || getTodayDateString();
  const next = tranches.map((t) => ({ ...t }));

  if (next.length === 0) {
    return [
      {
        id: `tranche-${Date.now()}-0`,
        startDate: todayStr,
        amount: defaultAmount || 200,
        label: 'Palier 1',
      },
    ];
  }

  const lastIdx = next.length - 1;
  const lastTranche = next[lastIdx];
  let newStartDate = todayStr;

  if (lastTranche.endDate) {
    newStartDate = lastTranche.endDate;
  } else {
    lastTranche.endDate = todayStr;
    newStartDate = todayStr;
  }

  const newAmount = defaultAmount || lastTranche.amount || 200;
  const newTranche: DCATranche = {
    id: `tranche-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    startDate: newStartDate,
    amount: newAmount,
    label: `Palier #${next.length + 1}`,
  };

  return [...next, newTranche];
}

/**
 * Crée un nouveau palier de DCA en clôturant automatiquement le palier précédent
 */
export function addOrStepUpDCATranche(
  existingTranches: DCATranche[],
  newAmount: number,
  startDateStr: string,
  reason?: string
): DCATranche[] {
  const sorted = [...existingTranches].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const newStartDate = startDateStr.slice(0, 10);
  
  // Date de fin pour le palier précédent = veille ou même date du nouveau palier
  const newDateObj = new Date(newStartDate);
  const prevEndDateObj = new Date(newDateObj.getTime() - 24 * 60 * 60 * 1000);
  const prevEndDateStr = prevEndDateObj.toISOString().split('T')[0];

  const updatedTranches: DCATranche[] = sorted.map((t) => {
    // Si la tranche n'avait pas de date de fin ou finissait après la nouvelle date de début
    if (!t.endDate || t.endDate >= newStartDate) {
      return {
        ...t,
        endDate: prevEndDateStr,
      };
    }
    return t;
  });

  const newTranche: DCATranche = {
    id: `dca-tranche-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    startDate: newStartDate,
    amount: newAmount,
    label: reason || `Palier #${updatedTranches.length + 1}`,
  };

  return [...updatedTranches, newTranche];
}

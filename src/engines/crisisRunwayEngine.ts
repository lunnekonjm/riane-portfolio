/**
 * Crisis & Resilience Engine — Calcul de Runway d'urgence, simulateurs d'accident de la vie,
 * comparateur de financement CLIC et jauge de réservoir liquide.
 * Porté de Flutter (Aura Budget Pro) vers Riane Portfolio (Next.js / TypeScript).
 */

export interface CrisisRunwayMetrics {
  totalAvailableEmergencySavings: number; // Sas Tampon + Livret A + LDDS + Pockets
  vitalMonthlyExpenses: number;           // Dépenses vitales incompressibles (Loyer, charges, alimentation)
  discretionaryMonthlyExpenses: number;   // Dépenses plaisir et abonnements compressibles
  totalMonthlyExpenses: number;           // Somme globale dépenses
  runwayMonths: number;                   // Mois d'autonomie sans aucun revenu
  targetBuffer3Months: number;
  targetBuffer6Months: number;
  targetBuffer12Months: number;
  bufferFillRatioPercent: number;         // Remplissage par rapport à la cible 6 mois
  safetyStatus: 'CRITICAL' | 'ALERT' | 'COMFORTABLE' | 'FORTRESS';
  recommendations: string[];
}

export interface LifeAccidentSimulationResult {
  totalExpense: number;
  cashContribution: number;
  financedAmount: number;
  creditDurationMonths: number;
  postAccidentAvailableSavings: number;
  postAccidentRunwayMonths: number;
  isReserveExhausted: boolean;
  actionPlan: string[];
}

export interface FinancingComparisonResult {
  totalCost: number;
  cashUpfront: number;
  remainingAmount: number;
  durationMonths: number;
  taegPercent: number;
  monthlyIncome: number;
  costToIncomeRatioPercent: number;
  
  // Option A: Full Cash
  cashOption: {
    immediateDrain: number;
    totalInterest: number;
    postCashSavings: number;
    isDangerous: boolean;
  };

  // Option B: 0% Installments (Fractionné sans frais)
  noFeeOption: {
    monthlyPayment: number;
    totalInterest: number;
    impactDescription: string;
  };

  // Option C: Personal Credit (Crédit amortissable)
  personalCreditOption: {
    monthlyPayment: number;
    totalInterest: number;
    totalPaid: number;
  };

  recommendedOptionIndex: 0 | 1 | 2; // 0 = Cash, 1 = 0% Split, 2 = Credit
  adviceTitle: string;
  adviceMessage: string;
}

/**
 * Calcule le Runway d'Urgence et le statut de résilience financière
 */
export function computeCrisisRunwayMetrics(params: {
  emergencySavings: number; // Somme disponible
  vitalExpenses: number;    // Loyer + Factures + Nourriture
  discretionaryExpenses?: number; // Plaisir / Abonnements
  targetMonths?: number;    // Par défaut 6 mois
}): CrisisRunwayMetrics {
  const { emergencySavings, vitalExpenses, discretionaryExpenses = 0, targetMonths = 6 } = params;

  const safeVital = Math.max(1, vitalExpenses);
  const totalMonthlyExpenses = safeVital + discretionaryExpenses;
  const runwayMonths = Math.round((emergencySavings / safeVital) * 10) / 10;

  const targetBuffer3Months = safeVital * 3;
  const targetBuffer6Months = safeVital * 6;
  const targetBuffer12Months = safeVital * 12;

  const selectedTarget = targetMonths === 12 ? targetBuffer12Months : (targetMonths === 3 ? targetBuffer3Months : targetBuffer6Months);
  const bufferFillRatioPercent = selectedTarget > 0 ? Math.min(200, Math.round((emergencySavings / selectedTarget) * 100)) : 0;

  let safetyStatus: CrisisRunwayMetrics['safetyStatus'] = 'FORTRESS';
  const recommendations: string[] = [];

  if (runwayMonths < 1) {
    safetyStatus = 'CRITICAL';
    recommendations.push('URGENCE : Vos liquidités couvrent moins d\'un mois de charges vitales.');
    recommendations.push('Gelez immédiatement tout investissement (DCA PEA) pour reconstituer un coussin de 1 500 € minimum.');
  } else if (runwayMonths < 3) {
    safetyStatus = 'ALERT';
    recommendations.push('Alerte de sécurité : Réserve inférieure au seuil prudentiel de 3 mois.');
    recommendations.push('Priorisez le Compte Tampon et le Livret A avant d\'augmenter vos allocations en bourse.');
  } else if (runwayMonths < 6) {
    safetyStatus = 'COMFORTABLE';
    recommendations.push('Filet protecteur solide (3 à 6 mois de dépenses vitales sécurisées).');
    recommendations.push('Vous pouvez maintenir votre rythme de DCA tout en alimentant progressivement vers 6 mois.');
  } else {
    safetyStatus = 'FORTRESS';
    recommendations.push('Forteresse financière atteinte (plus de 6 mois de charges incompressibles disponibles).');
    recommendations.push('Votre surplus de trésorerie peut être orienté à 100% vers vos objectifs patrimoniaux long terme.');
  }

  return {
    totalAvailableEmergencySavings: emergencySavings,
    vitalMonthlyExpenses: safeVital,
    discretionaryMonthlyExpenses: discretionaryExpenses,
    totalMonthlyExpenses,
    runwayMonths,
    targetBuffer3Months,
    targetBuffer6Months,
    targetBuffer12Months,
    bufferFillRatioPercent,
    safetyStatus,
    recommendations,
  };
}

/**
 * Simulateur d'Accident de la Vie / Choc financier imprévu
 */
export function simulateLifeAccident(params: {
  currentEmergencySavings: number;
  vitalMonthlyExpenses: number;
  emergencyExpense: number;
  cashPayment: number;
  creditMonths?: number;
}): LifeAccidentSimulationResult {
  const { currentEmergencySavings, vitalMonthlyExpenses, emergencyExpense, cashPayment, creditMonths = 12 } = params;

  const actualCashPaid = Math.min(emergencyExpense, Math.max(0, cashPayment));
  const financedAmount = Math.max(0, emergencyExpense - actualCashPaid);
  const postSavings = Math.max(0, currentEmergencySavings - actualCashPaid);
  const postRunway = vitalMonthlyExpenses > 0 ? Math.round((postSavings / vitalMonthlyExpenses) * 10) / 10 : 0;
  const isExhausted = postSavings <= 0 || postRunway < 1.0;

  const actionPlan: string[] = [];
  if (isExhausted) {
    actionPlan.push('Activer le protocole d\'urgence : Stopper 100% des transferts non-essentiels et du DCA.');
    actionPlan.push('Négocier un report d\'échéance ou étaler le reste à charge sur ' + creditMonths + ' mois.');
  } else if (postRunway < 3.0) {
    actionPlan.push('Réduire temporairement le DCA PEA de 50% pour recharger le sas de trésorerie.');
  } else {
    actionPlan.push('Votre filet de sécurité a parfaitement absorbé le choc imprévu.');
  }

  return {
    totalExpense: emergencyExpense,
    cashContribution: actualCashPaid,
    financedAmount,
    creditDurationMonths: creditMonths,
    postAccidentAvailableSavings: postSavings,
    postAccidentRunwayMonths: postRunway,
    isReserveExhausted: isExhausted,
    actionPlan,
  };
}

/**
 * Simulateur & Comparateur de Modes de Financement (CLIC / Étalement / Prêt Personnel)
 */
export function compareFinancingOptions(params: {
  totalCost: number;
  cashUpfront: number;
  durationMonths: number;
  taegPercent: number;
  monthlyIncome: number;
  currentSavings: number;
}): FinancingComparisonResult {
  const { totalCost, cashUpfront, durationMonths, taegPercent, monthlyIncome, currentSavings } = params;

  const safeDuration = Math.max(1, durationMonths);
  const remainingCost = Math.max(0, totalCost - cashUpfront);
  const costRatio = monthlyIncome > 0 ? (remainingCost / monthlyIncome) * 100 : 0;

  // Option A : Cash
  const postCashSavings = Math.max(0, currentSavings - totalCost);
  const cashDangerous = totalCost > currentSavings * 0.5 || postCashSavings < monthlyIncome;

  // Option B : 0% Split
  const noFeeMonthly = remainingCost / safeDuration;

  // Option C : Amortized Personal Loan
  const monthlyRate = (taegPercent / 100) / 12;
  let creditMonthly = noFeeMonthly;
  if (monthlyRate > 0) {
    creditMonthly = (remainingCost * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -safeDuration));
  }
  const creditTotalInterest = Math.max(0, (creditMonthly * safeDuration) - remainingCost);
  const creditTotalPaid = remainingCost + creditTotalInterest;

  // Recommandation intelligente
  let recommendedIndex: 0 | 1 | 2 = 1; // Default: 0% split
  let adviceTitle = 'Évitez le comptant — fractionnez ou crédit';
  let adviceMessage = 'Payer cash consommerait une part critique de votre épargne de sécurité. Un étalement sans frais préserve votre filet de précaution.';

  if (!cashDangerous && totalCost < monthlyIncome * 0.3) {
    recommendedIndex = 0;
    adviceTitle = 'Paiement comptant optimal';
    adviceMessage = 'Le montant est faible au regard de vos réserves : payer comptant élimine tout suivi administratif sans aucun risque de trésorerie.';
  } else if (remainingCost > 0) {
    recommendedIndex = 1;
    adviceTitle = 'Priorité au fractionné sans frais (0% d\'intérêts)';
    adviceMessage = `L'étalement sur ${safeDuration} mois (${Math.round(noFeeMonthly)} €/m) lisse l'effort sur votre reste à vivre sans générer de surcoût d'intérêts.`;
  }

  return {
    totalCost,
    cashUpfront,
    remainingAmount: remainingCost,
    durationMonths: safeDuration,
    taegPercent,
    monthlyIncome,
    costToIncomeRatioPercent: Math.round(costRatio * 10) / 10,
    cashOption: {
      immediateDrain: totalCost,
      totalInterest: 0,
      postCashSavings,
      isDangerous: cashDangerous,
    },
    noFeeOption: {
      monthlyPayment: Math.round(noFeeMonthly * 100) / 100,
      totalInterest: 0,
      impactDescription: `Lissage sur ${safeDuration} mois sans aucun intérêt`,
    },
    personalCreditOption: {
      monthlyPayment: Math.round(creditMonthly * 100) / 100,
      totalInterest: Math.round(creditTotalInterest * 100) / 100,
      totalPaid: Math.round(creditTotalPaid * 100) / 100,
    },
    recommendedOptionIndex: recommendedIndex,
    adviceTitle,
    adviceMessage,
  };
}

import { cleanTransactionTitle } from '@/services/reconciliation/transactionClassifier';
import type { TargetFlowItem } from './bankingTargetFlows';
import type { TemporaryExpenseItem } from '@/utils/bankingSanitizer';
import type { RuleCategoryItem } from '@/types/auraRules';
import type { AuraWizardLearningMemory } from '@/services/banking/auraWizardMemoryService';

export type SmartInsightType =
  | 'EPHEMERAL_RECURRING'
  | 'TARIFF_CHANGE'
  | 'NEW_RECURRING'
  | 'STABLE_SUBSCRIPTION';

export interface MonthOccurrence {
  period: string; // YYYY-MM
  date: string;
  amount: number;
  rawTitle: string;
}

export interface SmartFlowInsight {
  id: string;
  type: SmartInsightType;
  title: string;
  merchant: string;
  pillar: 'FIXED' | 'SAVINGS' | 'DAILY' | 'TEMPORARY';
  confidenceScore: number; // 0.0 to 1.0 (e.g. 0.95 = 95%)

  currentMonthlyAmount: number;
  previousMonthlyAmount?: number;
  deltaMonthlyAmount?: number; // e.g. -10 for savings, +5 for hike

  suggestedDurationMonths?: number;
  startPeriod?: string; // YYYY-MM
  category?: string;

  monthCount: number;
  history: MonthOccurrence[];

  badgeLabel: string;
  badgeColor: string;
  summaryText: string;
  rationale: string;

  primaryActionLabel: string;
  primaryActionType: 'ADD_TEMPORARY' | 'APPLY_TARIFF_CHANGE' | 'ADD_FIXED';
  secondaryActionLabel?: string;
  secondaryActionType?: 'ADD_FIXED' | 'DISMISS';
}

/**
 * Identify if transaction is an installment / health / short-term credit keyword
 */
export function isEphemeralExpenseKeyword(title: string, rawTitle: string = ''): boolean {
  const text = `${title} ${rawTitle}`.toUpperCase();
  const keywords = [
    'TURREL',
    'DENT',
    'ORTHO',
    'SANTE',
    'CLINIQUE',
    'HOPITAL',
    'DOCTEUR',
    'DR ',
    'KLARNA',
    'ALMA',
    'FLOA',
    '3X',
    '4X',
    'SOFINCO',
    'COFIDIS',
    'YOUNITED',
    'CREDIT',
    'ECHEANCIER',
  ];
  return keywords.some((k) => text.includes(k));
}

/**
 * Exclude income / salary merchants from expense alerts
 */
export function isIncomeMerchant(merchant: string, rawTitle: string = ''): boolean {
  const text = `${merchant} ${rawTitle}`.toUpperCase();
  return (
    text.includes('SALAIRE') ||
    text.includes('VESTAS') ||
    text.includes('PAIE') ||
    text.includes('VIR RECU') ||
    text.includes('REMBOURSEMENT')
  );
}

/**
 * Identify if merchant is a genuine recurring direct debit / subscription
 * (to avoid triggering tariff changes on variable shopping like Carrefour, Foot Locker, etc.)
 */
export function isGenuineRecurringMerchant(merchant: string, rawTitle: string = ''): boolean {
  const text = `${merchant} ${rawTitle}`.toUpperCase();

  // Prélèvements SEPA, virements automatiques
  if (text.includes('PRLV') || text.includes('PRELEVEMENT') || text.includes('VIR SEPA') || text.includes('SEPA')) {
    return true;
  }

  // Known telecom, utilities, housing, insurance, subscription providers
  const recurringKeywords = [
    'BOUYGUES',
    'TOTALENERGIES',
    'TOTAL ENERGIES',
    'EDF',
    'ENGIE',
    'CDC HABITAT',
    'LOYER',
    'BPCE',
    'PACIFICA',
    'MACIF',
    'MAIF',
    'AXA',
    'ALLIANZ',
    'MATMUT',
    'NETFLIX',
    'SPOTIFY',
    'FREE TELECOM',
    'FREE MOBILE',
    'FREEBOX',
    'ORANGE',
    'SFR',
    'AMAZON PRIME',
    'PRIME VIDEO',
    'APPLE.COM',
    'ICLOUD',
    'CHATGPT',
    'OPENAI',
    'TONTINE',
    'SENDWAVE',
    'WAVE',
    'REMITLY',
    'BOURSO PROTECT',
    'ASSURANCE',
  ];

  return recurringKeywords.some((k) => text.includes(k));
}

/**
 * Detect multi-month patterns across a 90-day (3 months) horizon
 */
export function detectMultiMonthPatterns(
  transactions: TargetFlowItem[],
  existingFixedRules: RuleCategoryItem[] = [],
  existingTempExpenses: TemporaryExpenseItem[] = [],
  memory?: AuraWizardLearningMemory
): SmartFlowInsight[] {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return [];
  }

  const existingTempLabels = existingTempExpenses.map((t) => (t.label || '').toUpperCase());
  const existingFixedMap = new Map<string, number>();
  for (const r of existingFixedRules) {
    if (r && r.name && typeof r.amount === 'number') {
      existingFixedMap.set(r.name.toUpperCase(), r.amount);
    }
  }

  const hasNegativeAmounts = transactions.some((t) => typeof t.amount === 'number' && t.amount < 0);

  // 1. Group transactions by clean merchant title (debits/outflows only)
  const groups = new Map<string, TargetFlowItem[]>();
  for (const rawTx of transactions) {
    if (!rawTx) continue;
    if (hasNegativeAmounts && typeof rawTx.amount === 'number' && rawTx.amount >= 0) continue;

    const rawDesc = rawTx.rawTitle || rawTx.title || '';
    const cleanTitle = cleanTransactionTitle(rawDesc);

    const list = groups.get(cleanTitle) || [];
    list.push({
      ...rawTx,
      title: cleanTitle,
      rawTitle: rawDesc,
    });
    groups.set(cleanTitle, list);
  }

  const insights: SmartFlowInsight[] = [];
  const fmtEur = (n: number) =>
    n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

  for (const [merchant, tList] of groups.entries()) {
    if (tList.length === 0) continue;

    const firstRaw = tList[0].rawTitle || tList[0].title || '';
    if (isIncomeMerchant(merchant, firstRaw)) {
      continue;
    }

    // Sort by date ascending
    const sortedTxs = [...tList].sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeA - timeB;
    });

    // Group into monthly buckets (YYYY-MM)
    const byMonth = new Map<string, TargetFlowItem[]>();
    for (const t of sortedTxs) {
      const monthKey = t.date ? t.date.slice(0, 7) : 'RECENT';
      const mList = byMonth.get(monthKey) || [];
      mList.push(t);
      byMonth.set(monthKey, mList);
    }

    const months = Array.from(byMonth.keys()).sort();
    const monthCount = months.length;

    // Monthly summary series
    const monthlySeries: MonthOccurrence[] = months.map((m) => {
      const items = byMonth.get(m) || [];
      const primaryItem = items[0];
      return {
        period: m,
        date: primaryItem.date || `${m}-01`,
        amount: Math.abs(primaryItem.amount),
        rawTitle: primaryItem.rawTitle || primaryItem.title,
      };
    });

    const latestOccurrence = monthlySeries[monthlySeries.length - 1];
    const latestAmount = latestOccurrence.amount;
    const distinctAmounts = Array.from(new Set(monthlySeries.map((s) => s.amount)));

    // A. Check for Ephemeral Recurring / Installment (e.g. Dr Turrel Baptiste)
    if (isEphemeralExpenseKeyword(merchant, firstRaw)) {
      const alreadyInTemp = existingTempLabels.some(
        (l) => l.includes(merchant.toUpperCase()) || merchant.toUpperCase().includes(l)
      );

      if (!alreadyInTemp) {
        const amtVariance =
          Math.max(...monthlySeries.map((s) => s.amount)) - Math.min(...monthlySeries.map((s) => s.amount));
        const confidence = monthCount >= 2 && amtVariance < 0.05 ? 0.95 : 0.85;

        const isTurrelOrHealth =
          merchant.toUpperCase().includes('TURREL') ||
          merchant.toUpperCase().includes('SANTE') ||
          merchant.toUpperCase().includes('DENT');

        const defaultDuration = isTurrelOrHealth ? 12 : 3;
        const startPeriod = monthlySeries[0].period;

        insights.push({
          id: `insight-ephemeral-${merchant.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          type: 'EPHEMERAL_RECURRING',
          title: `Échéancier détecté : ${merchant}`,
          merchant,
          pillar: 'TEMPORARY',
          confidenceScore: confidence,
          currentMonthlyAmount: latestAmount,
          suggestedDurationMonths: defaultDuration,
          startPeriod,
          category: isTurrelOrHealth ? 'Santé / Échéancier' : 'Échéancier (3x/4x)',
          monthCount,
          history: monthlySeries,
          badgeLabel: `🟢 ${Math.round(confidence * 100)}% Sûr (Échéancier Détecté)`,
          badgeColor: '#10b981',
          summaryText: `Prélèvement récurrent détecté sur ${monthCount} mois (${months.join(', ')}) à ${fmtEur(
            latestAmount
          )}/mois.`,
          rationale: `L'IA a identifié un échéancier à durée déterminée (${defaultDuration} mois débuté en ${startPeriod}). À classer dans les Dépenses Temporaires.`,
          primaryActionLabel: `📌 Ajouter aux Dépenses Temporaires (${defaultDuration} mois)`,
          primaryActionType: 'ADD_TEMPORARY',
          secondaryActionLabel: '🏠 Transformer en Charge Fixe',
          secondaryActionType: 'ADD_FIXED',
        });
        continue;
      }
    }

    // Only look for recurring tariff changes on GENUINE recurring merchants or existing fixed rules
    const isRecurring = isGenuineRecurringMerchant(merchant, firstRaw);
    const isExistingFixed = Array.from(existingFixedMap.keys()).some(
      (k) => k.includes(merchant.toUpperCase()) || merchant.toUpperCase().includes(k)
    );

    if (!isRecurring && !isExistingFixed) {
      // Variable spending (e.g. Carrefour, B&M, Devred, Foot Locker) is normal daily shopping, not a subscription tariff change
      continue;
    }

    // B. Check for Tariff Change / Price Variation across the window (e.g. TotalEnergies 42 -> 32 -> 32)
    if (distinctAmounts.length > 1 && monthCount >= 2) {
      const earliestAmount = monthlySeries[0].amount;
      if (Math.abs(earliestAmount - latestAmount) >= 0.5) {
        const delta = latestAmount - earliestAmount;
        const confidence = 0.92;
        const isSaving = delta < 0;

        insights.push({
          id: `insight-tariff-${merchant.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          type: 'TARIFF_CHANGE',
          title: `Variation tarifaire : ${merchant} (${delta > 0 ? '+' : ''}${fmtEur(delta)}/mois)`,
          merchant,
          pillar: 'FIXED',
          confidenceScore: confidence,
          previousMonthlyAmount: earliestAmount,
          currentMonthlyAmount: latestAmount,
          deltaMonthlyAmount: delta,
          monthCount,
          history: monthlySeries,
          badgeLabel: `⚡ ${Math.round(confidence * 100)}% Variation Tarifaire`,
          badgeColor: '#f59e0b',
          summaryText: `Montant passé de ${fmtEur(earliestAmount)} (${monthlySeries[0].period}) à ${fmtEur(
            latestAmount
          )} (${latestOccurrence.period}).`,
          rationale: `L'IA a détecté une évolution de tarif (${
            isSaving ? 'économie' : 'hausse'
          } de ${fmtEur(Math.abs(delta))}/mois). Nous vous recommandons d'ajuster la charge existante plutôt que de créer un doublon.`,
          primaryActionLabel: `🔄 Ajuster la charge à ${fmtEur(latestAmount)}/mois (${delta > 0 ? '+' : ''}${fmtEur(
            delta
          )})`,
          primaryActionType: 'APPLY_TARIFF_CHANGE',
        });
        continue;
      }
    }

    // C. Check against existing fixed rules (if user has an existing rule with an outdated amount)
    for (const [ruleName, ruleAmt] of existingFixedMap.entries()) {
      if (ruleName.includes(merchant.toUpperCase()) || merchant.toUpperCase().includes(ruleName)) {
        if (Math.abs(ruleAmt - latestAmount) >= 0.5) {
          const delta = latestAmount - ruleAmt;
          insights.push({
            id: `insight-tariff-rule-${merchant.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            type: 'TARIFF_CHANGE',
            title: `Écart de budget : ${merchant}`,
            merchant,
            pillar: 'FIXED',
            confidenceScore: 0.9,
            previousMonthlyAmount: ruleAmt,
            currentMonthlyAmount: latestAmount,
            deltaMonthlyAmount: delta,
            monthCount,
            history: monthlySeries,
            badgeLabel: '⚡ 90% Ajustement Règle Budget',
            badgeColor: '#06b6d4',
            summaryText: `Votre budget prévoit ${fmtEur(ruleAmt)}, mais les prélèvements récents sont de ${fmtEur(
              latestAmount
            )}.`,
            rationale: `L'IA vous propose d'aligner automatiquement la règle sur le montant constaté en banque (${fmtEur(
              latestAmount
            )}).`,
            primaryActionLabel: `🔄 Aligner sur ${fmtEur(latestAmount)}/mois`,
            primaryActionType: 'APPLY_TARIFF_CHANGE',
          });
        }
        break;
      }
    }
  }

  // Sort insights: Ephemerals first, then Tariff changes by absolute delta descending
  return insights.sort((a, b) => {
    if (a.type === 'EPHEMERAL_RECURRING' && b.type !== 'EPHEMERAL_RECURRING') return -1;
    if (b.type === 'EPHEMERAL_RECURRING' && a.type !== 'EPHEMERAL_RECURRING') return 1;
    return (b.confidenceScore || 0) - (a.confidenceScore || 0);
  });
}

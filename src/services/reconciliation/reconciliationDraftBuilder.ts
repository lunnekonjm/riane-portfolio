import type {
  BankReconciliationRecord,
  BankTransactionMatch,
  SalaryRecord,
} from '@/types/revenue';
import { classifyTransaction, type RawBankTransaction } from './transactionClassifier';

/**
 * Analyse l'ensemble des transactions pour une période (YYYY-MM)
 * et produit une proposition de réconciliation sans filtre restrictif.
 */
export function buildReconciliationDraft(
  period: string, // YYYY-MM
  theoreticalSalary: SalaryRecord | null,
  transactions: RawBankTransaction[]
): BankReconciliationRecord {
  // Filtrer les transactions du mois ciblé
  const monthTransactions = transactions.filter((t) => {
    const d = (t.date || '').slice(0, 7);
    return d === period;
  });

  const matches: BankTransactionMatch[] = monthTransactions.map((tx) => {
    const { category, confidence } = classifyTransaction(tx);
    const isRelevant = category !== 'IGNORED';
    return {
      id: tx.id || `tx-${Math.random()}`,
      date: (tx.date || '').slice(0, 10),
      rawDescription: tx.description,
      amount: Math.abs(tx.amount),
      category: category,
      suggestedCategory: category,
      confidence,
      accountName: tx.accountType || 'BoursoBank',
      included: isRelevant,
    };
  });

  // Calculs agrégés basés sur les matches inclus
  let actualNetSalaryReceived = 0;
  let actualRent = 0;
  let actualSubscriptions = 0;
  let actualInvestedPEA = 0;
  let actualInvestedTontine = 0;
  let actualSupportWave = 0;
  let actualRevolut = 0;
  let actualInvestedTampon = 0;
  let actualInvestedLivretA = 0;
  let actualInvestedCTO = 0;
  let actualDailyExpenses = 0;

  for (const m of matches) {
    if (!m.included) continue;
    switch (m.category) {
      case 'SALARY_INCOME':
        actualNetSalaryReceived += m.amount;
        break;
      case 'RENT_HOUSING':
        actualRent += m.amount;
        break;
      case 'SUBSCRIPTIONS':
        actualSubscriptions += m.amount;
        break;
      case 'INVEST_PEA':
        actualInvestedPEA += m.amount;
        break;
      case 'INVEST_TONTINE':
        actualInvestedTontine += m.amount;
        break;
      case 'SUPPORT_WAVE':
        actualSupportWave += m.amount;
        break;
      case 'REVOLUT_TRANSFER':
        actualRevolut += m.amount;
        break;
      case 'INVEST_TAMPON':
        actualInvestedTampon += m.amount;
        break;
      case 'INVEST_LIVRET_A':
        actualInvestedLivretA += m.amount;
        break;
      case 'INVEST_CTO':
        actualInvestedCTO += m.amount;
        break;
      case 'DAILY_EXPENSE':
      case 'OTHER_TRANSFER':
        actualDailyExpenses += m.amount;
        break;
      default:
        break;
    }
  }

  // Si aucun salaire détecté dans les transactions du mois mais qu'une fiche existe,
  // utiliser la valeur de la fiche en secours indicatif
  if (actualNetSalaryReceived === 0 && theoreticalSalary) {
    actualNetSalaryReceived = theoreticalSalary.netSalary;
  }

  const totalActualInvested =
    Math.round((actualInvestedPEA + actualInvestedTontine + actualInvestedTampon + actualInvestedLivretA + actualInvestedCTO) * 100) / 100;

  const totalActualFixedExpenses = Math.round((actualRent + actualSubscriptions) * 100) / 100;
  const totalActualLivingTransfers = Math.round((actualSupportWave + actualRevolut) * 100) / 100;

  const actualSavingsRate =
    actualNetSalaryReceived > 0
      ? Math.round(((totalActualInvested / actualNetSalaryReceived) * 100) * 10) / 10
      : 0;

  const targetBudget = theoreticalSalary?.regularInvestableAmount || 0;
  const deltaVsPlan = Math.round((totalActualInvested - targetBudget) * 100) / 100;
  const executionRatePercent =
    targetBudget > 0
      ? Math.round(((totalActualInvested / targetBudget) * 100) * 10) / 10
      : 100;

  let status: BankReconciliationRecord['status'] = 'ON_TRACK';
  if (targetBudget > 0) {
    if (executionRatePercent >= 90 && executionRatePercent <= 110) {
      status = 'ON_TRACK';
    } else if (executionRatePercent < 90) {
      status = 'UNDER_INVESTED';
    } else {
      status = 'OVER_INVESTED';
    }
  }

  return {
    reconciled: false,
    period,
    actualNetSalaryReceived,
    actualRent: Math.round(actualRent * 100) / 100,
    actualSubscriptions: Math.round(actualSubscriptions * 100) / 100,
    actualInvestedPEA,
    actualInvestedTontine,
    actualSupportWave: Math.round(actualSupportWave * 100) / 100,
    actualRevolut: Math.round(actualRevolut * 100) / 100,
    actualInvestedTampon,
    actualInvestedLivretA,
    actualInvestedCTO,
    actualDailyExpenses: Math.round(actualDailyExpenses * 100) / 100,
    totalActualInvested,
    totalActualFixedExpenses,
    totalActualLivingTransfers,
    actualSavingsRate,
    deltaVsPlan,
    executionRatePercent,
    status,
    detectedTransactions: matches,
  };
}

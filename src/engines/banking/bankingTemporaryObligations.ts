import type { TargetFlowItem } from './bankingTargetFlows';
import type { TemporaryExpenseItem } from '@/utils/bankingSanitizer';
import {
  type AuraWizardLearningMemory,
  isMerchantOrTxRejected,
} from '@/services/banking/auraWizardMemoryService';

export function detectTemporaryObligations(
  transactions: TargetFlowItem[],
  existingExpenses: TemporaryExpenseItem[] = [],
  memory?: AuraWizardLearningMemory
): TemporaryExpenseItem[] {
  const existingLabels = existingExpenses.map((e) => (e.label || '').toUpperCase());
  const detected: TemporaryExpenseItem[] = [];

  const hasNegativeAmounts = transactions.some((t) => typeof t.amount === 'number' && t.amount < 0);

  for (const tx of transactions) {
    // Only debits/outflows can be temporary expense obligations
    if (hasNegativeAmounts && tx.amount >= 0) continue;

    const upper = ((tx.rawTitle || tx.title || '') + ' ' + (tx.category || '')).toUpperCase();
    const amount = Math.abs(tx.amount || 0);

    // 1. Health / Dental treatments
    if (upper.includes('DENT') || upper.includes('ORTHO') || upper.includes('CLINIQUE') || upper.includes('HOPITAL') || upper.includes('LATTES')) {
      if (!isMerchantOrTxRejected(tx, 'Santé', memory)) {
        if (amount >= 50 && !existingLabels.some((l) => l.includes('DENT') || l.includes('ORTHO') || l.includes('SANTE'))) {
          const id = `temp-dent-${tx.id || Math.random().toString(36).slice(2, 6)}`;
          if (!detected.some((d) => d.label.includes('Dentiste') || d.label.includes('Orthodontie'))) {
            detected.push({
              id,
              label: 'Dentiste / Soins orthodontiques',
              monthlyAmount: Math.round(amount * 100) / 100,
              startPeriod: tx.date ? tx.date.slice(0, 7) : new Date().toISOString().slice(0, 7),
              durationMonths: 4,
              category: 'Santé',
            });
          }
        }
      }
    }

    // 2. Specific housing installments (e.g. Turrel)
    if (upper.includes('TURREL')) {
      if (!isMerchantOrTxRejected(tx, 'Échéancier', memory)) {
        if (!existingLabels.some((l) => l.includes('TURREL'))) {
          const id = `temp-turrel-${tx.id || Math.random().toString(36).slice(2, 6)}`;
          if (!detected.some((d) => d.label.includes('Turrel'))) {
            detected.push({
              id,
              label: 'Turrel Baptiste',
              monthlyAmount: Math.round(amount * 100) / 100,
              startPeriod: tx.date ? tx.date.slice(0, 7) : new Date().toISOString().slice(0, 7),
              durationMonths: 10,
              category: 'Échéancier',
            });
          }
        }
      }
    }

    // 3. BNPL Split payments (Klarna, Alma, Floa, 3x/4x)
    if (upper.includes('KLARNA') || upper.includes('ALMA') || upper.includes('FLOA') || upper.includes('3X') || upper.includes('4X') || upper.includes('SOFINCO')) {
      const matchLabel = upper.includes('KLARNA') ? 'Klarna (Paiement 3x)' : upper.includes('ALMA') ? 'Alma (Paiement 3x/4x)' : 'Paiement fractionné (3x/4x)';
      if (!isMerchantOrTxRejected(tx, 'Échéancier', memory)) {
        if (!existingLabels.some((l) => l.includes(matchLabel.toUpperCase()))) {
          const id = `temp-bnpl-${tx.id || Math.random().toString(36).slice(2, 6)}`;
          if (!detected.some((d) => d.label === matchLabel)) {
            detected.push({
              id,
              label: matchLabel,
              monthlyAmount: Math.round(amount * 100) / 100,
              startPeriod: tx.date ? tx.date.slice(0, 7) : new Date().toISOString().slice(0, 7),
              durationMonths: 3,
              category: 'Échéancier',
            });
          }
        }
      }
    }
  }

  return detected;
}

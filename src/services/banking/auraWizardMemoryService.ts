'use client';

import type { TargetFlowItem } from '@/engines/banking/bankingTargetFlows';
import type { DetectedFlowCandidate } from '@/engines/banking/bankingFlowCandidates';

export const AURA_WIZARD_MEMORY_STORAGE_KEY = 'aura_bank_wizard_memory_v1';

export interface RejectedMerchantRule {
  pattern: string; // uppercase substring or normalized merchant e.g. "PENE MGOUDA", "DEVRED", "MR PENE"
  categoryKey?: string; // e.g. "soutien", "loyer", "temp_turrel", or "ALL"
  timestamp: number;
}

export interface AuraWizardLearningMemory {
  version: number;
  rejectedCandidateIds: string[]; // Flow candidate IDs explicitly unselected/unchecked (e.g. "flow-soutien", "flow-temp-xyz")
  rejectedMerchantPatterns: RejectedMerchantRule[]; // Pattern rules learned from deselected or removed transactions
  excludedTxSignatures: string[]; // Specific transaction fingerprints e.g. "2026-08-10:VIR SEPA PENE:50.00"
  customCategoryMappings: Record<string, string>; // normalizedTitle -> candidateId (e.g. "TotalEnergies" -> "flow-loyer")
  dismissedInsightIds: string[]; // IDs of dismissed smart insights
  lastUpdated: number;
}

export const DEFAULT_WIZARD_MEMORY: AuraWizardLearningMemory = {
  version: 1,
  rejectedCandidateIds: [],
  rejectedMerchantPatterns: [],
  excludedTxSignatures: [],
  customCategoryMappings: {},
  dismissedInsightIds: [],
  lastUpdated: 0,
};

/**
 * Generate a deterministic signature for a bank transaction
 */
export function getTxSignature(tx: TargetFlowItem): string {
  const desc = (tx.rawTitle || tx.title || '').trim().toUpperCase();
  const amt = Math.abs(tx.amount || 0).toFixed(2);
  const date = (tx.date || '').slice(0, 10);
  return `${date}:${desc}:${amt}`;
}

/**
 * Clean & normalize a merchant pattern for memory storage
 */
export function normalizeMerchantPattern(raw: string): string {
  if (!raw) return '';
  return raw
    .toUpperCase()
    .replace(/^PRLV\s+SEPA\s+/i, '')
    .replace(/^VIR\s+SEPA\s+/i, '')
    .replace(/^CARTE\s+\d{2}\/\d{2}\/\d{2}\s+/i, '')
    .replace(/^PRELEVEMENT\s+/i, '')
    .replace(/^VIREMENT\s+(DE|POUR|VERS|EMIS)?\s+/i, '')
    .replace(/^VIR\s+INST\s+/i, '')
    .replace(/^VIR\s+/i, '')
    .replace(/,\s*RÉF\s*:.*$/i, '')
    .replace(/,\s*REF\s*:.*$/i, '')
    .replace(/,\s*RUM\s+.*$/i, '')
    .replace(/CB\*\d+/i, '')
    .replace(/SCT\d+/i, '')
    .replace(/,\s*REFERENCE\s+.*$/i, '')
    .trim();
}

/**
 * Load persistent AI learning memory from localStorage
 */
export function loadWizardMemory(): AuraWizardLearningMemory {
  if (typeof window === 'undefined') return { ...DEFAULT_WIZARD_MEMORY };
  try {
    const raw = localStorage.getItem(AURA_WIZARD_MEMORY_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_WIZARD_MEMORY };
    const parsed = JSON.parse(raw);
    return {
      version: parsed.version || 1,
      rejectedCandidateIds: Array.isArray(parsed.rejectedCandidateIds) ? parsed.rejectedCandidateIds : [],
      rejectedMerchantPatterns: Array.isArray(parsed.rejectedMerchantPatterns) ? parsed.rejectedMerchantPatterns : [],
      excludedTxSignatures: Array.isArray(parsed.excludedTxSignatures) ? parsed.excludedTxSignatures : [],
      customCategoryMappings: typeof parsed.customCategoryMappings === 'object' && parsed.customCategoryMappings !== null ? parsed.customCategoryMappings : {},
      dismissedInsightIds: Array.isArray(parsed.dismissedInsightIds) ? parsed.dismissedInsightIds : [],
      lastUpdated: parsed.lastUpdated || Date.now(),
    };
  } catch (err) {
    console.warn('[AuraWizardMemory] Failed to load wizard memory from localStorage:', err);
    return { ...DEFAULT_WIZARD_MEMORY };
  }
}

/**
 * Save persistent AI learning memory to localStorage
 */
export function saveWizardMemory(memory: AuraWizardLearningMemory): void {
  if (typeof window === 'undefined') return;
  try {
    const updated = {
      ...memory,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(AURA_WIZARD_MEMORY_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('aura_wizard_memory_updated', { detail: updated }));
  } catch (err) {
    console.warn('[AuraWizardMemory] Failed to save wizard memory to localStorage:', err);
  }
}

/**
 * Completely reset AI learning memory to default (start fresh)
 */
export function resetWizardMemory(): AuraWizardLearningMemory {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(AURA_WIZARD_MEMORY_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('aura_wizard_memory_reset'));
    } catch (err) {
      console.warn('[AuraWizardMemory] Failed to clear wizard memory:', err);
    }
  }
  return { ...DEFAULT_WIZARD_MEMORY, lastUpdated: Date.now() };
}

/**
 * Check if a transaction or merchant has been rejected/excluded by user in memory
 */
export function isMerchantOrTxRejected(
  tx: TargetFlowItem,
  categoryKey?: string,
  memory?: AuraWizardLearningMemory
): boolean {
  if (!memory) return false;

  // 1. Check exact tx signature
  const sig = getTxSignature(tx);
  if (memory.excludedTxSignatures.includes(sig)) {
    return true;
  }

  // 2. Check merchant patterns
  const rawText = `${tx.rawTitle || ''} ${tx.title || ''}`.toUpperCase();
  for (const rule of memory.rejectedMerchantPatterns) {
    if (!rule.pattern) continue;
    if (rawText.includes(rule.pattern.toUpperCase())) {
      if (!rule.categoryKey || rule.categoryKey === 'ALL' || rule.categoryKey === categoryKey) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Record user choices upon wizard application / validation
 */
export function recordUserWizardFeedback({
  initialCandidates,
  selectedCandidateIds,
  candidateTxsMap,
  excludedTxIds,
  dismissedInsightIds,
  unclassifiedTxs,
  previousMemory,
}: {
  initialCandidates: DetectedFlowCandidate[];
  selectedCandidateIds: Set<string>;
  candidateTxsMap: Record<string, TargetFlowItem[]>;
  excludedTxIds: Set<string>;
  dismissedInsightIds: Set<string>;
  unclassifiedTxs: TargetFlowItem[];
  previousMemory?: AuraWizardLearningMemory;
}): AuraWizardLearningMemory {
  const currentMem = previousMemory || loadWizardMemory();

  const rejectedCandidateIdsSet = new Set<string>(currentMem.rejectedCandidateIds);
  const excludedTxSignaturesSet = new Set<string>(currentMem.excludedTxSignatures);
  const rejectedMerchantPatternsMap = new Map<string, RejectedMerchantRule>();
  
  // Seed existing patterns
  for (const p of currentMem.rejectedMerchantPatterns) {
    rejectedMerchantPatternsMap.set(`${p.pattern}::${p.categoryKey || 'ALL'}`, p);
  }

  // 1. Check candidate unselected
  for (const c of initialCandidates) {
    if (!selectedCandidateIds.has(c.id)) {
      rejectedCandidateIdsSet.add(c.id);
      // Also register merchant patterns belonging to this rejected candidate
      for (const tx of c.transactions) {
        const pattern = normalizeMerchantPattern(tx.rawTitle || tx.title);
        if (pattern && pattern.length >= 3) {
          rejectedMerchantPatternsMap.set(`${pattern}::${c.categoryKey}`, {
            pattern,
            categoryKey: c.categoryKey,
            timestamp: Date.now(),
          });
        }
        excludedTxSignaturesSet.add(getTxSignature(tx));
      }
    } else {
      // If user selected it now, remove from rejected candidate IDs
      rejectedCandidateIdsSet.delete(c.id);
    }
  }

  // 2. Check excluded / unchecked transactions within selected candidates
  for (const [candId, txs] of Object.entries(candidateTxsMap)) {
    const matchedCand = initialCandidates.find((c) => c.id === candId);
    const catKey = matchedCand ? matchedCand.categoryKey : candId;

    for (const tx of txs) {
      if (Boolean(tx.id && excludedTxIds.has(tx.id))) {
        excludedTxSignaturesSet.add(getTxSignature(tx));
        const pattern = normalizeMerchantPattern(tx.rawTitle || tx.title);
        if (pattern && pattern.length >= 3) {
          rejectedMerchantPatternsMap.set(`${pattern}::${catKey}`, {
            pattern,
            categoryKey: catKey,
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  // 3. Persist dismissed insights
  const allDismissed = Array.from(new Set([...currentMem.dismissedInsightIds, ...Array.from(dismissedInsightIds)]));

  const updatedMemory: AuraWizardLearningMemory = {
    version: 1,
    rejectedCandidateIds: Array.from(rejectedCandidateIdsSet),
    rejectedMerchantPatterns: Array.from(rejectedMerchantPatternsMap.values()),
    excludedTxSignatures: Array.from(excludedTxSignaturesSet),
    customCategoryMappings: { ...currentMem.customCategoryMappings },
    dismissedInsightIds: allDismissed,
    lastUpdated: Date.now(),
  };

  saveWizardMemory(updatedMemory);
  return updatedMemory;
}

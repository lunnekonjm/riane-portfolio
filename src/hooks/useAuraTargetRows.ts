'use client';

import { useMemo } from 'react';
import type { BankTargetAnalysisSummary } from '@/engines/bankingAnalyzerEngine';
import type { RuleCategoryItem } from '@/components/aura/AuraRulesView';

export interface AuraTargetRow {
  key: string;
  title: string;
  subtitle: string;
  flow: any;
  currentRule?: RuleCategoryItem;
  color: string;
  icon: string;
  isPercent: boolean;
  isVirementEpargne?: boolean;
}

export function useAuraTargetRows(
  targetSummary: BankTargetAnalysisSummary,
  savingsCategories: RuleCategoryItem[],
  fixedCategories: RuleCategoryItem[],
  dailyCategories: RuleCategoryItem[]
): AuraTargetRow[] {
  return useMemo(() => {
    const currentPea = savingsCategories.find((c) => (c?.name || '').toUpperCase().includes('PEA'));
    const currentLivretA = savingsCategories.find((c) => (c?.name || '').toUpperCase().includes('LIVRET'));
    const currentLoyer = fixedCategories.find((c) => (c?.name || '').toUpperCase().includes('LOYER'));
    const currentAbo = fixedCategories.find((c) => (c?.name || '').toUpperCase().includes('ABONNEMENT'));
    const currentTontine = fixedCategories.find((c) => (c?.name || '').toUpperCase().includes('TONTINE'));
    const currentSoutien = fixedCategories.find((c) => (c?.name || '').toUpperCase().includes('SOUTIEN'));
    const currentRevolut = dailyCategories.find((c) => (c?.name || '').toUpperCase().includes('REVOLUT'));

    return [
      {
        key: 'pea',
        title: 'Cible PEA / ETF',
        subtitle: 'Flux mensuel versé vers PEA (virement débité)',
        flow: targetSummary.pea,
        currentRule: currentPea,
        color: '#06b6d4',
        icon: '📈',
        isPercent: currentPea?.isPercentage ?? true,
        isVirementEpargne: true,
      },
      {
        key: 'livret_a',
        title: 'Livret A',
        subtitle: 'Flux mensuel versé vers Livret A (virement débité, non le solde)',
        flow: targetSummary.livretA,
        currentRule: currentLivretA,
        color: '#3b82f6',
        icon: '🛡️',
        isPercent: currentLivretA?.isPercentage ?? true,
        isVirementEpargne: true,
      },
      {
        key: 'loyer',
        title: 'Loyer & Logement',
        subtitle: 'CDC Habitat & charges logement',
        flow: targetSummary.loyer,
        currentRule: currentLoyer,
        color: '#f43f5e',
        icon: '🏠',
        isPercent: currentLoyer?.isPercentage ?? false,
      },
      {
        key: 'abonnement',
        title: 'Abonnements',
        subtitle: 'Bouygues Telecom, Services & Abonnements récurrents',
        flow: targetSummary.abonnement,
        currentRule: currentAbo,
        color: '#f43f5e',
        icon: '📱',
        isPercent: currentAbo?.isPercentage ?? false,
      },
      {
        key: 'tontine',
        title: 'Tontine',
        subtitle: 'Épargne solidaire collective',
        flow: targetSummary.tontine,
        currentRule: currentTontine,
        color: '#8b5cf6',
        icon: '👥',
        isPercent: currentTontine?.isPercentage ?? false,
      },
      {
        key: 'soutien',
        title: 'Soutien familial (Wave)',
        subtitle: 'Sendwave / Transferts famille',
        flow: targetSummary.soutien,
        currentRule: currentSoutien,
        color: '#f43f5e',
        icon: '❤️',
        isPercent: currentSoutien?.isPercentage ?? false,
      },
      {
        key: 'revolut',
        title: 'Revolut (Reste à vivre)',
        subtitle: 'Recharges et virements vers Revolut',
        flow: targetSummary.revolut,
        currentRule: currentRevolut,
        color: '#06b6d4',
        icon: '💳',
        isPercent: currentRevolut?.isPercentage ?? true,
      },
    ];
  }, [targetSummary, savingsCategories, fixedCategories, dailyCategories]);
}

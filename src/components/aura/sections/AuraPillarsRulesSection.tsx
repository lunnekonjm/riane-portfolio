'use client';

import React from 'react';
import type { TemporaryExpenseItem } from '@/engines/bankingAnalyzerEngine';
import type { RuleCategoryItem } from '../AuraRulesView';
import { AuraPillarCard } from './AuraPillarCard';

interface AuraPillarsRulesSectionProps {
  netSalary: number;
  totalSavings: number;
  totalFixed: number;
  totalDaily: number;
  savingsCategories: RuleCategoryItem[];
  fixedCategories: RuleCategoryItem[];
  dailyCategories: RuleCategoryItem[];
  setSavingsCategories: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>;
  setFixedCategories: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>;
  setDailyCategories: React.Dispatch<React.SetStateAction<RuleCategoryItem[]>>;
  getEffectiveAmount: (item?: RuleCategoryItem | null) => number;
  getEffectivePercent: (item?: RuleCategoryItem | null) => number;
  renderCategoryIcon: (iconType: string | undefined, defaultEmoji?: string) => string;
  openCategoryEditor: (cat: RuleCategoryItem | null, pillar: 'SAVINGS' | 'FIXED' | 'DAILY') => void;
  selectedPeriod: string;
  activeTempMonthlyTotal: number;
  activeTempExpensesForSelectedPeriod: TemporaryExpenseItem[];
  onShowToast?: (msg: string, type: 'success' | 'error') => void;
}

export function AuraPillarsRulesSection({
  netSalary,
  totalSavings,
  totalFixed,
  totalDaily,
  savingsCategories,
  fixedCategories,
  dailyCategories,
  setSavingsCategories,
  setFixedCategories,
  setDailyCategories,
  getEffectiveAmount,
  getEffectivePercent,
  renderCategoryIcon,
  openCategoryEditor,
  selectedPeriod,
  activeTempMonthlyTotal,
  activeTempExpensesForSelectedPeriod,
  onShowToast,
}: AuraPillarsRulesSectionProps) {
  return (
    <>
      {/* PILIER 1: ALLOCATION MENSUELLE D'ÉPARGNE */}
      <AuraPillarCard
        title="ALLOCATION MENSUELLE D'ÉPARGNE"
        pillar="SAVINGS"
        totalAmount={totalSavings}
        netSalary={netSalary}
        badgeBg="rgba(59, 130, 246, 0.18)"
        badgeBorder="rgba(59, 130, 246, 0.35)"
        badgeColor="#93c5fd"
        accentBorderColor="rgba(6, 182, 212, 0.4)"
        accentTextColor="var(--accent-cyan)"
        defaultEmoji="📈"
        defaultIconColor="#06b6d4"
        categories={savingsCategories}
        setCategories={setSavingsCategories}
        getEffectiveAmount={getEffectiveAmount}
        getEffectivePercent={getEffectivePercent}
        renderCategoryIcon={renderCategoryIcon}
        openCategoryEditor={openCategoryEditor}
        onShowToast={onShowToast}
        addLabel="⊕ Ajouter une catégorie d'épargne"
      />

      {/* PILIER 2: CHARGES FIXES INCOMPRESSIBLES */}
      <AuraPillarCard
        title="CHARGES FIXES INCOMPRESSIBLES"
        pillar="FIXED"
        totalAmount={totalFixed}
        netSalary={netSalary}
        badgeBg="rgba(244, 63, 94, 0.18)"
        badgeBorder="rgba(244, 63, 94, 0.35)"
        badgeColor="var(--accent-rose)"
        accentBorderColor="rgba(244, 63, 94, 0.4)"
        accentTextColor="var(--accent-rose)"
        defaultEmoji="🏠"
        defaultIconColor="#f43f5e"
        categories={fixedCategories}
        setCategories={setFixedCategories}
        getEffectiveAmount={getEffectiveAmount}
        getEffectivePercent={getEffectivePercent}
        renderCategoryIcon={renderCategoryIcon}
        openCategoryEditor={openCategoryEditor}
        onShowToast={onShowToast}
        addLabel="⊕ Ajouter une charge fixe"
        extraHeaderBanner={
          activeTempMonthlyTotal > 0 ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                fontSize: 11.5,
              }}
            >
              <strong style={{ color: 'var(--accent-rose)' }}>
                Échéances actives sur {selectedPeriod} ({activeTempExpensesForSelectedPeriod.length})
              </strong>
              <strong style={{ color: 'var(--accent-rose)' }}>+{activeTempMonthlyTotal.toFixed(2)} €/mois</strong>
            </div>
          ) : undefined
        }
      />

      {/* PILIER 3: DÉPENSES QUOTIDIENNES */}
      <AuraPillarCard
        title="DÉPENSES QUOTIDIENNES"
        pillar="DAILY"
        totalAmount={totalDaily}
        netSalary={netSalary}
        badgeBg="rgba(245, 158, 11, 0.18)"
        badgeBorder="rgba(245, 158, 11, 0.35)"
        badgeColor="var(--accent-amber)"
        accentBorderColor="rgba(245, 158, 11, 0.4)"
        accentTextColor="var(--accent-amber)"
        defaultEmoji="💳"
        defaultIconColor="#f59e0b"
        categories={dailyCategories}
        setCategories={setDailyCategories}
        getEffectiveAmount={getEffectiveAmount}
        getEffectivePercent={getEffectivePercent}
        renderCategoryIcon={renderCategoryIcon}
        openCategoryEditor={openCategoryEditor}
        onShowToast={onShowToast}
        addLabel="⊕ Ajouter un poste de dépense courante"
      />
    </>
  );
}

'use client';

import React from 'react';
import type { RiskProfileType, InvestmentObjective, ExperienceLevel } from '@/types/portfolio';
import { OBJECTIVES, EXPERIENCE_LEVELS, type RiskProfileOption } from './onboardingData';

interface OnboardingStep4BudgetProps {
  monthlyBudget: number;
  setMonthlyBudget: (budget: number) => void;
  horizonYears: number;
  riskProfile: RiskProfileType;
  selectedRiskData?: RiskProfileOption;
  objective: InvestmentObjective;
  experience: ExperienceLevel;
  maxDrawdownTolerance: number;
}

export function OnboardingStep4Budget({
  monthlyBudget,
  setMonthlyBudget,
  horizonYears,
  selectedRiskData,
  objective,
  experience,
  maxDrawdownTolerance,
}: OnboardingStep4BudgetProps) {
  return (
    <div className="onboarding-step" key="step-4">
      <h3 className="onboarding-step-title">💶 Budget mensuel &amp; Récapitulatif</h3>
      <p className="onboarding-step-subtitle">Combien souhaitez-vous investir par mois et vérifiez votre profil.</p>

      {/* Monthly Budget */}
      <div style={{ marginBottom: 28 }}>
        <label className="onboarding-label">Budget mensuel DCA (€)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="range"
            min={0}
            max={5000}
            step={50}
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(parseInt(e.target.value))}
            style={{ flex: 1, accentColor: selectedRiskData?.color || 'var(--accent-cyan)' }}
          />
          <input
            type="number"
            className="input mono"
            style={{ width: 100, fontSize: 14, textAlign: 'center', fontWeight: 700 }}
            min={0}
            max={50000}
            step={50}
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(Math.max(0, parseInt(e.target.value) || 0))}
          />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>€/mois</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>
          ≈ {(monthlyBudget * 12).toLocaleString('fr-FR')} €/an · {(monthlyBudget * horizonYears * 12).toLocaleString('fr-FR')} € sur {horizonYears} ans
        </div>
      </div>

      {/* Profile Summary */}
      <div className="onboarding-summary">
        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          📋 Votre Profil Investisseur
        </h4>
        <div className="onboarding-summary-grid">
          <div className="onboarding-summary-item">
            <span className="onboarding-summary-label">Profil de risque</span>
            <span className="onboarding-summary-value" style={{ color: selectedRiskData?.color }}>
              {selectedRiskData?.icon} {selectedRiskData?.label}
            </span>
          </div>
          <div className="onboarding-summary-item">
            <span className="onboarding-summary-label">Horizon</span>
            <span className="onboarding-summary-value">⏳ {horizonYears} ans</span>
          </div>
          <div className="onboarding-summary-item">
            <span className="onboarding-summary-label">Objectif</span>
            <span className="onboarding-summary-value">
              {OBJECTIVES.find((o) => o.value === objective)?.icon} {OBJECTIVES.find((o) => o.value === objective)?.label}
            </span>
          </div>
          <div className="onboarding-summary-item">
            <span className="onboarding-summary-label">Expérience</span>
            <span className="onboarding-summary-value">
              {EXPERIENCE_LEVELS.find((e) => e.value === experience)?.icon} {EXPERIENCE_LEVELS.find((e) => e.value === experience)?.label}
            </span>
          </div>
          <div className="onboarding-summary-item">
            <span className="onboarding-summary-label">Tolérance drawdown</span>
            <span className="onboarding-summary-value">📉 Jusqu&apos;à -{(maxDrawdownTolerance * 100).toFixed(0)}%</span>
          </div>
          <div className="onboarding-summary-item">
            <span className="onboarding-summary-label">Budget DCA</span>
            <span className="onboarding-summary-value">💶 {monthlyBudget.toLocaleString('fr-FR')} €/mois</span>
          </div>
        </div>
      </div>
    </div>
  );
}

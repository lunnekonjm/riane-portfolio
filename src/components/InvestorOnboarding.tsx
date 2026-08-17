'use client';

import { useState } from 'react';
import type { InvestorProfile, RiskProfileType, InvestmentObjective, ExperienceLevel } from '@/types/portfolio';
import { RISK_PROFILES } from './onboarding/onboardingData';
import { OnboardingStep1Risk } from './onboarding/OnboardingStep1Risk';
import { OnboardingStep2Horizon } from './onboarding/OnboardingStep2Horizon';
import { OnboardingStep3Experience } from './onboarding/OnboardingStep3Experience';
import { OnboardingStep4Budget } from './onboarding/OnboardingStep4Budget';

interface InvestorOnboardingProps {
  onComplete: (profile: InvestorProfile) => void;
  existingProfile?: InvestorProfile | null;
}

export default function InvestorOnboarding({ onComplete, existingProfile }: InvestorOnboardingProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Form state
  const [riskProfile, setRiskProfile] = useState<RiskProfileType>(existingProfile?.riskProfile || 'dynamic');
  const [horizonYears, setHorizonYears] = useState<number>(existingProfile?.horizonYears || 15);
  const [objective, setObjective] = useState<InvestmentObjective>(existingProfile?.objective || 'wealth-building');
  const [experience, setExperience] = useState<ExperienceLevel>(existingProfile?.experience || 'intermediate');
  const [maxDrawdownTolerance, setMaxDrawdownTolerance] = useState<number>(existingProfile?.maxDrawdownTolerance || 0.3);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(existingProfile?.monthlyBudget || 500);

  const handleComplete = () => {
    const profile: InvestorProfile = {
      riskProfile,
      horizonYears,
      objective,
      experience,
      maxDrawdownTolerance,
      monthlyBudget,
      onboardingCompleted: true,
      updatedAt: Date.now(),
    };
    onComplete(profile);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!riskProfile;
      case 2: return horizonYears > 0 && !!objective;
      case 3: return maxDrawdownTolerance > 0 && !!experience;
      case 4: return monthlyBudget >= 0;
      default: return true;
    }
  };

  const progressPercent = (step / totalSteps) * 100;
  const selectedRiskData = RISK_PROFILES.find((r) => r.value === riskProfile);

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        {/* Header */}
        <div className="onboarding-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="sidebar-logo-icon" style={{ width: 40, height: 40, fontSize: 20 }}>R</div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {existingProfile ? 'Modifier mon Profil Investisseur' : 'Bienvenue sur RIANE'}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>
                Étape {step} sur {totalSteps} — {step === 1 ? 'Profil de risque' : step === 2 ? 'Horizon & Objectif' : step === 3 ? 'Tolérance & Expérience' : 'Budget & Récapitulatif'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="onboarding-progress-bar">
          <div className="onboarding-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Step Content */}
        <div className="onboarding-body">
          {step === 1 && (
            <OnboardingStep1Risk
              riskProfile={riskProfile}
              onSelectProfile={(val, drawdown) => {
                setRiskProfile(val);
                setMaxDrawdownTolerance(drawdown);
              }}
            />
          )}

          {step === 2 && (
            <OnboardingStep2Horizon
              horizonYears={horizonYears}
              setHorizonYears={setHorizonYears}
              objective={objective}
              setObjective={setObjective}
            />
          )}

          {step === 3 && (
            <OnboardingStep3Experience
              maxDrawdownTolerance={maxDrawdownTolerance}
              setMaxDrawdownTolerance={setMaxDrawdownTolerance}
              experience={experience}
              setExperience={setExperience}
            />
          )}

          {step === 4 && (
            <OnboardingStep4Budget
              monthlyBudget={monthlyBudget}
              setMonthlyBudget={setMonthlyBudget}
              horizonYears={horizonYears}
              riskProfile={riskProfile}
              selectedRiskData={selectedRiskData}
              objective={objective}
              experience={experience}
              maxDrawdownTolerance={maxDrawdownTolerance}
            />
          )}
        </div>

        {/* Footer Navigation */}
        <div className="onboarding-footer">
          {step > 1 ? (
            <button type="button" className="btn btn-secondary" onClick={() => setStep(step - 1)}>
              ← Précédent
            </button>
          ) : (
            <div />
          )}
          {step < totalSteps ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canProceed()}
              onClick={() => setStep(step + 1)}
              style={{ minWidth: 140 }}
            >
              Suivant →
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canProceed()}
              onClick={handleComplete}
              style={{
                minWidth: 180,
                background: selectedRiskData?.color || 'var(--accent-cyan)',
                fontWeight: 700,
              }}
            >
              ✅ Valider mon Profil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

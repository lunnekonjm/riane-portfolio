'use client';

import React from 'react';
import type { RiskProfileType } from '@/types/portfolio';
import { RISK_PROFILES } from './onboardingData';

interface OnboardingStep1RiskProps {
  riskProfile: RiskProfileType;
  onSelectProfile: (val: RiskProfileType, drawdown: number) => void;
}

export function OnboardingStep1Risk({
  riskProfile,
  onSelectProfile,
}: OnboardingStep1RiskProps) {
  return (
    <div className="onboarding-step" key="step-1">
      <h3 className="onboarding-step-title">🎯 Quel est votre profil de risque ?</h3>
      <p className="onboarding-step-subtitle">Choisissez le niveau de risque qui correspond à votre tempérament d&apos;investisseur.</p>

      <div className="onboarding-cards-grid">
        {RISK_PROFILES.map((profile) => (
          <button
            key={profile.value}
            type="button"
            className={`onboarding-card ${riskProfile === profile.value ? 'onboarding-card-selected' : ''}`}
            onClick={() => onSelectProfile(profile.value, profile.drawdown)}
            style={{
              background: riskProfile === profile.value ? profile.gradient : undefined,
              borderColor: riskProfile === profile.value ? profile.color : undefined,
            }}
          >
            <span className="onboarding-card-icon">{profile.icon}</span>
            <span className="onboarding-card-label" style={{ color: riskProfile === profile.value ? profile.color : undefined }}>
              {profile.label}
            </span>
            <span className="onboarding-card-desc">{profile.description}</span>
            <span className="onboarding-card-example">{profile.example}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

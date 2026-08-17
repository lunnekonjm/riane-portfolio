'use client';

import React from 'react';
import type { ExperienceLevel } from '@/types/portfolio';
import { DRAWDOWN_QUESTIONS, EXPERIENCE_LEVELS } from './onboardingData';

interface OnboardingStep3ExperienceProps {
  maxDrawdownTolerance: number;
  setMaxDrawdownTolerance: (val: number) => void;
  experience: ExperienceLevel;
  setExperience: (val: ExperienceLevel) => void;
}

export function OnboardingStep3Experience({
  maxDrawdownTolerance,
  setMaxDrawdownTolerance,
  experience,
  setExperience,
}: OnboardingStep3ExperienceProps) {
  return (
    <div className="onboarding-step" key="step-3">
      <h3 className="onboarding-step-title">🧘 Tolérance à la volatilité &amp; Expérience</h3>
      <p className="onboarding-step-subtitle">Si votre portefeuille perdait une partie de sa valeur en un mois, quelle serait votre réaction ?</p>

      {/* Drawdown Tolerance */}
      <div style={{ marginBottom: 24 }}>
        <label className="onboarding-label">Réaction face à une baisse</label>
        <div className="onboarding-drawdown-grid">
          {DRAWDOWN_QUESTIONS.map((q) => (
            <button
              key={q.value}
              type="button"
              className={`onboarding-drawdown-btn ${maxDrawdownTolerance === q.value ? 'onboarding-drawdown-btn-selected' : ''}`}
              onClick={() => setMaxDrawdownTolerance(q.value)}
            >
              <span style={{ fontSize: 22 }}>{q.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <label className="onboarding-label">Niveau d&apos;expérience</label>
        <div className="onboarding-experience-grid">
          {EXPERIENCE_LEVELS.map((exp) => (
            <button
              key={exp.value}
              type="button"
              className={`onboarding-experience-btn ${experience === exp.value ? 'onboarding-experience-btn-selected' : ''}`}
              onClick={() => setExperience(exp.value)}
            >
              <span style={{ fontSize: 20 }}>{exp.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{exp.label}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>{exp.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

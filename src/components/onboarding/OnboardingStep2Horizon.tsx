'use client';

import React from 'react';
import type { InvestmentObjective } from '@/types/portfolio';
import { OBJECTIVES, HORIZON_PRESETS } from './onboardingData';

interface OnboardingStep2HorizonProps {
  horizonYears: number;
  setHorizonYears: (years: number) => void;
  objective: InvestmentObjective;
  setObjective: (obj: InvestmentObjective) => void;
}

export function OnboardingStep2Horizon({
  horizonYears,
  setHorizonYears,
  objective,
  setObjective,
}: OnboardingStep2HorizonProps) {
  return (
    <div className="onboarding-step" key="step-2">
      <h3 className="onboarding-step-title">⏳ Horizon d&apos;investissement &amp; Objectif</h3>
      <p className="onboarding-step-subtitle">Sur combien d&apos;années comptez-vous investir et quel est votre objectif principal ?</p>

      {/* Horizon Presets */}
      <div style={{ marginBottom: 24 }}>
        <label className="onboarding-label">Horizon de placement</label>
        <div className="onboarding-horizon-grid">
          {HORIZON_PRESETS.map((preset) => (
            <button
              key={preset.years}
              type="button"
              className={`onboarding-horizon-btn ${horizonYears === preset.years ? 'onboarding-horizon-btn-selected' : ''}`}
              onClick={() => setHorizonYears(preset.years)}
            >
              <span className="onboarding-horizon-years">{preset.label}</span>
              <span className="onboarding-horizon-tag">{preset.tag}</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Personnalisé :</span>
          <input
            type="number"
            className="input mono"
            style={{ width: 80, fontSize: 13, textAlign: 'center' }}
            min={1}
            max={50}
            value={horizonYears}
            onChange={(e) => setHorizonYears(Math.max(1, parseInt(e.target.value) || 1))}
          />
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>ans</span>
        </div>
      </div>

      {/* Objective */}
      <div>
        <label className="onboarding-label">Objectif principal</label>
        <div className="onboarding-objective-grid">
          {OBJECTIVES.map((obj) => (
            <button
              key={obj.value}
              type="button"
              className={`onboarding-objective-btn ${objective === obj.value ? 'onboarding-objective-btn-selected' : ''}`}
              onClick={() => setObjective(obj.value)}
            >
              <span style={{ fontSize: 20 }}>{obj.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{obj.label}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>{obj.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import type { InvestorProfile, RiskProfileType, InvestmentObjective, ExperienceLevel } from '@/types/portfolio';

interface InvestorOnboardingProps {
  onComplete: (profile: InvestorProfile) => void;
  existingProfile?: InvestorProfile | null;
}

const RISK_PROFILES: Array<{
  value: RiskProfileType;
  label: string;
  icon: string;
  description: string;
  example: string;
  color: string;
  gradient: string;
  drawdown: number;
}> = [
  {
    value: 'conservative',
    label: 'Conservateur',
    icon: '🛡️',
    description: 'Priorité à la préservation du capital. Volatilité minimale.',
    example: 'ETF obligataires, fonds euros, ETF MSCI World uniquement',
    color: 'var(--accent-emerald)',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 95, 70, 0.15) 100%)',
    drawdown: 0.1,
  },
  {
    value: 'balanced',
    label: 'Équilibré',
    icon: '⚖️',
    description: 'Équilibre entre croissance et protection. Diversification large.',
    example: '60% ETF World + 30% obligations + 10% small caps',
    color: 'var(--accent-cyan)',
    gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(14, 116, 144, 0.15) 100%)',
    drawdown: 0.2,
  },
  {
    value: 'dynamic',
    label: 'Dynamique',
    icon: '🚀',
    description: 'Croissance active avec satellite thématique. Accepte la volatilité.',
    example: '50% ETF World + 20% Nasdaq + 20% actions + 10% spéculatif',
    color: 'var(--accent-violet)',
    gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(91, 33, 182, 0.15) 100%)',
    drawdown: 0.3,
  },
  {
    value: 'aggressive',
    label: 'Agressif',
    icon: '⚡',
    description: 'Performance maximale. Forte concentration et risque élevé accepté.',
    example: 'Actions individuelles, small caps, crypto, levier',
    color: 'var(--accent-rose)',
    gradient: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2) 0%, rgba(159, 18, 57, 0.15) 100%)',
    drawdown: 0.5,
  },
];

const OBJECTIVES: Array<{ value: InvestmentObjective; label: string; icon: string; description: string }> = [
  { value: 'wealth-building', label: 'Constitution de patrimoine', icon: '🏗️', description: 'Construire un capital à long terme via le DCA et la capitalisation des intérêts composés.' },
  { value: 'passive-income', label: 'Revenus passifs', icon: '💰', description: 'Générer des dividendes et des rentes régulières pour compléter vos revenus.' },
  { value: 'financial-independence', label: 'Indépendance financière', icon: '🏝️', description: 'Atteindre la liberté financière et pouvoir vivre de vos investissements.' },
  { value: 'speculation', label: 'Spéculation / Trading', icon: '🎯', description: 'Recherche de gains rapides via des paris directionnels ciblés.' },
];

const EXPERIENCE_LEVELS: Array<{ value: ExperienceLevel; label: string; icon: string; description: string }> = [
  { value: 'beginner', label: 'Débutant', icon: '🌱', description: 'Moins de 2 ans d\'investissement. Apprentissage des bases.' },
  { value: 'intermediate', label: 'Intermédiaire', icon: '📈', description: '2–5 ans d\'expérience. Connaît le DCA, les ETF, les enveloppes fiscales.' },
  { value: 'advanced', label: 'Avancé', icon: '🧠', description: '+5 ans d\'expérience. Maîtrise l\'allocation, le risk management et la valorisation.' },
];

const DRAWDOWN_QUESTIONS: Array<{ value: number; label: string; icon: string }> = [
  { value: 0.1, label: 'Je vendrais dès -10%', icon: '😰' },
  { value: 0.2, label: 'Je tiendrais jusqu\'à -20%', icon: '😐' },
  { value: 0.3, label: 'Je renforcerais à -30%', icon: '💪' },
  { value: 0.5, label: 'Je ne panique jamais, même à -50%', icon: '🧘' },
];

const HORIZON_PRESETS = [
  { years: 3, label: '3 ans', tag: 'Court terme' },
  { years: 5, label: '5 ans', tag: 'Moyen terme' },
  { years: 10, label: '10 ans', tag: 'Long terme' },
  { years: 15, label: '15 ans', tag: 'Patrimoine' },
  { years: 20, label: '20 ans', tag: 'Retraite' },
  { years: 30, label: '30+', tag: 'Génération' },
];

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

          {/* ═══════════════════════════════════════════════════════ */}
          {/* STEP 1: Risk Profile                                   */}
          {/* ═══════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="onboarding-step" key="step-1">
              <h3 className="onboarding-step-title">🎯 Quel est votre profil de risque ?</h3>
              <p className="onboarding-step-subtitle">Choisissez le niveau de risque qui correspond à votre tempérament d&apos;investisseur.</p>

              <div className="onboarding-cards-grid">
                {RISK_PROFILES.map((profile) => (
                  <button
                    key={profile.value}
                    type="button"
                    className={`onboarding-card ${riskProfile === profile.value ? 'onboarding-card-selected' : ''}`}
                    onClick={() => {
                      setRiskProfile(profile.value);
                      setMaxDrawdownTolerance(profile.drawdown);
                    }}
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
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* STEP 2: Horizon & Objective                            */}
          {/* ═══════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="onboarding-step" key="step-2">
              <h3 className="onboarding-step-title">⏳ Horizon d&apos;investissement & Objectif</h3>
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
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* STEP 3: Drawdown Tolerance & Experience                */}
          {/* ═══════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="onboarding-step" key="step-3">
              <h3 className="onboarding-step-title">🧘 Tolérance à la volatilité & Expérience</h3>
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
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* STEP 4: Budget & Summary                               */}
          {/* ═══════════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="onboarding-step" key="step-4">
              <h3 className="onboarding-step-title">💶 Budget mensuel & Récapitulatif</h3>
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

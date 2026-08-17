import type { RiskProfileType, InvestmentObjective, ExperienceLevel } from '@/types/portfolio';

export interface RiskProfileOption {
  value: RiskProfileType;
  label: string;
  icon: string;
  description: string;
  example: string;
  color: string;
  gradient: string;
  drawdown: number;
}

export const RISK_PROFILES: RiskProfileOption[] = [
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

export interface ObjectiveOption {
  value: InvestmentObjective;
  label: string;
  icon: string;
  description: string;
}

export const OBJECTIVES: ObjectiveOption[] = [
  { value: 'wealth-building', label: 'Constitution de patrimoine', icon: '🏗️', description: 'Construire un capital à long terme via le DCA et la capitalisation des intérêts composés.' },
  { value: 'passive-income', label: 'Revenus passifs', icon: '💰', description: 'Générer des dividendes et des rentes régulières pour compléter vos revenus.' },
  { value: 'financial-independence', label: 'Indépendance financière', icon: '🏝️', description: 'Atteindre la liberté financière et pouvoir vivre de vos investissements.' },
  { value: 'speculation', label: 'Spéculation / Trading', icon: '🎯', description: 'Recherche de gains rapides via des paris directionnels ciblés.' },
];

export interface ExperienceOption {
  value: ExperienceLevel;
  label: string;
  icon: string;
  description: string;
}

export const EXPERIENCE_LEVELS: ExperienceOption[] = [
  { value: 'beginner', label: 'Débutant', icon: '🌱', description: 'Moins de 2 ans d\'investissement. Apprentissage des bases.' },
  { value: 'intermediate', label: 'Intermédiaire', icon: '📈', description: '2–5 ans d\'expérience. Connaît le DCA, les ETF, les enveloppes fiscales.' },
  { value: 'advanced', label: 'Avancé', icon: '🧠', description: '+5 ans d\'expérience. Maîtrise l\'allocation, le risk management et la valorisation.' },
];

export interface DrawdownOption {
  value: number;
  label: string;
  icon: string;
}

export const DRAWDOWN_QUESTIONS: DrawdownOption[] = [
  { value: 0.1, label: 'Je vendrais dès -10%', icon: '😰' },
  { value: 0.2, label: 'Je tiendrais jusqu\'à -20%', icon: '😐' },
  { value: 0.3, label: 'Je renforcerais à -30%', icon: '💪' },
  { value: 0.5, label: 'Je ne panique jamais, même à -50%', icon: '🧘' },
];

export const HORIZON_PRESETS = [
  { years: 3, label: '3 ans', tag: 'Court terme' },
  { years: 5, label: '5 ans', tag: 'Moyen terme' },
  { years: 10, label: '10 ans', tag: 'Long terme' },
  { years: 15, label: '15 ans', tag: 'Patrimoine' },
  { years: 20, label: '20 ans', tag: 'Retraite' },
  { years: 30, label: '30+', tag: 'Génération' },
];

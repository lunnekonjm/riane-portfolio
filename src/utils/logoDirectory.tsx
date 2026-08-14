/**
 * Annuaire et Résolveur de Logos & Symboles Financiers Haute Définition
 * Fournit des logos vectoriels SVG ultra-nets intégrés au thème sombre (FinTech Premium)
 * pour les principales actions, ETF, cryptos et banques, avec fallback élégant.
 */

import React from 'react';

export interface LogoInfo {
  svg?: React.ReactNode;
  url?: string;
  fallbackLetters: string;
  fallbackColor: string;
  fallbackEmoji?: string;
  brandBg?: string;
}

// Couleurs de pastilles harmonisées
const PALETTE_COLORS = [
  'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)', // Cyan / Bleu
  'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Émeraude / Vert
  'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', // Violet
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // Ambre
  'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', // Rose
  'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Indigo
];

/**
 * Bibliothèque de composants SVG Vectoriels Haute Définition
 */
export const VECTOR_LOGOS: Record<string, { svg: React.ReactNode; bg: string }> = {
  // ── Coherent Corp (COHR) : Noyau orbital photonique & laser cyan ──
  'COHR': {
    bg: 'linear-gradient(135deg, #05192d 0%, #022340 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <ellipse cx="18" cy="18" rx="14" ry="6.5" transform="rotate(-30 18 18)" stroke="#06b6d4" strokeWidth="1.8" opacity="0.9" />
        <ellipse cx="18" cy="18" rx="14" ry="6.5" transform="rotate(30 18 18)" stroke="#38bdf8" strokeWidth="1.8" opacity="0.9" />
        <ellipse cx="18" cy="18" rx="14" ry="6.5" transform="rotate(90 18 18)" stroke="#0284c7" strokeWidth="1.8" opacity="0.75" />
        <circle cx="18" cy="18" r="3.5" fill="#ffffff" />
        <circle cx="18" cy="18" r="5" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
      </svg>
    ),
  },

  // ── Constellation Energy (CEG) : Rayonnement énergétique / Starburst émeraude & or ──
  'CEG': {
    bg: 'linear-gradient(135deg, #041f17 0%, #063828 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M18 4 L21 15 L32 18 L21 21 L18 32 L15 21 L4 18 L15 15 Z" fill="url(#ceg-grad)" />
        <circle cx="18" cy="18" r="3.8" fill="#ffffff" />
        <circle cx="18" cy="18" r="7.5" stroke="#34d399" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.8" />
        <defs>
          <linearGradient id="ceg-grad" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34d399" />
            <stop offset="0.5" stopColor="#06b6d4" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },

  // ── Symbotic (SYM) : Ruban 'S' géométrique robotique vert & acier ──
  'SYM': {
    bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M26 10 C26 7.5 23.5 6 18 6 C12.5 6 9 8.5 9 13 C9 19.5 27 16.5 27 23 C27 27.5 23.5 30 18 30 C12.5 30 10 28.5 10 26" stroke="#4ade80" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M14 11 L22 11" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 25 L22 25" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },

  // ── Amundi ETF (PUST, CW8, DCAM, GPEA, PAEEM) : Emblème Amundi royal ──
  'AMUNDI': {
    bg: 'linear-gradient(135deg, #002244 0%, #003366 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <text x="18" y="21" fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="-0.5">Am</text>
        <rect x="7" y="24.5" width="22" height="2.8" rx="1.4" fill="#00a3e0" />
      </svg>
    ),
  },

  // ── Indépendance AM (0P0001DKPM / IES) : Olivier doré & émeraude de croissance ──
  'INDEPENDANCE': {
    bg: 'linear-gradient(135deg, #0d2818 0%, #153e26 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M18 29 L18 20 M18 20 C18 16 13 14 11 11 C16 11 17 14 18 20 M18 20 C18 16 23 14 25 11 C20 11 19 14 18 20" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        <circle cx="18" cy="11" r="5" fill="#10b981" opacity="0.85" />
        <circle cx="12" cy="13" r="3.8" fill="#34d399" opacity="0.75" />
        <circle cx="24" cy="13" r="3.8" fill="#34d399" opacity="0.75" />
        <circle cx="15" cy="8" r="3.5" fill="#f59e0b" opacity="0.8" />
        <circle cx="21" cy="8" r="3.5" fill="#f59e0b" opacity="0.8" />
        <line x1="12" y1="29" x2="24" y2="29" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },

  // ── Memscap (MEMS.PA) : Puce silicium micro-capteurs MEMS & photonique ──
  'MEMS': {
    bg: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect x="8" y="8" width="20" height="20" rx="3" stroke="#38bdf8" strokeWidth="2" fill="#0369a1" fillOpacity="0.25" />
        <path d="M12 18 L15 13 L18 18 L21 13 L24 18" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="18" r="1.5" fill="#ffffff" />
        <circle cx="18" cy="18" r="1.5" fill="#ffffff" />
        <circle cx="24" cy="18" r="1.5" fill="#ffffff" />
        <line x1="18" y1="21" x2="18" y2="25" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="13" y1="25" x2="23" y2="25" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },

  // ── Riber (ALRIB.PA) : Cristallogenèse MBE & Faisceau moléculaire ultra-vide ──
  'RIBER': {
    bg: 'linear-gradient(135deg, #0a192f 0%, #0f2744 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect x="7" y="7" width="22" height="22" rx="4" stroke="#0284c7" strokeWidth="1.5" />
        <path d="M12 25 L12 11 L19 11 C21.5 11 23 12.5 23 15 C23 17.5 21.5 19 19 19 L12 19 M17.5 19 L23.5 25" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="11" r="2" fill="#00e5ff" />
      </svg>
    ),
  },

  // ── Alan Allman Associates (ALALM.PA) : Double A Haute Technologie ──
  'ALALM': {
    bg: 'linear-gradient(135deg, #1e1b4b 0%, #2e1065 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M12 26 L18 10 L24 26" stroke="#c084fc" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 21 L22 21" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
        <circle cx="18" cy="8" r="2" fill="#38bdf8" />
      </svg>
    ),
  },

  // ── Eurobio Scientific (ALERS.PA) : Helix & Biotech Star ──
  'ALERS': {
    bg: 'linear-gradient(135deg, #042f2e 0%, #064e3b 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <circle cx="18" cy="18" r="10" stroke="#14b8a6" strokeWidth="1.8" strokeDasharray="3 3" />
        <path d="M18 9 L18 27 M9 18 L27 18" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="18" cy="18" r="3.5" fill="#f59e0b" />
      </svg>
    ),
  },

  // ── Nvidia (NVDA) ──
  'NVDA': {
    bg: 'linear-gradient(135deg, #091a0f 0%, #0d2e1a 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M8 22 C8 15 13 9 20 9 C24 9 27 11 28 13 C26 14 24 15 22 15 C17 15 13 18 13 22 C13 25 15 27 18 27 C20 27 22 26 23 25 L23 21 L18 21 L18 18 L27 18 L27 26 C25 28 22 30 18 30 C12 30 8 26 8 22 Z" fill="#76b900" />
      </svg>
    ),
  },

  // ── Apple (AAPL) ──
  'AAPL': {
    bg: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M22.5 8 C23.5 6.8 24 5.2 23.8 3.5 C22.4 3.6 20.7 4.5 19.8 5.6 C19 6.5 18.3 8.2 18.5 9.8 C20.1 9.9 21.6 9 22.5 8 Z M24.5 17.5 C24.5 14.2 27.2 12.5 27.3 12.4 C25.8 10.2 23.4 9.9 22.6 9.8 C20.6 9.6 18.6 11 17.6 11 C16.5 11 14.9 9.8 13.3 9.8 C11.1 9.8 9.1 11.1 8 13 C5.7 16.9 7.4 22.8 9.6 26 C10.7 27.6 11.9 29.3 13.6 29.2 C15.3 29.1 15.9 28.1 17.9 28.1 C19.9 28.1 20.5 29.2 22.3 29.2 C24.1 29.1 25.2 27.6 26.3 26 C27.6 24.1 28.1 22.3 28.2 22.2 C28.1 22.1 24.5 20.8 24.5 17.5 Z" fill="#ffffff" />
      </svg>
    ),
  },

  // ── Microsoft (MSFT) ──
  'MSFT': {
    bg: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect x="8" y="8" width="9" height="9" fill="#f25022" />
        <rect x="19" y="8" width="9" height="9" fill="#7fba00" />
        <rect x="8" y="19" width="9" height="9" fill="#00a4ef" />
        <rect x="19" y="19" width="9" height="9" fill="#ffb900" />
      </svg>
    ),
  },

  // ── Google (GOOGL / GOOG) ──
  'GOOGL': {
    bg: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M26.5 18.2 C26.5 17.5 26.4 16.9 26.3 16.3 L18 16.3 L18 19.8 L22.8 19.8 C22.6 21 21.9 22 20.9 22.7 L20.9 25.1 L23.9 25.1 C25.7 23.4 26.5 21 26.5 18.2 Z" fill="#4285f4" />
        <path d="M18 27 C20.4 27 22.5 26.2 23.9 25.1 L20.9 22.7 C20.1 23.3 19.1 23.6 18 23.6 C15.7 23.6 13.7 22 13 20 L9.9 20 L9.9 22.4 C11.4 25.4 14.5 27 18 27 Z" fill="#34a853" />
        <path d="M13 20 C12.8 19.4 12.7 18.7 12.7 18 C12.7 17.3 12.8 16.6 13 16 L13 13.6 L9.9 13.6 C9.3 14.9 9 16.4 9 18 C9 19.6 9.3 21.1 9.9 22.4 L13 20 Z" fill="#fbbc05" />
        <path d="M18 12.4 C19.3 12.4 20.5 12.9 21.4 13.7 L24 11.1 C22.4 9.6 20.4 8.8 18 8.8 C14.5 8.8 11.4 10.6 9.9 13.6 L13 16 C13.7 13.9 15.7 12.4 18 12.4 Z" fill="#ea4335" />
      </svg>
    ),
  },

  // ── Palantir (PLTR) ──
  'PLTR': {
    bg: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <circle cx="18" cy="16" r="7.5" stroke="#ffffff" strokeWidth="2.2" />
        <circle cx="18" cy="16" r="2" fill="#ffffff" />
        <path d="M13 27 L23 27 M18 23.5 L18 27" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
  },

  // ── Bitcoin (BTC) ──
  'BTC': {
    bg: 'linear-gradient(135deg, #f7931a 0%, #d97706 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <text x="18" y="24" fill="#ffffff" fontSize="19" fontWeight="800" fontFamily="sans-serif" textAnchor="middle">₿</text>
      </svg>
    ),
  },

  // ── Ethereum (ETH) ──
  'ETH': {
    bg: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M18 6 L18 16.5 L24.5 19.5 Z" fill="#c084fc" opacity="0.8" />
        <path d="M18 6 L11.5 19.5 L18 16.5 Z" fill="#a855f7" />
        <path d="M18 22.5 L18 29.5 L24.5 21 Z" fill="#c084fc" opacity="0.8" />
        <path d="M18 22.5 L11.5 21 L18 29.5 Z" fill="#a855f7" />
        <path d="M18 16.5 L24.5 19.5 L18 22.5 Z" fill="#e9d5ff" opacity="0.9" />
        <path d="M18 16.5 L18 22.5 L11.5 19.5 Z" fill="#d8b4fe" />
      </svg>
    ),
  },

  // ── Solana (SOL) ──
  'SOL': {
    bg: 'linear-gradient(135deg, #180b2b 0%, #2e1065 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M10 23.5 L24 23.5 L26 21.5 L12 21.5 Z" fill="#14f195" />
        <path d="M12 18.5 L26 18.5 L24 16.5 L10 16.5 Z" fill="#00d2ff" />
        <path d="M10 13.5 L24 13.5 L26 11.5 L12 11.5 Z" fill="#9945ff" />
      </svg>
    ),
  },

  // ── BoursoBank (Banque & Épargne) ──
  'BOURSOBANK': {
    bg: 'linear-gradient(135deg, #0b1526 0%, #1e1b4b 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <circle cx="18" cy="18" r="13" fill="#ec4899" />
        <text x="18" y="24" fill="#ffffff" fontSize="17" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">B</text>
      </svg>
    ),
  },

  // ── Natixis (PEE / Salariale) ──
  'NATIXIS': {
    bg: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M10 26 L10 10 L16 10 L22 22 L22 10 L26 10 L26 26 L20 26 L14 14 L14 26 Z" fill="#a855f7" />
        <circle cx="26" cy="10" r="2.5" fill="#f43f5e" />
      </svg>
    ),
  },

  // ── Linxea (Assurance-Vie) ──
  'LINXEA': {
    bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <text x="16" y="24" fill="#38bdf8" fontSize="18" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">L</text>
        <circle cx="25" cy="14" r="3.2" fill="#f59e0b" />
      </svg>
    ),
  },

  // ── Crédit Agricole ──
  'CREDIT_AGRICOLE': {
    bg: 'linear-gradient(135deg, #052e24 0%, #064e3b 100%)',
    svg: (
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M9 25 C9 15 15 10 24 10 L24 15 C18 15 15 18 15 25 Z" fill="#10b981" />
        <path d="M16 27 L27 16 L27 27 Z" fill="#f43f5e" />
      </svg>
    ),
  },
};

/**
 * Extrait 1 ou 2 initiales élégantes pour le badge de repli
 */
function getInitials(nameOrTicker: string): string {
  const cleaned = nameOrTicker.replace(/[^a-zA-Z0-9]/g, ' ').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '•';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Calcule une couleur déterministe
 */
function getDeterministicColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE_COLORS.length;
  return PALETTE_COLORS[index];
}

/**
 * Résout le logo avec priorité absolue aux composants SVG Vectoriels intégrés
 */
export function resolveAssetLogo(
  ticker?: string,
  name?: string,
  envelope?: string,
  institutionName?: string
): LogoInfo {
  const normTicker = (ticker || '').toUpperCase().trim();
  const cleanTicker = normTicker.split('.')[0];
  const normName = (name || '').toLowerCase().trim();
  const normInst = (institutionName || '').toLowerCase().trim();

  const fallbackKey = normTicker || name || 'ACTIF';
  const fallbackLetters = getInitials(cleanTicker || name || 'A');
  const fallbackColor = getDeterministicColor(fallbackKey);

  // 1. Détection Vectorielle Directe par Ticker ou Société
  if (normTicker === 'COHR' || cleanTicker === 'COHR' || normName.includes('coherent')) {
    return { svg: VECTOR_LOGOS['COHR'].svg, brandBg: VECTOR_LOGOS['COHR'].bg, fallbackLetters: 'CO', fallbackColor };
  }
  if (normTicker === 'CEG' || cleanTicker === 'CEG' || normName.includes('constellation')) {
    return { svg: VECTOR_LOGOS['CEG'].svg, brandBg: VECTOR_LOGOS['CEG'].bg, fallbackLetters: 'CE', fallbackColor };
  }
  if (normTicker === 'SYM' || cleanTicker === 'SYM' || normName.includes('symbotic')) {
    return { svg: VECTOR_LOGOS['SYM'].svg, brandBg: VECTOR_LOGOS['SYM'].bg, fallbackLetters: 'SY', fallbackColor };
  }
  if (normTicker.includes('0P0001DKPM') || cleanTicker === 'IES' || normName.includes('independance') || normName.includes('indépendance')) {
    return { svg: VECTOR_LOGOS['INDEPENDANCE'].svg, brandBg: VECTOR_LOGOS['INDEPENDANCE'].bg, fallbackLetters: 'IA', fallbackColor };
  }
  if (normTicker.includes('MEMS') || cleanTicker === 'MEMS' || cleanTicker === 'ALMEM' || normName.includes('memscap')) {
    return { svg: VECTOR_LOGOS['MEMS'].svg, brandBg: VECTOR_LOGOS['MEMS'].bg, fallbackLetters: 'ME', fallbackColor };
  }
  if (normTicker.includes('ALRIB') || cleanTicker === 'ALRIB' || cleanTicker === 'RIBER' || normName.includes('riber')) {
    return { svg: VECTOR_LOGOS['RIBER'].svg, brandBg: VECTOR_LOGOS['RIBER'].bg, fallbackLetters: 'RI', fallbackColor };
  }
  if (normTicker.includes('ALALM') || cleanTicker === 'ALALM' || normName.includes('alan allman')) {
    return { svg: VECTOR_LOGOS['ALALM'].svg, brandBg: VECTOR_LOGOS['ALALM'].bg, fallbackLetters: 'AA', fallbackColor };
  }
  if (normTicker.includes('ALERS') || cleanTicker === 'ALERS' || normName.includes('eurobio')) {
    return { svg: VECTOR_LOGOS['ALERS'].svg, brandBg: VECTOR_LOGOS['ALERS'].bg, fallbackLetters: 'EB', fallbackColor };
  }

  // 2. Amundi ETF (PUST, CW8, DCAM, GPEA, PAEEM, PE500)
  if (
    normTicker.includes('PUST') ||
    normTicker.includes('CW8') ||
    normTicker.includes('DCAM') ||
    normTicker.includes('GPEA') ||
    normTicker.includes('PAEEM') ||
    normTicker.includes('PE500') ||
    normName.includes('amundi')
  ) {
    return { svg: VECTOR_LOGOS['AMUNDI'].svg, brandBg: VECTOR_LOGOS['AMUNDI'].bg, fallbackLetters: 'AM', fallbackColor };
  }

  // 3. Mega-Caps & Tech US
  if (cleanTicker === 'NVDA' || normName.includes('nvidia')) {
    return { svg: VECTOR_LOGOS['NVDA'].svg, brandBg: VECTOR_LOGOS['NVDA'].bg, fallbackLetters: 'NV', fallbackColor };
  }
  if (cleanTicker === 'AAPL' || normName.includes('apple')) {
    return { svg: VECTOR_LOGOS['AAPL'].svg, brandBg: VECTOR_LOGOS['AAPL'].bg, fallbackLetters: 'AP', fallbackColor };
  }
  if (cleanTicker === 'MSFT' || normName.includes('microsoft')) {
    return { svg: VECTOR_LOGOS['MSFT'].svg, brandBg: VECTOR_LOGOS['MSFT'].bg, fallbackLetters: 'MS', fallbackColor };
  }
  if (cleanTicker === 'GOOGL' || cleanTicker === 'GOOG' || normName.includes('google') || normName.includes('alphabet')) {
    return { svg: VECTOR_LOGOS['GOOGL'].svg, brandBg: VECTOR_LOGOS['GOOGL'].bg, fallbackLetters: 'GO', fallbackColor };
  }
  if (cleanTicker === 'PLTR' || normName.includes('palantir')) {
    return { svg: VECTOR_LOGOS['PLTR'].svg, brandBg: VECTOR_LOGOS['PLTR'].bg, fallbackLetters: 'PL', fallbackColor };
  }

  // 4. Cryptomonnaies (BTC, ETH, SOL)
  if (cleanTicker === 'BTC' || cleanTicker === 'BTC-USD' || normName.includes('bitcoin')) {
    return { svg: VECTOR_LOGOS['BTC'].svg, brandBg: VECTOR_LOGOS['BTC'].bg, fallbackLetters: '₿', fallbackColor, fallbackEmoji: '₿' };
  }
  if (cleanTicker === 'ETH' || cleanTicker === 'ETH-USD' || normName.includes('ethereum')) {
    return { svg: VECTOR_LOGOS['ETH'].svg, brandBg: VECTOR_LOGOS['ETH'].bg, fallbackLetters: 'Ξ', fallbackColor, fallbackEmoji: 'Ξ' };
  }
  if (cleanTicker === 'SOL' || cleanTicker === 'SOL-USD' || normName.includes('solana')) {
    return { svg: VECTOR_LOGOS['SOL'].svg, brandBg: VECTOR_LOGOS['SOL'].bg, fallbackLetters: '◎', fallbackColor, fallbackEmoji: '◎' };
  }

  // 5. Organismes Bancaires & Épargne Salariale
  if (normInst.includes('bourso') || normName.includes('bourso')) {
    return { svg: VECTOR_LOGOS['BOURSOBANK'].svg, brandBg: VECTOR_LOGOS['BOURSOBANK'].bg, fallbackLetters: 'BO', fallbackColor };
  }
  if (normInst.includes('natixis') || normName.includes('natixis')) {
    return { svg: VECTOR_LOGOS['NATIXIS'].svg, brandBg: VECTOR_LOGOS['NATIXIS'].bg, fallbackLetters: 'NX', fallbackColor };
  }
  if (normInst.includes('linxea') || normName.includes('linxea')) {
    return { svg: VECTOR_LOGOS['LINXEA'].svg, brandBg: VECTOR_LOGOS['LINXEA'].bg, fallbackLetters: 'LX', fallbackColor };
  }
  if (normInst.includes('agricole') || normName.includes('crédit agricole')) {
    return { svg: VECTOR_LOGOS['CREDIT_AGRICOLE'].svg, brandBg: VECTOR_LOGOS['CREDIT_AGRICOLE'].bg, fallbackLetters: 'CA', fallbackColor };
  }

  // 6. Livrets réglementés
  if (normName.includes('livret a') || normName.includes('ldds') || normName.includes('lep') || envelope === 'LIVRET') {
    return {
      fallbackLetters: '🛡️',
      fallbackColor: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      fallbackEmoji: '🛡️',
      brandBg: 'linear-gradient(135deg, #042f2e 0%, #064e3b 100%)',
    };
  }

  // 7. Fallback stylisé par Enveloppe Fiscale
  let fallbackEmoji: string | undefined;
  if (envelope === 'PEE') fallbackEmoji = '🏢';
  else if (envelope === 'ASSURANCE_VIE' || envelope === 'PER') fallbackEmoji = '📜';
  else if (envelope === 'IMMOBILIER') fallbackEmoji = '🏠';
  else if (envelope === 'SPECULATIVE') fallbackEmoji = '🚀';

  return {
    fallbackLetters,
    fallbackColor,
    fallbackEmoji,
    brandBg: fallbackColor,
  };
}

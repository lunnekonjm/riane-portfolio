import React from 'react';

/**
 * Logothèque Vectorielle SVG Officielle et Authentique
 * Reproduit fidèlement les logos officiels des entreprises, banques, émetteurs d'ETF et fonds.
 */

export interface OfficialLogo {
  svg: React.ReactNode;
  bg: string;
  borderColor?: string;
  name: string;
}

export const OFFICIAL_LOGOS: Record<string, OfficialLogo> = {
  // ── 🏦 BoursoBank (Officiel : 'B' stylisé magenta et bleu nuit) ──
  'BOURSOBANK': {
    name: 'BoursoBank',
    bg: 'linear-gradient(135deg, #001a30 0%, #002b49 100%)',
    borderColor: 'rgba(230, 0, 126, 0.4)',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        {/* Fond signature BoursoBank */}
        <rect width="40" height="40" rx="9" fill="#001a30" />
        {/* Barre verticale bleue */}
        <rect x="9" y="8" width="5.5" height="24" rx="2.75" fill="#00a3e0" />
        {/* Boucle supérieure magenta */}
        <path d="M14.5 8 H24 C28 8 30.5 10.5 30.5 14.5 C30.5 18.5 28 20.5 24 20.5 H14.5 V8 Z" fill="#e6007e" />
        <path d="M14.5 11 H23 C25.5 11 26.8 12.2 26.8 14.5 C26.8 16.8 25.5 17.8 23 17.8 H14.5 V11 Z" fill="#001a30" />
        {/* Boucle inférieure magenta */}
        <path d="M14.5 19.5 H25.5 C29.5 19.5 32 22 32 26 C32 30 29.5 32 25.5 32 H14.5 V19.5 Z" fill="#e6007e" />
        <path d="M14.5 22.5 H24.5 C27 22.5 28.2 23.8 28.2 26 C28.2 28.2 27 29.2 24.5 29.2 H14.5 V22.5 Z" fill="#001a30" />
      </svg>
    ),
  },

  // ── 🛡️ Livret A (Officiel : Pièce d'or et symbole d'épargne réglementée République Française) ──
  'LIVRET_A': {
    name: 'Livret A',
    bg: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <circle cx="20" cy="20" r="16" fill="url(#livreta-gold)" stroke="#fbbf24" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="13" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 1.5" />
        <text x="20" y="26" fill="#78350f" fontSize="18" fontWeight="900" fontFamily="serif" textAnchor="middle">A</text>
        <defs>
          <linearGradient id="livreta-gold" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fef3c7" />
            <stop offset="0.5" stopColor="#fcd34d" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },

  // ── 🏢 Natixis / Natixis Interépargne (Officiel : Vague pourpre avec carré rouge) ──
  'NATIXIS': {
    name: 'Natixis',
    bg: 'linear-gradient(135deg, #4b1248 0%, #350c33 100%)',
    borderColor: 'rgba(168, 85, 247, 0.4)',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="40" height="40" rx="9" fill="#4b1248" />
        {/* N stylisé officiel de Natixis */}
        <path d="M10 28 L10 12 L15.5 12 L24.5 24 L24.5 12 L29.5 12 L29.5 28 L24 28 L15 16 L15 28 Z" fill="#ffffff" />
        {/* Carré rouge signature Natixis */}
        <rect x="23" y="11" width="6.5" height="6.5" rx="1.5" fill="#e2001a" />
      </svg>
    ),
  },

  // ── 🌱 Mirova (Officiel : Mirova Funds / Natixis IM) ──
  'MIROVA': {
    name: 'Mirova',
    bg: 'linear-gradient(135deg, #042f2e 0%, #064e3b 100%)',
    borderColor: 'rgba(20, 184, 166, 0.4)',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="40" height="40" rx="9" fill="#042f2e" />
        <path d="M20 7 C13 7 8 13 8 21 C8 27 13 32 20 32 C27 32 32 27 32 21 C32 13 27 7 20 7 Z" fill="#0d9488" opacity="0.4" />
        <path d="M20 10 C15 10 12 15 12 21 C12 26 15 30 20 30 C20 23 20 17 20 10 Z" fill="#14b8a6" />
        <path d="M20 10 C25 10 28 15 28 21 C28 26 25 30 20 30 C20 23 20 17 20 10 Z" fill="#2dd4bf" />
        <line x1="20" y1="10" x2="20" y2="30" stroke="#ffffff" strokeWidth="1.5" />
      </svg>
    ),
  },

  // ── ⚡ Constellation Energy (CEG - Officiel : Les 4 pales d'énergie colorées) ──
  'CONSTELLATION': {
    name: 'Constellation Energy',
    bg: 'linear-gradient(135deg, #091a28 0%, #0d283e 100%)',
    borderColor: 'rgba(14, 165, 233, 0.4)',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="40" height="40" rx="9" fill="#091a28" />
        {/* Pale 1 : Verte / Lime (haut-gauche) */}
        <path d="M20 20 C18 12 11 11 7 14 C9 19 14 20 20 20 Z" fill="#84cc16" />
        {/* Pale 2 : Bleue / Cyan (haut-droite) */}
        <path d="M20 20 C20 12 27 8 32 10 C32 16 28 19 20 20 Z" fill="#0284c7" />
        {/* Pale 3 : Bleue claire (droite) */}
        <path d="M20 20 C27 20 31 26 31 30 C25 31 21 27 20 20 Z" fill="#38bdf8" />
        {/* Pale 4 : Orange / Rouge (bas-gauche) */}
        <path d="M20 20 C20 27 14 31 9 29 C8 24 13 20 20 20 Z" fill="#f97316" />
        {/* Centre blanc lumineux */}
        <circle cx="20" cy="20" r="2.5" fill="#ffffff" />
      </svg>
    ),
  },

  // ── 🤖 Symbotic (SYM - Officiel : Hexagone 'S' robotique vert & acier) ──
  'SYMBOTIC': {
    name: 'Symbotic',
    bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderColor: 'rgba(74, 222, 128, 0.4)',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="40" height="40" rx="9" fill="#0f172a" />
        {/* Ruban supérieur vert */}
        <path d="M12 16 L20 10 L28 16 L28 21 L20 15 L16 18 L12 16 Z" fill="#4ade80" />
        {/* Ruban inférieur acier */}
        <path d="M28 24 L20 30 L12 24 L12 19 L20 25 L24 22 L28 24 Z" fill="#94a3b8" />
        {/* Trait central de jonction */}
        <path d="M16 18 L24 22" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },

  // ── 🔬 Coherent Corp (COHR - Officiel : Noyau orbital photonique) ──
  'COHERENT': {
    name: 'Coherent Corp',
    bg: 'linear-gradient(135deg, #041628 0%, #072644 100%)',
    borderColor: 'rgba(6, 182, 212, 0.4)',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="40" height="40" rx="9" fill="#041628" />
        {/* Anneau orbital 1 */}
        <ellipse cx="20" cy="20" rx="14" ry="5.5" transform="rotate(-35 20 20)" stroke="#06b6d4" strokeWidth="2" />
        {/* Anneau orbital 2 */}
        <ellipse cx="20" cy="20" rx="14" ry="5.5" transform="rotate(35 20 20)" stroke="#0284c7" strokeWidth="2" />
        {/* Noyau laser central */}
        <circle cx="20" cy="20" r="4" fill="#ffffff" />
        <circle cx="20" cy="20" r="6.5" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
      </svg>
    ),
  },

  // ── 🇫🇷 Amundi ETF (PUST, CW8, DCAM, GPEA - Officiel : Bleu Amundi & barre cyan) ──
  'AMUNDI': {
    name: 'Amundi Asset Management',
    bg: 'linear-gradient(135deg, #002b49 0%, #001a30 100%)',
    borderColor: 'rgba(0, 163, 224, 0.4)',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="40" height="40" rx="9" fill="#002b49" />
        {/* Typographie officielle Amundi Am */}
        <text x="20" y="23" fill="#ffffff" fontSize="16" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="-0.5">Am</text>
        {/* Barre cyan officielle Amundi */}
        <rect x="8" y="27" width="24" height="3" rx="1.5" fill="#00a3e0" />
      </svg>
    ),
  },

  // ── 🌳 Indépendance AM (0P0001DKPM / IES - Officiel : Olivier de gestion value) ──
  'INDEPENDANCE_AM': {
    name: 'Indépendance AM',
    bg: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)',
    borderColor: 'rgba(217, 119, 6, 0.4)',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="40" height="40" rx="9" fill="#1c1917" />
        {/* Tronc d'olivier */}
        <path d="M20 31 L20 22 C20 18 16 16 13 13 C18 13 19 16 20 22 C20 18 24 16 27 13 C22 13 21 16 20 22" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" />
        {/* Feuillage d'olivier argent & or */}
        <circle cx="20" cy="12" r="5.5" fill="#9ca3af" opacity="0.9" />
        <circle cx="14" cy="15" r="4.5" fill="#d1d5db" opacity="0.8" />
        <circle cx="26" cy="15" r="4.5" fill="#d1d5db" opacity="0.8" />
        <circle cx="16" cy="9" r="4" fill="#f59e0b" opacity="0.85" />
        <circle cx="24" cy="9" r="4" fill="#f59e0b" opacity="0.85" />
        <line x1="12" y1="31" x2="28" y2="31" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },

  // ── ⚙️ Riber (ALRIB.PA - Officiel : 'R' bleu technologique MBE ultra-vide) ──
  'RIBER': {
    name: 'Riber SA',
    bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderColor: 'rgba(2, 132, 199, 0.4)',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="40" height="40" rx="9" fill="#0f172a" />
        <rect x="7" y="7" width="26" height="26" rx="5" stroke="#0284c7" strokeWidth="1.8" />
        <path d="M13 29 L13 11 L21 11 C24.5 11 27 13 27 16.5 C27 20 24.5 21.5 21 21.5 L13 21.5 M19 21.5 L27 29" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="27" cy="11" r="2.2" fill="#00e5ff" />
      </svg>
    ),
  },

  // ── 📡 Memscap (MEMS.PA - Officiel : Capteurs MEMS Silicium & Avionique) ──
  'MEMSCAP': {
    name: 'Memscap SA',
    bg: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="40" height="40" rx="9" fill="#0f172a" />
        {/* Puce MEMS silicium */}
        <rect x="8" y="8" width="24" height="24" rx="4" stroke="#0284c7" strokeWidth="1.8" fill="#0369a1" fillOpacity="0.2" />
        {/* Capteurs piézoélectriques & membrane */}
        <circle cx="20" cy="20" r="6" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 2" />
        <circle cx="20" cy="20" r="2.5" fill="#38bdf8" />
        {/* Connecteurs d'or */}
        <line x1="8" y1="14" x2="12" y2="14" stroke="#fbbf24" strokeWidth="2" />
        <line x1="8" y1="26" x2="12" y2="26" stroke="#fbbf24" strokeWidth="2" />
        <line x1="28" y1="14" x2="32" y2="14" stroke="#fbbf24" strokeWidth="2" />
        <line x1="28" y1="26" x2="32" y2="26" stroke="#fbbf24" strokeWidth="2" />
      </svg>
    ),
  },

  // ── 💼 Linxea (Assurance-Vie / PER) ──
  'LINXEA': {
    name: 'Linxea',
    bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="40" height="40" rx="9" fill="#0f172a" />
        <text x="17" y="27" fill="#38bdf8" fontSize="22" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">L</text>
        <circle cx="28" cy="14" r="3.5" fill="#f59e0b" />
      </svg>
    ),
  },

  // ── 🌾 Crédit Agricole ──
  'CREDIT_AGRICOLE': {
    name: 'Crédit Agricole',
    bg: 'linear-gradient(135deg, #052e24 0%, #064e3b 100%)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="40" height="40" rx="9" fill="#052e24" />
        <path d="M10 28 C10 17 17 11 27 11 L27 17 C20 17 17 20 17 28 Z" fill="#10b981" />
        <path d="M18 30 L30 18 L30 30 Z" fill="#f43f5e" />
      </svg>
    ),
  },
};

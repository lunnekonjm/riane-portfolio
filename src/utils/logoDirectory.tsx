/**
 * Annuaire et Résolveur de Logos & Symboles Financiers Officiels
 */

import React from 'react';
import { OFFICIAL_LOGOS, type OfficialLogo } from './officialLogos';

export interface LogoInfo {
  svg?: React.ReactNode;
  url?: string;
  fallbackLetters: string;
  fallbackColor: string;
  fallbackEmoji?: string;
  brandBg?: string;
  borderColor?: string;
}

const PALETTE_COLORS = [
  'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
];

function getInitials(nameOrTicker: string): string {
  const cleaned = nameOrTicker.replace(/[^a-zA-Z0-9]/g, ' ').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '•';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getDeterministicColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE_COLORS.length;
  return PALETTE_COLORS[index];
}

/**
 * Résout le logo officiel avec correspondance stricte par produit / émetteur / banque
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

  // 1. Livrets Réglementés Français (Livret A, LDDS, LEP)
  if (normName.includes('livret a') || normName === 'livret a') {
    const l = OFFICIAL_LOGOS['LIVRET_A'];
    return { svg: l.svg, brandBg: l.bg, borderColor: l.borderColor, fallbackLetters: 'LA', fallbackColor };
  }
  if (normName.includes('ldds') || normName.includes('lep') || envelope === 'LIVRET') {
    const l = OFFICIAL_LOGOS['LIVRET_A'];
    return { svg: l.svg, brandBg: l.bg, borderColor: l.borderColor, fallbackLetters: 'EP', fallbackColor };
  }

  // 2. Fonds d'Épargne Salariale / Mirova / Natixis (MF ACTIONS INTERNATIONALES, etc.)
  if (normName.includes('mf action') || normName.includes('mirova') || normName.includes('actions internationales')) {
    const l = OFFICIAL_LOGOS['MIROVA'];
    return { svg: l.svg, brandBg: l.bg, borderColor: l.borderColor, fallbackLetters: 'MV', fallbackColor };
  }
  if (normName.includes('natixis') || normInst.includes('natixis')) {
    const l = OFFICIAL_LOGOS['NATIXIS'];
    return { svg: l.svg, brandBg: l.bg, borderColor: l.borderColor, fallbackLetters: 'NX', fallbackColor };
  }

  // 3. BoursoBank (Banque & Assurance)
  if (normInst.includes('bourso') || normName.includes('bourso')) {
    const l = OFFICIAL_LOGOS['BOURSOBANK'];
    return { svg: l.svg, brandBg: l.bg, borderColor: l.borderColor, fallbackLetters: 'BB', fallbackColor };
  }

  // 4. Coherent Corp (COHR)
  if (normTicker === 'COHR' || cleanTicker === 'COHR' || normName.includes('coherent')) {
    const l = OFFICIAL_LOGOS['COHERENT'];
    return { svg: l.svg, brandBg: l.bg, borderColor: l.borderColor, fallbackLetters: 'CO', fallbackColor };
  }

  // 5. Constellation Energy (CEG)
  if (normTicker === 'CEG' || cleanTicker === 'CEG' || normName.includes('constellation')) {
    const l = OFFICIAL_LOGOS['CONSTELLATION'];
    return { svg: l.svg, brandBg: l.bg, borderColor: l.borderColor, fallbackLetters: 'CE', fallbackColor };
  }

  // 6. Symbotic (SYM)
  if (normTicker === 'SYM' || cleanTicker === 'SYM' || normName.includes('symbotic')) {
    const l = OFFICIAL_LOGOS['SYMBOTIC'];
    return { svg: l.svg, brandBg: l.bg, borderColor: l.borderColor, fallbackLetters: 'SY', fallbackColor };
  }

  // 7. Indépendance AM (0P0001DKPM / IES)
  if (normTicker.includes('0P0001DKPM') || cleanTicker === 'IES' || normName.includes('independance') || normName.includes('indépendance')) {
    const l = OFFICIAL_LOGOS['INDEPENDANCE_AM'];
    return { svg: l.svg, brandBg: l.bg, borderColor: l.borderColor, fallbackLetters: 'IA', fallbackColor };
  }

  // 8. Memscap (MEMS.PA)
  if (normTicker.includes('MEMS') || cleanTicker === 'MEMS' || cleanTicker === 'ALMEM' || normName.includes('memscap')) {
    const l = OFFICIAL_LOGOS['MEMSCAP'];
    return { svg: l.svg, brandBg: l.bg, borderColor: l.borderColor, fallbackLetters: 'ME', fallbackColor };
  }

  // 9. Riber (ALRIB.PA)
  if (normTicker.includes('ALRIB') || cleanTicker === 'ALRIB' || cleanTicker === 'RIBER' || normName.includes('riber')) {
    const l = OFFICIAL_LOGOS['RIBER'];
    return { svg: l.svg, brandBg: l.bg, borderColor: l.borderColor, fallbackLetters: 'RI', fallbackColor };
  }

  // 10. Amundi ETF (PUST, CW8, DCAM, GPEA, PAEEM, PE500)
  if (
    normTicker.includes('PUST') ||
    normTicker.includes('CW8') ||
    normTicker.includes('DCAM') ||
    normTicker.includes('GPEA') ||
    normTicker.includes('PAEEM') ||
    normTicker.includes('PE500') ||
    normName.includes('amundi') ||
    normInst.includes('amundi')
  ) {
    const l = OFFICIAL_LOGOS['AMUNDI'];
    return { svg: l.svg, brandBg: l.bg, borderColor: l.borderColor, fallbackLetters: 'AM', fallbackColor };
  }

  // 11. Linxea (Assurance-Vie / PER)
  if (normInst.includes('linxea') || normName.includes('linxea')) {
    const l = OFFICIAL_LOGOS['LINXEA'];
    return { svg: l.svg, brandBg: l.bg, borderColor: l.borderColor, fallbackLetters: 'LX', fallbackColor };
  }

  // 12. Crédit Agricole
  if (normInst.includes('agricole') || normName.includes('crédit agricole')) {
    const l = OFFICIAL_LOGOS['CREDIT_AGRICOLE'];
    return { svg: l.svg, brandBg: l.bg, borderColor: l.borderColor, fallbackLetters: 'CA', fallbackColor };
  }

  // 13. Fallback stylisé par Enveloppe Fiscale
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

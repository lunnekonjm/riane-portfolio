/**
 * Portefeuille de référence RIANE — Structure du CDC V4
 * Les quantités et PRU sont à renseigner par l'utilisateur (ses données réelles)
 * Seule la structure (ticker, enveloppe, thèmes, plan DCA) est pré-remplie
 *
 * targetWeight = part CIBLE du PORTEFEUILLE TOTAL (pas de l'enveloppe) — cf. flowRebalancer.ts
 * (targetValEUR = totalValueEUR * targetWeight). Aligné le 10/08/2026 sur le Portefeuille 1
 * (Modéré, 40/40/20) du plan PEA/PEA-PME/CTO de référence, section 03 :
 * PEA classique 40 % (100 % PUST) / PEA-PME 40 % (Indépendance 26,67 % + Riber 6,67 % + Memscap
 * 6,66 %) / CTO 20 % (Symbotic 7 % + Coherent 7 % + Constellation Energy 6 %).
 *
 * Le fonds GPEA.PA (Amundi ACWI) présent dans une version antérieure de ce fichier a été retiré :
 * il ne fait pas partie de l'historique documenté du plan (la concentration du 27/07/2026 a mené
 * la PEA classique à 100 % PUST, pas à un mix ACWI+PUST). Les cibles CTO (précédemment
 * 0,35/0,35/0,30, incohérentes avec targetWeight = fraction du portefeuille TOTAL) sont corrigées
 * pour sommer, avec PEA et PEA-PME, à 100 % du portefeuille.
 */

import type { Position } from '@/types/portfolio';

export const DEFAULT_POSITIONS: Position[] = [
  // ── PEA (40 % du portefeuille — 100 % PUST depuis la concentration du 27/07/2026) ──
  {
    id: 'pea-nasdaq',
    ticker: 'PUST.PA',
    name: 'Amundi Nasdaq-100',
    envelope: 'PEA',
    assetType: 'ETF',
    currency: 'EUR',
    quantity: 0,
    avgPrice: 0,
    themes: ['tech-satellite', 'ai-datacenters'],
    monthlyDCA: 0,
    dcaFrequency: 'monthly', // Seule ligne en vrai virement mensuel (Trade Republic, frais quasi nuls)
    targetWeight: 0.40,
    updatedAt: Date.now(),
  },

  // ── PEA-PME (40 % du portefeuille) ──
  {
    id: 'pea-pme-ies',
    ticker: '0P0001DKPM.F',
    name: 'Indépendance Europe Small',
    envelope: 'PEA-PME',
    assetType: 'FUND',
    currency: 'EUR',
    quantity: 0,
    avgPrice: 0,
    themes: ['europe-small-caps', 'sovereign-industry'],
    monthlyDCA: 0,
    dcaFrequency: 'semestrial', // Max 2 virements/an (confirmé par l'utilisateur) — accumulation jusqu'à seuil sur BoursoBank avant achat groupé, frais proportionnellement lourds sur petits montants
    targetWeight: 0.2667,
    updatedAt: Date.now(),
  },
  {
    id: 'pea-pme-riber',
    ticker: 'ALRIB.PA',
    name: 'Riber',
    envelope: 'PEA-PME',
    assetType: 'STOCK',
    currency: 'EUR',
    quantity: 0,
    avgPrice: 0,
    themes: ['semiconductors', 'photonics', 'europe-small-caps'],
    monthlyDCA: 0,
    dcaFrequency: 'semestrial', // Même logique d'accumulation que les autres small caps PEA-PME
    targetWeight: 0.0667,
    maxWeight: 0.05, // Garde-fou de gouvernance (section 10 du plan) — sous la cible brute, à revoir si actionné
    updatedAt: Date.now(),
  },
  {
    id: 'pea-pme-memscap',
    ticker: 'MEMS.PA',
    name: 'Memscap',
    envelope: 'PEA-PME',
    assetType: 'STOCK',
    currency: 'EUR',
    quantity: 0,
    avgPrice: 0,
    themes: ['semiconductors', 'photonics', 'europe-small-caps'],
    monthlyDCA: 0,
    dcaFrequency: 'semestrial', // Idem
    targetWeight: 0.0666,
    maxWeight: 0.05, // Idem
    updatedAt: Date.now(),
  },

  // ── CTO (20 % du portefeuille) ──
  {
    id: 'cto-symbotic',
    ticker: 'SYM',
    name: 'Symbotic',
    envelope: 'CTO',
    assetType: 'STOCK',
    currency: 'USD',
    quantity: 0,
    avgPrice: 0,
    themes: ['ai-datacenters', 'sovereign-industry'],
    annualBudget: 0,
    dcaFrequency: 'annual', // Financé principalement par la réserve primes/rachats (allocation manuelle), pas de DCA mensuel — frais IBKR proportionnellement lourds sur petits montants
    targetWeight: 0.07,
    maxWeight: 0.08,
    updatedAt: Date.now(),
  },
  {
    id: 'cto-coherent',
    ticker: 'COHR',
    name: 'Coherent',
    envelope: 'CTO',
    assetType: 'STOCK',
    currency: 'USD',
    quantity: 0,
    avgPrice: 0,
    themes: ['photonics', 'ai-datacenters', 'semiconductors'],
    annualBudget: 0,
    dcaFrequency: 'annual', // Idem
    targetWeight: 0.07,
    maxWeight: 0.10,
    updatedAt: Date.now(),
  },
  {
    id: 'cto-constellation',
    ticker: 'CEG',
    name: 'Constellation Energy',
    envelope: 'CTO',
    assetType: 'STOCK',
    currency: 'USD',
    quantity: 0,
    avgPrice: 0,
    themes: ['energy-electrification', 'ai-datacenters'],
    annualBudget: 0,
    dcaFrequency: 'annual', // Idem
    targetWeight: 0.06,
    maxWeight: 0.10,
    updatedAt: Date.now(),
  },
];

export const ENVELOPE_LABELS: Record<string, string> = {
  PEA: 'PEA',
  'PEA-PME': 'PEA-PME',
  CTO: 'Compte-Titres Ordinaire',
  PEE: 'Plan d\'Épargne Entreprise',
  SPECULATIVE: 'Poche Spéculative',
  OPPORTUNISTIC: 'Réserve Opportuniste',
};

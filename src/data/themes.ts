/**
 * Thèmes économiques transversaux — CDC Section "Dérive thématique"
 * Chaque thème agrège les positions exposées pour mesurer la concentration réelle
 */

export interface ThemeDefinition {
  id: string;
  label: string;
  description: string;
  tickers: string[];
  maxExposure: number;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'ai-datacenters',
    label: 'IA et Data Centers',
    description: 'Intelligence artificielle, cloud computing, infrastructure de données',
    tickers: ['PUST.PA', 'COHR', 'SYM', 'CEG', 'ALRIB.PA', 'MEMS.PA'],
    maxExposure: 0.45,
  },
  {
    id: 'semiconductors',
    label: 'Semi-conducteurs',
    description: 'Conception et fabrication de puces, équipements',
    tickers: ['ALRIB.PA', 'MEMS.PA', 'COHR'],
    maxExposure: 0.20,
  },
  {
    id: 'photonics',
    label: 'Photonique',
    description: 'Composants optiques, lasers, fibres',
    tickers: ['COHR', 'ALRIB.PA', 'MEMS.PA'],
    maxExposure: 0.15,
  },
  {
    id: 'energy-electrification',
    label: 'Énergie et Électrification',
    description: 'Production et distribution d\'énergie, transition énergétique',
    tickers: ['CEG'],
    maxExposure: 0.15,
  },
  {
    id: 'europe-small-caps',
    label: 'Small Caps Européennes',
    description: 'Petites capitalisations européennes',
    tickers: ['INDE.PA', 'ALRIB.PA', 'MEMS.PA'],
    maxExposure: 0.25,
  },
  {
    id: 'tech-satellite',
    label: 'Satellite Technologique',
    description: 'Exposition technologique satellite (non cœur)',
    tickers: ['PUST.PA'],
    maxExposure: 0.25,
  },
  {
    id: 'global-core',
    label: 'Cœur Indiciel Mondial',
    description: 'Indices mondiaux larges — cœur du portefeuille',
    tickers: ['GPEA.PA', 'CW8.PA'],
    maxExposure: 1.0,
  },
  {
    id: 'defense',
    label: 'Défense',
    description: 'Industries de défense et sécurité',
    tickers: [],
    maxExposure: 0.10,
  },
  {
    id: 'health',
    label: 'Santé',
    description: 'Biotechnologie, pharma, medtech',
    tickers: [],
    maxExposure: 0.15,
  },
  {
    id: 'sovereign-industry',
    label: 'Souveraineté Industrielle',
    description: 'Réindustrialisation et autonomie stratégique',
    tickers: ['ALRIB.PA', 'MEMS.PA', 'INDE.PA', 'SYM'],
    maxExposure: 0.25,
  },
];

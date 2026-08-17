import type { NewsItem } from './types';
import { finnhubProvider } from './finnhub';
import { getCached, setCache, CACHE_TTL } from './cache';

/** Verified Grounding Citations & Official Financial Sources per Ticker */
export const VERIFIABLE_TICKER_SOURCES: Record<string, NewsItem[]> = {
  'GPEA.PA': [
    {
      title: 'Fiche Officielle Boursomarkets — Amundi PEA MSCI ACWI UCITS ETF',
      url: 'https://www.boursorama.com/bourse/trackers/cours/1rPFR0014017NX3/',
      source: 'Boursorama Finance',
      publishedAt: 'En direct',
      summary: 'Éligibilité PEA certifiée à 0€ de frais de courtage Boursomarkets. Suivi du cours de clôture et du panier sous-jacent MSCI ACWI.',
    },
    {
      title: 'Composition & Reporting Indice Monde ACWI sur Yahoo Finance',
      url: 'https://finance.yahoo.com/quote/GPEA.PA',
      source: 'Yahoo Finance International',
      publishedAt: 'En direct',
      summary: 'Cotation Euronext Paris. Données de marché en temps réel et valorisation de la Valeur Liquidative (VL).',
    },
  ],
  'PUST.PA': [
    {
      title: 'Fiche Officielle & Cotation — Amundi PEA Nasdaq-100 UCITS ETF',
      url: 'https://www.boursorama.com/bourse/trackers/cours/1rPPUST/',
      source: 'Boursorama Finance',
      publishedAt: 'En direct',
      summary: 'Suivi de l\'indice Nasdaq-100 éligible PEA. Historique des volumes d\'échange et des variations sur Euronext Paris.',
    },
    {
      title: 'Données de Marché & Volatilité Nasdaq-100 sur Yahoo Finance',
      url: 'https://finance.yahoo.com/quote/PUST.PA',
      source: 'Yahoo Finance International',
      publishedAt: 'En direct',
      summary: 'Suivi de la performance des 100 géants technologiques non-financiers cotés sur le Nasdaq.',
    },
  ],
  '0P0001DKPM.F': [
    {
      title: 'Fiche Synthétique Morningstar — Indépendance Europe Small A (C)',
      url: 'https://www.morningstar.fr/fr/funds/snapshot/snapshot.aspx?id=F000010DKP',
      source: 'Morningstar Europe',
      publishedAt: 'En direct',
      summary: 'Analyse indépendante de la performance ajustée du risque, composition du portefeuille de Smalls Caps et ratios financiers (ROCE, P/E).',
    },
    {
      title: 'Fiche Quantalys & Reporting de Gestion — Indépendance AM',
      url: 'https://www.quantalys.com/Fonds/130172',
      source: 'Quantalys Finance',
      publishedAt: 'En direct',
      summary: 'Détail des lignes phares de la gestion Indépendance Europe Small et historique des plus-values cumulées.',
    },
  ],
  'ALRIB.PA': [
    {
      title: 'Communiqués Financiers & Relations Investisseurs Riber SA',
      url: 'https://www.riber.com/investisseurs/',
      source: 'Riber IR Officiel',
      publishedAt: 'En direct',
      summary: 'Publications officielles des chiffres d\'affaires, carnets de commandes de machines d\'épitaxie MBE et résultats semestriels/annuels.',
    },
    {
      title: 'Cours de Bourse & Actualités Riber (ALRIB) sur Boursorama',
      url: 'https://www.boursorama.com/cours/1rPALRIB/',
      source: 'Boursorama Finance',
      publishedAt: 'En direct',
      summary: 'Suivi Euronext Growth Paris, consensus des analystes et carnets d\'ordres en temps réel.',
    },
  ],
  'MEMS.PA': [
    {
      title: 'Publications Financières & Plan Stratégique Memscap SA',
      url: 'https://www.memscap.com/fr/investisseurs/',
      source: 'Memscap IR Officiel',
      publishedAt: 'En direct',
      summary: 'Rapports semestriels et annuels officiels sur le segment des capteurs de pression haute précision pour l\'aéronautique.',
    },
    {
      title: 'Cours & Actualités Memscap (MEMS) sur Boursorama',
      url: 'https://www.boursorama.com/cours/1rPMEMS/',
      source: 'Boursorama Finance',
      publishedAt: 'En direct',
      summary: 'Cours de clôture sur Euronext Paris, historiques de dividendes et actualités sectorielles.',
    },
  ],
  'COHR': [
    {
      title: 'SEC Filings & Official Financial Reports — Coherent Corp (COHR)',
      url: 'https://www.sec.gov/edgar/browse/?CIK=0000829224',
      source: 'US SEC EDGAR System',
      publishedAt: 'En direct',
      summary: 'Dépôts réglementaires officiels Form 10-K (Annuel) et Form 10-Q (Trimestriel) auprès de la SEC américaine.',
    },
    {
      title: 'Yahoo Finance Live Coverage — Coherent Corp',
      url: 'https://finance.yahoo.com/quote/COHR/news',
      source: 'Yahoo Finance US',
      publishedAt: 'En direct',
      summary: 'Actualités boursières en direct, dépôts de brevets photoniques et contrats datacenters IA.',
    },
  ],
  'CEG': [
    {
      title: 'Investor Relations & Earnings Releases — Constellation Energy',
      url: 'https://www.constellationenergy.com/investors.html',
      source: 'Constellation IR Officiel',
      publishedAt: 'En direct',
      summary: 'Publications officielles des contrats d\'approvisionnement électricité nucléaire 24/7 (PPA) pour les datacenters IA.',
    },
    {
      title: 'Yahoo Finance Live Coverage — Constellation Energy Corp (CEG)',
      url: 'https://finance.yahoo.com/quote/CEG/news',
      source: 'Yahoo Finance US',
      publishedAt: 'En direct',
      summary: 'Suivi des recommandations des analystes de Wall Street et révisions de bénéfices par action (EPS).',
    },
  ],
  'SYM': [
    {
      title: 'SEC Filings & Investor Presentations — Symbotic Inc. (SYM)',
      url: 'https://ir.symbotic.com/',
      source: 'Symbotic IR Officiel',
      publishedAt: 'En direct',
      summary: 'Rapports officiels de déploiement des systèmes robotiques IA et partenariats avec la grande distribution (Walmart).',
    },
    {
      title: 'Yahoo Finance Live Coverage — Symbotic Inc.',
      url: 'https://finance.yahoo.com/quote/SYM/news',
      source: 'Yahoo Finance US',
      publishedAt: 'En direct',
      summary: 'Actualités boursières sur le Nasdaq, carnets de commandes d\'automatisation et volatilité de cours.',
    },
  ],
};

/**
 * Get news for a ticker with verifiable citations & links
 */
export async function getNews(ticker: string): Promise<NewsItem[]> {
  const cacheKey = `news_${ticker}`;
  const cached = getCached<NewsItem[]>(cacheKey);
  if (cached) return cached;

  try {
    if (finnhubProvider.getNews) {
      const liveNews = await finnhubProvider.getNews(ticker);
      if (liveNews && liveNews.length > 0) {
        setCache(cacheKey, liveNews, CACHE_TTL.NEWS);
        return liveNews;
      }
    }
  } catch {
    // fallback
  }

  // Always return verifiable, clickable financial citations for the asset
  const verifiableSources = VERIFIABLE_TICKER_SOURCES[ticker] || [
    {
      title: `Données Financières et Profil Boursier de ${ticker}`,
      url: `https://finance.yahoo.com/quote/${ticker}`,
      source: 'Yahoo Finance International',
      publishedAt: 'En direct',
      summary: `Consulter les publications et données de marché officielles pour ${ticker}.`,
    },
  ];

  setCache(cacheKey, verifiableSources, CACHE_TTL.NEWS);
  return verifiableSources;
}

/**
 * Real Live News Scraper — Récupère de VRAIES actualités boursières en direct via Google News RSS & Yahoo RSS
 * Extrait les VRAIS titres, VRAIS liens cliquables, VRAIS éditeurs et VRAIES dates d'horodatage.
 */

import type { NewsItem } from './types';

/** Map des requêtes de recherche optimisées pour chaque ticker */
const TICKER_SEARCH_QUERIES: Record<string, string> = {
  'GPEA.PA': 'Amundi PEA Global MSCI ACWI',
  'PUST.PA': 'Amundi Nasdaq 100 PEA',
  '0P0001DKPM.F': 'Indépendance Europe Small',
  'ALRIB.PA': 'Riber semi-conducteurs',
  'MEMS.PA': 'Memscap capteurs',
  'COHR': 'Coherent Corp transceiver',
  'CEG': 'Constellation Energy nuclear',
  'SYM': 'Symbotic robotics',
};

/** Liens officiels des relations investisseurs en cas d'absence d'actualité récente */
const OFFICIAL_IR_PAGES: Record<string, { name: string; url: string }> = {
  'GPEA.PA': { name: 'Amundi ETF Officiel', url: 'https://www.amundietf.fr/fr/professionnels/produits/equity/amundi-pea-msci-acwi-ucits-etf-acc/fr0014017nx3' },
  'PUST.PA': { name: 'Amundi ETF Nasdaq-100', url: 'https://www.boursorama.com/bourse/trackers/cours/1rPPUST/' },
  '0P0001DKPM.F': { name: 'Indépendance AM Officiel', url: 'https://www.independance-am.com/' },
  'ALRIB.PA': { name: 'Riber IR Officiel', url: 'https://www.riber.com/investisseurs/' },
  'MEMS.PA': { name: 'Memscap IR Officiel', url: 'https://www.memscap.com/fr/investisseurs/' },
  'COHR': { name: 'Coherent Corp SEC EDGAR', url: 'https://www.sec.gov/edgar/browse/?CIK=0000829224' },
  'CEG': { name: 'Constellation Energy IR', url: 'https://www.constellationenergy.com/investors.html' },
  'SYM': { name: 'Symbotic IR Officiel', url: 'https://ir.symbotic.com/' },
};

function parseRssXml(xmlText: string, defaultSource: string): NewsItem[] {
  const items: NewsItem[] = [];
  try {
    const itemRegex = /<item>([\s+S]*?)<\/item>/gi;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xmlText)) !== null && items.length < 3) {
      const itemBlock = match[1];

      const titleMatch = itemBlock.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const linkMatch = itemBlock.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
      const pubDateMatch = itemBlock.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i);
      const sourceMatch = itemBlock.match(/<source[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/source>/i);

      let title = titleMatch ? titleMatch[1].trim() : '';
      let url = linkMatch ? linkMatch[1].trim() : '';
      const pubDateStr = pubDateMatch ? pubDateMatch[1].trim() : '';
      const source = sourceMatch ? sourceMatch[1].trim() : defaultSource;

      // Clean up HTML entities in title
      title = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

      if (title && url) {
        let formattedDate = 'Récemment';
        if (pubDateStr) {
          try {
            const d = new Date(pubDateStr);
            if (!isNaN(d.getTime())) {
              formattedDate = d.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
            }
          } catch {
            // ignore
          }
        }

        items.push({
          title,
          url,
          source,
          publishedAt: formattedDate,
          summary: `Article publié par ${source} le ${formattedDate}.`,
        });
      }
    }
  } catch (err) {
    console.warn('[RealNewsScraper] XML Parsing error:', err);
  }
  return items;
}

export async function fetchRealLiveNews(ticker: string): Promise<NewsItem[]> {
  const searchQuery = TICKER_SEARCH_QUERIES[ticker] || ticker;

  // 1. Try Google News RSS (Real-Time Search in French)
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=fr&gl=FR&ceid=FR:fr`;
    const res = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
      next: { revalidate: 1800 }, // 30 min cache
    });

    if (res.ok) {
      const xml = await res.text();
      const parsed = parseRssXml(xml, 'Google News');
      if (parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn(`[RealNewsScraper] Google News RSS failed for ${ticker}:`, err);
  }

  // 2. Try Yahoo Finance RSS
  try {
    const yahooRssUrl = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(ticker)}&region=US&lang=en-US`;
    const res = await fetch(yahooRssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
      next: { revalidate: 1800 },
    });

    if (res.ok) {
      const xml = await res.text();
      const parsed = parseRssXml(xml, 'Yahoo Finance');
      if (parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn(`[RealNewsScraper] Yahoo RSS failed for ${ticker}:`, err);
  }

  // 3. Fallback: Return Official IR Page Link with TRANSPARENT EXPLICIT NOTICE (No fake "En direct" dates!)
  const ir = OFFICIAL_IR_PAGES[ticker] || { name: 'Yahoo Finance', url: `https://finance.yahoo.com/quote/${ticker}` };
  return [
    {
      title: `Page Officielle & Publications Financières — ${searchQuery}`,
      url: ir.url,
      source: ir.name,
      publishedAt: 'Source Permanente Officielle',
      summary: `Consulter la fiche boursière et les derniers communiqués de presse officiels de ${searchQuery} sur ${ir.name}.`,
    },
  ];
}

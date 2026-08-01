/**
 * Real Live News Scraper — Interroge Google News RSS & Yahoo Finance API en temps réel
 * Extrait les vrais articles de presse (Les Echos, BFM Bourse, Bourse Direct, Saxo Bank, Yahoo Finance)
 * avec de vrais liens cliquables et de vraies dates de publication.
 */

import type { NewsItem } from './types';

const TICKER_SEARCH_QUERIES: Record<string, string> = {
  'GPEA.PA': 'Amundi MSCI ACWI PEA',
  'PUST.PA': 'Amundi Nasdaq 100 PEA',
  '0P0001DKPM.F': 'Independance Europe Small',
  'ALRIB.PA': 'Riber bourses',
  'MEMS.PA': 'Memscap bourses',
  'COHR': 'Coherent Corp optics',
  'CEG': 'Constellation Energy nuclear',
  'SYM': 'Symbotic robotics',
};

function parseRssArticles(xmlText: string): NewsItem[] {
  const items: NewsItem[] = [];
  try {
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xmlText)) !== null && items.length < 4) {
      const itemBlock = match[1];

      const titleMatch = itemBlock.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const linkMatch = itemBlock.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
      const pubDateMatch = itemBlock.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i);

      let title = titleMatch ? titleMatch[1].trim() : '';
      let url = linkMatch ? linkMatch[1].trim() : '';
      const pubDateStr = pubDateMatch ? pubDateMatch[1].trim() : '';

      // Clean HTML entities & source tag suffix from title (e.g. "Title - Les Echos")
      title = title
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      // Skip generic "Google News" root titles
      if (title.startsWith('Google') || title === 'Google News') continue;

      // Extract source publisher from title suffix (e.g., "... - BFM Bourse")
      let source = 'Presse Financière';
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        if (parts.length > 1) {
          source = parts[parts.length - 1].trim();
          title = parts.slice(0, parts.length - 1).join(' - ').trim();
        }
      }

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
          summary: `Article de presse publié par ${source} le ${formattedDate}.`,
        });
      }
    }
  } catch (err) {
    console.warn('[RealNewsScraper] RSS parse error:', err);
  }
  return items;
}

export async function fetchRealLiveNews(ticker: string): Promise<NewsItem[]> {
  const searchQuery = TICKER_SEARCH_QUERIES[ticker] || ticker;

  // 1. Interroger Google News RSS (Résultats de la presse financière francophone & internationale)
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=fr&gl=FR&ceid=FR:fr`;
    const res = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
      next: { revalidate: 1800 },
    });

    if (res.ok) {
      const xml = await res.text();
      const articles = parseRssArticles(xml);
      if (articles.length > 0) return articles;
    }
  } catch (err) {
    console.warn(`[RealNewsScraper] Google News RSS failed for ${ticker}:`, err);
  }

  // 2. Interroger Yahoo Finance News API
  try {
    const yahooUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&newsCount=4`;
    const res = await fetch(yahooUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
      next: { revalidate: 1800 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.news && Array.isArray(data.news) && data.news.length > 0) {
        return data.news.slice(0, 4).map((item: any) => {
          let dateStr = 'Récemment';
          if (item.providerPublishTime) {
            const d = new Date(item.providerPublishTime * 1000);
            dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
          }
          return {
            title: item.title,
            url: item.link,
            source: item.publisher || 'Yahoo Finance',
            publishedAt: dateStr,
            summary: item.summary || `Article boursier publié par ${item.publisher || 'Yahoo Finance'}.`,
          };
        });
      }
    }
  } catch (err) {
    console.warn(`[RealNewsScraper] Yahoo News API failed for ${ticker}:`, err);
  }

  // Si aucun article récent n'est trouvé, renvoyer un tableau vide pour signaler qu'aucun article n'a été publié récemment
  return [];
}

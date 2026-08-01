/**
 * Real Live News Scraper — Interroge Google News RSS & Yahoo Finance API en temps réel
 * Extrait les vrais articles de presse pertinents (Les Echos, BFM Bourse, Bourse Direct, Fortuneo, Yahoo Finance)
 * avec de vrais liens cliquables et de vraies dates de publication.
 * 
 * FILTRAGE STRICT DE PERTINENCE : Élimine le bruit et les articles hors-sujet.
 */

import type { NewsItem } from './types';

function parseRssArticles(xmlText: string, targetKeywords: string[]): NewsItem[] {
  const items: NewsItem[] = [];
  try {
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xmlText)) !== null && items.length < 4) {
      const itemBlock = match[1];

      const titleMatch = itemBlock.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const linkMatch = itemBlock.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
      const pubDateMatch = itemBlock.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i);
      const descMatch = itemBlock.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);

      let title = titleMatch ? titleMatch[1].trim() : '';
      let url = linkMatch ? linkMatch[1].trim() : '';
      const pubDateStr = pubDateMatch ? pubDateMatch[1].trim() : '';
      const rawDesc = descMatch ? descMatch[1].trim() : '';

      title = title
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      if (title.startsWith('Google') || title === 'Google News') continue;

      // Relevance check: ensure the title or snippet contains at least one target keyword
      const fullTextLower = `${title} ${rawDesc}`.toLowerCase();
      const isRelevant = targetKeywords.some((kw) => fullTextLower.includes(kw.toLowerCase()));
      if (!isRelevant) continue;

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
          summary: title,
        });
      }
    }
  } catch (err) {
    console.warn('[RealNewsScraper] RSS parse error:', err);
  }
  return items;
}

export async function fetchRealLiveNews(ticker: string, name?: string): Promise<NewsItem[]> {
  const cleanName = (name || ticker).replace(/\.PA|\.F/g, '').trim();
  
  // Specific relevance keywords for each holding
  const keywordsMap: Record<string, string[]> = {
    'GPEA.PA': ['amundi', 'acwi', 'msci', 'pea', 'etf', 'monde'],
    'PUST.PA': ['amundi', 'nasdaq', 'pea', 'etf', 'tech'],
    '0P0001DKPM.F': ['indépendance', 'independance', 'small', 'europe', 'fonds', 'value'],
    'ALRIB.PA': ['riber', 'semi-conducteur', 'mbe', 'rosie', 'ia'],
    'MEMS.PA': ['memscap', 'capteur', 'aéronautique', 'mems', 'croissance'],
    'COHR': ['coherent', 'optics', 'transceiver', 'laser', 'semiconductor'],
    'CEG': ['constellation', 'nuclear', 'nucléaire', 'meta', 'energy', 'power'],
    'SYM': ['symbotic', 'robotics', 'automation', 'walmart', 'warehouse'],
  };

  const targetKeywords = keywordsMap[ticker] || [cleanName.toLowerCase()];
  const searchQuery = `${cleanName} Bourse`;

  // 1. Google News RSS
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=fr&gl=FR&ceid=FR:fr`;
    const res = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
      next: { revalidate: 1800 },
    });

    if (res.ok) {
      const xml = await res.text();
      const articles = parseRssArticles(xml, targetKeywords);
      if (articles.length > 0) return articles;
    }
  } catch (err) {
    console.warn(`[RealNewsScraper] Google News RSS failed for ${ticker}:`, err);
  }

  // 2. Yahoo Finance API
  try {
    const yahooUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(cleanName)}&newsCount=5`;
    const res = await fetch(yahooUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
      next: { revalidate: 1800 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.news && Array.isArray(data.news) && data.news.length > 0) {
        const filtered = data.news.filter((item: any) => {
          const t = `${item.title} ${item.summary || ''}`.toLowerCase();
          return targetKeywords.some((kw) => t.includes(kw.toLowerCase()));
        });

        if (filtered.length > 0) {
          return filtered.slice(0, 4).map((item: any) => {
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
              summary: item.title,
            };
          });
        }
      }
    }
  } catch (err) {
    console.warn(`[RealNewsScraper] Yahoo News API failed for ${ticker}:`, err);
  }

  return [];
}

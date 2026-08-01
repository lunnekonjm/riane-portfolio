/**
 * Real Live News Scraper — Interroge Google News RSS & Yahoo Finance API en temps réel
 * Décode les entités &lt; et &gt; EN PREMIER avant de supprimer 100% des balises HTML et des URLs brutes.
 */

import type { NewsItem } from './types';

/** Purge inconditionnelle de TOUTES les balises HTML et URLs HTTP/HTTPS */
function stripAllHtmlAndUrls(text: string): string {
  if (!text) return '';
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/&lt;/gi, '<') // DECODE ENTITIES FIRST so encoded HTML tags are stripped!
    .replace(/&gt;/gi, '>')
    .replace(/<[^>]*>/g, '') // STRIP ALL HTML TAGS!
    .replace(/https?:\/\/\S+/gi, '') // STRIP ALL RAW URL STRINGS!
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Filtre pour exclure les fiches de cours boursiers automatiques */
function isRealPressArticle(title: string): boolean {
  const t = title.toLowerCase();
  const blacklistedPhrases = [
    'cours action',
    'cotation new york',
    'cotation euronext',
    'fiche valeur',
    'prix de l\'action et graphique',
    'cours de bourse',
    'graphique interactif',
    'chandigarh university',
  ];
  return !blacklistedPhrases.some((phrase) => t.includes(phrase));
}

function parseRssArticles(xmlText: string, cleanName: string): NewsItem[] {
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

      let title = titleMatch ? stripAllHtmlAndUrls(titleMatch[1]) : '';
      let rawUrl = '';
      const pubDateStr = pubDateMatch ? stripAllHtmlAndUrls(pubDateMatch[1]) : '';
      let cleanSnippet = descMatch ? stripAllHtmlAndUrls(descMatch[1]) : '';

      // Extract raw target link safely without stripping http/https
      const rawLinkMatch = itemBlock.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
      if (rawLinkMatch && rawLinkMatch[1].trim().startsWith('http')) {
        rawUrl = rawLinkMatch[1].trim();
      } else {
        const guidMatch = itemBlock.match(/<guid[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/guid>/i);
        if (guidMatch && guidMatch[1].trim().startsWith('http')) {
          rawUrl = guidMatch[1].trim();
        }
      }

      if (!title || title.startsWith('Google') || title === 'Google News') continue;
      if (!isRealPressArticle(title)) continue;

      let source = 'Presse Financière';
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        if (parts.length > 1) {
          source = parts[parts.length - 1].trim();
          title = parts.slice(0, parts.length - 1).join(' - ').trim();
        }
      }

      if (title && rawUrl) {
        let formattedDate = 'Récemment';
        if (pubDateStr) {
          try {
            const d = new Date(pubDateStr);
            if (!isNaN(d.getTime())) {
              formattedDate = d.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
            }
          } catch {
            // ignore
          }
        }

        items.push({
          title,
          url: rawUrl,
          source,
          publishedAt: formattedDate,
          summary: cleanSnippet.length > 15 ? cleanSnippet : title,
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
  
  const searchQueries: Record<string, string> = {
    'GPEA.PA': 'Amundi MSCI ACWI PEA',
    'PUST.PA': 'Amundi Nasdaq 100 PEA',
    '0P0001DKPM.F': 'Independance Europe Small',
    'ALRIB.PA': 'Riber',
    'MEMS.PA': 'Memscap',
    'COHR': 'Coherent Corp',
    'CEG': 'Constellation Energy',
    'SYM': 'Symbotic',
  };

  const searchQuery = searchQueries[ticker] || cleanName;

  // 1. Google News RSS avec en-têtes HTTP complets (fr-FR)
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=fr&gl=FR&ceid=FR:fr`;
    const res = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      next: { revalidate: 1800 },
    });

    if (res.ok) {
      const xml = await res.text();
      const articles = parseRssArticles(xml, cleanName);
      if (articles.length > 0) return articles;
    }
  } catch (err) {
    console.warn(`[RealNewsScraper] Google News RSS failed for ${ticker}:`, err);
  }

  // 2. Yahoo Finance API
  try {
    const yahooUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(searchQuery)}&newsCount=5`;
    const res = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 1800 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.news && Array.isArray(data.news) && data.news.length > 0) {
        const filtered = data.news.filter((item: any) => isRealPressArticle(item.title || ''));

        if (filtered.length > 0) {
          return filtered.slice(0, 4).map((item: any) => {
            let dateStr = 'Récemment';
            if (item.providerPublishTime) {
              const d = new Date(item.providerPublishTime * 1000);
              dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
            }
            let title = stripAllHtmlAndUrls(item.title || `Article sur ${cleanName}`);
            let summary = stripAllHtmlAndUrls(item.summary || title);
            return {
              title,
              url: item.link,
              source: stripAllHtmlAndUrls(item.publisher || 'Yahoo Finance'),
              publishedAt: dateStr,
              summary: summary.length > 15 ? summary : title,
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

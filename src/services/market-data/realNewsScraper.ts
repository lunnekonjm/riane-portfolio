/**
 * Real Live News Scraper — Interroge Google News RSS & Yahoo Finance API en temps réel
 * Nettoie 100% du code HTML brut, des balises <a> et des URLs HTTP/HTTPS dans les résumés.
 * Ne conserve que le texte brut lisible et pertinent.
 */

import type { NewsItem } from './types';

/** Purge intégrale des balises HTML, entités et URLs brutes */
function stripAllHtmlAndUrls(text: string): string {
  if (!text) return '';
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/https?:\/\/\S+/gi, '') // Supprime toutes les URLs brutes HTTP/HTTPS
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isRealArticle(title: string): boolean {
  const t = title.toLowerCase();
  const blacklistedPhrases = [
    'cours action',
    'cotation new york',
    'cotation euronext',
    'fiche valeur',
    'prix de l\'action et graphique',
    'cours de bourse',
    'graphique interactif',
  ];
  return !blacklistedPhrases.some((phrase) => t.includes(phrase));
}

function parseRssArticles(xmlText: string, targetKeywords: string[], cleanName: string): NewsItem[] {
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
      let url = linkMatch ? stripAllHtmlAndUrls(linkMatch[1]) : '';
      const pubDateStr = pubDateMatch ? stripAllHtmlAndUrls(pubDateMatch[1]) : '';
      const cleanSnippet = descMatch ? stripAllHtmlAndUrls(descMatch[1]) : '';

      // Extrait le vrai lien depuis la balise <link> ou <guid> si linkMatch était vide
      if (!url) {
        const guidMatch = itemBlock.match(/<guid[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/guid>/i);
        if (guidMatch && guidMatch[1].startsWith('http')) {
          url = guidMatch[1].trim();
        }
      }

      if (!title || title.startsWith('Google') || title === 'Google News') continue;
      if (!isRealArticle(title)) continue;

      if (title.startsWith('http://') || title.startsWith('https://')) {
        title = `Article de Presse Financière (${cleanName})`;
      }

      let source = 'Presse Financière';
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        if (parts.length > 1) {
          source = parts[parts.length - 1].trim();
          title = parts.slice(0, parts.length - 1).join(' - ').trim();
        }
      }

      const fullTextLower = `${title} ${cleanSnippet}`.toLowerCase();
      const isRelevant = targetKeywords.some((kw) => fullTextLower.includes(kw.toLowerCase()));
      if (!isRelevant) continue;

      if (title && url) {
        let formattedDate = 'Récemment';
        if (pubDateStr) {
          try {
            const d = new Date(pubDateStr);
            if (!isNaN(d.getTime())) {
              const ageDays = (Date.now() - d.getTime()) / (1000 * 3600 * 24);
              if (ageDays > 180) continue;

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
          url,
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
      const articles = parseRssArticles(xml, targetKeywords, cleanName);
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
          return targetKeywords.some((kw) => t.includes(kw.toLowerCase())) && isRealArticle(item.title || '');
        });

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

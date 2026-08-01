/**
 * Deep Research Live News Scraper — RIANE Portfolio
 * Interroge Google News RSS & Yahoo Finance avec plusieurs requêtes ciblées (Résultats, Analystes, Initiés, Contrats)
 * pour capturer jusqu'à 15 articles de presse réels par valeur pour un ancrage et un Deep Search exhaustif.
 */

import type { NewsItem } from './types';

function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/<[^>]*>/g, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[\[\]|]/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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

    while ((match = itemRegex.exec(xmlText)) !== null && items.length < 15) {
      const itemBlock = match[1];

      const titleMatch = itemBlock.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const linkMatch = itemBlock.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
      const pubDateMatch = itemBlock.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i);
      const descMatch = itemBlock.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);

      let title = titleMatch ? sanitizeText(titleMatch[1]) : '';
      let rawUrl = '';
      const pubDateStr = pubDateMatch ? sanitizeText(pubDateMatch[1]) : '';
      let cleanSnippet = descMatch ? sanitizeText(descMatch[1]) : '';

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

      if (pubDateStr) {
        try {
          const d = new Date(pubDateStr);
          if (!isNaN(d.getTime())) {
            if (d.getFullYear() < 2025) continue;
          }
        } catch {
          // ignore
        }
      }

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

        // Deduplicate titles
        if (!items.some((existing) => existing.title.toLowerCase() === title.toLowerCase())) {
          items.push({
            title,
            url: rawUrl,
            source,
            publishedAt: formattedDate,
            summary: cleanSnippet,
          });
        }
      }
    }
  } catch (err) {
    console.warn('[RealNewsScraper] RSS parse error:', err);
  }
  return items;
}

export async function fetchRealLiveNews(ticker: string, name?: string): Promise<NewsItem[]> {
  const cleanName = (name || ticker).replace(/\.PA|\.F/g, '').trim();
  
  // Requêtes multi-angles (Deep Search)
  const queries = [
    `${cleanName} actualités bourse`,
    `${cleanName} résultats financiers chiffre affaires`,
    `${cleanName} objectifs analystes consensus`,
  ];

  const allArticles: NewsItem[] = [];

  for (const query of queries) {
    try {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=fr&gl=FR&ceid=FR:fr`;
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
        for (const art of articles) {
          if (!allArticles.some((existing) => existing.title.toLowerCase() === art.title.toLowerCase())) {
            allArticles.push(art);
          }
        }
      }
    } catch (err) {
      console.warn(`[RealNewsScraper] Query failed for ${query}:`, err);
    }
  }

  return allArticles.slice(0, 10);
}

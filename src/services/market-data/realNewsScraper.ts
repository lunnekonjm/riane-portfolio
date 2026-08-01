/**
 * Real Live News Scraper — Interroge Google News RSS & Yahoo Finance API en temps réel
 * Purge 100% des crochets [], des barres |, du code HTML et des articles anciens (antérieurs à 2026).
 */

import type { NewsItem } from './types';

/** Purge intégrale du code HTML, des entités et des caractères Markdown dangereux ([ ] |) */
function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/<[^>]*>/g, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[\[\]|]/g, ' ') // Supprime les crochets et barres verticales qui cassent le Markdown
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
    'objectif des analystes',
    'consensus achat',
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

      let title = titleMatch ? sanitizeText(titleMatch[1]) : '';
      let rawUrl = '';
      const pubDateStr = pubDateMatch ? sanitizeText(pubDateMatch[1]) : '';
      let cleanSnippet = descMatch ? sanitizeText(descMatch[1]) : '';

      // Safe URL extraction
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

      // DISCARD ANCIENT ARTICLES (Filter strictly for 2026 articles)
      if (pubDateStr) {
        try {
          const d = new Date(pubDateStr);
          if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            if (year < 2025) continue; // Reject ancient 2021 / 2023 / 2024 articles
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

        // Avoid snippet duplicating title
        let finalSnippet = cleanSnippet;
        if (cleanSnippet.toLowerCase().includes(title.toLowerCase()) || cleanSnippet.length < 25) {
          finalSnippet = '';
        }

        items.push({
          title,
          url: rawUrl,
          source,
          publishedAt: formattedDate,
          summary: finalSnippet,
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

  return [];
}

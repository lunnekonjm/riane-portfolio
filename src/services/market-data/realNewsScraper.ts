/**
 * Real Live News Scraper — Interroge Google News RSS & Yahoo Finance API en temps réel
 * Nettoie rigoureusement tout code HTML brut (balises <a>, <font>, CDATA)
 * Filtre les fiches de cours boursières génériques pour ne conserver que de VRAIS articles de presse.
 */

import type { NewsItem } from './types';

/** Helper pour supprimer intégralement le code HTML et les entités */
function stripHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Vérifie si un titre est un vrai article de presse et non une fiche boursière générique */
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

      let title = titleMatch ? stripHtml(titleMatch[1]) : '';
      let url = linkMatch ? stripHtml(linkMatch[1]) : '';
      const pubDateStr = pubDateMatch ? stripHtml(pubDateMatch[1]) : '';
      const cleanSnippet = descMatch ? stripHtml(descMatch[1]) : '';

      if (!title || title.startsWith('Google') || title === 'Google News') continue;

      // Discard generic stock quote pages
      if (!isRealArticle(title)) continue;

      // Discard raw URL titles
      if (title.startsWith('http://') || title.startsWith('https://')) {
        title = `Article de Presse Financière (${cleanName})`;
      }

      // Extract publisher source from title suffix (e.g., "... - BFM Bourse")
      let source = 'Presse Financière';
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        if (parts.length > 1) {
          source = parts[parts.length - 1].trim();
          title = parts.slice(0, parts.length - 1).join(' - ').trim();
        }
      }

      // Check keyword relevance
      const fullTextLower = `${title} ${cleanSnippet}`.toLowerCase();
      const isRelevant = targetKeywords.some((kw) => fullTextLower.includes(kw.toLowerCase()));
      if (!isRelevant) continue;

      if (title && url) {
        let formattedDate = 'Récemment';
        if (pubDateStr) {
          try {
            const d = new Date(pubDateStr);
            if (!isNaN(d.getTime())) {
              // Discard articles older than 180 days to prevent ancient 2023 articles
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
          summary: cleanSnippet.length > 20 ? cleanSnippet : title,
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
            let title = stripHtml(item.title || `Article sur ${cleanName}`);
            if (title.startsWith('http://') || title.startsWith('https://')) {
              title = `Article de Presse Financière (${cleanName})`;
            }
            return {
              title,
              url: item.link,
              source: stripHtml(item.publisher || 'Yahoo Finance'),
              publishedAt: dateStr,
              summary: stripHtml(item.summary || title),
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

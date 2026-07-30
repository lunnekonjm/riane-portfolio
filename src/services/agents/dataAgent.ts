/**
 * Data Agent — Agent 1
 * Collecte, déduplication, chronologie et fraîcheur des données
 */

import type { AgentContext, AgentResult } from './types';
import type { MarketDataResult } from '@/types/analysis';
import { getQuote, getCompanyProfile, getNews } from '@/services/market-data/provider';

export async function runDataAgent(context: AgentContext): Promise<AgentResult> {
  const { ticker } = context;

  if (!ticker) {
    return {
      agent: 'data',
      success: false,
      data: null,
      error: 'Aucun ticker spécifié pour la collecte de données.',
      timestamp: Date.now(),
    };
  }

  try {
    // Parallel data collection
    const [quote, profile, news] = await Promise.allSettled([
      getQuote(ticker),
      getCompanyProfile(ticker),
      getNews(ticker),
    ]);

    const quoteData = quote.status === 'fulfilled' ? quote.value : null;
    const profileData = profile.status === 'fulfilled' ? profile.value : null;
    const newsData = news.status === 'fulfilled' ? news.value : [];

    if (!quoteData && !profileData) {
      return {
        agent: 'data',
        success: false,
        data: null,
        error: `Impossible de récupérer les données pour ${ticker}. Vérifiez le ticker ou les clés API.`,
        timestamp: Date.now(),
      };
    }

    const marketData: MarketDataResult = {
      ticker,
      name: profileData?.name || ticker,
      price: quoteData?.price || 0,
      currency: quoteData?.currency || profileData?.currency || 'USD',
      change24h: quoteData?.change || 0,
      change24hPercent: quoteData?.changePercent || 0,
      marketCap: profileData?.marketCap,
      peRatio: profileData?.peRatio,
      eps: profileData?.eps,
      dividendYield: profileData?.dividendYield,
      beta: profileData?.beta,
      week52High: profileData?.week52High,
      week52Low: profileData?.week52Low,
      avgVolume: quoteData?.volume,
      sector: profileData?.sector,
      industry: profileData?.industry,
      exchange: profileData?.exchange,
      dataSource: [quoteData?.source, profileData?.source].filter(Boolean).join(' + '),
      fetchedAt: Date.now(),
    };

    return {
      agent: 'data',
      success: true,
      data: {
        marketData,
        news: newsData,
        dataFreshness: {
          quote: quoteData ? 'fresh' : 'unavailable',
          profile: profileData ? 'fresh' : 'unavailable',
          news: newsData.length > 0 ? 'fresh' : 'unavailable',
        },
      },
      timestamp: Date.now(),
    };
  } catch (err: any) {
    return {
      agent: 'data',
      success: false,
      data: null,
      error: `Erreur de collecte : ${err.message}`,
      timestamp: Date.now(),
    };
  }
}

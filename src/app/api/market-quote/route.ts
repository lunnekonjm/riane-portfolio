/**
 * API Route — Proxy pour Yahoo Finance (contourne CORS)
 * GET /api/market-quote?url=...
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url || !url.startsWith('https://query1.finance.yahoo.com/')) {
    return NextResponse.json({ error: 'URL invalide' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RIANE-Portfolio/1.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Yahoo Finance returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch from Yahoo Finance' },
      { status: 502 }
    );
  }
}

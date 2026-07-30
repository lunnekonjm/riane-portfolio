/**
 * API Route — Proxy Sécurisé pour Yahoo Finance (Anti-SSRF & Anti-Injection)
 * GET /api/market-quote?url=...
 */

import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];

export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Paramètre URL manquant' }, { status: 400 });
  }

  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.includes(parsed.hostname)) {
      return NextResponse.json(
        { error: 'Refus de sécurité : Domaine non autorisé (Anti-SSRF Shield)' },
        { status: 403 }
      );
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'RIANE-Portfolio/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Yahoo Finance API a renvoyé le statut HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Échec de communication sécurisée avec l\'API Yahoo Finance' },
      { status: 502 }
    );
  }
}

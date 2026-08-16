import { NextResponse } from 'next/server';
import { fetchTrueLayerTransactions } from '@/lib/truelayer/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieMatch = cookieHeader.match(/truelayer_access_token=([^;]+)/);
    const cookieToken = cookieMatch ? decodeURIComponent(cookieMatch[1].trim()) : undefined;
    const refreshMatch = cookieHeader.match(/truelayer_refresh_token=([^;]+)/);
    const cookieRefreshToken = refreshMatch ? decodeURIComponent(refreshMatch[1].trim()) : undefined;

    const accessToken =
      searchParams.get('token') ||
      searchParams.get('truelayerToken') ||
      cookieToken ||
      process.env.TRUELAYER_ACCESS_TOKEN;

    const refreshToken =
      searchParams.get('refreshToken') ||
      cookieRefreshToken ||
      process.env.TRUELAYER_REFRESH_TOKEN;

    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    const result = await fetchTrueLayerTransactions(accessToken, from, to, refreshToken);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ transactions: [], partialErrors: [msg], requiresReauth: true }, { status: 200 });
  }
}

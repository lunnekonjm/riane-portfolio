/**
 * Next.js Security & Rate Limiting Middleware
 * Protects application APIs against DDoS, quota exhaustion, and injection attacks
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from '@/utils/rateLimiter';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply Rate Limiting to all /api/* proxy endpoints
  if (pathname.startsWith('/api/')) {
    // Extract IP address from request headers
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || '127.0.0.1';

    // Enforce 30 requests per minute per IP limit
    const rateLimit = checkRateLimit(ip, 30, 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Protection anti-DDoS & Quota active : Trop de requêtes envoyées.',
          message: `Vous avez dépassé la limite de 30 requêtes par minute. Veuillez réessayer dans ${rateLimit.resetSeconds} secondes.`,
          retryAfterSeconds: rateLimit.resetSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetSeconds),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetSeconds),
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  // Create response and attach OWASP Top 10 Security Headers
  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};

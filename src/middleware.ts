import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter (works in Edge runtime)
const buckets = new Map<string, { tokens: number; lastRefill: number }>();
const MAX_TOKENS = 30;
const REFILL_MS = 60_000;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  let b = buckets.get(ip);
  if (!b) { b = { tokens: MAX_TOKENS, lastRefill: now }; buckets.set(ip, b); }
  if (now - b.lastRefill > REFILL_MS) { b.tokens = MAX_TOKENS; b.lastRefill = now; }
  if (b.tokens <= 0) return false;
  b.tokens--;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only rate-limit API routes
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown';

    if (!rateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too Many Requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // CORS: block non-same-origin API requests
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && host && !origin.includes(host)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://financialmodelingprep.com;"
  );

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

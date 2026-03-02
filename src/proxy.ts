import { NextRequest, NextResponse } from "next/server";

// In-memory sliding-window rate limiter.
// Effective in Edge Middleware (long-lived workers). For stricter guarantees
// across multiple edge regions, swap to Upstash Redis (@upstash/ratelimit).
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;
const rateLimitMap = new Map<string, { count: number; reset: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  // Purge stale entries (capped to avoid unbounded iteration)
  if (rateLimitMap.size > 10_000) {
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.reset) rateLimitMap.delete(key);
    }
  }

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

// Migrated from middleware.ts → proxy.ts per Next.js 16 convention.
// See: https://nextjs.org/docs/messages/middleware-to-proxy
export function proxy(request: NextRequest) {
  // 1. CSRF — reject cross-origin requests
  const origin = request.headers.get("origin");
  if (origin) {
    const allowed = (
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    ).replace(/\/+$/, "");

    if (origin.replace(/\/+$/, "") !== allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // 2. Rate limiting by IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };

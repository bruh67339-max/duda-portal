// Rate limiting with Upstash Redis
// CRITICAL: Protects against brute force and DoS attacks

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Rate limit configurations
const RATE_LIMITS = {
  // Public API (Replit sites fetching content)
  public: {
    requests: 100,
    window: '1m' as const,
  },
  // Login attempts
  'auth/login': {
    requests: 5,
    window: '15m' as const,
  },
  // Password reset
  'auth/reset': {
    requests: 3,
    window: '1h' as const,
  },
  // Admin API
  admin: {
    requests: 200,
    window: '1m' as const,
  },
  // Client API
  client: {
    requests: 100,
    window: '1m' as const,
  },
  // File uploads
  upload: {
    requests: 10,
    window: '1h' as const,
  },
} as const;

type RateLimitType = keyof typeof RATE_LIMITS;

// Window duration mapping
const WINDOW_MS: Record<string, number> = {
  '1m': 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
};

let redis: Redis | null = null;
const rateLimiters: Map<RateLimitType, Ratelimit> = new Map();

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error('Missing Upstash Redis credentials');
    }

    redis = new Redis({
      url,
      token,
    });
  }
  return redis;
}

function getRateLimiter(type: RateLimitType): Ratelimit {
  if (!rateLimiters.has(type)) {
    const config = RATE_LIMITS[type];
    const windowMs = WINDOW_MS[config.window];

    const limiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(config.requests, `${windowMs}ms`),
      analytics: true,
      prefix: `ratelimit:${type}`,
    });

    rateLimiters.set(type, limiter);
  }

  return rateLimiters.get(type)!;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a given type and identifier
 * @param type - The rate limit type (public, auth/login, etc.)
 * @param identifier - Unique identifier (IP, user ID, or combination)
 * @returns Rate limit result with remaining quota
 */
export async function rateLimit(
  type: RateLimitType,
  identifier: string
): Promise<RateLimitResult> {
  try {
    const limiter = getRateLimiter(type);
    const result = await limiter.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    // If rate limiting fails, log and allow request (fail open for availability)
    // In high-security scenarios, you might want to fail closed instead
    console.error('Rate limit check failed:', error);
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
    };
  }
}

/**
 * Create a composite identifier for rate limiting
 * Useful for combining IP + user ID or IP + email
 */
export function createRateLimitKey(...parts: string[]): string {
  return parts.filter(Boolean).join(':');
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  // Check various headers in order of preference
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP (original client)
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}

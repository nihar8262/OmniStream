/**
 * In-Memory Sliding Window Rate Limiter.
 * 
 * NOTE: Sized for realistic low/occasional traffic.
 * This runs per-instance in-memory and does not require external distributed stores
 * (e.g. Redis/Upstash). It provides soft protection against client loops and scraping bursts.
 */

interface RateLimitRecord {
  timestamps: number[];
}

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

class InMemoryRateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private lastCleanup = Date.now();
  private readonly cleanupInterval = 60 * 1000; // 1 min

  constructor(private defaultOptions: RateLimiterOptions = { windowMs: 60 * 1000, maxRequests: 20 }) {}

  private cleanup(windowMs: number) {
    const now = Date.now();
    if (now - this.lastCleanup < this.cleanupInterval) return;
    this.lastCleanup = now;

    const expiryCutoff = now - windowMs;
    for (const [key, record] of this.records.entries()) {
      const validTimestamps = record.timestamps.filter((ts) => ts > expiryCutoff);
      if (validTimestamps.length === 0) {
        this.records.delete(key);
      } else {
        record.timestamps = validTimestamps;
      }
    }
  }

  public check(
    key: string,
    options?: Partial<RateLimiterOptions>
  ): {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  } {
    const windowMs = options?.windowMs ?? this.defaultOptions.windowMs;
    const max = options?.maxRequests ?? this.defaultOptions.maxRequests;
    const now = Date.now();
    const cutoff = now - windowMs;

    this.cleanup(windowMs);

    let record = this.records.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(key, record);
    }

    // Filter to only timestamps within the current sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

    const count = record.timestamps.length;
    const remaining = Math.max(0, max - count);
    const oldestTimestamp = record.timestamps[0] || now;
    const reset = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

    if (count >= max) {
      return {
        success: false,
        limit: max,
        remaining: 0,
        reset: Math.max(1, reset),
      };
    }

    // Allow request
    record.timestamps.push(now);
    return {
      success: true,
      limit: max,
      remaining: remaining - 1,
      reset: Math.max(1, reset),
    };
  }
}

// Global instances for different route types
export const resolveLimiter = new InMemoryRateLimiter({ windowMs: 60 * 1000, maxRequests: 20 });
export const downloadLimiter = new InMemoryRateLimiter({ windowMs: 60 * 1000, maxRequests: 40 });
export const zipLimiter = new InMemoryRateLimiter({ windowMs: 60 * 1000, maxRequests: 10 });
export const pdfLimiter = new InMemoryRateLimiter({ windowMs: 60 * 1000, maxRequests: 10 });

/**
 * Extracts client IP from Next.js request headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

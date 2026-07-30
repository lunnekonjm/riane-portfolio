/**
 * Sliding Window Rate Limiter Engine
 * Protects APIs from DDoS attacks, brute force, and quota exhaustion
 */

interface RateLimitRecord {
  timestamps: number[];
}

const ipMap = new Map<string, RateLimitRecord>();

// Clean up stale IP records every 5 minutes
setInterval(() => {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  for (const [ip, record] of ipMap.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    if (record.timestamps.length === 0) {
      ipMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Evaluates whether an IP address is within its rate limit
 * @param ip Client IP address
 * @param maxRequests Maximum allowed requests per window (default 30 req/min)
 * @param windowMs Time window in milliseconds (default 60 000 ms)
 */
export function checkRateLimit(
  ip: string,
  maxRequests: number = 30,
  windowMs: number = 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const clientRecord = ipMap.get(ip) || { timestamps: [] };

  // Filter timestamps outside current sliding window
  const validTimestamps = clientRecord.timestamps.filter((ts) => now - ts < windowMs);

  if (validTimestamps.length >= maxRequests) {
    const oldestInWindow = validTimestamps[0];
    const resetSeconds = Math.ceil((windowMs - (now - oldestInWindow)) / 1000);

    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds),
    };
  }

  // Record current request timestamp
  validTimestamps.push(now);
  ipMap.set(ip, { timestamps: validTimestamps });

  return {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - validTimestamps.length,
    resetSeconds: 60,
  };
}

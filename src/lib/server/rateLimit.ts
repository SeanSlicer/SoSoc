/**
 * In-memory sliding window rate limiter with optional DB-backed config.
 *
 * Uses a sliding window log — tracks exact request timestamps rather than a
 * fixed counter, so bursts at window boundaries are handled correctly.
 *
 * Trade-off: resets on server restart and is per-instance (not shared across
 * replicas). For multi-instance deployments, swap the store for a Redis-backed
 * implementation (e.g. @upstash/ratelimit).
 */

interface WindowEntry {
  /** Timestamps (ms) of requests in the current window */
  requests: number[];
}

const store = new Map<string, WindowEntry>();

// Periodically evict stale entries to prevent unbounded memory growth.
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.requests.length === 0 || now - (entry.requests.at(-1) ?? 0) > 300_000) {
      store.delete(key);
    }
  }
}, 60_000);

// Don't hold the process open in test environments
if (typeof cleanup.unref === "function") cleanup.unref();

export interface RateLimitResult {
  allowed: boolean;
  /** Requests remaining in the current window */
  remaining: number;
  /** How long to wait before retrying (0 when allowed) */
  retryAfterMs: number;
}

/**
 * Check whether a key is within its rate limit.
 *
 * @param key         Unique identifier — typically `"action:userId"` or `"action:ip"`
 * @param maxRequests Maximum requests allowed per window
 * @param windowMs    Sliding window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  const entry = store.get(key) ?? { requests: [] };

  // Drop timestamps that have slid out of the window
  entry.requests = entry.requests.filter((ts) => ts > windowStart);
  store.set(key, entry);

  if (entry.requests.length >= maxRequests) {
    const oldestInWindow = entry.requests[0]!;
    const retryAfterMs = oldestInWindow + windowMs - now;
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.requests.push(now);
  return {
    allowed: true,
    remaining: maxRequests - entry.requests.length,
    retryAfterMs: 0,
  };
}

// ─── DB-backed config cache ───────────────────────────────────────────────────

interface CachedConfig {
  maxRequests: number;
  windowMs: number;
  fetchedAt: number;
}

const CONFIG_TTL_MS = 60_000; // re-read DB config at most once per minute
const configCache = new Map<string, CachedConfig>();

/**
 * Fetch the rate limit config for a named action, using a 60-second memory
 * cache in front of the DB.  Falls back to the provided defaults if no DB
 * row exists (or the DB query fails).
 *
 * @param action       Action name matching a `RateLimitConfig.action` row (e.g. `"post.create"`)
 * @param defaultMax   Default max requests if no DB override exists
 * @param defaultWindow Default window in ms if no DB override exists
 */
export async function getRateLimitConfig(
  action: string,
  defaultMax: number,
  defaultWindow: number,
): Promise<{ maxRequests: number; windowMs: number }> {
  const cached = configCache.get(action);
  if (cached && Date.now() - cached.fetchedAt < CONFIG_TTL_MS) {
    return { maxRequests: cached.maxRequests, windowMs: cached.windowMs };
  }

  try {
    // Dynamic import avoids pulling prisma into edge/client bundles
    const { prisma } = await import("~/server/db");
    const row = await prisma.rateLimitConfig.findUnique({ where: { action } });
    const config = {
      maxRequests: row?.maxRequests ?? defaultMax,
      windowMs:    row?.windowMs   ?? defaultWindow,
      fetchedAt:   Date.now(),
    };
    configCache.set(action, config);
    return config;
  } catch {
    return { maxRequests: defaultMax, windowMs: defaultWindow };
  }
}

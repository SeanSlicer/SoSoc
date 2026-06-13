/**
 * Sliding window rate limiter with optional DB-backed config.
 *
 * Uses a sliding window log — tracks exact request timestamps rather than a
 * fixed counter, so bursts at window boundaries are handled correctly.
 *
 * Two stores:
 * - In-memory (default) — `checkRateLimit`. Per-instance; resets on restart.
 * - Upstash Redis — used automatically by `checkRateLimitDistributed` when
 *   `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set, so limits
 *   hold across replicas. Falls back to in-memory on any Redis error.
 */
import { TRPCError } from "@trpc/server";

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

// ─── Upstash Redis store (optional, multi-instance safe) ─────────────────────

/**
 * Sliding window check backed by a Redis sorted set, via the Upstash REST
 * pipeline API (no SDK dependency). One round trip on the allowed path:
 * prune old entries, add this request, count, refresh TTL, read the oldest
 * entry. If the count exceeds the limit, the just-added entry is removed so
 * blocked requests don't extend the lockout.
 */
interface RedisConfig {
  url: string;
  token: string;
}

/**
 * Reads Upstash credentials from env. Dynamic import (matching the prisma
 * pattern below) so importing this module never triggers env validation —
 * keeps unit tests runnable without a populated .env.
 */
async function getRedisConfig(): Promise<RedisConfig | null> {
  try {
    const { env } = await import("~/env");
    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
      return { url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN };
    }
  } catch {
    // env unavailable (e.g. test environment) — fall through to in-memory
  }
  return null;
}

async function checkRateLimitRedis(
  key: string,
  maxRequests: number,
  windowMs: number,
  redis: RedisConfig,
): Promise<RateLimitResult> {
  const now = Date.now();
  const member = `${now}-${Math.random().toString(36).slice(2)}`;
  const redisKey = `rl:${key}`;

  const results = await redisPipeline(redis, [
    ["ZREMRANGEBYSCORE", redisKey, "0", String(now - windowMs)],
    ["ZADD", redisKey, String(now), member],
    ["ZCARD", redisKey],
    ["PEXPIRE", redisKey, String(windowMs)],
    ["ZRANGE", redisKey, "0", "0", "WITHSCORES"],
  ]);

  const count = results[2] as number;
  if (count > maxRequests) {
    // Over the limit — undo our own entry and compute when the oldest expires
    await redisPipeline(redis, [["ZREM", redisKey, member]]);
    const oldest = Number((results[4] as string[])[1] ?? now);
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, oldest + windowMs - now) };
  }

  return { allowed: true, remaining: maxRequests - count, retryAfterMs: 0 };
}

/** Execute Redis commands via the Upstash REST pipeline endpoint. */
async function redisPipeline(redis: RedisConfig, commands: string[][]): Promise<unknown[]> {
  const res = await fetch(`${redis.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${redis.token}` },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(2_000),
  });
  if (!res.ok) throw new Error(`Upstash pipeline failed: ${res.status}`);
  const data = (await res.json()) as { result?: unknown; error?: string }[];
  const failed = data.find((r) => r.error);
  if (failed) throw new Error(`Upstash command failed: ${failed.error}`);
  return data.map((r) => r.result);
}

/**
 * Like `checkRateLimit`, but uses Redis when configured so the limit is
 * shared across server instances. Falls back to the in-memory store when
 * Redis isn't configured or the call fails (fail-open to per-instance limits
 * rather than blocking legitimate traffic on a Redis outage).
 *
 * @param key         Unique identifier — typically `"action:userId"` or `"action:ip"`
 * @param maxRequests Maximum requests allowed per window
 * @param windowMs    Sliding window duration in milliseconds
 */
export async function checkRateLimitDistributed(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redis = await getRedisConfig();
  if (redis) {
    try {
      return await checkRateLimitRedis(key, maxRequests, windowMs, redis);
    } catch (err) {
      console.error("[rateLimit] Redis check failed, falling back to memory:", err);
    }
  }
  return checkRateLimit(key, maxRequests, windowMs);
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

/**
 * Enforce a rate limit for a tRPC procedure. Loads the configured limit
 * (with default fallback), checks the sliding window, and throws
 * `TOO_MANY_REQUESTS` when blocked.
 *
 * @param action        Action name (e.g. `"post.create"`) — also used as the default key prefix
 * @param subject       Per-actor identifier appended to the key — typically `ctx.userId`
 * @param defaultMax    Default max requests when no DB override exists
 * @param defaultWindow Default window in ms when no DB override exists
 * @param message       Error message returned to the client when blocked
 */
export async function enforceRateLimit(
  action: string,
  subject: string,
  defaultMax: number,
  defaultWindow: number,
  message: string,
): Promise<void> {
  const cfg = await getRateLimitConfig(action, defaultMax, defaultWindow);
  const rl = await checkRateLimitDistributed(`${action}:${subject}`, cfg.maxRequests, cfg.windowMs);
  if (!rl.allowed) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message });
  }
}

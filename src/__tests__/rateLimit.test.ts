import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { checkRateLimit } from "../lib/server/rateLimit";

describe("checkRateLimit — sliding window", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests within the limit", () => {
    const result = checkRateLimit("test-key-1", 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks once the limit is reached", () => {
    const key = "test-key-2";
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 60_000);
    const result = checkRateLimit(key, 3, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after the window expires", () => {
    const key = "test-key-3";
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 60_000);

    // Advance past the window
    vi.advanceTimersByTime(61_000);

    const result = checkRateLimit(key, 3, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("uses a sliding window — partial window expiry frees up slots", () => {
    const key = "test-key-4";
    checkRateLimit(key, 3, 60_000); // t=0
    vi.advanceTimersByTime(30_000);
    checkRateLimit(key, 3, 60_000); // t=30s
    checkRateLimit(key, 3, 60_000); // t=30s — now at limit

    // At t=61s the first request (t=0) has expired, freeing one slot
    vi.advanceTimersByTime(31_000);
    const result = checkRateLimit(key, 3, 60_000);
    expect(result.allowed).toBe(true);
  });

  it("tracks different keys independently", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("key-a", 3, 60_000);
    expect(checkRateLimit("key-a", 3, 60_000).allowed).toBe(false);
    expect(checkRateLimit("key-b", 3, 60_000).allowed).toBe(true);
  });

  it("retryAfterMs is 0 when request is allowed", () => {
    const result = checkRateLimit("test-key-5", 10, 60_000);
    expect(result.retryAfterMs).toBe(0);
  });

  it("retryAfterMs reflects when the oldest in-window request will expire", () => {
    const key = `test-retry:${Math.random()}`;
    vi.setSystemTime(0);
    checkRateLimit(key, 1, 60_000); // uses the only slot at t=0
    vi.advanceTimersByTime(10_000);  // now t=10s
    const result = checkRateLimit(key, 1, 60_000);
    expect(result.allowed).toBe(false);
    // oldest request is at t=0, window is 60s, so retry after 60s-10s = 50s
    expect(result.retryAfterMs).toBeCloseTo(50_000, -2);
  });
});

// ─── Default rate limit config values ────────────────────────────────────────
// Imports from the constants-only file to avoid pulling in prisma/db

describe("DEFAULT_RATE_LIMITS", () => {
  it("defines all expected rate-limited actions", async () => {
    const { DEFAULT_RATE_LIMITS } = await import("@queries/admin/rateLimitDefaults");
    const expected = [
      "post.create",
      "post.comment",
      "message.send",
      "user.follow",
      "post.like",
      "auth.signup",
    ];
    for (const action of expected) {
      expect(DEFAULT_RATE_LIMITS[action], `missing default for ${action}`).toBeDefined();
      expect(DEFAULT_RATE_LIMITS[action]!.maxRequests).toBeGreaterThan(0);
      expect(DEFAULT_RATE_LIMITS[action]!.windowMs).toBeGreaterThan(0);
    }
  });

  it("auth.signup has a stricter limit than other actions", async () => {
    const { DEFAULT_RATE_LIMITS } = await import("@queries/admin/rateLimitDefaults");
    const signup = DEFAULT_RATE_LIMITS["auth.signup"]!;
    const postCreate = DEFAULT_RATE_LIMITS["post.create"]!;
    expect(signup.maxRequests).toBeLessThan(postCreate.maxRequests);
  });

  it("post.like has the highest limit (expected for passive actions)", async () => {
    const { DEFAULT_RATE_LIMITS } = await import("@queries/admin/rateLimitDefaults");
    const like = DEFAULT_RATE_LIMITS["post.like"]!;
    const create = DEFAULT_RATE_LIMITS["post.create"]!;
    expect(like.maxRequests).toBeGreaterThan(create.maxRequests);
  });
});

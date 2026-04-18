import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { checkRateLimit } from "../lib/server/rateLimit";

describe("checkRateLimit", () => {
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
});

import { prisma } from "~/server/db";
export { DEFAULT_RATE_LIMITS } from "./rateLimitDefaults";
import { DEFAULT_RATE_LIMITS } from "./rateLimitDefaults";

/** Returns all rate limit configs, filling in defaults for any action not yet in the DB. */
export async function getAllRateLimitConfigs() {
  const rows = await prisma.rateLimitConfig.findMany({ orderBy: { action: "asc" } });
  const rowMap = new Map(rows.map((r) => [r.action, r]));

  return Object.entries(DEFAULT_RATE_LIMITS).map(([action, defaults]) => {
    const row = rowMap.get(action);
    return {
      action,
      maxRequests: row?.maxRequests ?? defaults.maxRequests,
      windowMs:    row?.windowMs   ?? defaults.windowMs,
      isCustom:    !!row,
    };
  });
}

/** Upserts a single rate limit config row. */
export async function upsertRateLimitConfig(action: string, maxRequests: number, windowMs: number) {
  return prisma.rateLimitConfig.upsert({
    where:  { action },
    update: { maxRequests, windowMs },
    create: { action, maxRequests, windowMs },
  });
}

/** Resets a rate limit config to its default by deleting the DB override. */
export async function resetRateLimitConfig(action: string) {
  await prisma.rateLimitConfig.deleteMany({ where: { action } });
}

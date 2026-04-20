import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { listAllUsers, adminCreateUser } from "~/../prisma/queries/admin/users";
import {
  getAllRateLimitConfigs,
  upsertRateLimitConfig,
  resetRateLimitConfig,
} from "~/../prisma/queries/admin/rateLimits";

export const adminRouter = createTRPCRouter({
  getUsers: adminProcedure.query(() => listAllUsers()),

  createUser: adminProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(3)
          .max(25)
          .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(["USER", "ADMIN"]).default("USER"),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await adminCreateUser({ ...input });
      } catch (err) {
        throw new TRPCError({
          code: "CONFLICT",
          message: err instanceof Error ? err.message : "Failed to create user",
        });
      }
    }),

  /** Returns all rate limit configs (DB overrides merged with defaults). */
  getRateLimits: adminProcedure.query(() => getAllRateLimitConfigs()),

  /** Upserts a rate limit config for a named action. */
  setRateLimit: adminProcedure
    .input(z.object({
      action:      z.string(),
      maxRequests: z.number().int().min(1).max(100_000),
      windowMs:    z.number().int().min(1_000).max(24 * 60 * 60 * 1000),
    }))
    .mutation(({ input }) => upsertRateLimitConfig(input.action, input.maxRequests, input.windowMs)),

  /** Resets a rate limit config back to its default. */
  resetRateLimit: adminProcedure
    .input(z.object({ action: z.string() }))
    .mutation(({ input }) => resetRateLimitConfig(input.action)),
});

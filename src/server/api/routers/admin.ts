import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { listAllUsers, adminCreateUser } from "~/../prisma/queries/admin/users";

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
});

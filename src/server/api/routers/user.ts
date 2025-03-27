import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

import { TRPCError } from "@trpc/server";
import cookie from "cookie";
import { sign } from "jsonwebtoken";
import { env } from "~/../src/env.js";
import { getUserByUsernameOrEmailAndPassword } from "~/../prisma/queries/auth/getUser";
import { createUser } from "~/../prisma/queries/auth/signUp";
import { signUpSchema } from "~/../src/validation/auth/auth";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60, // 1 hour
} as const;

function createAuthToken(userId: string) {
  return sign(
    {
      userId,
      iat: Math.floor(Date.now() / 1000),
    },
    env.JWT_SECRET_KEY,
    {
      subject: userId,
      expiresIn: "1h",
      algorithm: "HS256",
    },
  );
}

export const userRouter = createTRPCRouter({
  login: publicProcedure
    .input(z.object({ usernameOrEmail: z.string(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { res } = ctx;
      const { usernameOrEmail, password } = input;

      const user = await getUserByUsernameOrEmailAndPassword(
        usernameOrEmail,
        password,
      );

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password",
        });
      }

      const token = await createAuthToken(user.id);
      res.setHeader(
        "Set-Cookie",
        cookie.serialize("user-token", token, COOKIE_OPTIONS),
      );

      return { success: true };
    }),

  signUp: publicProcedure
    .input(signUpSchema)
    .mutation(async ({ input, ctx }) => {
      const { res } = ctx;
      const { username, email, password } = input;

      const user = await createUser(username, email, password);

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
        });
      }

      const token = await createAuthToken(user.id);
      res.setHeader(
        "Set-Cookie",
        cookie.serialize("user-token", token, COOKIE_OPTIONS),
      );

      return { success: true };
    }),

  signOut: userProcedure.mutation(({ ctx }) => {
    const { res } = ctx;
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("user-token", "", {
        ...COOKIE_OPTIONS,
        maxAge: 0,
      }),
    );

    return { success: true };
  }),
});

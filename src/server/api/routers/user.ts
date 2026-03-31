import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  userProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { cookies } from "next/headers";
import { sign } from "jsonwebtoken";
import { env } from "~/env";
import { getUserByUsernameOrEmailAndPassword } from "~/../prisma/queries/auth/getUser";
import { createUser } from "~/../prisma/queries/auth/signUp";
import { signUpSchema } from "~/validation/auth/auth";

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
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
    },
    env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      algorithm: "HS256",
    },
  );
}

export const userRouter = createTRPCRouter({
  login: publicProcedure
    .input(z.object({ usernameOrEmail: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
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

      const token = createAuthToken(user.id);
      const cookieStore = await cookies();
      cookieStore.set("user-token", token, COOKIE_OPTIONS);

      return { success: true };
    }),

  signUp: publicProcedure
    .input(signUpSchema)
    .mutation(async ({ input }) => {
      const { username, email, password } = input;

      const user = await createUser(username, email, password);

      const token = createAuthToken(user.id);
      const cookieStore = await cookies();
      cookieStore.set("user-token", token, COOKIE_OPTIONS);

      return { success: true };
    }),

  signOut: userProcedure.mutation(async () => {
    const cookieStore = await cookies();
    cookieStore.delete("user-token");
    return { success: true };
  }),
});

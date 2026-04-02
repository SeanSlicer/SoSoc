import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  userProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { serialize } from "cookie";
import { sign } from "jsonwebtoken";
import { env } from "~/env";
import { getUserByUsernameOrEmailAndPassword } from "~/../prisma/queries/auth/getUser";
import { createUser } from "~/../prisma/queries/auth/signUp";
import { signUpSchema } from "~/validation/auth/auth";
import { getUserProfile, updateUserProfile, updateUserPhoto } from "~/../prisma/queries/users/profile";
import { followUser, unfollowUser, isFollowing } from "~/../prisma/queries/users/follows";
import { updateProfileSchema } from "~/validation/post/post";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
} as const;

function createAuthToken(userId: string) {
  return sign(
    { sub: userId, iat: Math.floor(Date.now() / 1000) },
    env.JWT_SECRET_KEY,
    { expiresIn: "7d", algorithm: "HS256" },
  );
}

export const userRouter = createTRPCRouter({
  login: publicProcedure
    .input(z.object({ usernameOrEmail: z.string(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = await getUserByUsernameOrEmailAndPassword(
        input.usernameOrEmail,
        input.password,
      );
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid username or password" });
      }
      const token = createAuthToken(user.id);
      ctx.resHeaders.append("Set-Cookie", serialize("user-token", token, COOKIE_OPTIONS));
      return { success: true };
    }),

  signUp: publicProcedure
    .input(signUpSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await createUser(input.username, input.email, input.password);
      const token = createAuthToken(user.id);
      ctx.resHeaders.append("Set-Cookie", serialize("user-token", token, COOKIE_OPTIONS));
      return { success: true };
    }),

  signOut: userProcedure.mutation(({ ctx }) => {
    ctx.resHeaders.append(
      "Set-Cookie",
      serialize("user-token", "", { ...COOKIE_OPTIONS, maxAge: 0 }),
    );
    return { success: true };
  }),

  getMe: userProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.userId },
      select: { id: true, username: true, displayName: true, bio: true, photo: true },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return user;
  }),

  getProfile: userProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const profile = await getUserProfile(input.username);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      return profile;
    }),

  updateProfile: userProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await updateUserProfile(ctx.userId, input);
      } catch (e: unknown) {
        if (e instanceof Error && "code" in e && (e as { code: string }).code === "P2002") {
          throw new TRPCError({ code: "CONFLICT", message: "Username already taken" });
        }
        throw e;
      }
    }),

  updatePhoto: userProcedure
    .input(z.object({ photo: z.string().url() }))
    .mutation(({ ctx, input }) => updateUserPhoto(ctx.userId, input.photo)),

  follow: userProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(({ ctx, input }) => {
      if (ctx.userId === input.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot follow yourself" });
      }
      return followUser(ctx.userId, input.userId);
    }),

  unfollow: userProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(({ ctx, input }) => unfollowUser(ctx.userId, input.userId)),

  isFollowing: userProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ ctx, input }) => isFollowing(ctx.userId, input.userId)),
});

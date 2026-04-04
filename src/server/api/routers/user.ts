import { z } from "zod";
import { createTRPCRouter, userProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { getUserProfile, updateUserProfile, updateUserPhoto } from "~/../prisma/queries/users/profile";
import { followUser, unfollowUser, isFollowing } from "~/../prisma/queries/users/follows";
import { updateProfileSchema } from "~/validation/post/post";

export const userRouter = createTRPCRouter({
  getMe: userProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.userId },
      select: { id: true, username: true, displayName: true, bio: true, photo: true, role: true },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return { ...user, isImpersonating: !!ctx.adminId };
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

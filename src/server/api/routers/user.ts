import { z } from "zod";
import { createTRPCRouter, userProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import {
  getUserProfile,
  updateUserProfile,
  updateUserPhoto,
  updateUserBanner,
} from "@queries/users/profile";
import { followUser, unfollowUser, isFollowing } from "@queries/users/follows";
import { isFriends } from "@queries/users/friends";
import { enforceRateLimit } from "~/lib/server/rateLimit";
import {
  cancelFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  getPendingRequestsForUser,
  hasPendingRequest,
  acceptAllPendingRequests,
} from "@queries/users/followRequests";
import { searchUsers, getFollowerList, getFollowingList } from "@queries/users/search";
import { blockUser, unblockUser, isBlocked, getBlockedUsers } from "@queries/users/blocks";
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
      // If switching to public, auto-accept all pending follow requests
      if (input.isPrivate === false) {
        await acceptAllPendingRequests(ctx.userId);
      }
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

  updateBanner: userProcedure
    .input(z.object({ bannerUrl: z.string().url() }))
    .mutation(({ ctx, input }) => updateUserBanner(ctx.userId, input.bannerUrl)),

  search: userProcedure
    .input(z.object({ query: z.string(), limit: z.number().int().min(1).max(50).default(20) }))
    .query(({ ctx, input }) => searchUsers(input.query, ctx.userId, input.limit)),

  getFollowers: userProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await getFollowerList(input.username, ctx.userId);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return result;
    }),

  getFollowing: userProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const result = await getFollowingList(input.username);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return result;
    }),

  follow: userProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.userId === input.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot follow yourself" });
      }
      await enforceRateLimit("user.follow", ctx.userId, 100, 60 * 60 * 1000, "Too many follow actions. Try again soon.");
      return followUser(ctx.userId, input.userId);
    }),

  unfollow: userProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(({ ctx, input }) => unfollowUser(ctx.userId, input.userId)),

  cancelFollowRequest: userProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(({ ctx, input }) => cancelFollowRequest(ctx.userId, input.userId)),

  acceptFollowRequest: userProcedure
    .input(z.object({ requesterId: z.string() }))
    .mutation(({ ctx, input }) => acceptFollowRequest(input.requesterId, ctx.userId)),

  rejectFollowRequest: userProcedure
    .input(z.object({ requesterId: z.string() }))
    .mutation(({ ctx, input }) => rejectFollowRequest(input.requesterId, ctx.userId)),

  getFollowRequests: userProcedure
    .query(({ ctx }) => getPendingRequestsForUser(ctx.userId)),

  getFollowStatus: userProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [following, requested, friends] = await Promise.all([
        isFollowing(ctx.userId, input.userId),
        hasPendingRequest(ctx.userId, input.userId),
        isFriends(ctx.userId, input.userId),
      ]);
      return { following, requested, friends };
    }),

  isFollowing: userProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ ctx, input }) => isFollowing(ctx.userId, input.userId)),

  block: userProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.userId === input.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot block yourself" });
      }
      await blockUser(ctx.userId, input.userId);
    }),

  unblock: userProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(({ ctx, input }) => unblockUser(ctx.userId, input.userId)),

  getBlockStatus: userProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ ctx, input }) => isBlocked(ctx.userId, input.userId)),

  getBlockedUsers: userProcedure
    .query(({ ctx }) => getBlockedUsers(ctx.userId)),
});

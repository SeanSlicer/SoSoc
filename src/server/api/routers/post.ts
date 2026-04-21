import { z } from "zod";
import { createTRPCRouter, userProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { createPostSchema, updatePostSchema } from "~/validation/post/post";
import { getFeed } from "@queries/posts/feed";
import { getUserPosts } from "@queries/posts/userPosts";
import {
  createPost,
  updatePostContent,
  deletePost,
  toggleLike,
  getComments,
  createComment,
  deleteComment,
} from "@queries/posts/mutations";
import { enforceRateLimit } from "~/lib/server/rateLimit";

export const postRouter = createTRPCRouter({
  getFeed: userProcedure
    .input(z.object({
      cursor: z.string().optional(),
      feedType: z.enum(["all", "following"]).default("all"),
    }))
    .query(({ ctx, input }) => getFeed(ctx.userId, input.cursor, 20, input.feedType)),

  getUserPosts: userProcedure
    .input(z.object({ username: z.string() }))
    .query(({ ctx, input }) => getUserPosts(input.username, ctx.userId)),

  create: userProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      await enforceRateLimit("post.create", ctx.userId, 100, 60 * 60 * 1000, "You're posting too fast. Slow down a bit.");
      const type = input.videoUrl ? "VIDEO" : input.images.length > 0 ? "PHOTO" : "CAPTION";
      return createPost(ctx.userId, input.content, type, input.images, input.videoUrl);
    }),

  update: userProcedure
    .input(updatePostSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await updatePostContent(input.postId, ctx.userId, input.content);
      if (result.count === 0) throw new TRPCError({ code: "FORBIDDEN" });
      return { success: true };
    }),

  delete: userProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await deletePost(input.postId, ctx.userId);
      if (result.count === 0) throw new TRPCError({ code: "FORBIDDEN" });
      return { success: true };
    }),

  toggleLike: userProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await enforceRateLimit("post.like", ctx.userId, 500, 60 * 60 * 1000, "Too many likes. Try again soon.");
      return toggleLike(ctx.userId, input.postId);
    }),

  getComments: userProcedure
    .input(z.object({ postId: z.string(), cursor: z.string().optional(), limit: z.number().int().min(1).max(50).default(10) }))
    .query(({ input }) => getComments(input.postId, input.cursor, input.limit)),

  addComment: userProcedure
    .input(z.object({ postId: z.string(), content: z.string().min(1).max(300) }))
    .mutation(async ({ ctx, input }) => {
      await enforceRateLimit("post.comment", ctx.userId, 200, 60 * 60 * 1000, "You're commenting too fast. Slow down a bit.");
      return createComment(ctx.userId, input.postId, input.content);
    }),

  deleteComment: userProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await deleteComment(input.commentId, ctx.userId);
      if (result.count === 0) throw new TRPCError({ code: "FORBIDDEN" });
      return { success: true };
    }),
});

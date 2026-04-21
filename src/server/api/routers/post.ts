import { z } from "zod";
import { createTRPCRouter, userProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { createPostSchema, updatePostSchema } from "~/validation/post/post";
import { getFeed } from "~/../prisma/queries/posts/feed";
import { getUserPosts } from "~/../prisma/queries/posts/userPosts";
import {
  createPost,
  updatePostContent,
  deletePost,
  toggleLike,
  getComments,
  createComment,
  deleteComment,
} from "~/../prisma/queries/posts/mutations";
import { checkRateLimit, getRateLimitConfig } from "~/lib/server/rateLimit";

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
      const cfg = await getRateLimitConfig("post.create", 100, 60 * 60 * 1000);
      const rl = checkRateLimit(`post.create:${ctx.userId}`, cfg.maxRequests, cfg.windowMs);
      if (!rl.allowed) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "You're posting too fast. Slow down a bit." });
      }
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
      const cfg = await getRateLimitConfig("post.like", 500, 60 * 60 * 1000);
      const rl = checkRateLimit(`post.like:${ctx.userId}`, cfg.maxRequests, cfg.windowMs);
      if (!rl.allowed) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many likes. Try again soon." });
      }
      return toggleLike(ctx.userId, input.postId);
    }),

  getComments: userProcedure
    .input(z.object({ postId: z.string(), cursor: z.string().optional(), limit: z.number().int().min(1).max(50).default(10) }))
    .query(({ input }) => getComments(input.postId, input.cursor, input.limit)),

  addComment: userProcedure
    .input(z.object({ postId: z.string(), content: z.string().min(1).max(300) }))
    .mutation(async ({ ctx, input }) => {
      const cfg = await getRateLimitConfig("post.comment", 200, 60 * 60 * 1000);
      const rl = checkRateLimit(`post.comment:${ctx.userId}`, cfg.maxRequests, cfg.windowMs);
      if (!rl.allowed) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "You're commenting too fast. Slow down a bit." });
      }
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

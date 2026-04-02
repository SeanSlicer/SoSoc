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
      const type = input.imageUrl ? "PHOTO" : "CAPTION";
      return createPost(ctx.userId, input.content, type, input.imageUrl ?? undefined);
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
    .mutation(({ ctx, input }) => toggleLike(ctx.userId, input.postId)),

  getComments: userProcedure
    .input(z.object({ postId: z.string() }))
    .query(({ input }) => getComments(input.postId)),

  addComment: userProcedure
    .input(z.object({ postId: z.string(), content: z.string().min(1).max(300) }))
    .mutation(({ ctx, input }) => createComment(ctx.userId, input.postId, input.content)),

  deleteComment: userProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await deleteComment(input.commentId, ctx.userId);
      if (result.count === 0) throw new TRPCError({ code: "FORBIDDEN" });
      return { success: true };
    }),
});

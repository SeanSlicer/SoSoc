import { z } from "zod";
import { createTRPCRouter, userProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import {
  getConversations,
  getRequests,
  getHidden,
  getOrCreateDM,
  createGroup,
  acceptRequest,
  declineRequest,
  hideConversation,
  unhideConversation,
  deleteConversation,
  markConversationRead,
  getTotalUnread,
  getRequestCount,
} from "~/../prisma/queries/messages/conversations";
import { getMessages, sendMessage } from "~/../prisma/queries/messages/messages";
import { prisma } from "~/server/db";
import { checkRateLimit, getRateLimitConfig } from "~/lib/server/rateLimit";

export const messagesRouter = createTRPCRouter({
  /** All ACTIVE conversations for the current user. */
  getConversations: userProcedure.query(({ ctx }) => getConversations(ctx.userId)),

  /** All REQUEST (pending) conversations for the current user. */
  getRequests: userProcedure.query(({ ctx }) => getRequests(ctx.userId)),

  /** Count of pending message requests (for badge display). */
  getRequestCount: userProcedure.query(({ ctx }) => getRequestCount(ctx.userId)),

  /** Total unread count across ACTIVE conversations only. */
  getTotalUnread: userProcedure.query(({ ctx }) => getTotalUnread(ctx.userId)),

  getOrCreateDM: userProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.userId === input.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot message yourself" });
      }
      return getOrCreateDM(ctx.userId, input.userId);
    }),

  createGroup: userProcedure
    .input(z.object({
      memberIds: z.array(z.string()).min(1).max(49),
      name: z.string().min(1).max(100),
    }))
    .mutation(({ ctx, input }) => createGroup(ctx.userId, input.memberIds, input.name)),

  getMessages: userProcedure
    .input(z.object({ conversationId: z.string(), cursor: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const member = await prisma.conversationMember.findUnique({
        where: { userId_conversationId: { userId: ctx.userId, conversationId: input.conversationId } },
      });
      if (!member) throw new TRPCError({ code: "FORBIDDEN" });
      return getMessages(input.conversationId, input.cursor);
    }),

  send: userProcedure
    .input(z.object({
      conversationId: z.string(),
      content: z.string().max(2000).optional(),
      sharedPostId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!input.content?.trim() && !input.sharedPostId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Message must have content or a shared post" });
      }
      const cfg = await getRateLimitConfig("message.send", 100, 60 * 60 * 1000);
      const rl = checkRateLimit(`message.send:${ctx.userId}`, cfg.maxRequests, cfg.windowMs);
      if (!rl.allowed) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "You're sending messages too fast. Slow down a bit." });
      }
      const member = await prisma.conversationMember.findUnique({
        where: { userId_conversationId: { userId: ctx.userId, conversationId: input.conversationId } },
      });
      if (!member) throw new TRPCError({ code: "FORBIDDEN" });
      return sendMessage(input.conversationId, ctx.userId, input.content, input.sharedPostId);
    }),

  markRead: userProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(({ ctx, input }) => markConversationRead(input.conversationId, ctx.userId)),

  /** Accept a message request — moves the conversation to the main Messages tab. */
  acceptRequest: userProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(({ ctx, input }) => acceptRequest(input.conversationId, ctx.userId)),

  /** Decline a message request — silently hides the conversation. */
  declineRequest: userProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(({ ctx, input }) => declineRequest(input.conversationId, ctx.userId)),

  /** Hide an existing conversation (soft-delete for one user only). */
  hideConversation: userProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(({ ctx, input }) => hideConversation(input.conversationId, ctx.userId)),

  /** Returns all hidden conversations for the current user. */
  getHidden: userProcedure.query(({ ctx }) => getHidden(ctx.userId)),

  /** Restores a hidden conversation back to the main Messages tab. */
  unhideConversation: userProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(({ ctx, input }) => unhideConversation(input.conversationId, ctx.userId)),

  /** Permanently removes the user from a conversation (cannot be undone). */
  deleteConversation: userProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(({ ctx, input }) => deleteConversation(input.conversationId, ctx.userId)),
});

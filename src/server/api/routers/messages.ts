import { z } from "zod";
import { createTRPCRouter, userProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import {
  getConversations,
  getOrCreateDM,
  createGroup,
  markConversationRead,
  getTotalUnread,
} from "~/../prisma/queries/messages/conversations";
import { getMessages, sendMessage } from "~/../prisma/queries/messages/messages";
import { prisma } from "~/server/db";

export const messagesRouter = createTRPCRouter({
  getConversations: userProcedure.query(({ ctx }) => getConversations(ctx.userId)),

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
      // Verify the user is a member
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
      const member = await prisma.conversationMember.findUnique({
        where: { userId_conversationId: { userId: ctx.userId, conversationId: input.conversationId } },
      });
      if (!member) throw new TRPCError({ code: "FORBIDDEN" });
      return sendMessage(input.conversationId, ctx.userId, input.content, input.sharedPostId);
    }),

  markRead: userProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(({ ctx, input }) => markConversationRead(input.conversationId, ctx.userId)),
});

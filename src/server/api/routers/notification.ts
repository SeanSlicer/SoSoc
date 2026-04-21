import { z } from "zod";
import { createTRPCRouter, userProcedure } from "~/server/api/trpc";
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  getNotificationPrefs,
  updateNotificationPrefs,
} from "@queries/notifications/notifications";

const notificationPrefSchema = z.object({
  notifyNewFollower:    z.boolean().optional(),
  notifyNewLike:        z.boolean().optional(),
  notifyNewComment:     z.boolean().optional(),
  notifyFollowRequest:  z.boolean().optional(),
  notifyFollowAccepted: z.boolean().optional(),
  notifyNewMessage:     z.boolean().optional(),
});

export const notificationRouter = createTRPCRouter({
  getAll: userProcedure.query(({ ctx }) => getNotifications(ctx.userId)),

  getUnreadCount: userProcedure.query(({ ctx }) => getUnreadCount(ctx.userId)),

  markAllRead: userProcedure.mutation(({ ctx }) => markAllRead(ctx.userId)),

  /** Returns the current user's notification preferences. */
  getPrefs: userProcedure.query(({ ctx }) => getNotificationPrefs(ctx.userId)),

  /** Updates one or more notification preference flags for the current user. */
  updatePrefs: userProcedure
    .input(notificationPrefSchema)
    .mutation(({ ctx, input }) => updateNotificationPrefs(ctx.userId, input)),
});

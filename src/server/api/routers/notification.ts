import { createTRPCRouter, userProcedure } from "~/server/api/trpc";
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
} from "~/../prisma/queries/notifications/notifications";

export const notificationRouter = createTRPCRouter({
  getAll: userProcedure.query(({ ctx }) => getNotifications(ctx.userId)),

  getUnreadCount: userProcedure.query(({ ctx }) => getUnreadCount(ctx.userId)),

  markAllRead: userProcedure.mutation(({ ctx }) => markAllRead(ctx.userId)),
});

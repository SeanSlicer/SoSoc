import { prisma } from "~/server/db";
import { type NotificationType } from "@prisma/client";

const ACTOR_SELECT = {
  id: true,
  username: true,
  displayName: true,
  photo: true,
} as const;

export async function getNotifications(userId: string, limit = 30) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: { select: ACTOR_SELECT } },
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export async function createNotification(
  userId: string,
  actorId: string,
  type: NotificationType,
  content: string,
  postId?: string,
) {
  // Never notify someone about their own actions
  if (userId === actorId) return;
  return prisma.notification.create({
    data: { userId, actorId, type, content, postId: postId ?? null },
  });
}

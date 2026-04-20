import { prisma } from "~/server/db";
import { type NotificationType } from "@prisma/client";

const ACTOR_SELECT = {
  id: true,
  username: true,
  displayName: true,
  photo: true,
} as const;

type NotifyPrefKey =
  | "notifyNewFollower"
  | "notifyNewLike"
  | "notifyNewComment"
  | "notifyFollowRequest"
  | "notifyFollowAccepted"
  | "notifyNewMessage";

/** Maps each notification type to the recipient's preference column. */
const PREF_COLUMN: Partial<Record<NotificationType, NotifyPrefKey>> = {
  NEW_FOLLOWER:            "notifyNewFollower",
  NEW_LIKE:                "notifyNewLike",
  NEW_COMMENT:             "notifyNewComment",
  FOLLOW_REQUEST:          "notifyFollowRequest",
  FOLLOW_REQUEST_ACCEPTED: "notifyFollowAccepted",
  NEW_MESSAGE:             "notifyNewMessage",
};

/**
 * Returns recent notifications for a user, newest first.
 *
 * @param userId  Recipient user ID
 * @param limit   Maximum records to return (default 30)
 */
export async function getNotifications(userId: string, limit = 30) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: { select: ACTOR_SELECT } },
  });
}

/**
 * Returns the count of unread notifications for a user.
 *
 * @param userId  Recipient user ID
 */
export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

/**
 * Marks all notifications as read for a user.
 *
 * @param userId  Recipient user ID
 */
export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

/**
 * Creates a notification if the recipient's preferences allow it.
 * Silently no-ops when the actor and recipient are the same user, or when
 * the recipient has disabled that notification type.
 *
 * @param userId   Recipient user ID
 * @param actorId  User who triggered the notification
 * @param type     Notification type
 * @param content  Human-readable notification text
 * @param postId   Optional related post ID
 */
export async function createNotification(
  userId: string,
  actorId: string,
  type: NotificationType,
  content: string,
  postId?: string,
) {
  if (userId === actorId) return;

  const prefColumn = PREF_COLUMN[type];
  if (prefColumn) {
    const prefs = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        notifyNewFollower:   true,
        notifyNewLike:       true,
        notifyNewComment:    true,
        notifyFollowRequest: true,
        notifyFollowAccepted:true,
        notifyNewMessage:    true,
      },
    });
    if (prefs && prefs[prefColumn] === false) return;
  }

  return prisma.notification.create({
    data: { userId, actorId, type, content, postId: postId ?? null },
  });
}

/**
 * Returns the notification preference settings for a user.
 *
 * @param userId  User ID
 */
export async function getNotificationPrefs(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      notifyNewFollower:   true,
      notifyNewLike:       true,
      notifyNewComment:    true,
      notifyFollowRequest: true,
      notifyFollowAccepted:true,
      notifyNewMessage:    true,
    },
  });
}

/**
 * Updates the notification preference settings for a user.
 *
 * @param userId  User ID
 * @param prefs   Partial set of preference flags to update
 */
export async function updateNotificationPrefs(
  userId: string,
  prefs: {
    notifyNewFollower?:   boolean;
    notifyNewLike?:       boolean;
    notifyNewComment?:    boolean;
    notifyFollowRequest?: boolean;
    notifyFollowAccepted?:boolean;
    notifyNewMessage?:    boolean;
  },
) {
  return prisma.user.update({ where: { id: userId }, data: prefs });
}

import { prisma } from "~/server/db";
import { createNotification } from "../notifications/notifications";
import { sendFollowRequest } from "./followRequests";

/**
 * Follow a user. If the target account is private, sends a follow request instead.
 * Returns { requested: true } when a request was queued, or the updated user when followed directly.
 */
export async function followUser(
  followerId: string,
  followingId: string,
): Promise<{ requested: true } | { requested: false }> {
  const target = await prisma.user.findUnique({
    where: { id: followingId },
    select: { isPrivate: true, username: true, displayName: true },
  });

  if (!target) throw new Error("User not found");

  if (target.isPrivate) {
    await sendFollowRequest(followerId, followingId);
    const follower = await prisma.user.findUnique({
      where: { id: followerId },
      select: { username: true, displayName: true },
    });
    const name = follower?.displayName ?? follower?.username ?? "Someone";
    void createNotification(followingId, followerId, "FOLLOW_REQUEST", `${name} requested to follow you`);
    return { requested: true };
  }

  const [, follower] = await Promise.all([
    prisma.user.update({
      where: { id: followerId },
      data: { follows: { connect: { id: followingId } } },
    }),
    prisma.user.findUnique({ where: { id: followerId }, select: { username: true, displayName: true } }),
  ]);

  const name = follower?.displayName ?? follower?.username ?? "Someone";
  void createNotification(followingId, followerId, "NEW_FOLLOWER", `${name} started following you`);

  return { requested: false };
}

export async function unfollowUser(followerId: string, followingId: string) {
  return prisma.user.update({
    where: { id: followerId },
    data: { follows: { disconnect: { id: followingId } } },
  });
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const result = await prisma.user.findFirst({
    where: {
      id: followerId,
      follows: { some: { id: followingId } },
    },
    select: { id: true },
  });
  return result !== null;
}

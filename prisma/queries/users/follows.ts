import { prisma } from "~/server/db";
import { createNotification } from "../notifications/notifications";
import { sendFollowRequest } from "./followRequests";

/**
 * Follows a user. If the target account is private, sends a follow request instead.
 * Throws if either user has blocked the other.
 *
 * @param followerId  User initiating the follow
 * @param followingId User to follow
 * @returns `{ requested: true }` when a follow request was queued, `{ requested: false }` when followed directly
 */
export async function followUser(
  followerId: string,
  followingId: string,
): Promise<{ requested: true } | { requested: false }> {
  const [target, block] = await Promise.all([
    prisma.user.findUnique({
      where: { id: followingId },
      select: { isPrivate: true, username: true, displayName: true },
    }),
    prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: followerId, blockedId: followingId },
          { blockerId: followingId, blockedId: followerId },
        ],
      },
      select: { blockerId: true },
    }),
  ]);

  if (!target) throw new Error("User not found");
  if (block) throw new Error("Cannot follow a blocked user");

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

/**
 * Removes a follow relationship.
 *
 * @param followerId  User who wants to unfollow
 * @param followingId User to unfollow
 */
export async function unfollowUser(followerId: string, followingId: string) {
  return prisma.user.update({
    where: { id: followerId },
    data: { follows: { disconnect: { id: followingId } } },
  });
}

/**
 * Returns true if followerId is currently following followingId.
 *
 * @param followerId  Potential follower
 * @param followingId Potential followee
 */
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

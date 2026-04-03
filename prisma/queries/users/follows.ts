import { prisma } from "~/server/db";
import { createNotification } from "../notifications/notifications";

export async function followUser(followerId: string, followingId: string) {
  const [result, follower] = await Promise.all([
    prisma.user.update({
      where: { id: followerId },
      data: { follows: { connect: { id: followingId } } },
    }),
    prisma.user.findUnique({ where: { id: followerId }, select: { username: true, displayName: true } }),
  ]);

  const name = follower?.displayName ?? follower?.username ?? "Someone";
  void createNotification(followingId, followerId, "NEW_FOLLOWER", `${name} started following you`);

  return result;
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

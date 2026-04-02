import { prisma } from "~/server/db";

export async function followUser(followerId: string, followingId: string) {
  return prisma.user.update({
    where: { id: followerId },
    data: { follows: { connect: { id: followingId } } },
  });
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

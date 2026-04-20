import { prisma } from "~/server/db";

export async function blockUser(blockerId: string, blockedId: string) {
  // Remove any existing follow relationship in both directions
  await prisma.$transaction([
    prisma.user.update({
      where: { id: blockerId },
      data: {
        follows: { disconnect: { id: blockedId } },
        followers: { disconnect: { id: blockedId } },
      },
    }),
    // Delete any pending follow requests between the two users
    prisma.followRequest.deleteMany({
      where: {
        OR: [
          { requesterId: blockerId, targetId: blockedId },
          { requesterId: blockedId, targetId: blockerId },
        ],
      },
    }),
    prisma.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    }),
  ]);
}

export async function unblockUser(blockerId: string, blockedId: string) {
  await prisma.blockedUser.deleteMany({ where: { blockerId, blockedId } });
}

export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const row = await prisma.blockedUser.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    select: { blockerId: true },
  });
  return row !== null;
}

/** Returns true if either user has blocked the other. */
export async function isBlockedInAnyDirection(
  userA: string,
  userB: string,
): Promise<boolean> {
  const row = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    },
    select: { blockerId: true },
  });
  return row !== null;
}

export async function getBlockedUsers(blockerId: string) {
  const rows = await prisma.blockedUser.findMany({
    where: { blockerId },
    orderBy: { createdAt: "desc" },
    select: {
      blocked: {
        select: { id: true, username: true, displayName: true, photo: true },
      },
    },
  });
  return rows.map((r) => r.blocked);
}

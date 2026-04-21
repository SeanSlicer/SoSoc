import { prisma } from "~/server/db";

/**
 * Blocks a user. Also removes any existing follow relationships and pending
 * follow requests between the two users.
 * Runs in a transaction so all side effects are atomic.
 *
 * @param blockerId  User performing the block
 * @param blockedId  User being blocked
 */
export async function blockUser(blockerId: string, blockedId: string) {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: blockerId },
      data: {
        follows: { disconnect: { id: blockedId } },
        followers: { disconnect: { id: blockedId } },
      },
    }),
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

/**
 * Removes a block relationship.
 *
 * @param blockerId  User who originally blocked
 * @param blockedId  User who was blocked
 */
export async function unblockUser(blockerId: string, blockedId: string) {
  await prisma.blockedUser.deleteMany({ where: { blockerId, blockedId } });
}

/**
 * Returns true if blockerId has blocked blockedId (one direction only).
 *
 * @param blockerId  Potential blocker
 * @param blockedId  Potential blocked user
 */
export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const row = await prisma.blockedUser.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    select: { blockerId: true },
  });
  return row !== null;
}

/**
 * Returns true if either user has blocked the other.
 *
 * @param userA  First user
 * @param userB  Second user
 */
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

/**
 * Returns the list of users that a given user has blocked.
 *
 * @param blockerId  User whose block list to return
 */
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

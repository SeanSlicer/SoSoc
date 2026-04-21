import { prisma } from "~/server/db";

/** Creates a pending follow request from requester to target. */
export async function sendFollowRequest(requesterId: string, targetId: string) {
  return prisma.followRequest.create({
    data: { requesterId, targetId },
  });
}

/** Cancels a pending follow request sent by the requester. */
export async function cancelFollowRequest(requesterId: string, targetId: string) {
  return prisma.followRequest.deleteMany({
    where: { requesterId, targetId },
  });
}

/**
 * Accepts a follow request, creating the follow relationship and deleting the request.
 * Runs in a transaction so both operations succeed or neither does.
 */
export async function acceptFollowRequest(requesterId: string, targetId: string) {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: requesterId },
      data: { follows: { connect: { id: targetId } } },
    }),
    prisma.followRequest.deleteMany({
      where: { requesterId, targetId },
    }),
  ]);
}

/** Rejects (deletes) a pending follow request without creating a follow relationship. */
export async function rejectFollowRequest(requesterId: string, targetId: string) {
  return prisma.followRequest.deleteMany({
    where: { requesterId, targetId },
  });
}

/**
 * Returns all pending follow requests for a target user, newest first.
 *
 * @param targetId  The user whose incoming requests to return
 */
export async function getPendingRequestsForUser(targetId: string) {
  return prisma.followRequest.findMany({
    where: { targetId },
    orderBy: { createdAt: "desc" },
    include: {
      requester: {
        select: { id: true, username: true, displayName: true, photo: true },
      },
    },
  });
}

/**
 * Returns true if the requester has a pending follow request to the target.
 *
 * @param requesterId  User who sent the request
 * @param targetId     User who received the request
 */
export async function hasPendingRequest(requesterId: string, targetId: string): Promise<boolean> {
  const req = await prisma.followRequest.findUnique({
    where: { requesterId_targetId: { requesterId, targetId } },
    select: { id: true },
  });
  return req !== null;
}

/**
 * Accepts all pending follow requests for a user — called when they switch to a public profile.
 * Runs in a transaction.
 *
 * @param targetId  The user switching to public
 */
export async function acceptAllPendingRequests(targetId: string) {
  const requests = await prisma.followRequest.findMany({
    where: { targetId },
    select: { requesterId: true },
  });

  if (requests.length === 0) return;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: targetId },
      data: {
        followers: {
          connect: requests.map((r) => ({ id: r.requesterId })),
        },
      },
    }),
    prisma.followRequest.deleteMany({ where: { targetId } }),
  ]);
}

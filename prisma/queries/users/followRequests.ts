import { prisma } from "~/server/db";

export async function sendFollowRequest(requesterId: string, targetId: string) {
  return prisma.followRequest.create({
    data: { requesterId, targetId },
  });
}

export async function cancelFollowRequest(requesterId: string, targetId: string) {
  return prisma.followRequest.deleteMany({
    where: { requesterId, targetId },
  });
}

export async function acceptFollowRequest(requesterId: string, targetId: string) {
  await prisma.$transaction([
    // Create the follow relationship
    prisma.user.update({
      where: { id: requesterId },
      data: { follows: { connect: { id: targetId } } },
    }),
    // Delete the request
    prisma.followRequest.deleteMany({
      where: { requesterId, targetId },
    }),
  ]);
}

export async function rejectFollowRequest(requesterId: string, targetId: string) {
  return prisma.followRequest.deleteMany({
    where: { requesterId, targetId },
  });
}

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

export async function hasPendingRequest(requesterId: string, targetId: string): Promise<boolean> {
  const req = await prisma.followRequest.findUnique({
    where: { requesterId_targetId: { requesterId, targetId } },
    select: { id: true },
  });
  return req !== null;
}

/** Accept all pending requests when a user switches to public */
export async function acceptAllPendingRequests(targetId: string) {
  const requests = await prisma.followRequest.findMany({
    where: { targetId },
    select: { requesterId: true },
  });

  if (requests.length === 0) return;

  await prisma.$transaction([
    // Connect all requesters as followers
    prisma.user.update({
      where: { id: targetId },
      data: {
        followers: {
          connect: requests.map((r) => ({ id: r.requesterId })),
        },
      },
    }),
    // Clear all requests
    prisma.followRequest.deleteMany({ where: { targetId } }),
  ]);
}

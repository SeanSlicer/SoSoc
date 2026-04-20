import { prisma } from "~/server/db";

const lastMessageSelect = {
  id: true,
  content: true,
  createdAt: true,
  senderId: true,
  sharedPostId: true,
} as const;

/** All conversations for a user, sorted by most recent message. */
export async function getConversations(userId: string) {
  const convos = await prisma.conversation.findMany({
    where: { members: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    include: {
      members: { include: { user: { select: { id: true, username: true, displayName: true, photo: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: lastMessageSelect },
      _count: { select: { messages: true } },
    },
  });

  // Attach unread count per conversation
  return Promise.all(
    convos.map(async (c) => {
      const member = c.members.find((m) => m.userId === userId);
      const unread = member?.lastReadAt
        ? await prisma.message.count({
            where: {
              conversationId: c.id,
              createdAt: { gt: member.lastReadAt },
              senderId: { not: userId },
            },
          })
        : await prisma.message.count({
            where: { conversationId: c.id, senderId: { not: userId } },
          });
      return { ...c, unread };
    }),
  );
}

/** Find an existing 1-on-1 DM or create a new one. Throws if either user has blocked the other. */
export async function getOrCreateDM(userId1: string, userId2: string) {
  const block = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: userId1, blockedId: userId2 },
        { blockerId: userId2, blockedId: userId1 },
      ],
    },
    select: { blockerId: true },
  });
  if (block) throw new Error("Cannot message a blocked user");

  // Look for a conversation where both users are the ONLY members
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { members: { some: { userId: userId1 } } },
        { members: { some: { userId: userId2 } } },
        { name: null }, // DMs have no name; groups do
      ],
    },
    include: {
      members: { include: { user: { select: { id: true, username: true, displayName: true, photo: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: lastMessageSelect },
    },
  });

  // Verify it's truly a 2-person conversation (no extra members)
  if (existing?.members.length === 2) return existing;

  // Create a new DM
  return prisma.conversation.create({
    data: {
      members: {
        create: [{ userId: userId1 }, { userId: userId2 }],
      },
    },
    include: {
      members: { include: { user: { select: { id: true, username: true, displayName: true, photo: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: lastMessageSelect },
    },
  });
}

/** Create a named group conversation. */
export async function createGroup(creatorId: string, memberIds: string[], name: string) {
  const allMembers = Array.from(new Set([creatorId, ...memberIds]));
  return prisma.conversation.create({
    data: {
      name,
      members: { create: allMembers.map((uid) => ({ userId: uid })) },
    },
    include: {
      members: { include: { user: { select: { id: true, username: true, displayName: true, photo: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: lastMessageSelect },
    },
  });
}

/** Mark all messages in a conversation as read for a user. */
export async function markConversationRead(conversationId: string, userId: string) {
  await prisma.conversationMember.updateMany({
    where: { conversationId, userId },
    data: { lastReadAt: new Date() },
  });
}

/** Total unread message count across all conversations. */
export async function getTotalUnread(userId: string) {
  const members = await prisma.conversationMember.findMany({
    where: { userId },
    select: { conversationId: true, lastReadAt: true },
  });

  let total = 0;
  for (const m of members) {
    const count = await prisma.message.count({
      where: {
        conversationId: m.conversationId,
        senderId: { not: userId },
        ...(m.lastReadAt ? { createdAt: { gt: m.lastReadAt } } : {}),
      },
    });
    total += count;
  }
  return total;
}

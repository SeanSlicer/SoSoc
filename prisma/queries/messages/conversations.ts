import { prisma } from "~/server/db";
import { isFriends } from "../users/friends";

const lastMessageSelect = {
  id: true,
  content: true,
  createdAt: true,
  senderId: true,
  sharedPostId: true,
} as const;

const memberUserSelect = {
  id: true,
  username: true,
  displayName: true,
  photo: true,
} as const;

/**
 * Returns all ACTIVE conversations for a user, sorted by most recent message.
 * REQUEST and HIDDEN conversations are excluded — use getRequests() for those.
 */
export async function getConversations(userId: string) {
  const convos = await prisma.conversation.findMany({
    where: { members: { some: { userId, status: "ACTIVE" } } },
    orderBy: { updatedAt: "desc" },
    include: {
      members: { include: { user: { select: memberUserSelect } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: lastMessageSelect },
      _count: { select: { messages: true } },
    },
  });

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

/**
 * Returns all REQUEST conversations for a user (DMs from non-friends awaiting acceptance).
 * Includes unread count so the same Conversation type can be used in the UI.
 */
export async function getRequests(userId: string) {
  const convos = await prisma.conversation.findMany({
    where: { members: { some: { userId, status: "REQUEST" } } },
    orderBy: { updatedAt: "desc" },
    include: {
      members: { include: { user: { select: memberUserSelect } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: lastMessageSelect },
      _count: { select: { messages: true } },
    },
  });

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

/**
 * Find an existing 1-on-1 DM or create a new one.
 * If the users are not friends and this is a new DM, the recipient's status is set to REQUEST.
 * Throws if either user has blocked the other.
 */
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
        { name: null },
      ],
    },
    include: {
      members: { include: { user: { select: memberUserSelect } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: lastMessageSelect },
    },
  });

  // Existing 2-person DM — return as is, preserving member statuses
  if (existing?.members.length === 2) return existing;

  // Determine if the two users are friends; if not, recipient gets REQUEST status
  const friends = await isFriends(userId1, userId2);
  const recipientStatus = friends ? "ACTIVE" : "REQUEST";

  return prisma.conversation.create({
    data: {
      members: {
        create: [
          { userId: userId1, status: "ACTIVE" },
          { userId: userId2, status: recipientStatus },
        ],
      },
    },
    include: {
      members: { include: { user: { select: memberUserSelect } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: lastMessageSelect },
    },
  });
}

/** Create a named group conversation. All members start as ACTIVE. */
export async function createGroup(creatorId: string, memberIds: string[], name: string) {
  const allMembers = Array.from(new Set([creatorId, ...memberIds]));
  return prisma.conversation.create({
    data: {
      name,
      members: { create: allMembers.map((uid) => ({ userId: uid, status: "ACTIVE" as const })) },
    },
    include: {
      members: { include: { user: { select: memberUserSelect } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: lastMessageSelect },
    },
  });
}

/** Accept a message request — move the conversation to the user's main Messages tab. */
export async function acceptRequest(conversationId: string, userId: string) {
  await prisma.conversationMember.updateMany({
    where: { conversationId, userId, status: "REQUEST" },
    data: { status: "ACTIVE" },
  });
}

/** Decline a message request — silently hide the conversation for this user. */
export async function declineRequest(conversationId: string, userId: string) {
  await prisma.conversationMember.updateMany({
    where: { conversationId, userId, status: "REQUEST" },
    data: { status: "HIDDEN" },
  });
}

/** Hide an existing conversation for one user only. Can be restored when a new message arrives. */
export async function hideConversation(conversationId: string, userId: string) {
  await prisma.conversationMember.updateMany({
    where: { conversationId, userId },
    data: { status: "HIDDEN" },
  });
}

/**
 * Returns all HIDDEN conversations for a user.
 * These are conversations the user has explicitly hidden or declined.
 */
export async function getHidden(userId: string) {
  const convos = await prisma.conversation.findMany({
    where: { members: { some: { userId, status: "HIDDEN" } } },
    orderBy: { updatedAt: "desc" },
    include: {
      members: { include: { user: { select: memberUserSelect } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: lastMessageSelect },
      _count: { select: { messages: true } },
    },
  });
  return convos.map((c) => ({ ...c, unread: 0 }));
}

/**
 * Permanently removes a user from a conversation by deleting their member row.
 * The conversation continues for other participants. Unlike hiding, this cannot
 * be restored by a new incoming message.
 */
export async function deleteConversation(conversationId: string, userId: string) {
  await prisma.conversationMember.deleteMany({ where: { conversationId, userId } });
}

/** Restores a HIDDEN conversation to ACTIVE for one user (unhide). */
export async function unhideConversation(conversationId: string, userId: string) {
  await prisma.conversationMember.updateMany({
    where: { conversationId, userId, status: "HIDDEN" },
    data: { status: "ACTIVE" },
  });
}

/** Mark all messages in a conversation as read for a user. */
export async function markConversationRead(conversationId: string, userId: string) {
  await prisma.conversationMember.updateMany({
    where: { conversationId, userId },
    data: { lastReadAt: new Date() },
  });
}

/**
 * Total unread message count across all ACTIVE conversations.
 * REQUEST conversations are not counted here (shown separately as a badge on the Requests tab).
 */
export async function getTotalUnread(userId: string) {
  const members = await prisma.conversationMember.findMany({
    where: { userId, status: "ACTIVE" },
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

/** Count of pending message requests (conversations in REQUEST status for a user). */
export async function getRequestCount(userId: string): Promise<number> {
  return prisma.conversationMember.count({ where: { userId, status: "REQUEST" } });
}

import { prisma } from "~/server/db";

const senderSelect = {
  id: true,
  username: true,
  displayName: true,
  photo: true,
} as const;

const sharedPostSelect = {
  id: true,
  content: true,
  type: true,
  images: true,
  imageUrl: true,
  videoUrl: true,
  createdAt: true,
  author: { select: senderSelect },
  _count: { select: { likes: true, comments: true } },
} as const;

/**
 * Returns a cursor-paginated list of messages for a conversation, oldest first.
 * Uses a negative take to fetch from the tail (newest end) of the list.
 *
 * @param conversationId  Conversation to fetch messages for
 * @param cursor          ID of the oldest message from the previous page (for older-message pagination)
 * @param limit           Messages per page (default 30)
 */
export async function getMessages(conversationId: string, cursor?: string, limit = 30) {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    take: -(limit + 1),
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: senderSelect },
      sharedPost: { select: sharedPostSelect },
    },
  });

  let prevCursor: string | undefined;
  if (messages.length > limit) {
    prevCursor = messages.shift()!.id;
  }

  return { messages, prevCursor };
}

/**
 * Sends a message in a conversation.
 * - Rejects if a block exists between participants in a 1-on-1 DM.
 * - Bumps the conversation's `updatedAt` so it sorts to the top of the list.
 * - Restores any HIDDEN member statuses to REQUEST so the conversation resurfaces.
 *
 * @param conversationId  Target conversation
 * @param senderId        User sending the message
 * @param content         Optional text content
 * @param sharedPostId    Optional shared post ID
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content?: string,
  sharedPostId?: string,
) {
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { name: true, members: { select: { userId: true } } },
  });
  if (convo && convo.name === null && convo.members.length === 2) {
    const otherId = convo.members.find((m) => m.userId !== senderId)?.userId;
    if (otherId) {
      const block = await prisma.blockedUser.findFirst({
        where: {
          OR: [
            { blockerId: senderId, blockedId: otherId },
            { blockerId: otherId, blockedId: senderId },
          ],
        },
        select: { blockerId: true },
      });
      if (block) throw new Error("Cannot message a blocked user");
    }
  }

  const message = await prisma.message.create({
    data: { conversationId, senderId, content: content ?? null, sharedPostId: sharedPostId ?? null },
    include: {
      sender: { select: senderSelect },
      sharedPost: { select: sharedPostSelect },
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  // If the recipient previously hid or declined this conversation, surface it as a new request
  await prisma.conversationMember.updateMany({
    where: { conversationId, userId: { not: senderId }, status: "HIDDEN" },
    data: { status: "REQUEST" },
  });

  return message;
}

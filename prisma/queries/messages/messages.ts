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

export async function getMessages(conversationId: string, cursor?: string, limit = 30) {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    take: -(limit + 1), // negative take = fetch from the end (newest last)
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: senderSelect },
      sharedPost: { select: sharedPostSelect },
    },
  });

  let prevCursor: string | undefined;
  if (messages.length > limit) {
    prevCursor = messages.shift()!.id; // remove the extra one from the front
  }

  return { messages, prevCursor };
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content?: string,
  sharedPostId?: string,
) {
  // For DMs (no name = 2-person), reject if a block exists between the two participants.
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

  // Bump conversation updatedAt so it sorts to top of list
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return message;
}

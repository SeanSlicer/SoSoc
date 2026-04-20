import { prisma } from "~/server/db";

export async function getFeed(
  currentUserId: string,
  cursor?: string,
  limit = 20,
  feedType: "all" | "following" = "all",
) {
  const posts = await prisma.post.findMany({
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    where:
      feedType === "following"
        ? {
            author: {
              followers: { some: { id: currentUserId } },
              blocking: { none: { blockedId: currentUserId } },
              blockedBy: { none: { blockerId: currentUserId } },
            },
          }
        : {
            AND: [
              { author: { blocking: { none: { blockedId: currentUserId } } } },
              { author: { blockedBy: { none: { blockerId: currentUserId } } } },
              {
                OR: [
                  { author: { isPrivate: false } },
                  { author: { followers: { some: { id: currentUserId } } } },
                  { authorId: currentUserId },
                ],
              },
            ],
          },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, username: true, displayName: true, photo: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: currentUserId }, select: { id: true } },
    },
  });

  let nextCursor: string | undefined;
  if (posts.length > limit) {
    nextCursor = posts.pop()!.id;
  }

  return {
    posts: posts.map(({ likes, ...post }) => ({ ...post, isLiked: likes.length > 0 })),
    nextCursor,
  };
}

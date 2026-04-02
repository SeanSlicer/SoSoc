import { prisma } from "~/server/db";

export async function getUserPosts(username: string, currentUserId: string) {
  const posts = await prisma.post.findMany({
    where: { author: { username } },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, username: true, displayName: true, photo: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: currentUserId }, select: { id: true } },
    },
  });
  return posts.map(({ likes, ...post }) => ({ ...post, isLiked: likes.length > 0 }));
}

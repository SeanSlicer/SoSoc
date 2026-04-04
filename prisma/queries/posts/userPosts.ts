import { prisma } from "~/server/db";

export async function getUserPosts(username: string, currentUserId: string) {
  const author = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      isPrivate: true,
      followers: { where: { id: currentUserId }, select: { id: true } },
    },
  });

  if (!author) return { posts: [], locked: false };

  const isOwnProfile = author.id === currentUserId;
  const isFollower = author.followers.length > 0;
  const canView = !author.isPrivate || isOwnProfile || isFollower;

  if (!canView) return { posts: [], locked: true };

  const posts = await prisma.post.findMany({
    where: { authorId: author.id },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, username: true, displayName: true, photo: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: currentUserId }, select: { id: true } },
    },
  });

  return {
    posts: posts.map(({ likes, ...post }) => ({ ...post, isLiked: likes.length > 0 })),
    locked: false,
  };
}
